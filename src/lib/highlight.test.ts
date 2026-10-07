import { describe, expect, it } from "vitest";
import { highlight } from "./highlight";

const hits = (text: string, q: string) => highlight(text, q).filter((s) => s.hit).map((s) => s.text);

describe("highlight", () => {
  it("marks a Latin match case-insensitively", () => {
    expect(hits("Carhartt Detroit Jacket", "jacket")).toEqual(["Jacket"]);
  });
  it("matches Georgian text from a Latin query", () => {
    expect(hits("ზაფხულის კაბა", "kaba")).toEqual(["კაბა"]);
  });
  it("marks every term of a multi-word query", () => {
    expect(hits("Nike Air Max 95", "nike max")).toEqual(["Nike", "Max"]);
  });
  it("returns the whole text unmarked without a query", () => {
    expect(highlight("Levi's 501", undefined)).toEqual([{ text: "Levi's 501", hit: false }]);
  });
});
