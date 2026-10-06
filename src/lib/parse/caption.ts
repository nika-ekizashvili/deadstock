/**
 * Rule-based caption parser for Instagram thrift posts (Georgian + English).
 * Good enough for the pilot; an LLM pass can replace `parseCaption` later
 * behind the same return type.
 */
import { normalizeSearch } from "@/lib/translit";

export type ParsedStatus = "available" | "reserved" | "sold";

export type ParsedCaption = {
  title: string | null;
  priceGel: number | null;
  size: string | null;
  brand: string | null;
  category: string | null;
  condition: string | null;
  status: ParsedStatus;
};

const SOLD = /\b(sold(\s*out)?)\b|გაიყიდა|გაყიდულია|გაყიდულია/i;
const RESERVED = /\breserved\b|დაჯავშნ/i;

const PRICE_LABELLED = /(?:price|ფასი)\s*[:\-–=]?\s*(\d{1,5}(?:[.,]\d{1,2})?)/i;
const PRICE_CURRENCY = /(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:₾|gel\b|lari\b|ლარი|ლ\.?(?=\s|$))/i;
const PRICE_BARE_LINE = /^\s*(\d{2,5})\s*$/;

const SIZE = /(?:size|ზომა)\s*[:\-–=]?\s*([^\n,|]{1,20})/i;
const CONDITION = /(?:condition|მდგომარეობა)\s*[:\-–=]?\s*([^\n]{1,30})/i;

const LEADING_JUNK = /^[\s\p{Extended_Pictographic}️▫▪•\-–*•▫️]+/u;
const INFO_LINE = /^[📌📍☎📞🚚⏰]|https?:\/\/|instagram\.com|@\w/u;
const LABEL_LINE = /^(price|size|condition|ფასი|ზომა|მდგომარეობა|ბრენდი|brand)\b/i;

export const BRANDS = [
  "Adidas", "Nike", "Puma", "Reebok", "New Balance", "Converse", "Vans", "Fila",
  "Levi's", "Levis", "Wrangler", "Lee", "Diesel", "Pepe Jeans", "Tommy Hilfiger",
  "Calvin Klein", "Ralph Lauren", "Lacoste", "Hugo Boss", "Carhartt", "Dickies",
  "Stussy", "Supreme", "The North Face", "Patagonia", "Columbia", "Champion",
  "Zara", "H&M", "Mango", "Massimo Dutti", "Bershka", "Pull&Bear", "Uniqlo",
  "Gucci", "Prada", "Louis Vuitton", "Chanel", "Dior", "Versace", "Burberry",
  "Moschino", "Dolce & Gabbana", "Armani", "Stone Island", "CP Company",
  "Dr. Martens", "Timberland", "Harley-Davidson", "Schott", "Barbour",
];

const CATEGORY_KEYWORDS: [string, RegExp][] = [
  ["outerwear", /jacket|coat|bomber|parka|anorak|puffer|blazer|ქურთუკ|პალტო/i],
  ["bags", /\bbag\b|bags|backpack|purse|tote|ჩანთ/i],
  ["shoes", /shoe|sneaker|boot|trainer|loafer|heels|ფეხსაცმ|ბოტას|ჩექმ/i],
  ["jeans", /jeans|denim|ჯინს/i],
  ["dresses", /dress|კაბა/i],
  ["skirts", /skirt|ქვედაბოლო|იუბკა/i],
  ["tops", /t-?shirt|tee\b|shirt|blouse|top\b|tank|hoodie|sweater|jumper|cardigan|polo|მაისურ|პერანგ|სვიტერ/i],
  ["pants", /pants|trousers|shorts|joggers|შარვალ/i],
  ["accessories", /belt|hat|cap|scarf|sunglasses|jewel|ring|necklace|earring|wallet|ქამარ|ქუდ/i],
  ["vinyl", /vinyl|\blp\b|record|cassette|\bcd\b|ფირფიტ/i],
  ["electronics", /headphone|iem|speaker|amp|camera|walkman/i],
];

function clean(line: string) {
  return line.replace(LEADING_JUNK, "").trim();
}

function parsePrice(caption: string, lines: string[]): number | null {
  const m = caption.match(PRICE_LABELLED) ?? caption.match(PRICE_CURRENCY);
  const raw = m?.[1] ?? lines.map((l) => l.match(PRICE_BARE_LINE)?.[1]).find(Boolean);
  if (!raw) return null;
  const n = Number(raw.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function findBrand(caption: string): string | null {
  const lower = caption.toLowerCase();
  for (const b of BRANDS) {
    const re = new RegExp(`(^|[^\\p{L}])${b.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "u");
    if (re.test(lower)) return b === "Levis" ? "Levi's" : b;
  }
  return null;
}

export function guessCategory(text: string): string | null {
  const hay = `${text} ${normalizeSearch(text)}`;
  for (const [cat, re] of CATEGORY_KEYWORDS) if (re.test(hay)) return cat;
  return null;
}

export function parseCaption(caption: string | null | undefined): ParsedCaption {
  const text = (caption ?? "").trim();
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean);

  const status: ParsedStatus = SOLD.test(text) ? "sold" : RESERVED.test(text) ? "reserved" : "available";

  const title =
    lines.find(
      (l) =>
        /\p{L}{2,}/u.test(l) &&
        l.length <= 80 &&
        !LABEL_LINE.test(l) &&
        !INFO_LINE.test(l) &&
        !SOLD.test(l) &&
        !RESERVED.test(l) &&
        !PRICE_LABELLED.test(l) &&
        !SIZE.test(l),
    ) ?? null;

  const size = text.match(SIZE)?.[1]?.trim() || null;
  const condition = text.match(CONDITION)?.[1]?.trim() || null;

  return {
    title,
    priceGel: parsePrice(text, lines),
    size,
    brand: findBrand(text),
    category: guessCategory(text),
    condition,
    status,
  };
}
