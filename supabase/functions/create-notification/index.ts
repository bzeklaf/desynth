import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  type: 'booking' | 'payment' | 'message' | 'compliance' | 'system' | 'audit' | 'facility' | 'dispute';
  title: string;
  message: string;
  urgent?: boolean;
  actionUrl?: string;
  sendEmail?: boolean;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client with service role for secure operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify the user is authenticated
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body: NotificationRequest = await req.json();

    // Validate required fields
    if (!body.userId || !body.type || !body.title || !body.message) {
      throw new Error("Missing required fields: userId, type, title, message");
    }

    // Input validation
    if (body.title.length > 200) {
      throw new Error("Title must be less than 200 characters");
    }
    if (body.message.length > 1000) {
      throw new Error("Message must be less than 1000 characters");
    }
    if (body.actionUrl && body.actionUrl.length > 500) {
      throw new Error("Action URL must be less than 500 characters");
    }

    // Validate notification type
    const validTypes = ['booking', 'payment', 'message', 'compliance', 'system', 'audit', 'facility', 'dispute'];
    if (!validTypes.includes(body.type)) {
      throw new Error("Invalid notification type");
    }

    // Additional authorization check: users can only create notifications for themselves
    // OR they must be admin/facility owner with permission
    if (body.userId !== user.id) {
      // Check if user has permission to create notifications for others
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      // For bookings, verify the user is either the facility owner or involved in the booking
      if (body.type === 'booking' || body.type === 'facility') {
        // Allow facility owners and admins to send booking notifications
        if (profile?.role !== 'admin' && profile?.role !== 'facility') {
          // Verify relationship through bookings table
          const { data: booking } = await supabaseAdmin
            .from('bookings')
            .select(`
              id,
              buyer_id,
              slots!inner(
                facility_id,
                facilities!inner(
                  owner_user_id
                )
              )
            `)
            .or(`buyer_id.eq.${user.id},slots.facilities.owner_user_id.eq.${user.id}`)
            .limit(1)
            .single();

          if (!booking) {
            throw new Error("Unauthorized to create notification for this user");
          }
        }
      } else {
        // For other types, only admins can create notifications for other users
        if (profile?.role !== 'admin') {
          throw new Error("Only admins can create notifications for other users");
        }
      }
    }

    // Create notification using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert([
        {
          user_id: body.userId,
          type: body.type,
          title: body.title,
          message: body.message,
          urgent: body.urgent || false,
          action_url: body.actionUrl || null,
          read: false,
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Send email if requested
    if (body.sendEmail && body.userEmail) {
      await supabaseAdmin.functions.invoke('send-notification-email', {
        body: {
          to: body.userEmail,
          subject: body.title,
          html: generateEmailHTML(body.type, body.title, body.message, body.actionUrl),
          type: body.type
        }
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in create-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

const generateEmailHTML = (type: string, title: string, message: string, actionUrl?: string) => {
  const typeColors = {
    booking: '#10B981',
    payment: '#3B82F6',
    message: '#8B5CF6',
    compliance: '#F59E0B',
    system: '#6B7280',
    audit: '#EF4444',
    facility: '#14B8A6',
    dispute: '#F97316'
  };

  const color = typeColors[type as keyof typeof typeColors] || '#6B7280';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${color}; margin: 0; font-size: 24px;">DeSynth Platform</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Manufacturing Excellence Network</p>
        </div>
        
        <div style="border-left: 4px solid ${color}; padding-left: 20px; margin: 20px 0;">
          <h2 style="color: #111827; margin: 0 0 10px 0; font-size: 20px;">${title}</h2>
          <p style="color: #374151; margin: 0; line-height: 1.6;">${message}</p>
        </div>
        
        ${actionUrl ? `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background-color: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Details</a>
          </div>
        ` : ''}
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">
            This email was sent by DeSynth Platform. If you have any questions, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  `;
};

serve(handler);
