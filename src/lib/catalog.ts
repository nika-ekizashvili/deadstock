/** Categories, display helpers and shop colours shared by every listing view. */

/** Category values match `guessCategory` in lib/parse/caption.ts. Icons from the handoff screens. */
export const CATEGORIES = [
  { value: "", name: "ყველა", one: "", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { value: "outerwear", name: "ქურთუკები", one: "ქურთუკი", icon: "M8 3 4 6v15h5v-9M16 3l4 3v15h-5v-9M8 3l4 4 4-4M12 7v14" },
  { value: "tops", name: "მაისურები", one: "მაისური", icon: "M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3c0 2-2 3-4 3S8 5 8 3z" },
  { value: "jeans", name: "ჯინსები", one: "ჯინსი", icon: "M6 3h12l1 18h-5l-2-11-2 11H5zM6 7h12M9 7v2M15 7v2" },
  { value: "pants", name: "შარვლები", one: "შარვალი", icon: "M7 3h10l1 18h-4l-2-12-2 12H6z" },
  { value: "dresses", name: "კაბები", one: "კაბა", icon: "M9 3h6l-1 5 5 13H5l5-13zM10 3l2 3 2-3" },
  { value: "skirts", name: "ქვედაბოლოები", one: "ქვედაბოლო", icon: "M7 5h10l3 15H4zM7 8h10" },
  { value: "shoes", name: "ფეხსაცმელი", one: "ფეხსაცმელი", icon: "M3 18v-5l5-6 3 3 3-1 7 6v3zM3 18h18M8 13l1 1M11 12l1 1" },
  { value: "bags", name: "ჩანთები", one: "ჩანთა", icon: "M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2" },
  { value: "accessories", name: "აქსესუარები", one: "აქსესუარი", icon: "M2 10h20M4 10a3 3 0 1 0 6 0M14 10a3 3 0 1 0 6 0" },
  { value: "vinyl", name: "ვინილი", one: "ვინილი", icon: "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6z" },
  { value: "electronics", name: "ელექტრონიკა", one: "ელექტრონიკა", icon: "M4 15v-3a8 8 0 0 1 16 0v3M4 15h3v5H4zM17 15h3v5h-3z" },
] as const;

export const SIZES = ["XS", "S", "M", "L", "XL"] as const;
export const MAX_PRICES = [50, 100, 200, 500] as const;

const categoryOne = (c: string | null) => CATEGORIES.find((x) => x.value === c)?.one || null;

/** Card title: caption title, else "brand · category", else an em dash (shown muted). */
export function displayTitle(l: { title: string | null; brand: string | null; category: string | null }) {
  if (l.title) return { text: l.title, fallback: false };
  const alt = [l.brand, categoryOne(l.category)].filter(Boolean).join(" · ");
  return { text: alt || "—", fallback: true };
}

/** "220 ₾", or "? ₾" when the caption had no price. */
export function priceText(priceGel: string | number | null) {
  return priceGel != null && priceGel !== "" ? `${Number(priceGel)} ₾` : "? ₾";
}

/** Shop colour used when there is no avatar (palette from the handoff screens). */
const SHOP_TONES = ["#C9A27A", "#6F8FA6", "#8E9B6A", "#B07A6E", "#A39783", "#7A6E60"];
export function shopTone(slug: string) {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return SHOP_TONES[h % SHOP_TONES.length];
}
