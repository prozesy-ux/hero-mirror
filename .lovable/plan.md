
# Reset Password Page Redesign - Match Sign In Dark Theme

## Overview

Redesign the Reset Password page and all its states (loading, success, error, form) to exactly match the Sign In page's dark theme styling. Replace default shadcn components with custom styled elements and use sonner toast for notifications.

---

## Current vs Target Design

### Current Issues
- Light background (`bg-background`) instead of black
- Default shadcn Input/Button components with light styling
- Generic foreground/muted colors
- Uses shadcn `useToast` hook (gray/white toast)
- Success/error states have light backgrounds

### Target Design (Matching Sign In)
- Black background (`bg-black`)
- Dark gray cards (`bg-gray-900/50`, `border border-gray-800`)
- Purple accents (`bg-purple-600`, `text-purple-400`, `focus:border-purple-500`)
- Custom dark inputs (`bg-black/50 border-gray-700`)
- White text (`text-white`)
- Uptoza logo in white rounded container
- Use `sonner` toast for success/error messages

---

## File to Modify

### `src/pages/ResetPassword.tsx`

**Key Changes:**

### 1. Imports Update
```tsx
// Remove
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Add
import { toast } from 'sonner';
import uptozaLogo from '@/assets/uptoza-logo.png';
```

### 2. Loading State (Validating)
```tsx
<div className="flex min-h-dvh flex-col items-center justify-center bg-black">
  <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mb-6">
    <img src={uptozaLogo} alt="Uptoza" className="h-12 w-auto rounded-xl" />
  </div>
  <div className="flex items-center gap-3 text-white">
    <Loader2 className="h-5 w-5 animate-spin" />
    <span className="text-lg font-medium">Validating reset link...</span>
  </div>
</div>
```

### 3. Success State
```tsx
<div className="flex min-h-dvh flex-col items-center justify-center bg-black p-4">
  <div className="w-full max-w-md text-center">
    <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mx-auto w-fit mb-6">
      <img src={uptozaLogo} alt="Uptoza" className="h-10 w-auto rounded-xl" />
    </div>
    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
      <CheckCircle className="w-8 h-8 text-emerald-400" />
    </div>
    <h1 className="text-2xl font-bold text-white mb-2">Password Reset Complete!</h1>
    <p className="text-gray-400 mb-6">
      Your password has been successfully updated. Redirecting to sign in...
    </p>
    <button
      onClick={() => navigate('/signin')}
      className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700"
    >
      Go to Sign In
    </button>
  </div>
</div>
```

### 4. Error State
```tsx
<div className="flex min-h-dvh flex-col items-center justify-center bg-black p-4">
  <div className="w-full max-w-md text-center">
    <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20 mx-auto w-fit mb-6">
      <img src={uptozaLogo} alt="Uptoza" className="h-10 w-auto rounded-xl" />
    </div>
    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
      <Shield className="w-8 h-8 text-red-400" />
    </div>
    <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
    <p className="text-gray-400 mb-6">{error}</p>
    <button
      onClick={() => navigate('/signin')}
      className="w-full rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700"
    >
      Back to Sign In
    </button>
  </div>
</div>
```

