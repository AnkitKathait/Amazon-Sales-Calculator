# Testing Guide - Sales Calculator Mobile & Desktop

## Quick Start Testing

### Open Both Versions
1. **Desktop Version**: Open `index.html` in browser
2. **Mobile Version**: Open `mobile.html` in browser

### Browser Console Debugging
Press `F12` to open browser console and check for:
- ✓ No red error messages
- ✓ Console shows "Mobile HTML loaded successfully"
- ✓ All required DOM elements show ✓
- ✓ App functions ready message appears

## Desktop Version Test (index.html)

### Test Steps
1. **Page Load**
   - [ ] Current month/year selected automatically
   - [ ] No data initially (0 orders)
   - [ ] All 7 summary cards visible
   - [ ] Days grid renders empty

2. **Add Order**
   - [ ] Click "+ Add order" button
   - [ ] Modal opens with all 7 form fields visible
   - [ ] Fields: Day, SKU, Price (₹), Shipping (₹), Cost (₹), Fees (₹), RTO/Loss (₹)
   - [ ] Day dropdown populated with all days of current month
   - [ ] Today marked with "— Today" label

3. **Fill Form**
   - [ ] Enter SKU: "TEST-001"
   - [ ] Enter Price: "500"
   - [ ] Shipping auto-shows cost per unit
   - [ ] Enter Cost: "200"
   - [ ] Amazon Fees auto-calculated
   - [ ] Enter RTO: "0"

4. **Submit**
   - [ ] Click "Add Entry" button
   - [ ] Modal closes
   - [ ] Toast shows "✓ Order added for [date]"
   - [ ] Day card appears with order

5. **Verify Summary**
   - [ ] Total Orders: incremented to 1
   - [ ] Total Revenue: shows 500
   - [ ] Total Shipping: shows calculated value
   - [ ] Amazon Fees: shows calculated value
   - [ ] Total Cost: shows 200
   - [ ] RTO/Loss: shows 0
   - [ ] Net Profit: shows calculated profit (500 - ship - fees - 200 - 0)

6. **View Order**
   - [ ] Click day card to expand/collapse
   - [ ] Table shows order row with all 6 values
   - [ ] Delete button (X) appears on hover

7. **Edit Order (Delete & Re-add)**
   - [ ] Click delete button on order row
   - [ ] Toast shows deletion message
   - [ ] Row removed from table
   - [ ] Summary updates

8. **Export/Import**
   - [ ] Click "Export" button (⬇)
   - [ ] JSON file downloaded: `amazon_sales_[Month]_[Year].json`
   - [ ] Click "Import" button (⬆)
   - [ ] Select downloaded JSON file
   - [ ] Data restored from file

9. **Print**
   - [ ] Click "Print" button
   - [ ] Print preview shows formatted month data
   - [ ] All orders and totals visible

## Mobile Version Test (mobile.html)

### Test Steps - Same as Desktop, Plus:

1. **Responsive Layout**
   - [ ] Page title fits on screen
   - [ ] Controls stack vertically
   - [ ] Month/Year selects full width
   - [ ] Summary cards 1-per-line (single column)
   - [ ] Day cards responsive

2. **Touch Friendly**
   - [ ] All buttons easily tappable (40px+ height)
   - [ ] Form inputs have 40px+ height
   - [ ] Modal doesn't overflow screen
   - [ ] No horizontal scroll needed

3. **Icons Only**
   - [ ] Top buttons show only icons (no text)
   - [ ] Export: ⬇
   - [ ] Import: ⬆
   - [ ] Add: ➕

4. **Form Fields**
   - [ ] All 7 fields fit in modal
   - [ ] No fields cut off
   - [ ] Keyboard doesn't hide critical buttons
   - [ ] Can scroll modal if needed

## Device Size Testing

### Using Browser DevTools

1. **Desktop (1920x1080)**
   - [ ] index.html looks good
   - All features work

2. **Tablet Portrait (768x1024)**
   - [ ] index.html adapts well
   - [ ] mobile.html displays properly
   - [ ] Controls visible and usable

3. **Mobile Portrait (375x667)**
   - [ ] mobile.html looks good
   - [ ] No horizontal scrolling
   - [ ] All buttons tappable
   - [ ] Modal fits screen

4. **Mobile Landscape (812x375)**
   - [ ] mobile.html adapts
   - [ ] Content not cramped
   - [ ] All fields accessible

## Console Debugging Checklist

Open browser console (F12) and verify:

### Initial Load
```
✓ Mobile HTML loaded successfully
✓ All required DOM elements listed with ✓ status
✓ App functions ready message appears
```

### After Adding Data
```
✓ No error messages
✓ Store shows data added
✓ Supabase config shows ✓ configured
```

### When Adding Order
- [ ] No JavaScript errors
- [ ] Modal opens without errors
- [ ] Form fields respond to input
- [ ] Submit works without errors

## Troubleshooting

### If Mobile Not Working

1. **Check Console (F12)**
   - Look for red error messages
   - Check Network tab for failed CSS/JS loads
   - Look for "DOM element missing" messages

2. **Common Issues**
   - [ ] CSS not loading: Check Network tab for 404 errors on `src/css/styles.css`
   - [ ] JS not loading: Check Network tab for 404 errors on `src/js/app.js`
   - [ ] Supabase error: Check console for "Supabase" error messages
   - [ ] Form fields missing: Check console for "DOM element missing" messages

3. **Fix Steps**
   - Delete browser cache (Ctrl+Shift+Delete)
   - Close and reopen mobile.html
   - Check browser console again
   - Report any red error messages

## Data Persistence

1. **Local Storage**
   - Data stored in browser
   - Persists across page reloads
   - Per browser/device

2. **Supabase Cloud Backup** (if configured)
   - Data synced to cloud on add/edit/delete
   - Persists across devices
   - Check Network tab for sync activity

## Expected Results

✓ Both versions fully functional  
✓ Desktop: All features enabled  
✓ Mobile: Core features, touch-optimized UI  
✓ No console errors  
✓ Data persists locally and to cloud  
✓ Responsive layout works on all tested sizes  
