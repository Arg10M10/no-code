import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import LavaLamp from '@/components/LavaLamp';
import PublishingFlow from '@/components/PublishingFlow';
import { getProjectById, getCode, Project } from '@/lib/projects';
import Loader from '@/components/Loader';

const PublishPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState<Project | null>(null);
  const [code, setCodeContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError('No project ID provided.');
      setLoading(false);
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    const foundProject = getProjectById(projectId);
    if (!foundProject) {
      setError('Project not found.');
      setLoading(false);
      setTimeout(() => navigate('/'), 3000);
      return;
    }

    const projectCode = getCode(projectId);
    if (!projectCode) {
      setError('Project has no code to publish.');
      setLoading(false);
      setTimeout(() => navigate(`/editor?id=${projectId}`), 3000);
      return;
    }

    setProject(foundProject);
    setCodeContent(projectCode);
    setLoading(false);
  }, [projectId, navigate]);

  return (
    <div className="min-h-screen bg-background relative">
      <LavaLamp />
      <div className="relative z-10">
        <Navigation />
        <main className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl mx-auto">
            {loading && (
              <div className="flex flex-col items-center justify-center text-center p-8">
                <Loader />
                <h1 className="text-xl font-bold mt-4">Loading Project...</h1>
              </div>
            )}
            {error && (
              <div className="text-center p-8 bg-destructive/10 border border-destructive/50 rounded-lg">
                <h1 className="text-xl font-bold text-destructive-foreground">{error}</h1>
                <p className="text-muted-foreground mt-2">Redirecting...</p>
              </div>
            )}
            {!loading && !error && project && code && (
              <PublishingFlow
                projectName={project.name}
                projectCode={code}
                projectId={project.id}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PublishPage;