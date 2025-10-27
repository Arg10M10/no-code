import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import LogoStrip from "@/components/LogoStrip";
import LavaLamp from "@/components/LavaLamp";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <LavaLamp />
      <div className="relative z-10">
        <Navigation />
        <Hero />
        <LogoStrip />
      </div>
    </div>
  );
};

export default Index;
