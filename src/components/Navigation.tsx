import { Link } from "react-router-dom";

const Navigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600"></span>
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-700"></span>
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-800"></span>
              </div>
              <span className="font-semibold">ByDamian</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link
                to="/pricing"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
              <Link
                to="/settings"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Settings
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;