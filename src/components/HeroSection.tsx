import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Rocket, Shield } from "lucide-react";
import heroImage from "@/assets/hero-blockchain.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-2 h-2 bg-accent rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-primary rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-secondary rounded-full animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-accent/50 rounded-full animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Hero Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-card border border-primary/30 rounded-full px-4 py-2 mb-8">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              Next-Generation Blockchain Hosting
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Starfall Key
            </span>
            <br />
            <span className="text-foreground">
              Self-Evolved Web Hosting
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Revolutionary blockchain hosting with AI validation, evolutionary security, and quantum-resistant protection for your web applications.
          </p>

          {/* GitHub Input Section */}
          <div className="bg-gradient-card border border-primary/20 rounded-2xl p-8 mb-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 text-foreground">Deploy Your Project</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="https://github.com/username/repository"
                  className="pl-10 bg-background/50 border-border focus:border-primary transition-smooth"
                />
              </div>
              <Button variant="hero" size="lg" className="whitespace-nowrap">
                <Rocket className="h-5 w-5" />
                Deploy Now
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Our AI agent will validate and deploy your project to the blockchain
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="neon" size="xl">
              <Shield className="h-5 w-5" />
              Start Hosting
            </Button>
            <Button variant="matrix" size="xl">
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent mb-2">99.9%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">5</div>
              <div className="text-sm text-muted-foreground">Keys per Block</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Evolution Cycles</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;