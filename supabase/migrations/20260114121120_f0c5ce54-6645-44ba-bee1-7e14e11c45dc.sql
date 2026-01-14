-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_pro BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE (user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prompts table
CREATE TABLE public.prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    image_url TEXT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    tool TEXT NOT NULL DEFAULT 'ChatGPT',
    is_free BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchases table
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    payment_intent_id TEXT,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create favorites table
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    prompt_id UUID REFERENCES public.prompts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, prompt_id)
);

-- Create admin_sessions table for persistent admin login
CREATE TABLE public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create has_role function (security definer to prevent recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Create function to check if user is pro
CREATE OR REPLACE FUNCTION public.is_pro_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_pro FROM public.profiles WHERE user_id = _user_id),
        FALSE
    )
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Categories RLS policies (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON public.categories
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Prompts RLS policies (public read, admin write)
CREATE POLICY "Anyone can view prompts" ON public.prompts
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage prompts" ON public.prompts
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Purchases RLS policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" ON public.purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON public.purchases
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all purchases" ON public.purchases
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Favorites RLS policies
CREATE POLICY "Users can view their own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.favorites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all favorites" ON public.favorites
    FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admin sessions RLS - allow public insert for login, admin manage
CREATE POLICY "Anyone can create admin session" ON public.admin_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view admin sessions" ON public.admin_sessions
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage admin sessions" ON public.admin_sessions
    FOR DELETE USING (true);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prompts_updated_at
    BEFORE UPDATE ON public.prompts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories
INSERT INTO public.categories (name, icon, description) VALUES
    ('Business', '💼', 'Business and marketing prompts'),
    ('Writing', '✍️', 'Content writing and copywriting'),
    ('Coding', '💻', 'Programming and development'),
    ('Education', '📚', 'Learning and teaching'),
    ('Creative', '🎨', 'Art and creative content'),
    ('Productivity', '⚡', 'Efficiency and workflow'),
    ('SEO', '🔍', 'Search engine optimization'),
    ('Social Media', '📱', 'Social media content'),
    ('Marketing', '📣', 'Marketing strategies'),
    ('Finance', '💰', 'Financial planning and analysis');

-- Insert sample prompts
INSERT INTO public.prompts (title, description, content, tool, is_free, is_featured, category_id) VALUES
    ('Ultimate Blog Post Generator', 'Generate SEO-optimized blog posts in minutes', 'Write a comprehensive blog post about [TOPIC]...', 'ChatGPT', true, true, (SELECT id FROM categories WHERE name = 'Writing')),
    ('Social Media Caption Creator', 'Create engaging captions for all platforms', 'Create 5 viral captions for [PLATFORM]...', 'ChatGPT', true, false, (SELECT id FROM categories WHERE name = 'Social Media')),
    ('Code Review Assistant', 'Get detailed code reviews and suggestions', 'Review this code and suggest improvements...', 'ChatGPT', false, true, (SELECT id FROM categories WHERE name = 'Coding')),
    ('Marketing Strategy Builder', 'Build complete marketing strategies', 'Create a marketing strategy for [BUSINESS]...', 'ChatGPT', false, false, (SELECT id FROM categories WHERE name = 'Marketing')),
    ('Photorealistic Image Prompt', 'Create stunning photorealistic images', 'Ultra realistic photograph of [SUBJECT]...', 'Midjourney', false, true, (SELECT id FROM categories WHERE name = 'Creative')),
    ('Business Plan Generator', 'Complete business plan in one prompt', 'Generate a detailed business plan for...', 'ChatGPT', false, false, (SELECT id FROM categories WHERE name = 'Business')),
    ('SEO Keyword Research', 'Find profitable keywords for your niche', 'Analyze and find top keywords for...', 'ChatGPT', true, false, (SELECT id FROM categories WHERE name = 'SEO')),
    ('Email Newsletter Writer', 'Write converting email newsletters', 'Write an email newsletter about...', 'ChatGPT', false, false, (SELECT id FROM categories WHERE name = 'Marketing')),
    ('Product Description Writer', 'Create compelling product descriptions', 'Write a product description for...', 'ChatGPT', false, true, (SELECT id FROM categories WHERE name = 'Writing')),
    ('Financial Analysis Prompt', 'Analyze financial data and trends', 'Analyze the following financial data...', 'ChatGPT', false, false, (SELECT id FROM categories WHERE name = 'Finance')),
    ('Cinematic Image Creator', 'Generate movie-quality images', 'Cinematic shot of [SCENE]...', 'Midjourney', false, true, (SELECT id FROM categories WHERE name = 'Creative')),
    ('Course Outline Generator', 'Create complete course structures', 'Design a course outline for...', 'ChatGPT', true, false, (SELECT id FROM categories WHERE name = 'Education'));