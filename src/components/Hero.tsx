import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Figma, Server, Puzzle } from "lucide-react";

const Hero = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Introducing Fusion
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            What should we build?
          </h1>
          <p className="text-lg text-muted-foreground">
            using your design & code context
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Input
              placeholder="Ask Fusion to build a multi-step us"
              className="h-14 px-6 pr-24 bg-secondary border-border text-base rounded-xl"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              Attach
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-secondary border-border hover:bg-muted"
            >
              <Github className="h-4 w-4 mr-2" />
              Connect a repo
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-secondary border-border hover:bg-muted"
            >
              <Figma className="h-4 w-4 mr-2" />
              Figma Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-secondary border-border hover:bg-muted"
            >
              <Server className="h-4 w-4 mr-2" />
              MCP Servers
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full bg-secondary border-border hover:bg-muted"
            >
              <Puzzle className="h-4 w-4 mr-2" />
              Get Extension
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
