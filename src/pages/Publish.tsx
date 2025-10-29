"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { Github, ArrowLeft, CheckCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { getProjectById, getCode, Project } from "@/lib/projects";
import { publishToGitHub } from "@/lib/github";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const PublishPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [code, setCodeContent] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [repoUrl, setRepoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      toast.error("No project ID found.");
      navigate("/");
      return;
    }
    const proj = getProjectById(projectId);
    const projCode = getCode(projectId);

    if (!proj || !projCode) {
      toast.error("Project not found or has no code.");
      navigate(`/editor?id=${projectId}`);
      return;
    }
    setProject(proj);
    setCodeContent(projCode);
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
      },
    });
    if (error) {
      toast.error("Login failed", { description: error.message });
    }
  };

  const handlePublish = async () => {
    if (!project || !code) return;
  
    setIsPublishing(true);
    const toastId = toast.loading("Publishing to GitHub...");
  
    try {
      const url = await publishToGitHub(project.name, code);
      setRepoUrl(url);
      toast.success("Published successfully!", { id: toastId });
    } catch (error: any) {
      toast.error("Publishing failed", {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
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
                Create a new public repository for your project: <span className="font-semibold text-foreground">{project.name}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {repoUrl ? (
                <div className="p-4 rounded-md border border-green-500/30 bg-green-500/10 text-center space-y-4">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold">Project Published!</h3>
                  <p className="text-sm text-muted-foreground">Your repository has been created successfully.</p>
                  <Button asChild>
                    <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                      View on GitHub
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              ) : user ? (
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
                  <Button onClick={handlePublish} disabled={isPublishing}>
                    {isPublishing ? "Publishing..." : "Publish Project"}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">Connect your GitHub account to continue.</p>
                  <Button onClick={handleLogin} size="lg">
                    <Github className="h-5 w-5 mr-2" />
                    Connect with GitHub
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                A new public repository will be created under your account. If it already exists, the files will be updated.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PublishPage;