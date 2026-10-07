import { normalizeSearch, toLatin } from "@/lib/translit";

export type Segment = { text: string; hit: boolean };

/**
 * Split `text` into hit / non-hit segments for the search query, matching across scripts
 * the same way search does ("kaba" lights up "კაბა"). Each character is transliterated on its own,
 * so a match in the Latin form maps back to whole original characters.
 */
export function highlight(text: string, query: string | undefined): Segment[] {
  const terms = query ? normalizeSearch(query).split(" ").filter((x) => x.length > 1) : [];
  if (!terms.length) return [{ text, hit: false }];

  const chars = [...text];
  let latin = "";
  const owner: number[] = []; // latin index → original char index
  chars.forEach((ch, i) => {
    const l = toLatin(ch.toLowerCase());
    latin += l;
    for (let k = 0; k < l.length; k++) owner.push(i);
  });

  const hit = new Array<boolean>(chars.length).fill(false);
  for (const term of terms) {
    for (let from = latin.indexOf(term); from !== -1; from = latin.indexOf(term, from + 1)) {
      for (let k = from; k < from + term.length; k++) hit[owner[k]] = true;
    }
  }

  const out: Segment[] = [];
  chars.forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && last.hit === hit[i]) last.text += ch;
    else out.push({ text: ch, hit: hit[i] });
  });
  return out;
}
