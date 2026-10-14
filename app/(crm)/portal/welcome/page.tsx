import { redirect } from "next/navigation";

/** Replaced by My account (cart, purchases, portals in one place); old links land there. */
export default function WelcomePage() {
  redirect("/account");
}
