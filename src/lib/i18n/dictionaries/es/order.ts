import type order from "../en/order";

const esOrder: { [K in keyof typeof order]: string } = {
  // ── Order sheet ──
  "orderSheet.stepOf": "Paso {{current}} de {{total}}",
  "orderSheet.yourOrder": "Tu pedido",
  "orderSheet.max": "Máx {{count}}",
  "orderSheet.bakedThisSaturday": "Horneado fresco este sábado",
  "orderSheet.totalTreat": "Total · {{count}} postre",
  "orderSheet.totalTreats": "Total · {{count}} postres",
  "orderSheet.continueCheckout": "Continuar al pago",
  "orderSheet.paymentLinkNote": "Recibirás un link de pago para confirmar",
  "orderSheet.almostThere": "Ya casi",
  "orderSheet.treats": "postres",
  "orderSheet.yourName": "Tu nombre",
  "orderSheet.whatsappNumber": "Número de WhatsApp",
  "orderSheet.emailOptional": "Email (opcional)",
  "orderSheet.emailPlaceholder": "Para actualizaciones del pedido",
  "orderSheet.pickupSundayAt": "Recogida domingo en {{location}}",
  "orderSheet.reserving": "Reservando...",
  "orderSheet.reserveMyTreats": "Reservar mis postres",
  "orderSheet.whatsappPayNote": "Enviaremos un link de pago a tu WhatsApp. Paga en 20 minutos para confirmar tu pedido.",
  "orderSheet.nameRequired": "Nombre y WhatsApp son requeridos",
  "orderSheet.onlyLeft": "Solo quedan {{count}}. Reduce tu cantidad e intenta de nuevo.",
  "orderSheet.hitCapacity": "Este drop se acaba de agotar. No se pueden hacer más pedidos.",
  "orderSheet.tooFast": "¡Vas muy rápido! Espera {{seconds}} segundos e intenta de nuevo.",
  "orderSheet.connectionError": "Error de conexión. Intenta de nuevo.",

  // ── Pay-now ──
  "payNow.orderReserved": "¡Orden reservada!",
  "payNow.payWithin": "Paga en los próximos 20 minutos para asegurar tu pedido. Todo será horneado fresco a mano, solo para ti.",
  "payNow.bakedPickup": "Horneado fresco {{bakingDay}} · Recogida {{pickupDay}} · {{location}}",
  "payNow.total": "Total",
  "payNow.openPayment": "Abrir link de pago",
  "payNow.sentToWhatsApp": "También enviado a tu WhatsApp",

  // ── Confirmed ──
  "confirmed.paymentConfirmed": "PAGO CONFIRMADO",
  "confirmed.youGotYours": "¡Ya son tuyos!",
  "confirmed.bakedFreshScratch": "Tu pedido será horneado fresco desde cero",
  "confirmed.bakedForYou": "Hecho desde cero, solo para ti",
  "confirmed.shareStories": "Compartir en Stories",
  "confirmed.orSaveScreenshot": "o guarda una captura",

  // ── Order status page ──
  "orderStatus.youGotYours": "¡Ya son tuyos!",
  "orderStatus.paymentConfirmedDesc": "Pago confirmado. Hornearemos tus galletas frescas este sábado.",
  "orderStatus.cookiePhoto": "Foto de galletas",
  "orderStatus.cookies": "galletas",
  "orderStatus.pickupAt": "Recogida {{day}} en {{location}}",
  "orderStatus.pickupReminder": "Recogida {{day}} {{startTime}}–{{endTime}} en {{location}} · Te enviaremos un recordatorio por WhatsApp",
  "orderStatus.backToMunchis": "Volver a munchis",
  "orderStatus.orderExpired": "Orden expirada",
  "orderStatus.expiredDesc": "La ventana de pago de 20 minutos ha pasado. Tu lugar ha sido liberado. No te preocupes — puedes hacer un nuevo pedido si el drop sigue abierto.",
  "orderStatus.reserved": "Reservado",
  "orderStatus.pay": "Pagar",
  "orderStatus.pickup": "Recogida",
  "orderStatus.orderReserved": "¡Orden reservada!",
  "orderStatus.payWithin": "Paga en los próximos 20 minutos para asegurar tu pedido. Todo será horneado fresco a mano, solo para ti.",
  "orderStatus.remainingToPay": "restante para pagar",
  "orderStatus.total": "Total",
  "orderStatus.bakedPickup": "Horneado fresco · Recogida {{day}} · {{location}}",
  "orderStatus.openPayment": "Abrir link de pago",
  "orderStatus.paymentLinkSent": "Link de pago también enviado a tu WhatsApp",
};

export default esOrder;
