import { describe, expect, it } from "vitest";
import { parseCaption } from "./caption";
import { buildSearchText, normalizeSearch } from "@/lib/translit";

describe("parseCaption (real captions from Tbilisi shops)", () => {
  it("junktofunkk: labelled English, reserved", () => {
    const p = parseCaption(
      "Pepe Jeans leather jacket\n\nSize XS\nPrice: 220\nRESERVED\n\n📌 შეგიძლიათ ისარგებლოთ Bog განვადებით ან ნაწილ-ნაწილ გადახდის მეთოდით\n\n📍Egnate Ninoshvili Street 1📍",
    );
    expect(p).toMatchObject({
      title: "Pepe Jeans leather jacket",
      size: "XS",
      priceGel: 220,
      brand: "Pepe Jeans",
      category: "outerwear",
      status: "reserved",
    });
  });

  it("secon_dlifebagss: Georgian bullets, sold", () => {
    const p = parseCaption(
      "❌გაიყიდა\n▫️ბრენდი✅\n▫️მდგომარეობა: 10/10\n▫️ზომა:28x44\n▫️ფასი:27  ლარი",
    );
    expect(p).toMatchObject({ priceGel: 27, size: "28x44", condition: "10/10", status: "sold" });
  });

  it("supa.thrifts: bare price line", () => {
    const p = parseCaption("Adidas anorak jacket\n\nSize L\n110");
    expect(p).toMatchObject({ title: "Adidas anorak jacket", size: "L", priceGel: 110, brand: "Adidas", status: "available" });
  });

  it("ghetto_archive: dash labels, no title", () => {
    const p = parseCaption("Price - 350\nSize - L");
    expect(p).toMatchObject({ title: null, priceGel: 350, size: "L", status: "available" });
  });

  it("theregularthrift: address line is not the title", () => {
    const p = parseCaption("Vintage Leather Bomber Jacket \nSize - 2XL\nPrice - 345\n📍Ivane Javakhishvili 64/3");
    expect(p).toMatchObject({ title: "Vintage Leather Bomber Jacket", size: "2XL", priceGel: 345, category: "outerwear" });
  });

  it("currency symbol", () => {
    expect(parseCaption("Nike hoodie M 45₾").priceGel).toBe(45);
  });

  it("empty caption", () => {
    expect(parseCaption(null)).toMatchObject({ title: null, priceGel: null, status: "available" });
  });
});

describe("transliteration search", () => {
  it("kaba matches კაბა", () => {
    expect(buildSearchText(["ლამაზი კაბა"])).toContain("kaba");
    expect(normalizeSearch("კაბა")).toBe("kaba");
  });
});
