import { connection } from "next/server";
import { TabBar } from "@/components/TabBar";
import { env } from "@/env";

/** Shopper-facing pages: mobile tab bar on every screen. */
export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // Runtime env (APP_URL) — without this `next build` prerenders the layout with no env set.
  await connection();
  return (
    <>
      {children}
      <TabBar appUrl={env().APP_URL} />
    </>
  );
}
