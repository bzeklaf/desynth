import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { FeaturedSlots } from "@/components/FeaturedSlots";
import desynthLogo from '@/assets/desynth-logo.png';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Remove automatic dashboard redirect to allow navigation to other pages
  // useEffect(() => {
  //   if (user) {
  //     navigate('/dashboard');
  //   }
  // }, [user, navigate]);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <div id="featured-slots">
          <FeaturedSlots />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-12 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="flex items-center justify-center mb-4">
            <img src={desynthLogo} alt="DeSynth" className="h-8" />
          </div>
          <p className="text-muted-foreground">
            Decentralized Synthetic Biology Protocol - Connect. Build. Scale.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
