# Munchis — TODO

## Pre-Launch (Drop #1)
- [x] Customer hero screen (live drop)
- [x] Customer flavor screen
- [x] Order flow (qty → contact → payment link)
- [x] Pay Now full screen with countdown
- [x] Payment Confirmed share card
- [x] Pre-drop countdown screen
- [x] Post-drop orders closed screen
- [x] Baker login (Supabase Auth)
- [x] Baker dashboard home with tabs
- [x] Baker orders list with filters
- [x] Baker drops schedule
- [x] Baker drop editor (WYSIWYG preview + settings)
- [x] Drop status state machine
- [x] Scheduling constraints (overlap prevention)
- [x] Smart defaults for new drops
- [x] Notify-me API
- [x] Simulate payment (sandbox)
- [x] Expired orders cron (pg_cron)
- [x] Micro-interactions (transitions, button press, animations)
- [x] Skeleton loading
- [x] Order sheet drag-to-dismiss
- [x] Full Paper audit — align all artboards to code
- [ ] Deploy to production (Vercel)

## Recipe Lab v3
- [x] Migration: 014_recipe_lab.sql
- [x] Types: database.ts (Recipe, RecipeIngredient, RecipeStep, etc.)
- [x] Constants: src/lib/recipes/constants.ts
- [x] API: Recipes CRUD (list, create, detail, update, delete)
- [x] API: Ingredients CRUD (add, update, delete)
- [x] API: Steps CRUD (add, update, delete)
- [x] API: Drop shopping (GET, PATCH toggle)
- [x] API: Drop baking (GET, PATCH status)
- [x] API: drops route — recipe_id in ALLOWED_FIELDS
- [x] API: drop-status route — rollback cleanup
- [x] Tab bar: "Lab" tab added
- [x] Lab tab component (Active Now + filter chips + grouped cards)
- [x] Recipe detail view (read mode + edit mode)
- [x] Shopping list component
- [x] Baking plan component
- [x] Dashboard client: wire up all views
- [x] Server page: fetch recipes + drop_stats
- [x] Drop editor: recipe selector
- [x] TypeScript clean compile
- [x] All tests pass (24/24)

## Paper Design — New Artboards Needed
- [ ] Desktop v2 — Pre-Drop (countdown + marquee + how-it-works + notify)
- [x] Desktop v2 — Closed/Baking (no marquee/how-it-works, Coming Next Week as primary CTA)
- [ ] Desktop v2 — Completed (recap, next drop teaser)
- [ ] Desktop v2 — Order Modal (centered overlay on live drop)
- [ ] Desktop v2 — Pay Now + Confirmed (desktop versions of mobile screens)
- [ ] Full About page design (with Instagram/YouTube embeds)

## Post-Launch (Drop #2+)
- [ ] /order/[id] status page (if WhatsApp isn't enough)
- [ ] Language selector (EN/ES)
- [ ] WhatsApp send integration
- [ ] Real Wompi integration (replace sandbox)
- [ ] Baker pickup checklist
- [x] Baker shopping list (from recipes)
- [x] Baker baking day planner
- [ ] Photo shoot brief
- [ ] Analytics event specification
- [ ] Inline Stripe/Wompi checkout (remove 2-hour payment window)
- [ ] Notify-me delivery pipeline (WhatsApp)
- [ ] Full About page with Instagram Reels + YouTube reviews
- [ ] Error screens (stock changed, payment expired)
