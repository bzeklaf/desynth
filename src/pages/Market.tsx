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
  Eye
} from 'lucide-react';

export const Market = () => {
  const [activeTab, setActiveTab] = useState('resale');

  // TODO: Replace with real data from database
  const resaleListings: any[] = [];
  const trendingProtocols: any[] = [];

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
                    <p className="text-2xl font-bold text-primary">$0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-2xl font-bold text-primary">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Discount</p>
                    <p className="text-2xl font-bold text-primary">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold text-primary">0</p>
                  </div>
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
            {resaleListings.length === 0 ? (
              <Card className="card-glow">
                <CardContent className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Resale Listings</h3>
                  <p className="text-muted-foreground">
                    There are currently no slots available for resale. Check back later.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {resaleListings.map((listing) => (
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
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Protocol Pricing Trends</CardTitle>
                <CardDescription>Average prices and volume for popular protocols</CardDescription>
              </CardHeader>
              <CardContent>
                {trendingProtocols.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Trend Data Available</h3>
                    <p className="text-muted-foreground">
                      Market trends will appear here once there is sufficient transaction data.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trendingProtocols.map((protocol) => (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};