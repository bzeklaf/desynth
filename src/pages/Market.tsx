import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, TrendingUp, Activity, DollarSign, Calendar, MapPin, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { SlotBookingFlow } from "@/components/SlotBookingFlow";

interface MarketListing {
  id: string;
  slot_id: string;
  seller_id: string;
  seller_type: string;
  listing_price: number;
  original_price: number;
  discount_percentage: number;
  status: string;
  listed_at: string;
  expires_at: string | null;
  description: string | null;
  slots: {
    id: string;
    title: string;
    equipment: string;
    start_date: string;
    end_date: string;
    compliance_level: string;
    facilities: {
      name: string;
      location: string;
    };
  };
}

export const Market = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("resale");
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [stats, setStats] = useState({
    totalVolume: 0,
    activeListings: 0,
    avgDiscount: 0,
    transactions: 0,
  });

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      setLoading(true);

      // Fetch active listings with slot and facility data
      const { data: listingsData, error: listingsError } = await supabase
        .from("market_listings")
        .select(`
          *,
          slots (
            id,
            title,
            equipment,
            start_date,
            end_date,
            compliance_level,
            facilities (
              name,
              location
            )
          )
        `)
        .eq("status", "active")
        .order("listed_at", { ascending: false });

      if (listingsError) throw listingsError;

      setListings(listingsData || []);

      // Calculate stats
      const { data: transactionsData } = await supabase
        .from("market_transactions")
        .select("transaction_amount, platform_fee");

      const totalVolume = transactionsData?.reduce(
        (sum, t) => sum + (Number(t.transaction_amount) || 0),
        0
      ) || 0;

      const avgDiscount = listingsData && listingsData.length > 0
        ? listingsData.reduce((sum, l) => sum + (parseFloat(String(l.discount_percentage)) || 0), 0) / listingsData.length
        : 0;

      setStats({
        totalVolume,
        activeListings: listingsData?.length || 0,
        avgDiscount: Math.round(avgDiscount),
        transactions: transactionsData?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching market data:", error);
      toast.error("Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (listing: MarketListing) => {
    if (!user) {
      toast.error("Please sign in to purchase a slot");
      return;
    }

    // Set the slot ID and slot data for booking flow
    setSelectedSlot({
      slotId: listing.slots.id,
      slotData: {
        id: listing.slots.id,
        title: listing.slots.title,
        equipment: listing.slots.equipment,
        start_date: listing.slots.start_date,
        end_date: listing.slots.end_date,
        compliance_level: listing.slots.compliance_level,
        price: parseFloat(String(listing.listing_price)),
        facility: listing.slots.facilities,
        isSecondaryMarket: true,
        listingId: listing.id,
      },
    });
  };

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
              <p className="text-muted-foreground">Trade manufacturing slots with price discovery and liquidity</p>
            </div>
          </div>

          {/* Market Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Volume</p>
                    <p className="text-2xl font-bold text-primary">
                      ${stats.totalVolume.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <p className="text-2xl font-bold text-primary">{stats.activeListings}</p>
                  </div>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Discount</p>
                    <p className="text-2xl font-bold text-primary">{stats.avgDiscount}%</p>
                  </div>
                  <TrendingDown className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="card-glow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p className="text-2xl font-bold text-primary">{stats.transactions}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
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
            {loading ? (
              <Card className="card-glow">
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Loading listings...</p>
                </CardContent>
              </Card>
            ) : listings.length === 0 ? (
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <Card key={listing.id} className="card-glow hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{listing.slots.title}</CardTitle>
                          <CardDescription>{listing.slots.facilities.name}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                          {listing.discount_percentage}% OFF
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{listing.slots.facilities.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(listing.slots.start_date), "MMM d")} -{" "}
                            {format(new Date(listing.slots.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold">
                            ${listing.listing_price.toLocaleString()}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            ${listing.original_price.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Listed {format(new Date(listing.listed_at), "MMM d, yyyy")}
                        </p>
                      </div>

                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {listing.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {listing.slots.compliance_level}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {listing.seller_type}
                        </Badge>
                      </div>

                      <Button 
                        onClick={() => handlePurchase(listing)}
                        className="w-full"
                      >
                        Purchase Slot
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <Card className="card-glow">
              <CardHeader>
                <CardTitle>Market Trends</CardTitle>
                <CardDescription>
                  Monitor pricing trends and demand signals across protocols
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Avg Days to Sale</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {listings.length > 0 ? "7-14" : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Based on recent transactions
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Most Active</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {listings.length > 0 ? listings[0].slots.compliance_level : "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          By compliance level
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Price Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold flex items-center gap-1">
                          {stats.avgDiscount > 0 ? (
                            <>
                              <TrendingDown className="h-5 w-5 text-green-600" />
                              <span className="text-green-600">-{stats.avgDiscount}%</span>
                            </>
                          ) : (
                            "N/A"
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Average discount rate
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedSlot && (
          <SlotBookingFlow
            slotId={selectedSlot.slotId}
            slotData={selectedSlot.slotData}
            onClose={() => {
              setSelectedSlot(null);
              fetchMarketData();
            }}
          />
        )}
      </main>
    </div>
  );
};

export default Market;
