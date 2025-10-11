-- Create facilities using existing users (we'll use the existing facility user)
INSERT INTO public.facilities (owner_user_id, name, location, description, certifications, status, reputation_score, cancellation_rate, qa_pass_rate, on_time_percentage) VALUES
('ae6b8e6d-68fb-478b-acda-ac1bf90dc2f3', 'BioPharma Excellence', 'Cambridge, MA', 'State-of-the-art GMP facility specializing in vaccine and therapeutic production', ARRAY['FDA GMP', 'EMA GMP', 'ISO 13485'], 'approved', 4.9, 0.02, 0.98, 0.96),
('ae6b8e6d-68fb-478b-acda-ac1bf90dc2f3', 'Innovation BioCenter', 'San Francisco, CA', 'Cutting-edge R&D facility for early-stage biotechnology development', ARRAY['ISO 9001', 'AAALAC'], 'approved', 4.7, 0.05, 0.94, 0.92),
('ae6b8e6d-68fb-478b-acda-ac1bf90dc2f3', 'ClinTech Solutions', 'Basel, Switzerland', 'GCP-compliant facility for clinical trial manufacturing', ARRAY['FDA GCP', 'EMA GCP', 'ISO 14155'], 'approved', 4.8, 0.03, 0.96, 0.94);

-- Insert sample slots for the facilities
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
  (NOW() + (slot_data.days_offset || ' days')::interval)::timestamptz,
  (NOW() + (slot_data.days_offset || ' days')::interval + (slot_data.duration_hours || ' hours')::interval)::timestamptz,
  slot_data.is_available
FROM facilities f
CROSS JOIN (
  VALUES 
    ('Premium GMP Vaccine Production', 'State-of-the-art facility with automated systems for vaccine production', 'Automated Bioreactor 2000L', 120, 45000, 'gmp', '1000L - 5000L', '7', true),
    ('Rapid Prototyping Lab Space', 'Perfect for early-stage research and development projects', 'Modular R&D Suite', 96, 18000, 'rd', '50L - 500L', '14', true),
    ('Clinical Trial Manufacturing', 'GCP-compliant facility for clinical phase production', 'Single-Use Bioreactor 1000L', 144, 52000, 'gcp', '500L - 2000L', '21', true),
    ('Advanced Cell Culture System', 'Latest technology for advanced cell culture applications', 'Advanced Cell Culture System', 168, 38000, 'gmp', '200L - 1000L', '28', true),
    ('Protein Expression Platform', 'High-yield protein production using mammalian cell lines', 'CHO Expression System', 80, 28000, 'gmp', '100L - 800L', '35', true),
    ('Bioreactor Suite 500L', 'Flexible biomanufacturing capacity', 'Bioreactor Suite 500L', 72, 22000, 'gmp', '200L - 800L', '42', true),
    ('Automated Processing Line', 'High-throughput processing capabilities', 'Automated Processing Line', 96, 32000, 'gmp', '500L - 2000L', '49', true),
    ('Research & Development Lab', 'Early-stage development and testing', 'R&D Lab Equipment', 48, 12000, 'rd', '10L - 100L', '56', true)
) AS slot_data(title, description, equipment, duration_hours, price, compliance_level, scale_capacity, days_offset, is_available)
WHERE f.status = 'approved';