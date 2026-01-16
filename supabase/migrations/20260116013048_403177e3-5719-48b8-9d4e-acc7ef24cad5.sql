-- Add image_url column to ai_tools table
ALTER TABLE ai_tools ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Clear existing AI tools and insert fresh with proper logos
DELETE FROM ai_tools;

-- Insert 18+ AI tools with real logo URLs (using official brand colors)
INSERT INTO ai_tools (name, icon, color, description, is_active, display_order, image_url) VALUES
('ChatGPT', 'MessageSquare', 'from-emerald-500 to-emerald-600', 'OpenAI conversational AI', true, 1, 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg'),
('Midjourney', 'Palette', 'from-indigo-500 to-purple-600', 'AI image generation', true, 2, 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.png'),
('DALL-E 3', 'Image', 'from-cyan-400 to-teal-500', 'OpenAI image creator', true, 3, 'https://upload.wikimedia.org/wikipedia/commons/4/4c/DALL-E_3_%28circle%29.png'),
('Claude', 'Bot', 'from-orange-400 to-amber-500', 'Anthropic AI assistant', true, 4, 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg'),
('Gemini', 'Sparkles', 'from-blue-500 to-indigo-600', 'Google AI model', true, 5, 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'),
('Stable Diffusion', 'Wand2', 'from-violet-500 to-purple-600', 'Open source image AI', true, 6, 'https://upload.wikimedia.org/wikipedia/commons/1/10/Stable_Diffusion_logo.png'),
('Sora', 'Video', 'from-rose-500 to-pink-600', 'OpenAI video generation', true, 7, NULL),
('GitHub Copilot', 'Code', 'from-gray-600 to-gray-800', 'AI pair programmer', true, 8, 'https://upload.wikimedia.org/wikipedia/commons/8/8a/GitHub_Copilot_logo.svg'),
('Leonardo AI', 'Brush', 'from-purple-500 to-fuchsia-600', 'Creative AI platform', true, 9, NULL),
('Perplexity', 'Search', 'from-teal-500 to-cyan-600', 'AI search engine', true, 10, NULL),
('Suno AI', 'Music', 'from-pink-500 to-rose-600', 'AI music generation', true, 11, NULL),
('Runway', 'Film', 'from-emerald-500 to-green-600', 'AI video editing', true, 12, NULL),
('Pika', 'Clapperboard', 'from-yellow-500 to-orange-500', 'AI video creation', true, 13, NULL),
('Ideogram', 'Type', 'from-blue-400 to-sky-500', 'AI with text rendering', true, 14, NULL),
('Adobe Firefly', 'Flame', 'from-red-500 to-orange-500', 'Adobe creative AI', true, 15, NULL),
('Canva AI', 'Layout', 'from-cyan-500 to-blue-500', 'Design with AI', false, 16, NULL),
('Meta AI', 'Globe', 'from-blue-600 to-indigo-700', 'Meta AI assistant', false, 17, NULL),
('Bing Image Creator', 'ImagePlus', 'from-sky-500 to-blue-600', 'Microsoft image AI', false, 18, NULL);

-- Clear existing categories and insert fresh
DELETE FROM categories;

-- Insert 20 categories with icons
INSERT INTO categories (name, icon, description) VALUES
('Business', 'Briefcase', 'Business strategy and planning prompts'),
('Coding', 'Code', 'Programming and development prompts'),
('Creative', 'Palette', 'Art and creative content generation'),
('Education', 'GraduationCap', 'Learning and teaching materials'),
('Finance', 'DollarSign', 'Financial planning and analysis'),
('Marketing', 'Megaphone', 'Marketing strategies and campaigns'),
('Productivity', 'Zap', 'Efficiency and workflow optimization'),
('SEO', 'Search', 'Search engine optimization tips'),
('Social Media', 'Share2', 'Social media content creation'),
('Writing', 'PenTool', 'Content writing and copywriting'),
('Video', 'Video', 'Video creation and editing prompts'),
('Music', 'Music', 'Music and audio generation'),
('E-commerce', 'ShoppingCart', 'Online store and sales prompts'),
('Health', 'Heart', 'Health and wellness content'),
('Legal', 'Scale', 'Legal documents and advice'),
('Real Estate', 'Home', 'Property and real estate content'),
('Travel', 'Plane', 'Travel planning and guides'),
('Gaming', 'Gamepad2', 'Game development and content'),
('Photography', 'Camera', 'Photo editing and enhancement'),
('Customer Service', 'Headphones', 'Support and customer care prompts');