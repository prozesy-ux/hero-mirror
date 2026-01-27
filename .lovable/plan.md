

# Quick Stats Section - Real Data & Click Functions

## Current State Analysis

### Seller Dashboard Quick Stats (lines 455-521)
The Seller Dashboard has a "Quick Stats" sidebar panel with 4 items:
1. **Products** - Shows real data (`products.length` and approved count)
2. **Messages** - Shows hardcoded `0` (not real data)
3. **Success Rate** - Shows real calculated data from orders
4. **Rating** - Shows hardcoded 4 stars (not real data)

**Issues:**
- Messages count is hardcoded to `0`
- Rating is hardcoded to 4 stars (no real data)
- No click navigation to relevant sections

### Buyer Dashboard Home
The Buyer Dashboard does NOT have a "Quick Stats" sidebar section matching the seller's design. It has stat cards but not in the same sidebar format.

---

## Implementation Plan

### Part 1: Fix Seller Dashboard Quick Stats with Real Data

**File: `src/components/seller/SellerDashboard.tsx`**

#### Change 1: Add state and fetch for unread messages count

```typescript
// Add state for messages and ratings
const [unreadMessages, setUnreadMessages] = useState(0);
const [averageRating, setAverageRating] = useState<number | null>(null);
const [reviewCount, setReviewCount] = useState(0);

// Add fetch function
const fetchQuickStats = async () => {
  if (!profile?.id) return;
  
  // Fetch unread messages count
  const { count: msgCount } = await supabase
    .from('seller_chats')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', profile.id)
    .eq('is_read', false)
    .eq('sender_type', 'buyer');
  
  setUnreadMessages(msgCount || 0);
  
  // Fetch average rating from product reviews
  const { data: ratingData } = await supabase
    .from('product_reviews')
    .select('rating, seller_products!inner(seller_id)')
    .eq('seller_products.seller_id', profile.id);
  
  if (ratingData && ratingData.length > 0) {
    const avg = ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length;
    setAverageRating(avg);
    setReviewCount(ratingData.length);
  }
};
```

#### Change 2: Add useEffect to call fetchQuickStats

```typescript
useEffect(() => {
  if (profile?.id) {
    fetchQuickStats();
  }
}, [profile?.id]);
```

#### Change 3: Update Quick Stats UI with real data and click navigation

```tsx
{/* Quick Stats */}
<div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
  <h3 className="text-base font-semibold text-slate-800 mb-5">Quick Stats</h3>
  <div className="space-y-4">
    {/* Products - Click to navigate */}
    <button 
      onClick={() => navigate('/seller/products')}
      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
          <Package className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Products</p>
          <p className="text-xs text-slate-500">{products.filter(p => p.is_approved).length} live</p>
        </div>
      </div>
      <span className="text-xl font-bold text-slate-800">{products.length}</span>
    </button>

    {/* Messages - Real unread count + click navigation */}
    <button 
      onClick={() => navigate('/seller/chat')}
      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Messages</p>
          <p className="text-xs text-slate-500">Unread chats</p>
        </div>
      </div>
      <span className={`text-xl font-bold ${unreadMessages > 0 ? 'text-blue-600' : 'text-slate-800'}`}>
        {unreadMessages}
      </span>
    </button>

    {/* Success Rate - Click to analytics */}
    <button 
      onClick={() => navigate('/seller/analytics')}
      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Award className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Success Rate</p>
          <p className="text-xs text-slate-500">Completion rate</p>
        </div>
      </div>
      <span className="text-xl font-bold text-emerald-600">
        {orders.length > 0 ? Math.round((completedOrders / orders.length) * 100) : 100}%
      </span>
    </button>

    {/* Rating - Real average from reviews */}
    <button 
      onClick={() => navigate('/seller/products')}
      className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
          <Star className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Rating</p>
          <p className="text-xs text-slate-500">{reviewCount} reviews</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {averageRating ? (
          <>
            {[1, 2, 3, 4, 5].map(i => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
              />
            ))}
          </>
        ) : (
          <span className="text-sm text-slate-500">No reviews</span>
        )}
      </div>
    </button>
  </div>
</div>
```

---

### Part 2: Add Quick Stats Section to Buyer Dashboard

**File: `src/components/dashboard/BuyerDashboardHome.tsx`**

Create a matching "Quick Stats" sidebar panel for buyers with real data:

#### Change 1: Add Quick Stats sidebar after the main chart area (matching seller layout)

The buyer's Quick Stats will show:
1. **Orders** - Total orders count, click to `/dashboard/orders`
2. **Messages** - Unread support messages (if applicable)
3. **Wishlist** - Saved items count, click to `/dashboard/wishlist`
4. **Completion Rate** - Percentage of completed orders

```tsx
{/* Quick Stats - Matching Seller Design */}
<div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
  <h3 className="text-base font-semibold text-slate-800 mb-5">Quick Stats</h3>
  <div className="space-y-4">
    {/* Total Orders */}
    <Link to="/dashboard/orders">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Orders</p>
            <p className="text-xs text-slate-500">{stats.completedOrders} completed</p>
          </div>
        </div>
        <span className="text-xl font-bold text-slate-800">{stats.totalOrders}</span>
      </div>
    </Link>

    {/* Wishlist */}
    <Link to="/dashboard/wishlist">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Wishlist</p>
            <p className="text-xs text-slate-500">Saved items</p>
          </div>
        </div>
        <span className="text-xl font-bold text-slate-800">{wishlistCount}</span>
      </div>
    </Link>

    {/* Pending Orders */}
    <Link to="/dashboard/orders">
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Pending</p>
            <p className="text-xs text-slate-500">Awaiting delivery</p>
          </div>
        </div>
        <span className={`text-xl font-bold ${stats.pendingOrders > 0 ? 'text-orange-600' : 'text-slate-800'}`}>
          {stats.pendingOrders}
        </span>
      </div>
    </Link>

    {/* Completion Rate */}
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">Completion</p>
          <p className="text-xs text-slate-500">Order success</p>
        </div>
      </div>
      <span className="text-xl font-bold text-emerald-600">
        {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 100}%
      </span>
    </div>
  </div>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/seller/SellerDashboard.tsx` | Add real messages/rating fetch, make all stats clickable |
| `src/components/dashboard/BuyerDashboardHome.tsx` | Add matching Quick Stats section with real data |

---

## Data Sources

### Seller Quick Stats
| Stat | Source | Query |
|------|--------|-------|
| Products | `products.length` from context | Already available |
| Messages | `seller_chats` table | Count where `is_read=false`, `sender_type='buyer'` |
| Success Rate | `orders` from context | Calculate `completed / total * 100` |
| Rating | `product_reviews` joined with `seller_products` | Average rating for seller's products |

### Buyer Quick Stats
| Stat | Source | Query |
|------|--------|-------|
| Orders | `seller_orders` table | Already fetched as `allOrders` |
| Wishlist | `buyer_wishlist` table | Already fetched as `wishlistCount` |
| Pending | `allOrders.filter(status='pending')` | Already calculated |
| Completion | `allOrders.filter(status='completed')` | Calculate percentage |

---

## Expected Results

1. **Seller Quick Stats**: Real unread message count, real average rating from reviews, all items clickable to relevant pages
2. **Buyer Quick Stats**: Matching design with orders, wishlist, pending, and completion stats
3. **Click Navigation**: Each stat card navigates to the relevant detail page
4. **Real-time Updates**: Data refreshes automatically via existing Supabase subscriptions

