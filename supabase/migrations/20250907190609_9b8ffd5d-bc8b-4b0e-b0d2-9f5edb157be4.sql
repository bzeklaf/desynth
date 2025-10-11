-- Create tables for chat system, notifications, and auditing system

-- Chat channels table
CREATE TABLE public.chat_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('direct', 'booking', 'support', 'group')),
  participants TEXT[] NOT NULL DEFAULT '{}',
  booking_id UUID REFERENCES public.bookings(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name TEXT NOT NULL,
  sender_avatar_url TEXT,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  read_by JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'message', 'compliance', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  urgent BOOLEAN DEFAULT false,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit tasks table
CREATE TABLE public.audit_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id),
  facility_id UUID NOT NULL REFERENCES public.facilities(id),
  auditor_id UUID REFERENCES auth.users(id),
  audit_type TEXT NOT NULL CHECK (audit_type IN ('pre_production', 'in_progress', 'post_production', 'compliance')),
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_review', 'completed', 'requires_action')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  documents_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit findings table
CREATE TABLE public.audit_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audit_tasks(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('compliance', 'quality', 'safety', 'documentation', 'process')),
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Audit reports table
CREATE TABLE public.audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL REFERENCES public.audit_tasks(id),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  overall_rating TEXT NOT NULL CHECK (overall_rating IN ('pass', 'conditional_pass', 'fail')),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100),
  safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
  report_file_url TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;

-- Chat channels policies
CREATE POLICY "Users can view channels they participate in" ON public.chat_channels
FOR SELECT USING (auth.uid()::text = ANY(participants));

CREATE POLICY "Users can create channels" ON public.chat_channels
FOR INSERT WITH CHECK (auth.uid()::text = ANY(participants));

CREATE POLICY "Participants can update channels" ON public.chat_channels
FOR UPDATE USING (auth.uid()::text = ANY(participants));

-- Chat messages policies  
CREATE POLICY "Users can view messages in their channels" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_channels 
    WHERE id = channel_id AND auth.uid()::text = ANY(participants)
  )
);

CREATE POLICY "Users can send messages to their channels" ON public.chat_messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.chat_channels 
    WHERE id = channel_id AND auth.uid()::text = ANY(participants)
  )
);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON public.notifications
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Audit tasks policies
CREATE POLICY "Auditors can view assigned tasks" ON public.audit_tasks
FOR SELECT USING (
  auditor_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'facility'))
);

CREATE POLICY "Admins can manage audit tasks" ON public.audit_tasks
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Audit findings policies
CREATE POLICY "Users can view findings for their audits" ON public.audit_findings
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.audit_tasks 
    WHERE id = audit_id AND (
      auditor_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'facility'))
    )
  )
);

-- Audit reports policies
CREATE POLICY "Users can view reports for their audits" ON public.audit_reports  
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.audit_tasks 
    WHERE id = audit_id AND (
      auditor_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'facility'))
    )
  )
);

-- Create storage buckets for audit documents
INSERT INTO storage.buckets (id, name, public) VALUES 
('audit-documents', 'audit-documents', false),
('chat-attachments', 'chat-attachments', false);

-- Storage policies for audit documents
CREATE POLICY "Users can view audit documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'audit-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('auditor', 'admin', 'facility')
  )
);

CREATE POLICY "Auditors can upload documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'audit-documents' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('auditor', 'admin')
  )
);

-- Storage policies for chat attachments
CREATE POLICY "Users can view their chat attachments" ON storage.objects
FOR SELECT USING (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload chat attachments" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'chat-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add triggers for updated_at columns
CREATE TRIGGER update_chat_channels_updated_at
BEFORE UPDATE ON public.chat_channels
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_tasks_updated_at  
BEFORE UPDATE ON public.audit_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();