import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateMarketListingProps {
  slotId: string;
  originalPrice: number;
  bookingId?: string;
  sellerType: "facility" | "buyer";
  onSuccess?: () => void;
}

export function CreateMarketListing({
  slotId,
  originalPrice,
  bookingId,
  sellerType,
  onSuccess,
}: CreateMarketListingProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [listingPrice, setListingPrice] = useState(originalPrice.toString());
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [description, setDescription] = useState("");

  const discountPercentage = originalPrice > 0 
    ? ((originalPrice - parseFloat(listingPrice || "0")) / originalPrice * 100).toFixed(2)
    : "0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create a listing");
      return;
    }

    const price = parseFloat(listingPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    if (price >= originalPrice) {
      toast.error("Listing price must be lower than the original price");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("market_listings")
        .insert({
          slot_id: slotId,
          seller_id: user.id,
          seller_type: sellerType,
          original_booking_id: bookingId || null,
          listing_price: price,
          original_price: originalPrice,
          expires_at: expiresAt?.toISOString() || null,
          description: description || null,
        });

      if (error) throw error;

      toast.success("Listing created successfully!");
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Market Listing</CardTitle>
        <CardDescription>
          List your slot on the secondary market for resale
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="original-price">Original Price</Label>
            <Input
              id="original-price"
              type="number"
              value={originalPrice}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="listing-price">Listing Price *</Label>
            <Input
              id="listing-price"
              type="number"
              step="0.01"
              min="0"
              max={originalPrice}
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              placeholder="Enter listing price"
              required
            />
            <p className="text-sm text-muted-foreground">
              Discount: {discountPercentage}% off original price
            </p>
          </div>

          <div className="space-y-2">
            <Label>Expiration Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP") : "Select expiration date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about why you're selling or any terms..."
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Listing"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