### 5. Main Form Layout
```tsx
<div className="flex min-h-dvh flex-col lg:flex-row">
  {/* Left Side - Background Image */}
  <div className="relative hidden h-full min-h-dvh overflow-hidden lg:block lg:w-2/3">
    <img src={signinBackground} alt="Background" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/60 to-gray-900/60" />
    <div className="absolute inset-0 z-10" style={{ backgroundImage: "radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 0)", backgroundSize: "20px 20px" }} />
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-12 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-light tracking-tight text-white drop-shadow-lg">Reset Your Password</h1>
        <p className="text-xl font-medium text-white/90 drop-shadow-md">Create a strong password to secure your account</p>
      </div>
    </div>
  </div>

  {/* Right Side - Form */}
  <div className="flex min-h-dvh w-full flex-col items-center bg-black text-white lg:w-1/3 lg:justify-center lg:p-8">
    {/* Mobile Background */}
    <div className="relative w-full overflow-hidden lg:hidden" style={{ minHeight: "180px" }}>
      <img src={signinBackground} alt="Background" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-light text-white">Reset Your Password</h1>
      </div>
    </div>

    {/* Form Container */}
    <div className="flex w-full max-w-sm flex-col items-center px-6 py-8 lg:px-0">
      {/* Logo */}
      <div className="mb-8 flex justify-center">
        <div className="overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-black/20">
          <img src={uptozaLogo} alt="Uptoza" className="h-10 w-auto rounded-xl" />
        </div>
      </div>

      {/* Back Button */}
      <button onClick={() => navigate('/signin')} className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm self-start">
        <ArrowLeft size={16} />
        Back to Sign In
      </button>

      {/* Form Card */}
      <div className="w-full rounded-2xl border border-gray-800 bg-gray-900/50 p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Lock className="w-7 h-7 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Create New Password</h2>
          <p className="text-gray-400 text-sm mt-2">Enter your new password below</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Field */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
                minLength={8}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-700'}`} />
                  ))}
                </div>
                <p className={`text-xs ${strengthTextColors}`}>{strengthLabels[passwordStrength - 1] || 'Too weak'}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="mb-2 block text-sm font-medium text-white">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full rounded-lg border border-gray-700 bg-black/50 py-3 pl-10 pr-10 text-sm text-white placeholder:text-gray-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || password !== confirmPassword || password.length < 8}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        {/* Password Requirements */}
        <div className="mt-5 p-4 rounded-lg bg-gray-800/50 border border-gray-700">
          <h4 className="text-xs font-medium text-white mb-2">Password requirements:</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li className={password.length >= 8 ? 'text-emerald-400' : ''}>At least 8 characters</li>
            <li className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-emerald-400' : ''}>Upper and lowercase letters</li>
            <li className={/\d/.test(password) ? 'text-emerald-400' : ''}>At least one number</li>
            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-emerald-400' : ''}>At least one special character</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 6. Toast Notifications
Replace `useToast` with `sonner`:
```tsx
// Error toast
toast.error("Passwords don't match", {
  description: "Please make sure both passwords are the same."
});

// Success toast  
toast.success("Password updated!", {
  description: "Your password has been successfully reset."
});
```

---

## Design Specifications

### Color Palette (Matching Sign In)
| Element | Color |
|---------|-------|
| Background | `bg-black` |
| Card | `bg-gray-900/50 border-gray-800` |
| Input | `bg-black/50 border-gray-700` |
| Input Focus | `focus:border-purple-500 focus:ring-purple-500` |
| Primary Button | `bg-purple-600 hover:bg-purple-700` |
| Text Primary | `text-white` |
| Text Secondary | `text-gray-400` |
| Text Muted | `text-gray-500` |
| Success Accent | `bg-emerald-500/20 text-emerald-400` |
| Error Accent | `bg-red-500/20 text-red-400` |
| Icon Accent | `bg-purple-500/20 text-purple-400` |

### Typography
| Element | Style |
|---------|-------|
| Page Title | `text-4xl font-light tracking-tight text-white` |
| Card Title | `text-xl font-bold text-white` |
| Labels | `text-sm font-medium text-white` |
| Helper Text | `text-sm text-gray-400` |
| Placeholder | `placeholder:text-gray-500` |

---

## Mobile Responsiveness

- **Desktop (lg+)**: 2/3 background image left, 1/3 form right
- **Mobile**: Full width with compact header background image
- Same layout pattern as Sign In page

---

## Expected Outcome

After implementation:
1. Reset Password page matches Sign In dark theme exactly
2. All states (loading, success, error, form) use dark styling
3. Uptoza logo displayed in all states
4. Purple accents for buttons and focus states
5. Sonner toast for notifications (consistent with Sign In)
6. Password requirements box with dark styling
7. Mobile-responsive matching Sign In layout
8. No default shadcn component styling visible
