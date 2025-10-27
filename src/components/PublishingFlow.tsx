import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Github, Loader2, CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface PublishingFlowProps {
  projectName: string;
  projectCode: string;
  projectId: string;
}

const PublishingFlow: React.FC<PublishingFlowProps> = ({ projectName, projectId }) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<'idle' | 'authenticating' | 'authenticated'>('idle');
  const [publishState, setPublishState] = useState<'idle' | 'publishing' | 'published'>('idle');
  const [repoName, setRepoName] = useState(projectName.replace(/\s+/g, '-').toLowerCase());
  const [publishedUrl, setPublishedUrl] = useState('');

  const handleLogin = () => {
    setAuthState('authenticating');
    toast.message('Redirecting to GitHub for authentication...');
    setTimeout(() => {
      setAuthState('authenticated');
      toast.success('Successfully authenticated with GitHub.');
    }, 2000);
  };

  const handlePublish = () => {
    if (!repoName.trim()) {
      toast.error('Repository name cannot be empty.');
      return;
    }
    setPublishState('publishing');
    toast.message('Creating repository and publishing your project...');
    setTimeout(() => {
      const url = `https://github.com/bydamian-user/${repoName}`;
      setPublishedUrl(url);
      setPublishState('published');
      toast.success('Project published successfully!');
    }, 3000);
  };

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
            <p className="text-sm text-green-400 mt-1">Successfully connected as @bydamian-user.</p>
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
                <p className="text-sm text-muted-foreground mt-1">A new public repository will be created on your GitHub account.</p>
                <div className="mt-4 space-y-2 max-w-sm">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input
                    id="repo-name"
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    disabled={publishState === 'publishing'}
                  />
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