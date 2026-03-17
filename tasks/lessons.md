# Munchis — Lessons Learned

## HARD RULE: Paper Is The Source of Truth — Read Before Coding
**Mistake:** Built desktop components from memory/old HTML instead of reading the CURRENT Paper node state. Used stale colors, spacing, and text that the user had manually updated in Paper.
**Root cause:** Assumed the design hadn't changed since I last wrote it. Reused old HTML from conversation history instead of querying Paper for the current values.
**Impact:** The user had to point out multiple times that colors, spacing, and content didn't match what they'd designed.
**Fix:** BEFORE coding ANY UI component, ALWAYS:
1. `get_screenshot` the Paper artboard to see the current visual state
2. `get_computed_styles` on specific nodes to get exact colors, spacing, fonts
3. `get_jsx` or `get_node_info` for text content
4. NEVER reuse old HTML from conversation history — it may be stale
5. If a value in Paper differs from what you remember, Paper wins. Always.
**Prevention:** This is a non-negotiable rule. The user customizes designs in Paper after initial generation. Every pixel, color, and word must be re-read from the live Paper state before building code.

## iOS Safari Bottom Sheet Scroll Lock
**Mistake:** Tried `position: fixed; top: -scrollY` on body to lock scroll behind a bottom sheet. This shifts the body content, causing gaps below the sheet where page content peeks through.
**Root cause:** iOS Safari treats `position: fixed` on body differently than Chrome. The negative top physically moves the document.
**Fix:** Use `createPortal` to render the sheet outside the app DOM tree + `touchmove` event prevention at the document level + `overflow: hidden` on html+body. Never reposition the body.
**Prevention:** For any modal/sheet overlay, always use `createPortal` into `document.body` and event-level scroll prevention. Never use body positioning hacks.

## Chrome vs Safari overscrollBehavior
**Mistake:** Relied on CSS `overscroll-behavior: contain` to prevent scroll chaining from a bottom sheet to the body behind it. Works in Safari, fails in Chrome.
**Root cause:** Chrome doesn't honor `overscroll-behavior: contain` consistently on dynamically positioned elements.
**Fix:** Track touch start Y position, detect scroll direction, and prevent `touchmove` at scroll boundaries (top/bottom of sheet). This handles both browsers.
**Prevention:** Never rely on `overscroll-behavior` alone for mobile. Always pair with JS-level boundary detection.

## Drop Priority Query — Show Live, Not Latest
**Mistake:** Queried drops with `ORDER BY number DESC LIMIT 1`, which returns the newest drop (often a draft) instead of the active one.
**Root cause:** Drop #02 (draft) has a higher number than Drop #01 (live), so it wins the sort.
**Fix:** Query by status priority: live > closed > baking > draft > completed. Loop through statuses and return the first match.
**Prevention:** Any "current" entity query should filter by status priority, not creation order. This happened in both the customer frontend AND the baker dashboard.

## Design in Paper Before Coding UI
**Mistake:** Built the baker dashboard UI directly in code, leading to multiple rounds of iteration, layout changes, and wasted effort.
**Root cause:** Skipped the design step to move faster. Instead moved slower due to constant back-and-forth.
**Fix:** Hard rule: **design every screen in Paper first, get approval, then code.** No exceptions.
**Prevention:** Before any UI work, check if a Paper artboard exists. If not, create one first.

## State Machine for Drop Status
**Mistake:** Initially allowed any status to transition to any other status (5 buttons in a row). This is confusing and error-prone.
**Root cause:** No business logic enforcing valid transitions.
**Fix:** Define explicit transition map: draft→live→closed→baking→completed. Only show valid next states in the UI. Validate in the API. Learned from Paperclip's `CONTENT_TRANSITIONS` pattern.
**Prevention:** Any stateful entity needs a transition map defined before the UI is built.

## Scheduling Overlap Prevention
**Mistake:** No validation prevented creating two drops for the same week or going live with two drops simultaneously.
**Root cause:** Missing DB constraints and API validation.
**Fix:** DB trigger validates: no overlapping order windows, close > open, pickup > close. Going live auto-closes the current live drop. API surfaces human-readable error messages. New drops auto-schedule to the next available week.
**Prevention:** For any scheduling system, define constraints at the DB level first, then API, then UI hints. Three layers of defense.

## Smart Defaults for New Entities
**Mistake:** New drops created with hardcoded dates that didn't account for existing drops, leading to scheduling conflicts.
**Root cause:** Creation API used static offsets (Date.now + 7 days) instead of looking at existing data.
**Fix:** New drops auto-schedule after the latest drop's pickup date. Inherit price, capacity, and location from the previous drop.
**Prevention:** Any "create new" flow should look at existing data to provide intelligent defaults.

## Bottom Sheet max-width on Mobile
**Mistake:** Used `max-w-[390px]` on the order sheet, which made it too narrow on phones wider than 390px, with visible margins.
**Root cause:** Hardcoded the Paper artboard width as a CSS constraint.
**Fix:** Use `max-w-lg` (512px) which fills most phones but caps on tablets/desktop.
**Prevention:** Never use Paper artboard dimensions as CSS constraints. Paper uses 390px for design, but the code should be responsive.

## Em Dashes in Copy
**Mistake:** Used em dashes (—) throughout the copy, which the user doesn't want.
**Root cause:** Default writing style, not a deliberate choice.
**Fix:** Replaced all em dashes with periods, commas, or restructured sentences.
**Prevention:** User preference: no em dashes in any copy. Use periods or commas instead.

## "Cookies" vs "Treats" in Copy
**Mistake:** Used "cookies" throughout the copy, but the brand wants to keep options open for other desserts.
**Root cause:** Assumed the product was cookies-only.
**Fix:** Changed all "cookies" to "treats" (EN) and "delicias" (ES) across all screens and WhatsApp templates.
**Prevention:** Use "treats" not "cookies" in all customer-facing copy. The brand may expand beyond cookies.

## "Current Entity" Bug — Happened 3 Times
**Mistake:** Used `drops[0]` (sorted by number DESC) to get the "current" drop. This returns the newest drop (often a draft), not the active one.
**Root cause:** Assumed newest = current. But Drop #02 (draft) has a higher number than Drop #01 (live).
**Where it happened:** 1) Customer frontend page.tsx, 2) Baker HomeTab, 3) Baker OrdersTab. Same bug, three places.
**Fix:** Always query by status priority: live > closed > baking > draft > completed. Never sort by creation order for "current" entity.
**Prevention:** Search the codebase for `drops[0]` or similar "take first" patterns. Every one is a potential bug. Use a helper function for "get active drop."

## Supabase New Key Format
**Mistake:** Assumed the new `sb_publishable_` / `sb_secret_` keys wouldn't work with `@supabase/supabase-js`. Almost fell back to legacy JWT keys unnecessarily.
**Root cause:** New key format wasn't documented in supabase-js release notes.
**Fix:** Tested directly — the new keys work fine with supabase-js v2.99+. No legacy keys needed.
**Prevention:** Test first, assume second. The new Supabase key format is compatible with the latest client library.
