import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

const Navigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600"></span>
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-green-400 to-green-600"></span>
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600"></span>
              </div>
              <span className="font-semibold">Fusion</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/pricing"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                to="/changelog"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Changelog
              </Link>
              <Link
                to="/docs"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Docs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm">Sign up</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;