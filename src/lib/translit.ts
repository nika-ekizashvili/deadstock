/** Georgian (Mkhedruli) → Latin, so "kaba" finds "კაბა" and vice versa. */
const MAP: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k",
  ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u",
  ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts",
  ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

export function toLatin(s: string): string {
  return [...s].map((ch) => MAP[ch] ?? ch).join("");
}

/** Normalised text for search: lower-case, Latin transliteration, single spaces. */
export function normalizeSearch(s: string): string {
  return toLatin(s.toLowerCase())
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Text stored on a listing: original + transliterated, so both scripts match. */
export function buildSearchText(parts: (string | null | undefined)[]): string {
  const joined = parts.filter(Boolean).join(" ").toLowerCase();
  return `${joined} ${normalizeSearch(joined)}`.replace(/\s+/g, " ").trim();
}
