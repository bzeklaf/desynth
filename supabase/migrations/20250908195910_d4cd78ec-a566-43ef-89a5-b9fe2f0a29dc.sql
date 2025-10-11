-- Insert sample facilities
INSERT INTO public.facilities (owner_user_id, name, location, description, certifications, status, reputation_score, cancellation_rate, qa_pass_rate, on_time_percentage) VALUES
(gen_random_uuid(), 'BioPharma Excellence', 'Cambridge, MA', 'State-of-the-art GMP facility specializing in vaccine and therapeutic production', ARRAY['FDA GMP', 'EMA GMP', 'ISO 13485'], 'approved', 4.9, 0.02, 0.98, 0.96),
(gen_random_uuid(), 'Innovation BioCenter', 'San Francisco, CA', 'Cutting-edge R&D facility for early-stage biotechnology development', ARRAY['ISO 9001', 'AAALAC'], 'approved', 4.7, 0.05, 0.94, 0.92),
(gen_random_uuid(), 'ClinTech Solutions', 'Basel, Switzerland', 'GCP-compliant facility for clinical trial manufacturing', ARRAY['FDA GCP', 'EMA GCP', 'ISO 14155'], 'approved', 4.8, 0.03, 0.96, 0.94),
(gen_random_uuid(), 'NextGen Biologics', 'Singapore', 'Advanced cell culture and biologics manufacturing facility', ARRAY['Singapore GMP', 'WHO GMP'], 'approved', 4.6, 0.04, 0.93, 0.90),
(gen_random_uuid(), 'PrecisionBio Labs', 'Boston, MA', 'Specialized in precision medicine and personalized therapeutics', ARRAY['FDA GMP', 'CAP', 'CLIA'], 'approved', 4.8, 0.02, 0.97, 0.95);

-- Insert sample slots for each facility
INSERT INTO public.slots (facility_id, title, description, equipment, duration_hours, price, compliance_level, scale_capacity, start_date, end_date, is_available) 
SELECT 
  f.id,
  slot_data.title,
  slot_data.description,
  slot_data.equipment,
  slot_data.duration_hours,
  slot_data.price,
  slot_data.compliance_level::compliance_level,
  slot_data.scale_capacity,
  slot_data.start_date,
  slot_data.end_date,
  slot_data.is_available
FROM facilities f
CROSS JOIN (
  VALUES 
    ('Premium GMP Vaccine Production', 'State-of-the-art facility with automated systems for vaccine production', 'Automated Bioreactor 2000L', 120, 45000, 'gmp', '1000L - 5000L', '2024-02-15 08:00:00+00', '2024-02-20 17:00:00+00', true),
    ('Rapid Prototyping Lab Space', 'Perfect for early-stage research and development projects', 'Modular R&D Suite', 96, 18000, 'rd', '50L - 500L', '2024-01-25 09:00:00+00', '2024-01-30 18:00:00+00', true),
    ('Clinical Trial Manufacturing', 'GCP-compliant facility for clinical phase production', 'Single-Use Bioreactor 1000L', 144, 52000, 'gcp', '500L - 2000L', '2024-03-01 07:00:00+00', '2024-03-07 19:00:00+00', true),
    ('Advanced Cell Culture System', 'Latest technology for advanced cell culture applications', 'Advanced Cell Culture System', 168, 38000, 'gmp', '200L - 1000L', '2024-02-05 08:30:00+00', '2024-02-12 17:30:00+00', true),
    ('Protein Expression Platform', 'High-yield protein production using mammalian cell lines', 'CHO Expression System', 80, 28000, 'gmp', '100L - 800L', '2024-01-20 07:00:00+00', '2024-01-24 19:00:00+00', true)
) AS slot_data(title, description, equipment, duration_hours, price, compliance_level, scale_capacity, start_date, end_date, is_available)
WHERE f.status = 'approved'
LIMIT 20;

-- Add future slots for continuous availability
INSERT INTO public.slots (facility_id, title, description, equipment, duration_hours, price, compliance_level, scale_capacity, start_date, end_date, is_available) 
SELECT 
  f.id,
  'Available Production Slot',
  'Flexible biomanufacturing capacity available for your projects',
  CASE 
    WHEN random() < 0.3 THEN 'Bioreactor Suite 500L'
    WHEN random() < 0.6 THEN 'Automated Processing Line'
    ELSE 'Custom Equipment Setup'
  END,
  (ARRAY[72, 96, 120, 144, 168])[floor(random() * 5 + 1)],
  (ARRAY[15000, 25000, 35000, 45000, 55000])[floor(random() * 5 + 1)],
  (ARRAY['rd', 'gmp', 'gcp'])[floor(random() * 3 + 1)]::compliance_level,
  (ARRAY['50L - 200L', '200L - 1000L', '1000L - 5000L'])[floor(random() * 3 + 1)],
  NOW() + INTERVAL '1 week' + (generate_series * INTERVAL '2 weeks'),
  NOW() + INTERVAL '1 week' + (generate_series * INTERVAL '2 weeks') + INTERVAL '5 days',
  true
FROM facilities f
CROSS JOIN generate_series(0, 3) AS generate_series
WHERE f.status = 'approved';