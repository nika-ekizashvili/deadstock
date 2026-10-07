import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono, Noto_Sans_Georgian } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-archivo" });
const georgian = Noto_Sans_Georgian({ subsets: ["georgian"], axes: ["wdth"], variable: "--font-georgian" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "DEADSTOCK.ge",
  description: "თბილისის Instagram თრიფთ მაღაზიები ერთ ადგილას",
};

export const viewport: Viewport = {
  themeColor: "#0e0e0e",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ka" className={`${archivo.variable} ${georgian.variable} ${mono.variable}`}>
      <body>
        {children}
        {/* Film grain (handoff: .ds-grained) — one fixed overlay, never catches clicks */}
        <div className="ds-grain" aria-hidden="true" />
        <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
          <filter id="ds-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </svg>
      </body>
    </html>
  );
}
