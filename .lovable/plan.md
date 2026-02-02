

# Fix Chat and Leave Review Buttons in Order Details Modal

## Problem Identified

The "Contact Seller" and "Leave Review" buttons in the Order Details modal (BuyerOrders.tsx, lines 720-730) are **completely non-functional** - they have no `onClick` handlers attached.

---

## Solution

### Part 1: Add Floating Chat Integration for "Contact Seller"

**Import the floating chat hook:**
```tsx
import { useFloatingChat } from '@/contexts/FloatingChatContext';
```

**Use the hook in component:**
```tsx
const { openChat } = useFloatingChat();
```

**Add onClick handler to Contact Seller button:**
```tsx
<Button 
  variant="outline" 
  className="flex-1"
  onClick={() => {
    if (selectedOrder?.seller && selectedOrder?.product) {
      openChat({
        sellerId: selectedOrder.seller.id,
        sellerName: selectedOrder.seller.store_name,
        productId: selectedOrder.product.id,
        productName: selectedOrder.product.name,
        type: 'seller'
      });
      setSelectedOrder(null); // Close modal
    }
  }}
>
```

---

### Part 2: Add Review Modal for "Leave Review"

**Add state for review modal:**
```tsx
const [showReviewModal, setShowReviewModal] = useState(false);
const [reviewingOrder, setReviewingOrder] = useState<Order | null>(null);
```

**Import ReviewForm component:**
```tsx
import ReviewForm from '@/components/reviews/ReviewForm';
```

**Add onClick handler to Leave Review button:**
```tsx
<Button 
  variant="outline" 
  className="flex-1"
  onClick={() => {
    setReviewingOrder(selectedOrder);
    setShowReviewModal(true);
    setSelectedOrder(null); // Close order detail modal
  }}
>
```

**Add Review Modal Dialog:**
```tsx
<Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Leave a Review</DialogTitle>
    </DialogHeader>
    {reviewingOrder && reviewingOrder.product && (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
          {reviewingOrder.product.icon_url ? (
            <img 
              src={reviewingOrder.product.icon_url} 
              alt="" 
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
          )}
          <div>
            <h4 className="font-medium">{reviewingOrder.product.name}</h4>
            <p className="text-sm text-slate-500">{reviewingOrder.seller?.store_name}</p>
          </div>
        </div>
        <ReviewForm 
          productId={reviewingOrder.product.id}
          orderId={reviewingOrder.id}
          onSuccess={() => {
            setShowReviewModal(false);
            setReviewingOrder(null);
            toast.success('Review submitted!');
          }}
          onCancel={() => {
            setShowReviewModal(false);
            setReviewingOrder(null);
          }}
        />
      </div>
    )}
  </DialogContent>
</Dialog>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/BuyerOrders.tsx` | Add imports, state, click handlers, and review modal |

---

## Summary of Changes

| Button | Before | After |
|--------|--------|-------|
| Contact Seller | No `onClick` - does nothing | Opens floating chat with seller context |
| Leave Review | No `onClick` - does nothing | Opens review modal with product/order context |

Both buttons will now be fully functional:
- **Chat**: Opens the floating chat widget pre-filled with seller and product info
- **Review**: Opens a modal with the ReviewForm component for that specific order

