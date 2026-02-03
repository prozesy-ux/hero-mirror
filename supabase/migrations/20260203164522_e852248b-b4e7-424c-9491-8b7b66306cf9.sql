-- =============================================
-- Product Type-Based Delivery System Schema
-- =============================================

-- 1. Product Content Table - Stores downloadable files and content
CREATE TABLE public.product_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('file', 'link', 'text', 'lesson', 'video_stream')),
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  file_type TEXT,
  stream_url TEXT,
  external_link TEXT,
  text_content TEXT,
  display_order INT DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Course Lessons Table - For course/tutorial products
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  video_duration INT,
  content_html TEXT,
  attachments JSONB DEFAULT '[]',
  display_order INT DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Buyer Content Access Table - Tracks buyer access rights
CREATE TABLE public.buyer_content_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  order_id UUID REFERENCES public.seller_orders(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  access_type TEXT NOT NULL CHECK (access_type IN ('download', 'stream', 'course', 'membership', 'service')),
  access_granted_at TIMESTAMPTZ DEFAULT now(),
  access_expires_at TIMESTAMPTZ,
  download_count INT DEFAULT 0,
  max_downloads INT,
  last_accessed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(buyer_id, product_id, order_id)
);

-- 4. Course Progress Table - Tracks lesson progress
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  progress_percent INT DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed_at TIMESTAMPTZ,
  last_position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(buyer_id, lesson_id)
);

-- 5. Service Bookings Table - For Call and Commission products
CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.seller_orders(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.seller_products(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('call', 'commission', 'service')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE,
  scheduled_time TIME,
  duration_minutes INT,
  meeting_link TEXT,
  timezone TEXT DEFAULT 'UTC',
  commission_brief TEXT,
  deposit_paid BOOLEAN DEFAULT false,
  final_paid BOOLEAN DEFAULT false,
  deliverables JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Extend seller_products table with delivery configuration
ALTER TABLE public.seller_products 
  ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS call_duration_minutes INT,
  ADD COLUMN IF NOT EXISTS availability_slots JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS membership_period TEXT,
  ADD COLUMN IF NOT EXISTS bundle_product_ids UUID[],
  ADD COLUMN IF NOT EXISTS thank_you_message TEXT;

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_product_content_product_id ON public.product_content(product_id);
CREATE INDEX idx_course_lessons_product_id ON public.course_lessons(product_id);
CREATE INDEX idx_buyer_content_access_buyer_id ON public.buyer_content_access(buyer_id);
CREATE INDEX idx_buyer_content_access_product_id ON public.buyer_content_access(product_id);
CREATE INDEX idx_course_progress_buyer_id ON public.course_progress(buyer_id);
CREATE INDEX idx_course_progress_product_id ON public.course_progress(product_id);
CREATE INDEX idx_service_bookings_buyer_id ON public.service_bookings(buyer_id);
CREATE INDEX idx_service_bookings_seller_id ON public.service_bookings(seller_id);
CREATE INDEX idx_service_bookings_status ON public.service_bookings(status);

-- =============================================
-- Enable RLS
-- =============================================
ALTER TABLE public.product_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_content_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for product_content
-- =============================================
-- Public can view preview content
CREATE POLICY "Anyone can view preview content"
ON public.product_content FOR SELECT
USING (is_preview = true);

-- Sellers can manage their product content
CREATE POLICY "Sellers can manage their product content"
ON public.product_content FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products sp
    JOIN public.seller_profiles sel ON sp.seller_id = sel.id
    WHERE sp.id = product_content.product_id
    AND sel.user_id = auth.uid()
  )
);

-- Buyers with access can view content
CREATE POLICY "Buyers with access can view content"
ON public.product_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_content_access bca
    WHERE bca.product_id = product_content.product_id
    AND bca.buyer_id = auth.uid()
    AND (bca.access_expires_at IS NULL OR bca.access_expires_at > now())
  )
);

-- =============================================
-- RLS Policies for course_lessons
-- =============================================
-- Public can view free preview lessons
CREATE POLICY "Anyone can view free preview lessons"
ON public.course_lessons FOR SELECT
USING (is_free_preview = true);

-- Sellers can manage their course lessons
CREATE POLICY "Sellers can manage their course lessons"
ON public.course_lessons FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products sp
    JOIN public.seller_profiles sel ON sp.seller_id = sel.id
    WHERE sp.id = course_lessons.product_id
    AND sel.user_id = auth.uid()
  )
);

-- Buyers with course access can view lessons
CREATE POLICY "Buyers with course access can view lessons"
ON public.course_lessons FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.buyer_content_access bca
    WHERE bca.product_id = course_lessons.product_id
    AND bca.buyer_id = auth.uid()
    AND bca.access_type = 'course'
    AND (bca.access_expires_at IS NULL OR bca.access_expires_at > now())
  )
);

-- =============================================
-- RLS Policies for buyer_content_access
-- =============================================
-- Buyers can view their own access records
CREATE POLICY "Buyers can view their own access"
ON public.buyer_content_access FOR SELECT
USING (buyer_id = auth.uid());

-- Sellers can view access for their products
CREATE POLICY "Sellers can view access for their products"
ON public.buyer_content_access FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products sp
    JOIN public.seller_profiles sel ON sp.seller_id = sel.id
    WHERE sp.id = buyer_content_access.product_id
    AND sel.user_id = auth.uid()
  )
);

-- =============================================
-- RLS Policies for course_progress
-- =============================================
-- Buyers can manage their own progress
CREATE POLICY "Buyers can manage their own course progress"
ON public.course_progress FOR ALL
USING (buyer_id = auth.uid());

-- Sellers can view progress for their courses
CREATE POLICY "Sellers can view progress for their courses"
ON public.course_progress FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seller_products sp
    JOIN public.seller_profiles sel ON sp.seller_id = sel.id
    WHERE sp.id = course_progress.product_id
    AND sel.user_id = auth.uid()
  )
);

-- =============================================
-- RLS Policies for service_bookings
-- =============================================
-- Buyers can view and update their own bookings
CREATE POLICY "Buyers can view their bookings"
ON public.service_bookings FOR SELECT
USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can update their bookings"
ON public.service_bookings FOR UPDATE
USING (buyer_id = auth.uid());

-- Sellers can manage bookings for their services
CREATE POLICY "Sellers can manage their service bookings"
ON public.service_bookings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.seller_profiles sel
    WHERE sel.id = service_bookings.seller_id
    AND sel.user_id = auth.uid()
  )
);

-- =============================================
-- Trigger for course_progress updated_at
-- =============================================
CREATE TRIGGER update_course_progress_updated_at
BEFORE UPDATE ON public.course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at
BEFORE UPDATE ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Storage bucket for product files (private)
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-files', 'product-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-files bucket
CREATE POLICY "Sellers can upload product files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-files' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.seller_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can manage their product files"
ON storage.objects FOR ALL
USING (
  bucket_id = 'product-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Buyers can download purchased files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'product-files'
  AND EXISTS (
    SELECT 1 FROM public.buyer_content_access bca
    JOIN public.product_content pc ON pc.product_id = bca.product_id
    WHERE bca.buyer_id = auth.uid()
    AND pc.file_url LIKE '%' || name || '%'
    AND (bca.access_expires_at IS NULL OR bca.access_expires_at > now())
  )
);