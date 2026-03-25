export interface ToastVariant {
  message: string;
  submessage: string;
}

export type ToastType = "order" | "low-stock" | "sold-out";

export interface ToastEvent {
  id: string;
  type: ToastType;
  message: string;
  submessage: string;
}

const ORDER_VARIANTS: ToastVariant[] = [
  { message: "\u00a1Otra m\u00e1s que vuela! \ud83d\udcb8", submessage: "Alguien se llev\u00f3 una {flavor}" },
  { message: "\u00a1Pum! Reservada \ud83d\udd25", submessage: "{flavor} tiene nuevo due\u00f1o" },
  { message: "Esa ya tiene nombre \ud83d\udc40", submessage: "Una {flavor} menos en el drop" },
  { message: "\u00a1Se mueve r\u00e1pido! \ud83d\udca8", submessage: "Acaban de apartar una {flavor}" },
  { message: "\u00a1\u00d1am! Una menos \ud83d\ude0b", submessage: "{flavor} reci\u00e9n apartada" },
  { message: "Alguien sabe lo que quiere \ud83d\ude0f", submessage: "Una {flavor} fue reclamada" },
];

const LOW_STOCK_VARIANTS: ToastVariant[] = [
  { message: "Quedan poquitas \ud83d\udc40", submessage: "Solo {n} disponibles" },
  { message: "Esto se pone serio \ud83d\ude2c", submessage: "Quedan {n} y contando..." },
  { message: "\u00bfSer\u00e1 que alcanzas? \ud83c\udfc3", submessage: "Solo quedan {n}" },
  { message: "\u00daltimas llamadas \ud83d\udd14", submessage: "Solo {n} m\u00e1s" },
];

const SOLD_OUT_VARIANTS: ToastVariant[] = [
  { message: "\u00a1Se acab\u00f3! \ud83c\udfac", submessage: "{flavor} oficialmente agotada" },
  { message: "Volaron todas \ud83d\udd4a\ufe0f", submessage: "El drop se cerr\u00f3" },
  { message: "Too late, bestie \ud83d\udc85", submessage: "Sold out" },
  { message: "Fin. \ud83d\udcb8", submessage: "No queda ni una" },
];

let lastOrderIdx = -1;
let lastLowStockIdx = -1;
let lastSoldOutIdx = -1;

function pickRandom(variants: ToastVariant[], lastIdx: number): [ToastVariant, number] {
  let idx: number;
  do {
    idx = Math.floor(Math.random() * variants.length);
  } while (idx === lastIdx && variants.length > 1);
  return [variants[idx], idx];
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

export function getRandomOrderToast(flavor: string): Omit<ToastEvent, "id"> {
  const [variant, idx] = pickRandom(ORDER_VARIANTS, lastOrderIdx);
  lastOrderIdx = idx;
  return {
    type: "order",
    message: variant.message,
    submessage: interpolate(variant.submessage, { flavor }),
  };
}

export function getRandomLowStockToast(n: number): Omit<ToastEvent, "id"> {
  const [variant, idx] = pickRandom(LOW_STOCK_VARIANTS, lastLowStockIdx);
  lastLowStockIdx = idx;
  return {
    type: "low-stock",
    message: variant.message,
    submessage: interpolate(variant.submessage, { n }),
  };
}

export function getRandomSoldOutToast(flavor: string): Omit<ToastEvent, "id"> {
  const [variant, idx] = pickRandom(SOLD_OUT_VARIANTS, lastSoldOutIdx);
  lastSoldOutIdx = idx;
  return {
    type: "sold-out",
    message: variant.message,
    submessage: interpolate(variant.submessage, { flavor }),
  };
}
