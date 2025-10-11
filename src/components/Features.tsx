import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Users, 
  BarChart3, 
  Globe, 
  Coins,
  Lock,
  TrendingUp,
  CheckCircle,
  Star
} from "lucide-react";

export const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "Decentralized Escrow",
      description: "Smart contract-based escrow system protects both buyers and sellers with automated dispute resolution.",
      badge: "Blockchain",
      color: "text-blue-500"
    },
    {
      icon: Coins,
      title: "Crypto Payments",
      description: "Accept USDC payments with low fees and instant settlement. Full integration with major wallets.",
      badge: "DeFi",
      color: "text-green-500"
    },
    {
      icon: Users,
      title: "Oracle Verification",
      description: "Independent auditors verify production quality and compliance, building trust in the network.",
      badge: "Trust",
      color: "text-purple-500"
    },
    {
      icon: BarChart3,
      title: "Market Intelligence",
      description: "Real-time pricing, capacity analytics, and demand forecasting for optimal resource allocation.",
      badge: "Analytics",
      color: "text-orange-500"
    },
    {
      icon: Lock,
      title: "IP Protection",
      description: "Secure your intellectual property with blockchain-verified confidentiality agreements.",
      badge: "Security",
      color: "text-red-500"
    },
    {
      icon: TrendingUp,
      title: "Reputation System",
      description: "Build your reputation through successful collaborations and quality deliverables.",
      badge: "Reputation",
      color: "text-indigo-500"
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Built for the Future of <span className="gradient-text">Biotech</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            DeSynth combines cutting-edge blockchain technology with real-world biotech needs, 
            creating a trustless marketplace for synthetic biology services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Statistics */}
        <div className="mt-20 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="space-y-2">
              <div className="text-3xl font-bold gradient-text">99.8%</div>
              <div className="text-sm text-muted-foreground">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold gradient-text">$50M+</div>
              <div className="text-sm text-muted-foreground">Transaction Volume</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold gradient-text">500+</div>
              <div className="text-sm text-muted-foreground">Active Labs</div>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold gradient-text">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};