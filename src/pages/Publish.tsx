"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Github, ArrowLeft, CheckCircle, ExternalLink, LogOut, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProjectById, getProjectFiles, Project, setProjectRepoUrl, ProjectFile } from "@/lib/projects";
import { publishToGitHub } from "@/lib/github";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PublishPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);
  const [repoName, setRepoName] = useState("");
  const [publishSuccess, setPublishSuccess] = useState(false);

  useEffect(() => {
    if (!projectId) {
      toast.error("No project ID found.");
      navigate("/");
      return;
    }
    const proj = getProjectById(projectId);
    const projFiles = getProjectFiles(projectId);

    if (!proj || !projFiles || projFiles.length === 0) {
      toast.error("Project not found or has no files to publish.");
      navigate(`/editor?id=${projectId}`);
      return;
    }
    
    setProject(proj);
    setProjectFiles(projFiles);
    setRepoUrl(proj.repoUrl || null);

    if (proj.repoUrl) {
      // If repo exists, parse its name from the URL to ensure we sync with the correct one.
      try {
        const url = new URL(proj.repoUrl);
        const pathParts = url.pathname.split('/').filter(Boolean);
        const existingRepoName = pathParts.pop();
        if (existingRepoName) {
          setRepoName(existingRepoName);
        }
      } catch (e) {
        console.error("Could not parse repo URL", e);
        // Fallback to project name if parsing fails
        const sanitized = proj.name.trim().replace(/[^a-zA-Z0-9-._]/g, '-').toLowerCase() || 'brimy-project';
        setRepoName(sanitized);
      }
    } else {
      // If no repo exists, suggest a name based on the project name.
      const sanitized = proj.name.trim().replace(/[^a-zA-Z0-9-._]/g, '-').toLowerCase() || 'brimy-project';
      setRepoName(sanitized);
    }
  }, [projectId, navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.href,
        scopes: 'repo',
      },
    });
    if (error) {
      toast.error("Login failed", { description: error.message });
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed", { description: error.message });
    } else {
      toast.success("Logged out successfully.");
      setUser(null);
    }
  };

  const handlePublishOrSync = async () => {
    if (!project || !projectFiles || !repoName.trim()) {
        toast.error("Repository name cannot be empty or project has no files.");
        return;
    }
  
    setIsPublishing(true);
    const toastId = toast.loading(repoUrl ? "Syncing with GitHub..." : "Publishing to GitHub...");
  
    try {
      const url = await publishToGitHub(repoName, projectFiles);
      setRepoUrl(url);
      setPublishSuccess(true);
      if (projectId) {
        setProjectRepoUrl(projectId, url);
      }
      toast.success(repoUrl ? "Synced successfully!" : "Published successfully!", { id: toastId });
    } catch (error: any) {
      toast.error(repoUrl ? "Sync failed" : "Publishing failed", {
        id: toastId,
        description: error.message || "An unknown error occurred.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (!project) {
    return <div>Loading project...</div>;
  }

  const renderContent = () => {
    if (publishSuccess) {
      return (
        <div className="p-4 rounded-md border border-green-500/30 bg-green-500/10 text-center space-y-4">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h3 className="text-lg font-semibold">Project Published!</h3>
          <p className="text-sm text-muted-foreground">Your private repository has been created/updated successfully.</p>
          <Button asChild>
            <a href={repoUrl!} target="_blank" rel="noopener noreferrer">
              View on GitHub
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
        </div>
      );
    }

    if (user) {
      if (repoUrl) {
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-green-500" />
                  Repository Connected
                </CardTitle>
                <CardDescription>This project is linked to a GitHub repository.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild className="w-full">
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                    {repoName}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
            <Button onClick={handlePublishOrSync} disabled={isPublishing} className="w-full">
              {isPublishing ? "Syncing..." : "Sync with GitHub"}
            </Button>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-md border bg-secondary">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name} />
                <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.user_metadata?.full_name}</p>
                <p className="text-sm text-muted-foreground">{user.user_metadata?.user_name || user.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repo-name">Repository Name</Label>
            <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value.replace(/[^a-zA-Z0-9-._]/g, '-'))}
                placeholder="my-awesome-project"
                disabled={isPublishing}
            />
            <p className="text-xs text-muted-foreground">
                Your new private repository will be created at: <code className="font-mono text-foreground">{user.user_metadata?.user_name}/{repoName}</code>
            </p>
          </div>
          <Button onClick={handlePublishOrSync} disabled={isPublishing || !repoName.trim()} className="w-full">
            {isPublishing ? "Publishing..." : "Create Repository & Publish"}
          </Button>
        </div>
      );
    }

    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">Connect your GitHub account to continue.</p>
        <Button onClick={handleLogin} size="lg">
          <Github className="h-5 w-5 mr-2" />
          Connect with GitHub
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 pt-24 pb-20 flex justify-center items-center">
        <div className="w-full max-w-2xl">
          <Button variant="ghost" onClick={() => navigate(`/editor?id=${projectId}`)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Button>
          
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-2xl">Publish to GitHub</CardTitle>
              <CardDescription>
                Create or sync a private repository for your project: <span className="font-semibold text-foreground">{project.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderContent()}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                A new private repository will be created under your account. If it already exists, the files will be updated.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublishPage;