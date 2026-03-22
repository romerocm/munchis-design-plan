import type storefront from "../en/storefront";

const esStorefront: { [K in keyof typeof storefront]: string } = {
  // ── Pre-drop ──
  "preDrop.limitedBatch": "EDICIÓN LIMITADA",
  "preDrop.heading": "Algo dulce viene en camino",
  "preDrop.description": "Postres artesanales en lotes pequeños. Cada drop se agota rápido — sé el primero en saber cuándo abrimos pedidos.",
  "preDrop.bakedPickup": "Horneado {{bakingDay}} · Recogida {{pickupDay}} en {{location}}",
  "preDrop.opensIn": "ABRE EN",
  "preDrop.notifySubtitle": "Recibe una notificación antes de que se agote",

  // ── Live drop ──
  "live.thisWeeksDrop": "EL DROP DE ESTA SEMANA",
  "live.each": "c/u",
  "live.claimedSoldOut": "{{capacity}} de {{capacity}} reservados — agotado",
  "live.dropWentFast": "Este drop se agotó rápido. Recibe un aviso la próxima vez.",
  "live.beFirstNext": "Sé el primero en el próximo drop",

  // ── Hero (mobile) ──
  "hero.bakedFromScratch": "Hecho desde cero · Nunca producido en masa",
  "hero.heading": "Postres artesanales,\nhorneados frescos cada domingo",
  "hero.description": "Un sabor por drop, hecho a mano desde cero. Tú pides, nosotros horneamos. Nada se queda en un estante. Esta semana: {{flavorName}}.",
  "hero.orderByThursday": "PIDE ANTES DEL JUEVES ·",
  "hero.orderNow": "Ordenar",
  "hero.claimed": "{{count}} de {{capacity}} reservados",

  // ── Closed / baking / ready / completed ──
  "closed.allClaimed": "¡Los {{capacity}} lugares fueron reservados! Compraremos ingredientes frescos el {{ingredientsDay}} y hornearemos todo a mano el {{bakingDay}}.",
  "closed.gettingIngredients": "Compraremos ingredientes frescos el {{ingredientsDay}} y hornearemos todo a mano el {{bakingDay}}. Todo hecho desde cero, solo para ti.",
  "closed.bakingNow": "¡Tus postres se están horneando ahora mismo! Heidi está en la cocina preparando todo desde cero para la recogida del {{pickupDay}}.",
  "closed.readyPickup": "¡Tus postres están listos! Ve a {{location}} el {{pickupDay}} a recoger tu pedido.",
  "closed.readyAlmost": "¡Tus postres están horneados y hermosos! Recogida el {{pickupDay}} en {{location}}. ¡Ya casi!",
  "closed.dropComplete": "¡Drop {{dropNumber}} completado! {{orderedCount}} pedidos, todos hechos a mano. Pendiente del próximo sabor.",
  "closed.headingSoldOut": "¡Agotado!",
  "closed.headingBaking": "Estamos horneando tus postres",
  "closed.headingReadyPickup": "¡Listos para recoger!",
  "closed.headingFreshOven": "¡Recién salidos del horno!",
  "closed.headingComplete": "¡Drop completado!",
  "closed.headingClosed": "Pedidos cerrados",
  "closed.capacityClaimed": "{{count}} de {{capacity}} reservados",
  "closed.ordersThisDrop": "{{count}} pedidos en este drop",
  "closed.nextWeekFlavor": "Sabor de la próxima semana",
  "closed.beFirstInLine": "Sé el primero cuando el Drop {{dropNumber}} abra el lunes",
  "closed.followUs": "Síguenos para más",

  // ── Desktop closed variants ──
  "desktop.closedBakingHeading": "Estamos horneando tus postres ahora mismo",
  "desktop.closedBakingBody": "Cada lote hecho a mano desde cero por Heidi. Tus postres estarán listos pronto.",
  "desktop.closedCompleteBody": "Los {{count}} pedidos fueron recogidos. ¡Gracias por ser parte de este drop!",
  "desktop.closedSoldOutBody": "¡Los {{capacity}} lugares fueron reservados! Estamos comprando ingredientes frescos y horneando todo a mano.",
  "desktop.closedDefaultBody": "Nos preparamos para comprar ingredientes frescos y hornear todo a mano.",
  "desktop.closesThursday": "CIERRA EL JUEVES",
  "desktop.left": "{{count}} disponibles",
};

export default esStorefront;
