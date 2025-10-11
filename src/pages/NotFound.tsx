import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-8 max-w-md mx-auto px-4">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-6xl font-bold gradient-text">404</h1>
          <h2 className="text-2xl font-semibold">Protocol Not Found</h2>
          <p className="text-muted-foreground">
            The biomanufacturing protocol you're looking for doesn't exist in our network.
          </p>
        </div>
        
        <Button variant="hero" size="lg" asChild>
          <a href="/" className="inline-flex items-center">
            <Home className="w-4 h-4 mr-2" />
            Return to Lab
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
