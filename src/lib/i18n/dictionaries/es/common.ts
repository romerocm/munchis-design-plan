import type common from "../en/common";

const esCommon: { [K in keyof typeof common]: string } = {
  // ── Nav badges ──
  "nav.comingSoon": "PRÓXIMAMENTE",
  "nav.soldOut": "AGOTADO",
  "nav.ordersClosed": "PEDIDOS CERRADOS",
  "nav.dropLive": "DROP ACTIVO",
  "nav.readyForPickup": "LISTO PARA RECOGER",
  "nav.bakingDone": "HORNEADO LISTO",

  // ── Countdown ──
  "countdown.days": "Días",
  "countdown.hrs": "Hrs",
  "countdown.min": "Min",
  "countdown.sec": "Seg",
  "countdown.expired": "Pedidos cerrados",
  "countdown.left": "restante",

  // ── Notify form ──
  "notify.onTheList": "¡Estás en la lista!",
  "notify.wellWhatsApp": "Te avisaremos por WhatsApp cuando el drop esté activo",
  "notify.notifyMe": "Avísame",
  "notify.error": "Algo salió mal. Intenta de nuevo.",

  // ── Phone input ──
  "phone.notInElSalvador": "¿No estás en El Salvador?",
  "phone.backToLocal": "Volver a El Salvador (+503)",

  // ── Baking timeline ──
  "timeline.ordersClosed": "Pedidos cerrados",
  "timeline.ordersLockedIn": "{{count}} pedidos confirmados",
  "timeline.freshIngredients": "Ingredientes frescos comprados",
  "timeline.ingredientsDetail": "Mantequilla, chocolate, huevos, harina",
  "timeline.bakingInProgress": "Horneando en progreso",
  "timeline.bakingComplete": "Horneado completo",
  "timeline.bakingDay": "Día de hornear",
  "timeline.madeByHand": "Hecho fresco a mano",
  "timeline.readyForPickup": "¡Listo para recoger!",
  "timeline.pickupComplete": "Recogida completa",
  "timeline.pickupAt": "Recogida en {{location}}",
  "timeline.pickupOn": "Recogida {{day}}",
  "timeline.now": "AHORA",
  "timeline.soon": "PRONTO",

  // ── Marquee ──
  "marquee.handmade": "Hecho a mano desde cero",
  "marquee.oneFlavor": "Un sabor por drop",
  "marquee.bakedSaturday": "Horneado fresco cada sábado",
  "marquee.location": "San Salvador, El Salvador",
  "marquee.foodEngineer": "Ingeniera de alimentos y chef pastelera",
  "marquee.realIngredients": "Hecho con ingredientes reales",
  "marquee.freshOven": "Recién salido del horno",
  "marquee.smallBatch": "Lotes pequeños, sin atajos",
  "marquee.noPreservatives": "Sin preservantes",
  "marquee.madeWithLove": "Hecho con amor",

  // ── How it works ──
  "howItWorks.step1Title": "Pide antes del jueves",
  "howItWorks.step1Desc": "Elige tu cantidad antes de que cierre el drop",
  "howItWorks.step2Title": "Horneamos el sábado",
  "howItWorks.step2Desc": "Ingredientes frescos, hechos a mano desde cero",
  "howItWorks.step3Title": "Recoge el domingo",
  "howItWorks.step3Desc": "Recoge tu bolsa en la ubicación de la semana",

  // ── Footer ──
  "footer.tagline": "Un sabor. Artesanal. Cada domingo.",
  "footer.copyright": "© 2026 munchis · San Salvador, El Salvador",

  // ── Next drop card ──
  "nextDrop.comingNextWeek": "La próxima semana",
  "nextDrop.noDescFallback": "Un sabor por drop. Regístrate para saber cuándo estará disponible.",
  "nextDrop.whatBakeNext": "¿Qué deberíamos hornear después?",
  "nextDrop.suggestFlavor": "Sugiere un sabor",
  "nextDrop.suggestDesc": "Un sabor por drop. Dinos cuál te gustaría ver.",
  "nextDrop.sendSuggestion": "Enviar sugerencia",

  // ── Flavor / Meet Heidi ──
  "flavor.back": "Atrás",
  "flavor.thisWeeksDrop": "El drop de esta semana",
  "flavor.addToOrder": "Agregar al pedido",
  "flavor.handsLabel": "Las manos detrás de cada postre",
  "flavor.meetHeidi": "Conoce a Heidi",
  "flavor.meetHeidiShort": "Ingeniera de alimentos y chef pastelera. Cada postre de munchis es artesanal, en lotes pequeños, sin atajos.",
  "flavor.meetHeidiLong": "Ingeniera de alimentos y chef pastelera. Después de 5 años dominando la producción industrial, eligió volver a lo básico.",
  "flavor.meetHeidiRebellion": "Cada postre de munchis es su rebelión: artesanal, en lotes pequeños, sin atajos.",
};

export default esCommon;
