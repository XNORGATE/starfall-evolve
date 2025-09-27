import { Button } from "@/components/ui/button";
import { Github, Shield, Zap } from "lucide-react";

const StarfallHeader = () => {
  return (
    <header className="fixed top-0 w-full z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Starfall Key
          </span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
            Features
          </a>
          <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-smooth">
            How it Works
          </a>
          <a href="#security" className="text-muted-foreground hover:text-foreground transition-smooth">
            Security
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Github className="h-4 w-4" />
            GitHub
          </Button>
          <Button variant="neon" size="sm">
            <Zap className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </header>
  );
};

export default StarfallHeader;