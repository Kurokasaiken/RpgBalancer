# Routing Setup for Manual Testing

**To test the integration page in your browser, add this route to App.tsx**

---

## Step 1: Add Import

At the top of `src/App.tsx`, add:

```typescript
import MinimalActivityIntegration from '@/pages/MinimalActivityIntegration';
```

---

## Step 2: Add Route

In your `<Routes>` section (inside your Router), add:

```tsx
<Route path="/activity-integration" element={<MinimalActivityIntegration />} />
```

### Full Example (if your App.tsx doesn't have routing yet)

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MinimalActivityIntegration from '@/pages/MinimalActivityIntegration';
import OtherPage from '@/pages/OtherPage'; // your existing pages

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/activity-integration" element={<MinimalActivityIntegration />} />
        <Route path="/other-page" element={<OtherPage />} />
        {/* your other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Step 3: Run Dev Server

```bash
npm run dev
```

---

## Step 4: Open in Browser

Navigate to:

```
http://localhost:5173/activity-integration
```

---

## What You'll See

1. **Header:** Title + current game time (Day X, HH:MM)
2. **Status HUD:** Wood, Gold, Food, XP displays
3. **Main Layout:**
   - Left: Roster with 5 residents (Alice, Borin, Cleric, David, Eva)
   - Right: 3 Activity cards (Taglia Legna, Miniera Oro, Cattura Bestia)
4. **Debug Panel:** At bottom showing state machine info

---

## Test Workflow

1. **Drag** a resident from the roster
2. **Drop** on an activity card
3. **Watch** the progress bar fill (HaloProgressComponent)
4. **Wait** for skill check to auto-trigger
5. **See** victory overlay with rewards
6. **Click** Continue to reset
7. **Repeat** with different residents/activities

---

## That's It!

No other setup needed. The page handles:
- ✅ Drag & drop
- ✅ Timer progression
- ✅ Skill checks
- ✅ Rewards
- ✅ State reset

All fully integrated and ready to test.

