import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, amount, currency = "usd", successUrl, cancelUrl } = await req.json();

    if (!bookingId || !amount) {
      throw new Error("Missing required parameters: bookingId and amount");
    }

    // Initialize Supabase client with service role for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user from request headers
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const userSupabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userSupabase.auth.getUser(token);
    if (userError || !userData.user?.email) throw new Error("User not authenticated");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: userData.user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : userData.user.email,
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: `Production Slot Booking - ${booking.slot_id}`,
              description: `Biomanufacturing slot booking payment`,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl || `${req.headers.get("origin")}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/booking-canceled`,
      metadata: {
        bookingId,
        userId: userData.user.id,
      },
    });

    // Store payment session in database
    const { error: sessionError } = await supabase
      .from('payment_sessions')
      .insert({
        booking_id: bookingId,
        stripe_session_id: session.id,
        amount: Math.round(amount * 100),
        currency,
        status: 'pending'
      });

    if (sessionError) {
      console.error('Error storing payment session:', sessionError);
      throw new Error("Failed to store payment session");
    }

    // Update booking with payment session ID
    await supabase
      .from('bookings')
      .update({ 
        payment_session_id: session.id,
        payment_method: 'credit-card' 
      })
      .eq('id', bookingId);

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Payment session creation error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || "Failed to create payment session" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});