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
    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      throw new Error("Payment session not found");
    }

    // Get payment session from database
    const { data: paymentSession, error: psError } = await supabase
      .from('payment_sessions')
      .select('*, bookings(*)')
      .eq('stripe_session_id', sessionId)
      .single();

    if (psError || !paymentSession) {
      throw new Error("Payment session not found in database");
    }

    const isPaymentSuccessful = session.payment_status === 'paid';
    const newStatus = isPaymentSuccessful ? 'completed' : 'failed';

    // Update payment session status
    await supabase
      .from('payment_sessions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString() 
      })
      .eq('stripe_session_id', sessionId);

    if (isPaymentSuccessful) {
      // Update booking status to confirmed
      await supabase
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSession.booking_id);

      // Create transaction record
      await supabase
        .from('transactions')
        .insert({
          booking_id: paymentSession.booking_id,
          payer_id: paymentSession.bookings.buyer_id,
          amount: paymentSession.amount / 100, // Convert back to dollars
          status: 'completed',
          transaction_type: 'booking_payment',
          stripe_payment_intent_id: session.payment_intent,
          payment_method: 'credit-card'
        });

      // Send confirmation notification (optional)
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: paymentSession.bookings.buyer_id,
            type: 'booking_confirmation',
            data: {
              bookingId: paymentSession.booking_id,
              amount: paymentSession.amount / 100
            }
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't throw error for email failure
      }
    }

    return new Response(JSON.stringify({
      success: isPaymentSuccessful,
      status: newStatus,
      bookingId: paymentSession.booking_id,
      amount: paymentSession.amount / 100,
      currency: paymentSession.currency
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return new Response(JSON.stringify({ 
      error: error?.message || "Failed to verify payment" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});