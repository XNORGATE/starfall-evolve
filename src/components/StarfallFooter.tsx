import { Button } from "@/components/ui/button";
import { Shield, Github, Twitter, MessageCircle, Mail } from "lucide-react";

const StarfallFooter = () => {
  return (
    <footer className="bg-gradient-to-t from-background to-muted/10 border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 rounded-lg bg-gradient-primary">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Starfall Key
              </span>
            </div>
            <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
              Revolutionary blockchain hosting with AI validation, evolutionary security, and quantum-resistant protection for the next generation of web applications.
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Platform</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Deploy</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Dashboard</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Analytics</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Security</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Documentation</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">API Reference</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Community</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 Starfall Key. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth">Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StarfallFooter;