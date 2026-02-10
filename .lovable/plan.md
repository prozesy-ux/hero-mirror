

# Update Homepage to Meet Google OAuth Verification Requirements

## Problem
Google's verification process requires the homepage to:
1. **Accurately identify the app/brand** -- partially met (shows "Uptoza" but lacks company identity)
2. **Fully describe the app's functionality** -- partially met (says "digital marketplace" but lacks detail)
3. **Explain why the app requests user data** -- NOT met
4. **Include a link to privacy policy** -- met (footer added)
5. **Be visible without login** -- met
6. **Hosted on verified domain** -- met (uptoza.com)

## What We'll Change

### 1. Update Hero Section description
Currently the hero says "Search thousands of digital products, premium accounts, and services." This needs to better describe what Uptoza does as a platform and identify the brand.

**Updated copy:**
- Subtitle: "The Digital Commerce Platform"
- Description: "Uptoza powers global digital commerce. Browse and purchase digital products, premium services, and AI-driven solutions from trusted creators and businesses worldwide."

### 2. Add a "What is Uptoza" section below AsSeenIn
A short section that clearly describes the app's functionality and data usage, meeting Google's requirements. This will include:
- What Uptoza does (marketplace for digital products, services, AI tools)
- How it works (browse, purchase, download/access)
- Why we use Google Sign-In (secure authentication, personalized experience)
- Link to privacy policy

### 3. Update footer to include company name more prominently
Already has privacy/terms links -- no further changes needed.

## Technical Details

### Modified Files

**`src/components/HeroSection.tsx`**
- Update subtitle from "The #1 Digital Marketplace" to "The Digital Commerce Platform"
- Update description to better explain the platform's purpose

**New File: `src/components/AboutSection.tsx`**
A clean, minimal section with:
- "About Uptoza" heading
- 3-4 short paragraphs covering: what the platform does, key features, and a transparent note about Google Sign-In data usage
- Link to privacy policy
- Styled consistently with existing sections (dark/light theme compatible)

**`src/pages/Index.tsx`**
- Import and add `AboutSection` after `AsSeenIn` (lazy-loaded)

### Design
- Clean typography, consistent with existing sections
- Uses existing Tailwind classes and color variables
- Responsive layout (single column on mobile, multi-column on desktop for feature highlights)
- No new dependencies required

