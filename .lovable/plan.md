

# Home Page Bundle & Prompts - Auth Flow with Intent Restoration

## Overview

Add click handlers to the home page "Get The Everything Bundle" buttons and "Unlock Prompt" buttons that:
1. Save the user's intent to localStorage
2. Redirect to Sign In page
3. After authentication, redirect based on saved intent:
   - **Bundle/Prompts intent** → `/dashboard/prompts`
   - **Normal sign-in** → `/dashboard/marketplace` (existing behavior)

## Current Flow Analysis

The system already has an intent restoration pattern using localStorage:
- `pendingPurchase` → marketplace product modal
- `pendingChat` → marketplace chat modal
- `storeReturn` → store page return

We'll add a new key `pendingBundlePrompts` for this feature.

## What Will Be Done

### 1. CompleteBundleCard.tsx - Add Navigation to Bundle Button

```text
User clicks "Get Lifetime Access"
  ↓
Check if authenticated
  ↓
If NO → Save intent → Navigate to /signin
If YES → Navigate to /dashboard/prompts
```

### 2. BundleSection.tsx - Add Navigation to Bundle Buttons

Both "Get The Everything Bundle" buttons will follow the same logic.

### 3. PromptsSection.tsx - Add Navigation to Unlock Buttons

```text
User clicks "Unlock Prompt"
  ↓
Check if authenticated
  ↓
If NO → Save intent → Navigate to /signin
If YES → Navigate to /dashboard/prompts
```

### 4. SignIn.tsx - Handle New Intent

Add priority check for `pendingBundlePrompts`:
- If found → redirect to `/dashboard/prompts`
- Clear the localStorage key after redirect

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/CompleteBundleCard.tsx` | Add auth check, intent storage, navigation |
| `src/components/BundleSection.tsx` | Add auth check, intent storage, navigation |
| `src/components/PromptsSection.tsx` | Add auth check, intent storage, navigation |
| `src/pages/SignIn.tsx` | Add `pendingBundlePrompts` intent handling |
| `src/lib/cache-utils.ts` | Add `pendingBundlePrompts` to preserved keys |

## Technical Implementation

### CompleteBundleCard.tsx

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const CompleteBundleCard = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const handleGetBundle = () => {
    if (isAuthenticated) {
      navigate('/dashboard/prompts');
    } else {
      localStorage.setItem('pendingBundlePrompts', 'true');
      navigate('/signin');
    }
  };

  return (
    // ...
    <button onClick={handleGetBundle} className="...">
      Get Lifetime Access
      <ArrowRight className="w-4 h-4" />
    </button>
    // ...
  );
};
```

### PromptsSection.tsx

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';

const PromptsSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const handleUnlock = () => {
    if (isAuthenticated) {
      navigate('/dashboard/prompts');
    } else {
      localStorage.setItem('pendingBundlePrompts', 'true');
      navigate('/signin');
    }
  };

  return (
    // ...
    <button onClick={handleUnlock} className="...">
      <Lock className="w-4 h-4" />
      Unlock Prompt
    </button>
    // ...
  );
};
```

### SignIn.tsx - Updated handlePostAuthRedirect

```tsx
const handlePostAuthRedirect = () => {
  // Priority 0: Check for bundle/prompts intent
  const pendingBundlePrompts = localStorage.getItem('pendingBundlePrompts');
  if (pendingBundlePrompts) {
    localStorage.removeItem('pendingBundlePrompts');
    navigate('/dashboard/prompts');
    return;
  }

  // Priority 1: Check for pending purchase (existing)
  const pendingPurchase = localStorage.getItem('pendingPurchase');
  if (pendingPurchase) {
    navigate('/dashboard/marketplace');
    return;
  }

  // ... rest of existing priority checks ...

  // Default: go to marketplace
  navigate('/dashboard/marketplace');
};
```

### cache-utils.ts - Preserve New Key

```tsx
const keysToPreserve = [
  // ... existing keys ...
  'pendingBundlePrompts', // New: Bundle/prompts unlock flow
];
```

## User Flow Diagram

```text
┌─────────────────────────────────────────────────────────────┐
│                    HOME PAGE (/)                             │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │ CompleteBundleCard  │    │ PromptsSection              │ │
│  │ "Get Lifetime Access"│    │ "Unlock Prompt" buttons     │ │
│  └──────────┬──────────┘    └──────────────┬──────────────┘ │
│             │                              │                 │
│             └──────────────┬───────────────┘                 │
│                            ▼                                 │
│            ┌───────────────────────────────┐                 │
│            │     Is User Authenticated?    │                 │
│            └───────────────────────────────┘                 │
│                  │                │                          │
│                 YES               NO                         │
│                  │                │                          │
│                  ▼                ▼                          │
│     ┌────────────────┐  ┌────────────────────────┐          │
│     │ Go to          │  │ Save intent:           │          │
│     │ /dashboard/    │  │ pendingBundlePrompts   │          │
│     │ prompts        │  │ = true                 │          │
│     └────────────────┘  └────────────┬───────────┘          │
│                                      │                       │
│                                      ▼                       │
│                         ┌────────────────────┐               │
│                         │ Navigate to        │               │
│                         │ /signin            │               │
│                         └────────────────────┘               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SIGN IN PAGE                              │
│                                                              │
│                    User signs in                             │
│                          │                                   │
│                          ▼                                   │
│            ┌───────────────────────────────┐                 │
│            │ Check pendingBundlePrompts?   │                 │
│            └───────────────────────────────┘                 │
│                  │                │                          │
│                 YES               NO                         │
│                  │                │                          │
│                  ▼                ▼                          │
│     ┌────────────────┐  ┌────────────────────────┐          │
│     │ Clear key &    │  │ Check other intents    │          │
│     │ Go to          │  │ (pendingPurchase, etc) │          │
│     │ /dashboard/    │  │                        │          │
│     │ prompts        │  │ Default: /dashboard/   │          │
│     │                │  │ marketplace            │          │
│     └────────────────┘  └────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Summary

- **Bundle buttons**: "Get Lifetime Access" and "Get The Everything Bundle" will redirect authenticated users to prompts, or save intent and go to signin
- **Unlock buttons**: Each "Unlock Prompt" button will do the same
- **SignIn page**: Will detect `pendingBundlePrompts` and redirect to `/dashboard/prompts`
- **Normal users**: Without bundle intent, they go to `/dashboard/marketplace` after signin (unchanged)
- **Cache preservation**: New intent key preserved during app version updates

