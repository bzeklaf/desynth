import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RealTimeNotifications } from '@/components/RealTimeNotifications';
import { WalletConnection } from '@/components/blockchain/WalletConnection';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from 'react';
import desynthLogo from '@/assets/desynth-logo.png';
import { 
  Home, 
  Search, 
  Users, 
  BarChart3,
  Shield,
  User,
  Bell,
  Settings,
  LogOut,
  Calendar
} from "lucide-react";

export const Navigation = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center cursor-pointer" 
              onClick={() => handleNavigation('/')}
            >
              <img src={desynthLogo} alt="DeSynth" className="h-8" />
            </div>
          </div>

          {/* Main Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigation('/browse')}
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Slots
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigation('/book')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Book Slot
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigation('/market')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Market
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => handleNavigation('/facilities')}
            >
              <Users className="w-4 h-4 mr-2" />
              Facilities
            </Button>
            {user && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => handleNavigation('/dashboard')}
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Wallet Connection */}
            <WalletConnection showBalance={true} className="hidden sm:flex" />
            {user && profile && (
              <>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
                
                <RealTimeNotifications />
                
                <Button variant="ghost" size="sm" disabled>
                  <Settings className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={() => handleNavigation('/profile')}>
                  <User className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}

            {!user && (
              <Button variant="hero" size="sm" onClick={() => handleNavigation('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};