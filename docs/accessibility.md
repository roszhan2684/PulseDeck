# Accessibility

| Area | Implementation |
|---|---|
| VoiceOver labels | Every icon-only button requires `accessibilityLabel` (type-enforced in `IconButton`). Cards expose a full sentence (author, caption, reaction count). Avatars, stats, counters announce values. |
| Roles & state | button / tab / tablist / radio / radiogroup / checkbox / menu / menuitem / adjustable / progressbar / alert / header, with `accessibilityState` (selected, checked, disabled, busy). |
| Gesture alternatives | Swipe deck: prev/next buttons + `adjustable` role. Double-tap/long-press reactions: reaction bar chips. Swipe-to-reply: long-press menu → Reply. Sheet drag: backdrop tap + close actions. Sliders: increment/decrement actions. |
| Reduced Motion | `useReducedMotionPref()` merges iOS setting + in-app override (Settings / Motion Lab). Removes particles, parallax, rotation, scale pops, slide transitions; keeps fades and all functionality. |
| Dynamic Type | `Text` allows scaling up to 1.4× (inputs 1.3×) so layouts hold. Large emoji get an automatic line height. |
| Contrast | text 18.6:1, muted 8.1:1, subtle 4.6:1 on `bg` (#09090F). Media text sits on gradient scrims. |
| Touch targets | `IconButton` ≥ 44 pt plus hitSlop; chips/buttons ≥ 40–56 pt. |
| Errors | Field errors use `accessibilityRole="alert"` + live region; toasts are polite live regions; form errors trigger error haptics. |
| Modals | `accessibilityViewIsModal` on sheets, dialogs and the media viewer; backdrop is a labeled close button. |

Audit still to run on device: full VoiceOver pass of the 7 core flows, Accessibility Inspector contrast scan, largest Dynamic Type size.
