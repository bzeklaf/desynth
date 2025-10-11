import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WalletConnection } from "@/components/blockchain/WalletConnection";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import sygnalLogo from "@/assets/sygnal-logo.png";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Users,
  BarChart3,
  Star
} from "lucide-react";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleExploreMarket = () => {
    const featuredSlotsSection = document.getElementById('featured-slots');
    if (featuredSlotsSection) {
      featuredSlotsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCreateSlot = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    navigate('/facilities');
  };

  return (
    <section className="relative overflow-hidden py-24 px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10"></div>
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-primary-glow/10 rounded-full blur-2xl"></div>
      
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center space-y-8">
          {/* Main Logo */}
          <div className="flex justify-center mb-8">
            <img src={sygnalLogo} alt="SYGNAL" className="w-32 h-32" />
          </div>

          {/* Hero Content */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Decentralized
              <br />
              <span className="gradient-text">Synthetic Biology Protocol</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connect lab capacity with biotech demand. Build your reputation, monetize your expertise, 
              and accelerate discovery through oracle-verified protocols.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="lg" className="text-lg px-8 py-4" onClick={handleExploreMarket}>
              <BarChart3 className="w-5 h-5 mr-2" />
              Explore Market
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-primary/30 hover:bg-primary/5" onClick={handleCreateSlot}>
              <Zap className="w-5 h-5 mr-2" />
              Create Slot
            </Button>
          </div>

          {/* Wallet Connection */}
          <div className="flex justify-center pt-4">
            <WalletConnection showBalance={true} className="bg-card/50 backdrop-blur-sm" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16">
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold gradient-text">150+</div>
              <div className="text-muted-foreground">Active Facilities</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold gradient-text">$50K+</div>
              <div className="text-muted-foreground">Total Volume</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold gradient-text">78%</div>
              <div className="text-muted-foreground">Success Rate</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl md:text-4xl font-bold gradient-text">300+</div>
              <div className="text-muted-foreground">Protocols</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};