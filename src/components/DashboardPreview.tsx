import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Activity, Shield, Zap, Globe, Clock, Database } from "lucide-react";

const DashboardPreview = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary text-primary">
            Live Dashboard
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Monitor Your{" "}
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Blockchain Hosting
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real-time insights into your hosting performance, security status, and blockchain evolution.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          {/* Main Dashboard Card */}
          <Card className="bg-gradient-card border-primary/20 shadow-primary/10 mb-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl text-foreground flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-primary">
                    <Activity className="h-6 w-6 text-primary-foreground" />
                  </div>
                  Hosting Dashboard
                </CardTitle>
                <Badge variant="default" className="bg-success text-success-foreground">
                  <div className="w-2 h-2 bg-success-foreground rounded-full animate-pulse mr-2" />
                  Active
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-2xl font-bold text-foreground">3</div>
                      <div className="text-sm text-muted-foreground">Active Sites</div>
                    </div>
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-accent" />
                    <div>
                      <div className="text-2xl font-bold text-foreground">Level 7</div>
                      <div className="text-sm text-muted-foreground">Security</div>
                    </div>
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-secondary" />
                    <div>
                      <div className="text-2xl font-bold text-foreground">12</div>
                      <div className="text-sm text-muted-foreground">Evolutions</div>
                    </div>
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-warning" />
                    <div>
                      <div className="text-2xl font-bold text-foreground">847</div>
                      <div className="text-sm text-muted-foreground">Blocks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Block Evolution</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">Security Level</span>
                    <span className="text-sm text-muted-foreground">94%</span>
                  </div>
                  <Progress value={94} className="h-2" />
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-background/30 rounded-lg p-4 border border-border">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Recent Activity
                </h4>
                <div className="space-y-3">
                  {[
                    { action: "Block #847 evolved", time: "2 minutes ago", status: "success" },
                    { action: "Security scan completed", time: "15 minutes ago", status: "success" },
                    { action: "New deployment: portfolio-site", time: "1 hour ago", status: "info" },
                    { action: "Key rotation cycle #12", time: "3 hours ago", status: "warning" }
                  ].map((activity, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <span className="text-sm text-foreground">{activity.action}</span>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={activity.status === 'success' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="text-center">
            <Button variant="hero" size="xl" className="mr-4">
              Access Full Dashboard
            </Button>
            <Button variant="matrix" size="xl">
              View Analytics
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;