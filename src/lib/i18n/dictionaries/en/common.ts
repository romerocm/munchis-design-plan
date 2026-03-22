/** Shared UI: nav badges, countdown, notify, phone, timeline, marquee, how-it-works, footer, next-drop card, flavor/heidi */
const common = {
  // ── Nav badges ──
  "nav.comingSoon": "COMING SOON",
  "nav.soldOut": "SOLD OUT",
  "nav.ordersClosed": "ORDERS CLOSED",
  "nav.dropLive": "DROP LIVE",
  "nav.readyForPickup": "READY FOR PICKUP",
  "nav.bakingDone": "BAKING DONE",

  // ── Countdown ──
  "countdown.days": "Days",
  "countdown.hrs": "Hrs",
  "countdown.min": "Min",
  "countdown.sec": "Sec",
  "countdown.expired": "Orders are closed",
  "countdown.left": "left",

  // ── Notify form ──
  "notify.onTheList": "You're on the list!",
  "notify.wellWhatsApp": "We'll WhatsApp you when the drop goes live",
  "notify.notifyMe": "Notify me",
  "notify.error": "Something went wrong. Try again.",

  // ── Phone input ──
  "phone.notInElSalvador": "Not in El Salvador?",
  "phone.backToLocal": "Back to El Salvador (+503)",

  // ── Baking timeline ──
  "timeline.ordersClosed": "Orders closed",
  "timeline.ordersLockedIn": "{{count}} orders locked in",
  "timeline.freshIngredients": "Fresh ingredients bought",
  "timeline.ingredientsDetail": "Butter, chocolate, eggs, flour",
  "timeline.bakingInProgress": "Baking in progress",
  "timeline.bakingComplete": "Baking complete",
  "timeline.bakingDay": "Baking day",
  "timeline.madeByHand": "Made fresh by hand",
  "timeline.readyForPickup": "Ready for pickup!",
  "timeline.pickupComplete": "Pickup complete",
  "timeline.pickupAt": "Pickup at {{location}}",
  "timeline.pickupOn": "Pickup {{day}}",
  "timeline.now": "NOW",
  "timeline.soon": "SOON",

  // ── Marquee ──
  "marquee.handmade": "Handmade from scratch",
  "marquee.oneFlavor": "One flavor per drop",
  "marquee.bakedSaturday": "Baked fresh every Saturday",
  "marquee.location": "San Salvador, El Salvador",
  "marquee.foodEngineer": "Food engineer & pastry chef",
  "marquee.realIngredients": "Made with real ingredients",
  "marquee.freshOven": "Fresh out of the oven",
  "marquee.smallBatch": "Small-batch, no shortcuts",
  "marquee.noPreservatives": "No preservatives",
  "marquee.madeWithLove": "Made with love",

  // ── How it works ──
  "howItWorks.step1Title": "Order by Thursday",
  "howItWorks.step1Desc": "Pick your quantity before the drop closes",
  "howItWorks.step2Title": "We bake Saturday",
  "howItWorks.step2Desc": "Fresh ingredients, handmade from scratch",
  "howItWorks.step3Title": "Pick up Sunday",
  "howItWorks.step3Desc": "Grab your bag at this week's location",

  // ── Footer ──
  "footer.tagline": "One flavor. Handmade. Every Sunday.",
  "footer.copyright": "© 2026 munchis · San Salvador, El Salvador",

  // ── Next drop card ──
  "nextDrop.comingNextWeek": "Coming next week",
  "nextDrop.noDescFallback": "One flavor per drop. Sign up to get notified when it goes live.",
  "nextDrop.whatBakeNext": "What should we bake next?",
  "nextDrop.suggestFlavor": "Suggest a flavor",
  "nextDrop.suggestDesc": "We pick one flavor per drop. Tell us what you'd love to see next.",
  "nextDrop.sendSuggestion": "Send suggestion",

  // ── Flavor / Meet Heidi ──
  "flavor.back": "Back",
  "flavor.thisWeeksDrop": "This week's drop",
  "flavor.addToOrder": "Add to order",
  "flavor.handsLabel": "The hands behind every treat",
  "flavor.meetHeidi": "Meet Heidi",
  "flavor.meetHeidiShort": "Food engineer and pastry chef. Every munchis treat is handmade, small-batch, no shortcuts.",
  "flavor.meetHeidiLong": "Food engineer and pastry chef. After 5 years mastering industrial food production, she chose to go back to basics.",
  "flavor.meetHeidiRebellion": "Every munchis treat is her rebellion: handmade, small-batch, no shortcuts.",
} as const;

export default common;
