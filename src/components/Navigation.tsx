import { Link } from "react-router-dom";
import RecentProjectsSheet from "./RecentProjectsSheet";
import SettingsModal from "./SettingsModal";

const Navigation = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-sm">
      <div className="mx-auto w-full px-3 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 max-w-[1800px]">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-6 lg:gap-8">
            <RecentProjectsSheet />
            <Link to="/" className="flex items-center gap-2">
              <div className="flex gap-0.5">
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-400 to-blue-600"></span>
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-500 to-blue-700"></span>
                <span className="h-5 w-2.5 rounded-full bg-gradient-to-b from-blue-600 to-blue-800"></span>
              </div>
              <span className="font-semibold text-sm sm:text-base lg:text-lg">ByDamian</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 lg:gap-8 xl:gap-10 text-sm lg:text-[15px] font-medium">
              <Link
                to="/pricing"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Pricing
              </Link>
            </nav>
          </div>

          <SettingsModal />
        </div>
      </div>
    </header>
  );
};

export default Navigation;