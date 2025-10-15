import { useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  Star,
  Lock,
  Eye,
  RefreshCw
} from 'lucide-react';

export const Market = () => {
  const [activeTab, setActiveTab] = useState('resale');

  const mockResaleListings = [
    {
      id: '1',
      title: 'mRNA Vaccine Production Slot',
      facility: 'BioTech Labs Boston',
      originalPrice: 18500,
      currentPrice: 16000,
      discount: 13.5,
      rating: 4.9,
      timeLeft: '3 days',
      compliance: 'GMP',
      equipment: 'Bioreactor 1000L'
    },
    {
      id: '2',
      title: 'Cell Therapy Manufacturing',
      facility: 'GenCell Facility',
      originalPrice: 24000,
      currentPrice: 21600,
      discount: 10,
      rating: 4.7,
      timeLeft: '1 day',
      compliance: 'GMP',
      equipment: 'CleanRoom Suite'
    },
    {
      id: '3',
      title: 'Protein Expression Scale-Up',
      facility: 'ProTech Industries',
      originalPrice: 12000,
      currentPrice: 9800,
      discount: 18.3,
      rating: 4.6,
      timeLeft: '5 days',
      compliance: 'R&D',
      equipment: 'Fermenter 500L'
    }
  ];

  const mockTrendingProtocols = [
    {
      id: '1',
      name: 'mRNA Vaccine Production',
      avgPrice: '$18,500',
      change: '+12.5%',
      trend: 'up',
      volume: '24 slots',
      facilities: 8
    },
    {
      id: '2',
      name: 'Cell Therapy Manufacturing',
      avgPrice: '$24,200',
      change: '+8.3%',
      trend: 'up',
      volume: '18 slots',
      facilities: 6
    },
    {
      id: '3',
      name: 'Protein Purification',
      avgPrice: '$8,900',
      change: '-3.2%',
      trend: 'down',
      volume: '31 slots',
      facilities: 12
    },
    {
      id: '4',
      name: 'Antibody Production',
      avgPrice: '$15,600',
      change: '+5.7%',
      trend: 'up',
      volume: '22 slots',
      facilities: 9
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Secondary Market</h1>
              <p className="text-muted-foreground">Trade slot claims and discover pricing trends</p>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p className="text-2xl font-bold text-primary">$1.2M</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +24%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-2xl font-bold text-primary">37</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +8
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Discount</p>
                    <p className="text-2xl font-bold text-primary">12.8%</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Stable
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold text-primary">156</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +18%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resale" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Resale Listings
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Market Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="resale" className="space-y-6">
            <div className="grid gap-6">
              {mockResaleListings.map((listing) => (
                <Card key={listing.id} className="card-glow hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{listing.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            {listing.rating}
                          </div>
                          <span>{listing.facility}</span>
                          <Badge variant="outline" className="text-xs">
                            {listing.compliance}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{listing.equipment}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-muted-foreground line-through">
                            ${listing.originalPrice.toLocaleString()}
                          </span>
                          <Badge variant="outline" className="bg-green-500/10 text-green-400">
                            -{listing.discount}%
                          </Badge>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          ${listing.currentPrice.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {listing.timeLeft} left
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button variant="premium" className="flex-1">
                        <Lock className="w-4 h-4 mr-2" />
                        Purchase Slot
                      </Button>
                      <Button variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Protocol Pricing Trends</CardTitle>
                <CardDescription>Average prices and volume for popular protocols</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTrendingProtocols.map((protocol) => (
                    <div key={protocol.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{protocol.name}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{protocol.volume} this month</span>
                          <span>{protocol.facilities} facilities</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary mb-1">
                          {protocol.avgPrice}
                        </div>
                        <div className="flex items-center gap-1">
                          {protocol.trend === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <span className={`text-sm font-semibold ${
                            protocol.trend === 'up' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {protocol.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};
