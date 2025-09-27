import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Brain, Lock, Cpu, Globe } from "lucide-react";
import securityPattern from "@/assets/security-pattern.jpg";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI Agent Validation",
      description: "Multi-function AI agent validates your GitHub repositories before deployment, ensuring code quality and security standards.",
      badge: "Intelligent"
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Revolutionary 5-key block system with random key selection provides quantum-resistant protection against attacks.",
      badge: "Quantum Safe"
    },
    {
      icon: Zap,
      title: "Self-Evolution",
      description: "Proprietary evolution formula strengthens security blocks over time, adapting to new threats automatically.",
      badge: "Adaptive"
    },
    {
      icon: Lock,
      title: "Noise-Based Keys",
      description: "Private keys generated using advanced noise algorithms ensure maximum unpredictability and security.",
      badge: "Cryptographic"
    },
    {
      icon: Cpu,
      title: "Dynamic Block IDs",
      description: "Unique block identification system can instantly change indices when under attack, confusing potential hackers.",
      badge: "Dynamic"
    },
    {
      icon: Globe,
      title: "Decentralized Hosting",
      description: "Your applications are hosted across a distributed blockchain network, ensuring maximum availability.",
      badge: "Distributed"
    }
  ];

  return (
    <section id="features" className="py-20 relative overflow-hidden">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-5 bg-cover bg-center"
        style={{ backgroundImage: `url(${securityPattern})` }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-accent text-accent">
            Revolutionary Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-secondary bg-clip-text text-transparent">
              Next-Generation
            </span>{" "}
            Web Hosting
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience the future of web hosting with our innovative blockchain technology and AI-powered security systems.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-gradient-card border-primary/20 hover:border-primary/40 transition-smooth hover:shadow-primary/20 hover:shadow-lg group"
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-lg bg-gradient-primary group-hover:shadow-glow-primary transition-smooth">
                      <IconComponent className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground group-hover:text-primary transition-smooth">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;