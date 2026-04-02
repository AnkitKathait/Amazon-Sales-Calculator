# Amazon Sales Calculator

A simple Amazon order tracker built for daily margin, shipping, returns and profit visibility.

## Project Structure

```
Amazon Sales Calculator/
├── index.html                    # Desktop version (recommended default)
├── mobile.html                   # Mobile-optimized version
├── src/
│   ├── css/
│   │   └── styles.css           # All CSS styling (shared between desktop & mobile)
│   └── js/
│       └── app.js               # All JavaScript logic (shared between desktop & mobile)
├── Amazon_Sales_Calculator.html  # Legacy single-file version (deprecated)
└── urban-drip-inventory-supabase.html  # Reference file (do not modify)
```

## Usage

### Desktop Version
Open **`index.html`** in your browser for the full-featured desktop experience with all controls and detailed views.

### Mobile Version
Open **`mobile.html`** in your browser for a mobile-optimized experience with:
- Simplified controls
- Touch-friendly buttons (min 40px height)
- Compact layout
- Icon-only topbar on small screens
- Single-column summary cards

## Features

✅ **Order Tracking**
- Add/edit/delete orders by day
- Track selling price, shipping, fees, cost, RTO/loss
- Auto-calculate profit per order

✅ **Monthly Summary**
- Summary cards showing total orders, revenue, profit
- Week-by-week organization
- Day-by-day collapsible details

✅ **Auto-Fill Intelligence**
- Selling price → Auto-set cost based on range
- Cost → Auto-set Amazon fees based on range
- Defaults: Shipping ₹65, Cost ₹250 (if < ₹500), ₹300 (if ≥ ₹500)

✅ **Data Persistence**
- Supabase cloud sync (auto-save on every change)
- Export data to JSON
- Import previous data

✅ **Responsive Design**
- Desktop (1024px+): Full layout, all text visible
- Tablet (768px): 2-column summary, compact controls
- Phone (600px): 1-column layout, full-width controls, vertical stacking
- Small phone (400px): Minimalist layout, compact spacing

## Supabase Configuration

The app uses **Supabase** for cloud data persistence. Configuration:
- **URL**: `https://jopulgsuccysuhoadvim.supabase.co`
- **Key**: Anonymous key embedded in `src/js/app.js`
- **Table**: `orders` with columns: `id, year, month, day, sku, sell, ship, fees, cost, rto, created_at`

## File Organization Benefits

### Before (Single File)
- 53KB single HTML file
- Hard to maintain CSS and JS separately
- Difficult to reuse code

### After (Modular)
- `index.html` (3.2KB) - Structure only
- `mobile.html` (2.8KB) - Structure only  
- `src/css/styles.css` (28KB) - All styling (desktop + tablet + phone breakpoints)
- `src/js/app.js` (25KB) - All logic (shared between both versions)

**Benefits:**
✅ Easier to maintain and update
✅ Faster load times (browser caches CSS/JS separately)
✅ Reusable components across versions
✅ Better separation of concerns
✅ Faster development and debugging

## Development Notes

- Both `index.html` and `mobile.html` share the same `src/css/styles.css` and `src/js/app.js`
- Mobile breakpoints in CSS: 768px (tablet), 600px (phone), 400px (small phone)
- All Supabase operations are async (auto-save, auto-load, auto-delete)
- Data structure: `store[year][month][day] = [{ sku, sell, ship, fees, cost, rto }, ...]`

## How to Deploy

1. **Desktop**: Host `index.html` + `src/` folder
2. **Mobile**: Can be the same deployment, just share the mobile link
3. Both versions access the same Supabase database
4. Use relative paths (`src/css/styles.css`, `src/js/app.js`)

## Browser Compatibility

✅ Chrome/Edge 90+
✅ Firefox 88+
✅ Safari 14+
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

**Version**: 2.1  
**Last Updated**: April 2, 2026  
**Status**: Production Ready
