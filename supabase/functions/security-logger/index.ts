import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logInfo, logError } from '../_shared/logger.ts';
import { checkRateLimit, createErrorResponse, AppError } from '../_shared/security.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SecurityLogEvent {
  eventType: 'failed_login' | 'suspicious_request' | 'rate_limit_exceeded' | 'invalid_input' | 'xss_attempt' | 'unauthorized_access';
  userId?: string;
  details?: Record<string, any>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseKey) {
      throw new AppError('CONFIG_ERROR', 'Missing Supabase configuration', 500);
    }

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Rate limiting: 100 requests per minute per IP
    const rateLimit = await checkRateLimit(`security-log:${clientIp}`, { 
      maxRequests: 100, 
      windowMs: 60000 
    });

    if (!rateLimit.allowed) {
      logError('Rate limit exceeded for security logging', { clientIp });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded',
          resetAt: new Date(rateLimit.resetAt).toISOString()
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString()
          }
        }
      );
    }

    const { eventType, userId, details, severity = 'medium', ipAddress, userAgent } = 
      await req.json() as SecurityLogEvent;

    if (!eventType) {
      throw new AppError('VALIDATION_ERROR', 'eventType is required', 400);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Log to console for immediate visibility
    logInfo('Security event logged', { 
      eventType, 
      userId, 
      severity, 
      ipAddress: ipAddress || clientIp,
      timestamp: new Date().toISOString()
    });

    // Store in database for audit trail
    // Note: You'll need to create a security_logs table in your database
    const logEntry = {
      event_type: eventType,
      user_id: userId || null,
      details: details || {},
      severity,
      ip_address: ipAddress || clientIp,
      user_agent: userAgent || req.headers.get('user-agent') || 'unknown',
      created_at: new Date().toISOString(),
    };

    // Try to insert into security_logs table if it exists
    try {
      const { error: insertError } = await supabase
        .from('security_logs')
        .insert(logEntry);

      if (insertError) {
        // Table might not exist yet - just log to console
        logInfo('Security log stored in-memory only (table not found)', logEntry);
      }
    } catch (error) {
      // Table doesn't exist - just log to console
      logInfo('Security log stored in-memory only', logEntry);
    }

    // Send alerts for critical events
    if (severity === 'critical' || severity === 'high') {
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            to: 'security@biosynthfi.com',
            subject: `[SECURITY ${severity.toUpperCase()}] ${eventType}`,
            html: `
              <h2>Security Alert</h2>
              <p><strong>Event Type:</strong> ${eventType}</p>
              <p><strong>Severity:</strong> ${severity}</p>
              <p><strong>User ID:</strong> ${userId || 'N/A'}</p>
              <p><strong>IP Address:</strong> ${ipAddress || clientIp}</p>
              <p><strong>Details:</strong></p>
              <pre>${JSON.stringify(details, null, 2)}</pre>
            `
          }
        });
      } catch (notifyError) {
        logError('Failed to send security alert email', notifyError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        logged: true,
        severity,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString()
        }
      }
    );

  } catch (error) {
    return createErrorResponse(error, corsHeaders);
  }
});
