import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <div className="h-5 w-1.5 bg-primary rounded-sm"></div>
                <div className="h-5 w-1.5 bg-accent rounded-sm"></div>
              </div>
              <span className="text-xl font-semibold">ByDamian</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Platform <ChevronDown className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Resources <ChevronDown className="h-3 w-3" />
              </button>
              <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                Docs <ChevronDown className="h-3 w-3" />
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Enterprise
              </button>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-sm">
              Contact sales
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-sm">
              Go to app
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
