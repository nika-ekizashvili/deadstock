import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icons";
import { getSession } from "@/lib/session";
import s from "./sell.module.css";

export const metadata: Metadata = { title: "DEADSTOCK — SELL" };

/** Shop sign-in strings (Georgian; shop side is ka-only). To be merged into lib/copy.ts. */
const T = {
  home: "DEADSTOCK — მთავარი",
  kicker: "SELL ON DEADSTOCK",
  h1a: "Instagram დააკავშირე.",
  h1b: "დანარჩენს ჩვენ ვიზამთ.",
  onlyA: "მხოლოდ ",
  onlyB: " ანგარიში",
  connect: "დაკავშირება",
  back: "← უკან",
  errPersonal: "Business / Creator?",
  errFailed: "Instagram-თან დაკავშირება ვერ მოხერხდა. სცადე თავიდან.",
};

const INFO = "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 11v5M12 8h.01";
const ALERT = "M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7v6M12 16.5h.01";

/** Decorative tiles (SignIn-1440; the first three are the mobile row). */
const TILES = [
  { tone: "#3A332C" },
  { tone: "#B9B0A2", price: "220 ₾" },
  { tone: "#2C363B" },
  { tone: "#4A2F2A", price: "35 ₾" },
  { tone: "#6B5A4C" },
  { tone: "#2F3B2E", price: "310 ₾" },
];

export default async function Sell({ searchParams }: PageProps<"/sell">) {
  if (await getSession()) redirect("/dash");
  const { error } = await searchParams;
  const code = Array.isArray(error) ? error[0] : error;

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerInner}>
          <Link href="/" className={`ds-logo ${s.logo}`} aria-label={T.home}>
            <span className="ds-logo__mark">DEADSTOCK</span>
            <span className="ds-logo__tld">.ge</span>
          </Link>
        </div>
      </header>

      <main className={s.main}>
        <div aria-hidden="true" className={s.tiles}>
          {TILES.map((t, i) => (
            <div key={i} className={s.tile} style={{ ["--tone" as string]: t.tone }}>
              {t.price && <span className={s.tag}>{t.price}</span>}
            </div>
          ))}
        </div>

        <div className={s.copy}>
          <span className={s.kicker}>{T.kicker}</span>
          <h1 className={s.h1}>
            {T.h1a}
            <br />
            <span className={s.lime}>{T.h1b}</span>
          </h1>
          <div className={s.info}>
            <Icon d={INFO} size={18} className={s.infoIcon} />
            <span>
              {T.onlyA}
              <strong>Business</strong> / <strong>Creator</strong>
              {T.onlyB}
            </span>
          </div>
          <div className={s.actions}>
            {/* GET route that starts the Instagram OAuth flow — a plain link, not a client-side navigation */}
            <a href="/api/instagram/connect" className={`ds-btn ds-p ${s.connect}`}>
              {T.connect}
              <Icon d="M5 12h14M13 6l6 6-6 6" size={18} strokeWidth={2.5} />
            </a>
            {code && (
              <p role="alert" className={s.error}>
                <Icon d={ALERT} size={18} className={s.errIcon} />
                <span>{code === "personal" ? T.errPersonal : T.errFailed}</span>
              </p>
            )}
          </div>
          <Link href="/" className={s.back}>
            {T.back}
          </Link>
        </div>
      </main>
    </div>
  );
}
