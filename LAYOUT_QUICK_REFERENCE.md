# Layout Fix - Quick Reference

## Fixed Header Implementation

### Before:
```tsx
// Header scrolled with content
<header className="relative ...">
```

### After:
```tsx
// Header fixed at top, content scrolls underneath
<header className="fixed top-0 left-0 right-0 z-50 ...">
```

### Content Adjustment:
```tsx
// Added padding to prevent content hiding under header
<main className="flex-1 pt-20 sm:pt-24">
```

---

## Chat Sidebar Positioning

### Before:
```tsx
// Sidebar in flow, affecting layout
<div className="hidden md:block">
  <ChatSidebar />
</div>
```

### After:
```tsx
// Sidebar as floating overlay
<ChatSidebar /> // Already has fixed positioning inside
```

### Inside ChatSidebar:
```tsx
// Fixed position, properly offset from header
<div className="fixed right-2 sm:right-4 top-20 sm:top-24 bottom-4 z-[60] ...">
```

---

## Container Consistency

### Before (Multiple conflicting containers):
```tsx
<div className="max-w-screen-2xl mx-auto px-6 py-12">
  <div className="max-w-5xl mx-auto pl-8 md:pl-12">
    <div className="container mx-auto px-6 py-12">
      // Content
    </div>
  </div>
</div>
```

### After (Clean single container):
```tsx
<div className="w-full max-w-5xl mx-auto space-y-8 sm:space-y-12">
  // Content
</div>
```

---

## Responsive Spacing Pattern

### Consistent approach across all components:
```tsx
// Padding
p-4 sm:p-6 lg:p-8

// Gaps
space-y-6 sm:space-y-8
gap-4 sm:gap-6

// Border radius
rounded-lg sm:rounded-xl

// Text sizes
text-base sm:text-lg md:text-xl
```

---

## Grid Responsiveness

### Before:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### After:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
// Added sm breakpoint for tablets
```

---

## Mobile-First Considerations

### Text truncation for long content:
```tsx
<p className="truncate">Long text here</p>
<h3 className="line-clamp-2">Long heading</h3>
```

### Flexible wrapping:
```tsx
<div className="flex flex-wrap gap-2">
  // Items wrap on small screens
</div>
```

### Conditional display:
```tsx
<p className="hidden sm:block">Desktop only text</p>
<span className="sm:hidden">Mobile only</span>
```

---

## Z-Index Layering

```
z-50  → Fixed Header
z-60  → Chat Sidebar (overlay)
z-10  → Content layers within components
```

---

## Breakpoint Reference

```
sm:   640px  (Small tablets, large phones landscape)
md:   768px  (Tablets)
lg:   1024px (Small laptops)
xl:   1280px (Desktops)
2xl:  1536px (Large desktops)
```

---

## Testing Checklist

- [ ] Header stays fixed when scrolling
- [ ] No content hidden under header
- [ ] Sidebar opens/closes without affecting layout
- [ ] All cards display properly on mobile (320px+)
- [ ] Text doesn't overflow containers
- [ ] Buttons are properly sized and accessible
- [ ] Charts are readable on all screen sizes
- [ ] No horizontal scrollbar at any screen size
- [ ] Spacing looks consistent across pages
- [ ] Tab navigation works and looks good on mobile
