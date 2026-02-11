
## Complete Integration of DeliveryInventoryManager into NewProduct Step 2

### Current State Analysis
The `DeliveryInventoryManager` component exists and is properly imported in `NewProduct.tsx` (line 21), but it's **not rendered anywhere in the Step 2 form**. The component is designed to accept:
- `productId: string | null` -- needed after product is saved
- `sellerId: string` -- available from `profile.id`
- `deliveryMode: string` -- stored in state as `deliveryMode` (line 124)
- `onDeliveryModeChange: (mode: DeliveryMode) => void` -- callback to update state
- `productType: string` -- available as `productType` state variable

### Root Cause
The integration attempt failed due to a line-matching issue during the edit operation. The `DeliveryInventoryManager` needs to be properly rendered as a new section in Step 2 after the "Card Appearance" section and before the content-type-specific sections (files, lessons, etc.).

### Implementation Plan

#### 1. **Add Delivery Mode Selector Section (Step 2)**
Insert a new section after "Card Appearance" (around line 965) with:
- **Section Header**: "Delivery Settings"
- **Description**: Explain auto-delivery options
- **Render**: The full `DeliveryInventoryManager` component

**Code placement**: After the Card Appearance divider and before FileContentUploader/LessonBuilder sections

**Props passed**:
```tsx
<DeliveryInventoryManager
  productId={savedProductId}  // null initially, set after first save
  sellerId={profile.id}
  deliveryMode={deliveryMode}
  onDeliveryModeChange={setDeliveryMode}
  productType={productType}
/>
```

#### 2. **Update State & Lifecycle**
- `deliveryMode` state already exists (line 124)
- `savedProductId` state already tracks product ID after creation (line 125)
- No changes needed here

#### 3. **Add Conditional Rendering Logic**
- Only show DeliveryInventoryManager for product types that support auto-delivery
- Use the `SUPPORTED_PRODUCT_TYPES` array from DeliveryInventoryManager: `['digital_product', 'ebook', 'template', 'graphics', 'audio', 'video', 'software']`
- Show a notice if product isn't saved yet: "Save the product first to add delivery inventory"

#### 4. **Integrate Delivery Mode with Save Logic**
- Add `delivery_type: deliveryMode` to the `buildProductData()` function
- Currently, product data saves but doesn't capture delivery mode -- need to add this field

#### 5. **Handle Stock Auto-Sync**
- The edge function and database trigger handle this automatically once items are added
- No additional work needed in the UI

### Files to Modify
1. **`src/pages/NewProduct.tsx`** (single file change):
   - Add new section in Step 2 form for Delivery Settings
   - Update `buildProductData()` to include `delivery_type: deliveryMode`
   - Conditionally render DeliveryInventoryManager only for supported types

### Technical Details

**Location in Step 2**: After CardCustomizer (line 965), before content-type conditionals (FileContentUploader at line 972, LessonBuilder at line 983, etc.)

**Conditional check**:
```tsx
const SUPPORTED_FOR_DELIVERY = ['digital_product', 'ebook', 'template', 'graphics', 'audio', 'video', 'software'];

// In Step 2 form:
{SUPPORTED_FOR_DELIVERY.includes(productType) && (
  <>
    <div className="border-t" />
    <div>
      <Label className="text-base text-slate-700 mb-3 block">
        Delivery Settings
      </Label>
      {!savedProductId && (
        <p className="text-sm text-amber-600 mb-3">Save the product first to configure delivery inventory.</p>
      )}
      <DeliveryInventoryManager
        productId={savedProductId}
        sellerId={profile.id}
        deliveryMode={deliveryMode}
        onDeliveryModeChange={setDeliveryMode}
        productType={productType}
      />
    </div>
  </>
)}
```

**Update buildProductData()** (around line 281):
- Add `delivery_type: deliveryMode` to the returned object

### Edge Cases Handled
- **Product not yet saved**: Component shows warning message, prevents adding items
- **Type change**: If user changes product type after selecting auto-delivery, inventory is preserved but selector hides if type no longer supports it
- **Switching between delivery modes**: Inventory auto-updates based on item_type selection in manager
- **Load on edit**: Existing `deliveryMode` loads from product data (line 219 already handles this)

### No Breaking Changes
- All existing functionality preserved
- Component is optional/hidden for unsupported types
- No new dependencies required
- Only CSS classes already in use (same styling as Card Appearance section)

### Testing Checklist
After implementation:
- [ ] Create new product → Type selector → Details page → Delivery Settings visible
- [ ] Add accounts/license keys → See them list below
- [ ] Bulk import credentials → Count updates correctly
- [ ] Save product → Delivery mode persists on reload
- [ ] Edit existing product → Delivery inventory loads with existing items
- [ ] Switch delivery modes → Inventory updates dynamically
- [ ] Test on mobile → Layout responsive
