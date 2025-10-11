import { Navigation } from '@/components/Navigation';
import { SlotBrowser } from '@/components/SlotBrowser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Filter } from 'lucide-react';

export const Browse = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Browse Lab Slots</h1>
              <p className="text-muted-foreground">Find and book biomanufacturing capacity</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Slots</p>
                    <p className="text-2xl font-bold text-primary">42</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Price</p>
                    <p className="text-2xl font-bold text-primary">$8,200</p>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-400">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    -5%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Facilities</p>
                    <p className="text-2xl font-bold text-primary">18</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10">
                    <Filter className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <SlotBrowser />
      </main>
    </div>
  );
};