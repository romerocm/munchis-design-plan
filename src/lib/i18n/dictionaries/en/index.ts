import common from "./common";
import storefront from "./storefront";
import order from "./order";

const en = { ...common, ...storefront, ...order } as const;

export type DictionaryKeys = keyof typeof en;
export default en;
