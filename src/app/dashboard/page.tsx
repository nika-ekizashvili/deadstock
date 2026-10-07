import { redirect } from "next/navigation";

/** Old URL: the shop dashboard lives at /dash. */
export default function DashboardRedirect() {
  redirect("/dash");
}
