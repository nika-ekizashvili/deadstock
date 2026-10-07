import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SavedView } from "./SavedView";
import s from "./saved.module.css";

export const metadata: Metadata = { title: "შენახული · DEADSTOCK.ge" };

/** Saved items (handoff: Saved-375, Saved-1440, Empty-States → SAVED · EMPTY). Ids live in this browser. */
export default function SavedPage() {
  return (
    <>
      <div className={s.desk}>
        <Header />
      </div>
      <SavedView />
      <div className={s.desk}>
        <Footer />
      </div>
    </>
  );
}
