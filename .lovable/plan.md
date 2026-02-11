
# Fix: Seller Product Section - Multiple Critical Bugs

## Issues Identified

### 1. Image Loading Fails in Product Section
**Root Cause:** The `MultiImageUploader` uploads to `store-media` bucket, which IS public. However, the image optimizer (`prepareImageForUpload`) may fail silently on certain image types or browsers, causing broken uploads. The upload path and public URL generation look correct.
**Action:** Add error handling and fallback in `MultiImageUploader` to handle failed compression gracefully (skip optimization if it fails, upload original).

### 2. Course Lessons Not Being Saved
**Root Cause:** In `NewProduct.tsx` (lines 603-604), `LessonBuilder` is rendered with hardcoded empty props:
```
lessons={[]}
onChange={() => {}}
```
The component appears but data is never stored in state or saved to the database. The `handleSubmit` function does not save lessons to `product_content` table.
**Action:** Add `lessons` state variable, wire `LessonBuilder` onChange to it, and save lessons to `product_content` table on submit.

### 3. File Download Not Working
**Root Cause:** Same issue as lessons -- `FileContentUploader` (lines 583-584) is rendered with:
```
files={[]}
onChange={() => {}}
```
Files are never stored in state or saved to the database.
**Action:** Add `files` state variable, wire `FileContentUploader` onChange to it, and save files to `product_content` table on submit.

### 4. Product Section Missing from Sidebar/Navbar
**Root Cause:** The `SellerSidebar` has a "Products" link at `/seller/products`, but the sub-menu items under Products are `Discount`, `Coupons`, `Flash Sales`, `Inventory` -- there is no direct "All Products" or "My Products" sub-item. The Products link itself in the sidebar navigates to `/seller/products` but it is only the parent collapsible trigger, not a direct link in expanded mode. When clicked it toggles the dropdown instead of navigating.
**Action:** Make the "Products" text in the sidebar a direct link to `/seller/products` while keeping the chevron as the collapsible toggle. Add "All Products" as the first sub-item.

### 5. AvailabilityEditor Not Saving
**Root Cause:** Same pattern -- `AvailabilityEditor` (lines 622-627) uses hardcoded empty props. Availability data is never saved.
**Action:** Add `timeSlots` and `callDuration` state, wire to component, save to `product_metadata`.

### 6. Edit Mode Doesn't Load Content Data
**Root Cause:** When loading a product for editing (lines 120-156), only basic fields are loaded. Lessons, files, and availability are NOT fetched from `product_content` table.
**Action:** In the `loadProduct` function, also fetch associated `product_content` records and populate the respective state variables.

---

## Technical Implementation Plan

### Step 1: Add State Variables for Content Types
Add to `NewProduct.tsx`:
- `files` state (FileItem[]) for downloadable content
- `lessons` state (Lesson[]) for course content
- `timeSlots` state (TimeSlot[]) for call availability
- `callDuration` state (number) for call duration

### Step 2: Wire Content Components to State
Replace the hardcoded empty props:
- `FileContentUploader`: `files={files}` and `onChange={setFiles}`
- `LessonBuilder`: `lessons={lessons}` and `onChange={setLessons}`
- `AvailabilityEditor`: `slots={timeSlots}` and `onChange={setTimeSlots}`, `duration={callDuration}`, `onDurationChange={setCallDuration}`

### Step 3: Save Content on Submit
In `handleSubmit`, after creating/updating the product:
- For file types: Insert/upsert rows into `product_content` with content_type='file'
- For course types: Insert/upsert rows into `product_content` with content_type='lesson'
- For call types: Save availability data to `product_metadata` JSON field

### Step 4: Load Content in Edit Mode
In `loadProduct`, after fetching the product:
- Fetch `product_content` rows for this product
- Populate `files` and `lessons` state from the results
- Parse `product_metadata` for availability data

### Step 5: Fix Sidebar Navigation
In `SellerSidebar.tsx`:
- Make the "Products" label a direct `Link` to `/seller/products`
- Add "All Products" as the first sub-item under the Products dropdown
- Keep the chevron icon as the collapsible toggle (separate from the link)

### Step 6: Image Upload Resilience
In `MultiImageUploader.tsx`:
- Wrap `prepareImageForUpload` in try/catch
- If compression fails, fall back to uploading the original file
- Show a warning toast instead of blocking the upload

---

## Files to Modify
1. `src/pages/NewProduct.tsx` -- Wire state, save/load content data
2. `src/components/seller/SellerSidebar.tsx` -- Fix Products navigation
3. `src/components/seller/MultiImageUploader.tsx` -- Add image upload fallback
