import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, DollarSign, TrendingDown, Trash2, Edit, Package } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface Listing {
  id: string;
  slot_id: string;
  listing_price: number;
  original_price: number;
  discount_percentage: number;
  status: string;
  listed_at: string;
  expires_at: string | null;
  description: string | null;
  slots: {
    title: string;
    start_date: string;
    end_date: string;
    facilities: {
      name: string;
    };
  };
}

export function ManageMarketListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("market_listings")
        .select(`
          *,
          slots (
            title,
            start_date,
            end_date,
            facilities (
              name
            )
          )
        `)
        .eq("seller_id", user.id)
        .order("listed_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error: any) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from("market_listings")
        .update({ status: "cancelled" })
        .eq("id", listingId);

      if (error) throw error;

      toast.success("Listing cancelled successfully");
      fetchListings();
    } catch (error: any) {
      console.error("Error cancelling listing:", error);
      toast.error("Failed to cancel listing");
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      active: { variant: "default", label: "Active" },
      sold: { variant: "secondary", label: "Sold" },
      cancelled: { variant: "outline", label: "Cancelled" },
      expired: { variant: "destructive", label: "Expired" },
    };

    const config = variants[status] || variants.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading your listings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Market Listings</CardTitle>
              <CardDescription>
                Manage your slots listed on the secondary market
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {listings.filter(l => l.status === "active").length} Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                You haven't listed any slots yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{listing.slots.title}</h3>
                          {getStatusBadge(listing.status)}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(listing.slots.start_date), "MMM d")} -{" "}
                              {format(new Date(listing.slots.end_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                            <TrendingDown className="h-3 w-3 mr-1" />
                            {listing.discount_percentage}% OFF
                          </Badge>
                        </div>

                        {listing.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {listing.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right space-y-2">
                        <div>
                          <div className="text-2xl font-bold">
                            ${listing.listing_price.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground line-through">
                            ${listing.original_price.toLocaleString()}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Listed {format(new Date(listing.listed_at), "MMM d, yyyy")}
                        </div>

                        {listing.status === "active" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteId(listing.id)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove your slot from the secondary market. You can always list it again later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Listing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleCancelListing(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
