"use client";

import { Github, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="text-center py-20 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
        Build web apps with your AI co-worker
      </h1>
      <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
        Dyad is an AI agent that can build and modify web applications from a chat interface.
      </p>
      <div className="mt-8 flex justify-center items-center gap-4">
        <Link to="/editor">
          <Button size="sm" className="rounded-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Start building for free
          </Button>
        </Link>
        <Link to="/pricing">
          <Button variant="outline" size="sm" className="rounded-full bg-secondary border-border hover:bg-muted">
            <Github className="h-4 w-4 mr-2" />
            Connect a repo
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Hero;