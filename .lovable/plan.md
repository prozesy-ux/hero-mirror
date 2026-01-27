
# Replace Native Browser Confirm with Modern Dialog

## Problem
The current codebase uses native `window.confirm()` dialogs which show ugly browser-default prompts. This needs to be replaced with a modern, styled confirmation dialog like Fiverr/Upwork uses.

## Solution
Create a reusable `ConfirmDialog` component and replace all 12+ instances of `confirm()` across the app.

---

## Implementation Plan

### Phase 1: Create Reusable ConfirmDialog Component

**New File: `src/components/ui/confirm-dialog.tsx`**

A modern confirmation dialog with:
- Clean, minimal design matching app theme
- Warning icon for destructive actions
- Customizable title and description
- Cancel and Confirm buttons with proper styling
- Loading state support
- Smooth animations

**Design (Fiverr/Upwork inspired):**
```text
┌───────────────────────────────────────┐
│                                       │
│         ⚠️ Warning Icon               │
│                                       │
│      Delete this account?             │
│                                       │
│   This action cannot be undone.       │
│                                       │
│   ┌─────────┐     ┌─────────────────┐ │
│   │ Cancel  │     │ Yes, Delete     │ │
│   └─────────┘     └─────────────────┘ │
│                                       │
└───────────────────────────────────────┘
```

---

### Phase 2: Update All Components Using confirm()

**Files to update (10 files, 12+ instances):**

| File | Function | Message |
|------|----------|---------|
| `BuyerWallet.tsx` | handleDeleteAccount | "Delete this account?" |
| `SellerWallet.tsx` | handleDeleteAccount | "Delete this account?" |
| `SellerProducts.tsx` | handleDelete | "Delete this product?" |
| `PromptsManagement.tsx` | handleDelete | "Delete this prompt?" |
| `CategoriesManagement.tsx` | handleDelete | "Delete this category?" |
| `AccountOrdersManagement.tsx` | handleDelete | "Delete this order?" |
| `AIAccountsManagement.tsx` | handleDelete | "Delete this account?" |
| `ChatManagement.tsx` | handleDeleteMessage (x3) | "Delete this message?" |
| `ChatManagement.tsx` | handleDeleteAllUserChat | "Delete entire chat history?" |
| `ChatManagement.tsx` | handleDeleteAllSellerChat | "Delete entire chat history?" |
| `UsersManagement.tsx` | handleDeleteUser | "Delete this user?" |
| `PaymentSettingsManagement.tsx` | handleDelete | "Delete this payment method?" |

---

### Phase 3: Pattern for Each Component

**Before (native confirm):**
```typescript
const handleDelete = async (id: string) => {
  if (!confirm('Are you sure?')) return;
  // delete logic
};
```

**After (modern dialog):**
```typescript
const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string | null }>({ 
  open: false, 
  id: null 
});

const handleDeleteClick = (id: string) => {
  setDeleteConfirm({ open: true, id });
};

const handleDeleteConfirm = async () => {
  if (!deleteConfirm.id) return;
  // delete logic
  setDeleteConfirm({ open: false, id: null });
};

// In JSX:
<ConfirmDialog
  open={deleteConfirm.open}
  onOpenChange={(open) => setDeleteConfirm({ open, id: null })}
  title="Delete Account"
  description="Are you sure you want to delete this account? This action cannot be undone."
  onConfirm={handleDeleteConfirm}
  confirmText="Delete"
  variant="destructive"
  loading={deleting}
/>
```

---

## Technical Details

### ConfirmDialog Props

```typescript
interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;       // Default: "Confirm"
  cancelText?: string;        // Default: "Cancel"
  variant?: 'default' | 'destructive';  // Default: 'destructive'
  loading?: boolean;          // Shows spinner on confirm button
  icon?: React.ReactNode;     // Custom icon (default: AlertTriangle for destructive)
}
```

### Styling (matching app theme)

- **Overlay**: `bg-black/60` with blur
- **Dialog**: `bg-slate-900` with rounded corners for admin, `bg-white` for buyer/seller
- **Title**: Bold, centered with icon
- **Description**: Muted text, centered
- **Cancel Button**: Outline/ghost style
- **Confirm Button**: Red/destructive for delete actions
- **Loading**: Spinner icon when processing

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/ui/confirm-dialog.tsx` | CREATE - New reusable component |
| `src/components/dashboard/BuyerWallet.tsx` | MODIFY - Replace confirm() |
| `src/components/seller/SellerWallet.tsx` | MODIFY - Replace confirm() |
| `src/components/seller/SellerProducts.tsx` | MODIFY - Replace confirm() |
| `src/components/admin/PromptsManagement.tsx` | MODIFY - Replace confirm() |
| `src/components/admin/CategoriesManagement.tsx` | MODIFY - Replace confirm() |
| `src/components/admin/AccountOrdersManagement.tsx` | MODIFY - Replace confirm() |
| `src/components/admin/AIAccountsManagement.tsx` | MODIFY - Replace confirm() |
| `src/components/admin/ChatManagement.tsx` | MODIFY - Replace 4 confirm() calls |
| `src/components/admin/UsersManagement.tsx` | MODIFY - Replace confirm() |
| `src/components/admin/PaymentSettingsManagement.tsx` | MODIFY - Replace confirm() |

---

## Expected Result

- All confirmation dialogs show modern, styled UI
- Consistent look across all dashboards (Admin, Seller, Buyer)
- Better UX with clear action buttons
- Loading states during operations
- Smooth open/close animations
- Accessible (keyboard navigation, focus management)
