import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Loader2, CheckCircle, ArrowRight, ExternalLink, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface PublishingFlowProps {
  projectName: string;
  projectCode: string;
  projectId: string;
}

const PublishingFlow: React.FC<PublishingFlowProps> = ({ projectName, projectCode, projectId }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'published'>('idle');
  const [repoName, setRepoName] = useState(projectName.replace(/\s+/g, '-').toLowerCase());
  const [publishedUrl, setPublishedUrl] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo', // Solicitar permiso para crear repositorios
      },
    });
    if (error) {
      toast.error('GitHub login failed', { description: error.message });
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setLoading(false);
    toast.info("You have been logged out.");
  };

  const handlePublish = async () => {
    if (!repoName.trim()) {
      toast.error('Repository name cannot be empty.');
      return;
    }
    setPublishState('publishing');
    toast.message('Creating repository and publishing your project...');

    try {
      const { data, error } = await supabase.functions.invoke('publish-to-github', {
        body: { repoName: repoName.trim(), fileContent: projectCode },
      });

      if (error) {
        if (error.context && error.context instanceof Response) {
          const errorMessage = await error.context.text();
          throw new Error(errorMessage);
        }
        throw error;
      }
      
      if (data && data.error) {
        throw new Error(data.error);
      }

      setPublishedUrl(data.html_url);
      setPublishState('published');
      toast.success('Project published successfully!');
    } catch (err: any) {
      console.error("Full publishing error:", err);
      let finalMessage = err.message || "An unknown error occurred.";
      
      if (finalMessage.includes("Not authenticated") || finalMessage.includes("provider_token not found")) {
        toast.error('GitHub Authentication Failed', { 
          description: "Your connection with GitHub may have expired. Please try logging out and logging back in, ensuring you grant repository access.",
          duration: 10000,
        });
      } else {
        toast.error('Failed to publish project', { 
          description: finalMessage,
          duration: 10000,
        });
      }
      setPublishState('idle');
    }
  };

  const authState = loading ? 'authenticating' : user ? 'authenticated' : 'idle';

  return (
    <div className="space-y-8 p-8 border border-border/60 bg-card/60 backdrop-blur-sm rounded-2xl">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Publish to GitHub</h1>
        <p className="text-muted-foreground mt-2">Create a new repository and publish your project.</p>
      </div>

      {/* Step 1: Authentication */}
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 h-10 w-10 rounded-full border flex items-center justify-center ${authState === 'authenticated' ? 'bg-green-500/20 border-green-500' : 'bg-secondary border-border'}`}>
          {authState === 'authenticated' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <Github className="h-5 w-5" />}
        </div>
        <div className="flex-1 pt-1.5">
          <h2 className="font-semibold">Connect to GitHub</h2>
          {authState === 'idle' && (
            <>
              <p className="text-sm text-muted-foreground mt-1">You need to sign in to publish your project.</p>
              <Button onClick={handleLogin} className="mt-4">
                <Github className="h-4 w-4 mr-2" />
                Login with GitHub
              </Button>
            </>
          )}
          {authState === 'authenticating' && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Authenticating...
            </div>
          )}
          {authState === 'authenticated' && (
            <div className="space-y-2">
              <p className="text-sm text-green-400 mt-1">Successfully connected as {user?.user_metadata.user_name || 'your GitHub account'}.</p>
              <p className="text-xs text-muted-foreground">If publishing fails, try logging out and back in to refresh permissions.</p>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-3 w-3 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Publish */}
      {authState === 'authenticated' && (
        <div className="flex items-start gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className={`flex-shrink-0 h-10 w-10 rounded-full border flex items-center justify-center ${publishState === 'published' ? 'bg-green-500/20 border-green-500' : 'bg-secondary border-border'}`}>
            {publishState === 'published' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <span className="font-bold text-lg">2</span>}
          </div>
          <div className="flex-1 pt-1.5">
            <h2 className="font-semibold">Create Repository</h2>
            {publishState !== 'published' && (
              <>
                <p className="text-sm text-muted-foreground mt-1">A new private repository will be created on your GitHub account.</p>
                <div className="mt-4 space-y-2 max-w-sm">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input
                    id="repo-name"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    disabled={publishState === 'publishing'}
                  />
                  <p className="text-xs text-muted-foreground">Make sure this repository name doesn't already exist in your GitHub account.</p>
                </div>
                <Button onClick={handlePublish} className="mt-4" disabled={publishState === 'publishing'}>
                  {publishState === 'publishing' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Create and Publish
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </>
            )}
            {publishState === 'published' && (
              <div className="mt-2 space-y-4">
                <p className="text-sm text-green-400">Your project is now live on GitHub!</p>
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
                  View Repository
                  <ExternalLink className="h-4 w-4 ml-1.5" />
                </a>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => navigate(`/editor?id=${projectId}`)}>Back to Editor</Button>
                  <Button onClick={() => navigate('/')}>Go to Homepage</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublishingFlow;