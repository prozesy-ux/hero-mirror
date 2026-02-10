
# Create Privacy Policy and Terms of Service Pages

## What We'll Build
Two new pages for **uptoza.com** — a Privacy Policy page (`/privacy`) and a Terms of Service page (`/terms`). These are needed for Google OAuth verification and general legal compliance.

## Pages

### 1. Privacy Policy (`/privacy`)
Covers:
- What data Uptoza collects (name, email, payment info)
- How data is used (account management, marketplace, communications)
- Third-party services (Google OAuth, payment processors)
- Data storage and security
- User rights (access, delete, update data)
- Cookie usage
- Contact information

### 2. Terms of Service (`/terms`)
Covers:
- Account registration and responsibilities
- Marketplace rules (buying and selling)
- Intellectual property rights
- Payment and refund policies
- Prohibited activities
- Limitation of liability
- Termination of accounts
- Contact information

## Technical Details

### New Files
- `src/pages/PrivacyPolicy.tsx` — Full privacy policy page with SEOHead
- `src/pages/TermsOfService.tsx` — Full terms of service page with SEOHead

### Modified Files
- `src/App.tsx` — Add two new lazy-loaded routes: `/privacy` and `/terms`

### Design
- Clean, readable layout with the existing Header component
- Proper heading hierarchy (h1, h2, h3)
- Consistent with existing site styling (Inter font, dark/light theme)
- Footer links back to home
- "Last updated" date shown at top
- Company name: **Uptoza Inc**
- Website: **uptoza.com**
