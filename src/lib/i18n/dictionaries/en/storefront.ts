/** Storefront pages: pre-drop, live, hero, closed/baking, desktop variants */
const storefront = {
  // ── Pre-drop ──
  "preDrop.limitedBatch": "LIMITED BATCH",
  "preDrop.heading": "Something sweet is coming",
  "preDrop.description": "Small-batch, handmade treats. Each drop sells out fast — be the first to know when orders open.",
  "preDrop.bakedPickup": "Baked {{bakingDay}} · Pickup {{pickupDay}} at {{location}}",
  "preDrop.opensIn": "OPENS IN",
  "preDrop.notifySubtitle": "Get notified before it's gone",

  // ── Live drop ──
  "live.thisWeeksDrop": "THIS WEEK'S DROP",
  "live.each": "each",
  "live.claimedSoldOut": "{{capacity}} of {{capacity}} claimed — sold out",
  "live.dropWentFast": "This drop went fast. Get a heads-up next time so you don't miss out.",
  "live.beFirstNext": "Be first in line for the next drop",

  // ── Hero (mobile) ──
  "hero.bakedFromScratch": "Baked from scratch · Never mass-produced",
  "hero.heading": "Handmade treats,\nbaked fresh every Sunday",
  "hero.description": "One flavor per drop, made from scratch by hand. You order, we bake. Nothing sits on a shelf. This week: {{flavorName}}.",
  "hero.orderByThursday": "ORDER BY THURSDAY ·",
  "hero.orderNow": "Order Now",
  "hero.claimed": "{{count}} of {{capacity}} claimed",

  // ── Closed / baking / ready / completed ──
  "closed.allClaimed": "All {{capacity}} spots claimed! We're getting fresh ingredients {{ingredientsDay}} and baking everything by hand on {{bakingDay}}.",
  "closed.gettingIngredients": "We're buying fresh ingredients {{ingredientsDay}} and baking everything by hand on {{bakingDay}}. All made from scratch, just for you.",
  "closed.bakingNow": "Your treats are being baked fresh right now! Heidi is in the kitchen making everything from scratch for {{pickupDay}} pickup.",
  "closed.readyPickup": "Your treats are ready! Head to {{location}} on {{pickupDay}} to pick up your order.",
  "closed.readyAlmost": "Your treats are baked and beautiful! Pickup is {{pickupDay}} at {{location}}. Almost there!",
  "closed.dropComplete": "Drop {{dropNumber}} is complete! {{orderedCount}} orders, all handmade. Stay tuned for the next flavor.",
  "closed.headingSoldOut": "Sold out!",
  "closed.headingBaking": "We're baking your treats",
  "closed.headingReadyPickup": "Ready for pickup!",
  "closed.headingFreshOven": "Fresh out of the oven!",
  "closed.headingComplete": "Drop complete!",
  "closed.headingClosed": "Orders are closed",
  "closed.capacityClaimed": "{{count}} of {{capacity}} claimed",
  "closed.ordersThisDrop": "{{count}} orders this drop",
  "closed.nextWeekFlavor": "Next week's flavor",
  "closed.beFirstInLine": "Be first in line when Drop {{dropNumber}} opens Monday",
  "closed.followUs": "Follow us for updates",

  // ── Desktop closed variants ──
  "desktop.closedBakingHeading": "We're baking your treats right now",
  "desktop.closedBakingBody": "Every batch handmade from scratch by Heidi. Your treats will be ready for pickup soon.",
  "desktop.closedCompleteBody": "All {{count}} orders picked up. Thanks for being part of this drop!",
  "desktop.closedSoldOutBody": "All {{capacity}} spots claimed! We're getting fresh ingredients and baking everything by hand.",
  "desktop.closedDefaultBody": "We're getting ready to buy fresh ingredients and bake everything by hand.",
  "desktop.closesThursday": "CLOSES THURSDAY",
  "desktop.left": "{{count}} left",
} as const;

export default storefront;
