-- COMPREHENSIVE SECURITY FIX - Part 2: Update RLS policies and prevent privilege escalation

-- ===========================================================================
-- STRENGTHEN PAYMENT_SESSIONS RLS POLICIES  
-- ============================================================================

DROP POLICY IF EXISTS "Service role can insert payment sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Service role can update payment sessions" ON public.payment_sessions;
DROP POLICY IF EXISTS "Users can view their own payment sessions" ON public.payment_sessions;

CREATE POLICY "Users can view their payment sessions"
ON public.payment_sessions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = payment_sessions.booking_id
      AND b.buyer_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Service role can manage payment sessions" ON public.payment_sessions;
CREATE POLICY "Service role can manage payment sessions"
ON public.payment_sessions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================================
-- STRENGTHEN TRANSACTIONS RLS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;

CREATE POLICY "Users can view their transactions"
ON public.transactions FOR SELECT TO authenticated
USING (
  (payer_id = auth.uid() OR payee_id = auth.uid())
  AND (
    booking_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = transactions.booking_id
        AND (b.buyer_id = auth.uid() OR EXISTS (
          SELECT 1 FROM slots s
          JOIN facilities f ON s.facility_id = f.id
          WHERE s.id = b.slot_id AND f.owner_user_id = auth.uid()
        ))
    )
  )
);

DROP POLICY IF EXISTS "Service role can manage transactions" ON public.transactions;
CREATE POLICY "Service role can manage transactions"
ON public.transactions FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================================
-- STRENGTHEN REVENUE_ANALYTICS
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Buyers can view their spending analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Facilities can view their revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "System can insert revenue analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Buyers can view their own spending" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Facilities can view their own revenue" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.revenue_analytics;
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.revenue_analytics;

CREATE POLICY "Buyers can view their own spending"
ON public.revenue_analytics FOR SELECT TO authenticated
USING (buyer_id = auth.uid() AND booking_id IS NOT NULL);

CREATE POLICY "Facilities can view their own revenue"
ON public.revenue_analytics FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM facilities f
    WHERE f.id = revenue_analytics.facility_id
      AND f.owner_user_id = auth.uid()
  )
  AND booking_id IS NOT NULL
);

CREATE POLICY "Admins can view all analytics"
ON public.revenue_analytics FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can insert analytics"
ON public.revenue_analytics FOR INSERT TO service_role
WITH CHECK (true);

-- ============================================================================
-- UPDATE OTHER RLS POLICIES TO USE SECURE ROLE FUNCTION
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all facilities" ON public.facilities;
CREATE POLICY "Admins can manage all facilities"
ON public.facilities FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Auditors can create attestations" ON public.attestations;
CREATE POLICY "Auditors can create attestations"
ON public.attestations FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'auditor'));

DROP POLICY IF EXISTS "Auditors can view attestations" ON public.attestations;
CREATE POLICY "Auditors can view attestations"
ON public.attestations FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'auditor') 
  OR public.has_role(auth.uid(), 'admin')
);

DROP POLICY IF EXISTS "Admins can manage audit tasks" ON public.audit_tasks;
CREATE POLICY "Admins can manage audit tasks"
ON public.audit_tasks FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Auditors can view assigned tasks" ON public.audit_tasks;
CREATE POLICY "Auditors can view assigned tasks"
ON public.audit_tasks FOR SELECT TO authenticated
USING (
  auditor_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM facilities f
    WHERE f.id = audit_tasks.facility_id AND f.owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.facility_subscriptions;
CREATE POLICY "Admins can manage all subscriptions"
ON public.facility_subscriptions FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can manage all claims" ON public.insurance_claims;
CREATE POLICY "Admins can manage all claims"
ON public.insurance_claims FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Only admins can manage revenue settings" ON public.revenue_settings;
CREATE POLICY "Only admins can manage revenue settings"
ON public.revenue_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));