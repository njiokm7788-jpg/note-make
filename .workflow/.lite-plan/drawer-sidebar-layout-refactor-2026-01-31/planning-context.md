# Planning Context: Drawer-Sidebar Layout Refactor

## Source Evidence

### Exploration Files
- `exploration-patterns.json` - React hooks patterns (useState, useCallback, useEffect), drag-drop pattern, collapsible section pattern, toast notification pattern, modal/overlay pattern
- `exploration-integration-points.json` - App.tsx integration points (lines 162-382 single mode layout), ProcessingPanel props interface, state lifting requirements
- `exploration-dependencies.json` - No new external deps needed, Tailwind CSS 4.0 handles all animations, custom hooks for focus trap/scroll lock
- `exploration-architecture.json` - Transform from 3-column grid to sidebar+drawer architecture, new component hierarchy

### Design Specs
- `analysis.md` - Overview: drawer 300ms ease-out, sidebar 250ms ease-out, overlay 200ms ease
- `analysis-upload-status-bar.md` - 6 states (empty/partial-original/partial-annotated/complete/uploading/error), h-12 height, thumbnail 32x32px
- `analysis-upload-drawer.md` - Top slide-out panel, two drag zones, ESC close, focus trap, smart file assignment
- `analysis-sidebar.md` - 280px expanded, 48px collapsed, responsive breakpoints, localStorage persistence

### Reference Implementation
- `IMPL_PLAN.md` - 5-phase implementation plan with task breakdown

## Understanding

### Current State
- App.tsx uses 3-column grid layout (`lg:grid-cols-3`) with upload+settings in left column, preview in right 2 columns
- ProcessingPanel.tsx (352 lines) contains presets, advanced settings, action buttons
- ImageUploader.tsx (147 lines) handles single file upload with drag-drop
- All state managed in App.tsx via useState hooks
- Existing patterns: useDebounce, toast notifications, collapsible sections

### Problem
- Space utilization inefficient - preview area constrained
- Frequent scrolling required to access settings
- Upload area takes permanent space even after files selected
- No responsive adaptation for different screen sizes

### Approach
1. Create 3 new components: UploadStatusBar, UploadDrawer, Sidebar
2. Refactor App.tsx layout from grid to flex (sidebar + main content)
3. Optimize preview area to maximize available space
4. Add responsive breakpoints and keyboard shortcuts
5. Use pure Tailwind CSS transitions (no external animation library)

## Key Decisions

| Decision | Rationale | Evidence |
|----------|-----------|----------|
| 3 new component files | Single-responsibility, cleaner separation | User clarification: "3 new files" |
| Manual drawer close | User preference for explicit control | User clarification: "manual close - click done button" |
| Partial state persistence | Balance between UX and simplicity | User clarification: "only save collapsed state and preset selection" |
| Pure Tailwind animations | Zero additional dependencies | User clarification: "pure Tailwind CSS transitions" |
| Batch mode unchanged | Backward compatibility, scope control | exploration-architecture.json constraints |

## Dependencies

### Task Dependencies
- T1 (New Components) - Independent, can start immediately
- T2 (Layout Refactor) - Depends on T1 (needs new components to integrate)
- T3 (Preview Optimization) - Can run parallel with T2
- T4 (Responsive & Interactions) - Depends on T2 (needs layout structure)

### External Dependencies
- React 19.0.0 hooks (existing)
- Tailwind CSS 4.0.0 transitions (existing)
- localStorage API (built-in)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| State management complexity | Medium | Medium | Extract to custom hooks if needed |
| Animation performance | Low | Low | Use CSS transforms, avoid layout thrashing |
| Responsive breakpoint bugs | Medium | Medium | Test at each breakpoint during development |
| Batch mode regression | Low | High | Keep batch mode code path unchanged |
