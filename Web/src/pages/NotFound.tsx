import { useLocation } from "react-router-dom";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center cyber-grid">
      <div className="text-center space-y-4">
        <Zap className="w-8 h-8 text-primary mx-auto" />
        <h1 className="text-6xl font-display font-bold text-primary glow-text-primary">404</h1>
        <p className="text-muted-foreground">
          Route <code className="text-primary font-display">{location.pathname}</code> not found
        </p>
        <Button onClick={() => window.location.replace("/")} className="mt-4">
          Return to Login
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
