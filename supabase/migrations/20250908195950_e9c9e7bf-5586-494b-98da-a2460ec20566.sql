-- First create facility owner profiles
INSERT INTO public.profiles (user_id, role, first_name, last_name, email, reputation_score, verification_status) VALUES
(gen_random_uuid(), 'facility', 'Dr. Sarah', 'Johnson', 'sarah.johnson@biopharmaexcellence.com', 4.9, true),
(gen_random_uuid(), 'facility', 'Dr. Michael', 'Chen', 'michael.chen@innovationbiocenter.com', 4.7, true),
(gen_random_uuid(), 'facility', 'Dr. Emma', 'Schmidt', 'emma.schmidt@clintechsolutions.com', 4.8, true),
(gen_random_uuid(), 'facility', 'Dr. Raj', 'Patel', 'raj.patel@nextgenbiologics.com', 4.6, true),
(gen_random_uuid(), 'facility', 'Dr. Lisa', 'Rodriguez', 'lisa.rodriguez@precisionbiolabs.com', 4.8, true);

-- Insert facilities using the created facility owner profiles
INSERT INTO public.facilities (owner_user_id, name, location, description, certifications, status, reputation_score, cancellation_rate, qa_pass_rate, on_time_percentage) 
SELECT 
  p.user_id,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN 'BioPharma Excellence'
    WHEN p.email LIKE '%innovationbiocenter%' THEN 'Innovation BioCenter' 
    WHEN p.email LIKE '%clintechsolutions%' THEN 'ClinTech Solutions'
    WHEN p.email LIKE '%nextgenbiologics%' THEN 'NextGen Biologics'
    WHEN p.email LIKE '%precisionbiolabs%' THEN 'PrecisionBio Labs'
  END as name,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN 'Cambridge, MA'
    WHEN p.email LIKE '%innovationbiocenter%' THEN 'San Francisco, CA'
    WHEN p.email LIKE '%clintechsolutions%' THEN 'Basel, Switzerland'
    WHEN p.email LIKE '%nextgenbiologics%' THEN 'Singapore'
    WHEN p.email LIKE '%precisionbiolabs%' THEN 'Boston, MA'
  END as location,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN 'State-of-the-art GMP facility specializing in vaccine and therapeutic production'
    WHEN p.email LIKE '%innovationbiocenter%' THEN 'Cutting-edge R&D facility for early-stage biotechnology development'
    WHEN p.email LIKE '%clintechsolutions%' THEN 'GCP-compliant facility for clinical trial manufacturing'
    WHEN p.email LIKE '%nextgenbiologics%' THEN 'Advanced cell culture and biologics manufacturing facility'
    WHEN p.email LIKE '%precisionbiolabs%' THEN 'Specialized in precision medicine and personalized therapeutics'
  END as description,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN ARRAY['FDA GMP', 'EMA GMP', 'ISO 13485']
    WHEN p.email LIKE '%innovationbiocenter%' THEN ARRAY['ISO 9001', 'AAALAC']
    WHEN p.email LIKE '%clintechsolutions%' THEN ARRAY['FDA GCP', 'EMA GCP', 'ISO 14155']
    WHEN p.email LIKE '%nextgenbiologics%' THEN ARRAY['Singapore GMP', 'WHO GMP']
    WHEN p.email LIKE '%precisionbiolabs%' THEN ARRAY['FDA GMP', 'CAP', 'CLIA']
  END as certifications,
  'approved'::facility_status,
  p.reputation_score,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN 0.02
    WHEN p.email LIKE '%innovationbiocenter%' THEN 0.05
    WHEN p.email LIKE '%clintechsolutions%' THEN 0.03
    WHEN p.email LIKE '%nextgenbiologics%' THEN 0.04
    WHEN p.email LIKE '%precisionbiolabs%' THEN 0.02
  END as cancellation_rate,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN 0.98
    WHEN p.email LIKE '%innovationbiocenter%' THEN 0.94
    WHEN p.email LIKE '%clintechsolutions%' THEN 0.96
    WHEN p.email LIKE '%nextgenbiologics%' THEN 0.93
    WHEN p.email LIKE '%precisionbiolabs%' THEN 0.97
  END as qa_pass_rate,
  CASE 
    WHEN p.email LIKE '%biopharmaexcellence%' THEN 0.96
    WHEN p.email LIKE '%innovationbiocenter%' THEN 0.92
    WHEN p.email LIKE '%clintechsolutions%' THEN 0.94
    WHEN p.email LIKE '%nextgenbiologics%' THEN 0.90
    WHEN p.email LIKE '%precisionbiolabs%' THEN 0.95
  END as on_time_percentage
FROM public.profiles p 
WHERE p.role = 'facility' 
  AND p.email IN (
    'sarah.johnson@biopharmaexcellence.com',
    'michael.chen@innovationbiocenter.com', 
    'emma.schmidt@clintechsolutions.com',
    'raj.patel@nextgenbiologics.com',
    'lisa.rodriguez@precisionbiolabs.com'
  );