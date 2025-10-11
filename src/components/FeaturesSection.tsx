import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Star, 
  DollarSign,
  Zap,
  Users,
  BarChart3
} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: "Oracle-Verified",
      description: "All protocols are resolved automatically using oracle verification, ensuring transparent and tamper-proof outcomes.",
      color: "text-green-400"
    },
    {
      icon: Star,
      title: "Reputation Scoring",
      description: "Build your on-chain reputation through accurate deliveries and earn higher rewards for consistent performance.",
      color: "text-yellow-400"
    },
    {
      icon: DollarSign,
      title: "Monetize Insights",
      description: "Stake your confidence and earn from both accurate deliveries and protocol purchases from consumers.",
      color: "text-green-400"
    }
  ];

  return (
    <section className="py-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Build the future of <span className="gradient-text">synthetic biology</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transform how biotech companies access lab capacity and build 
            reputation through transparent, oracle-verified protocols.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="card-glow border-border/50 p-6">
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};