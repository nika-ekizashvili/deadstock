import { TabBar } from "@/components/TabBar";
import { env } from "@/env";

/** Shopper-facing pages: mobile tab bar on every screen. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TabBar appUrl={env().APP_URL} />
    </>
  );
}
