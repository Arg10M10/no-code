"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import PublishingFlow from '@/components/PublishingFlow';
import { getProjectById, getCode, Project } from '@/lib/projects';
import LavaLamp from '@/components/LavaLamp';
import Loader from '@/components/Loader';
import { Button } from '@/components/ui/button';

const PublishPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState<Project | null>(null);
  const [code, setCodeState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      navigate('/');
      return;
    }

    try {
      const foundProject = getProjectById(projectId);
      if (!foundProject) {
        throw new Error('Project not found.');
      }
      const projectCode = getCode(projectId);
      if (!projectCode) {
        throw new Error('Project has no code to publish.');
      }
      setProject(foundProject);
      setCodeState(projectCode);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [projectId, navigate]);

  return (
    <div className="min-h-screen bg-background relative">
      <LavaLamp />
      <div className="relative z-10">
        <Navigation />
        <main className="container mx-auto px-6 pt-32 pb-20 flex items-center justify-center">
          {loading && (
            <div className="text-center">
              <Loader />
              <p className="mt-4 text-muted-foreground">Loading Project...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-destructive">
              <h2 className="text-2xl font-bold">Error</h2>
              <p>{error}</p>
              <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
            </div>
          )}
          {project && code && projectId && (
            <PublishingFlow
              projectName={project.name}
              projectCode={code}
              projectId={projectId}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default PublishPage;