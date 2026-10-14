"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { getViewer } from "@/lib/crm/session";
import { getPrisma } from "@/lib/db";
import { hintValue, SIGNED_IN_HINT, SIGNED_IN_HINT_MAX_AGE } from "@/lib/signed-in-hint";

/**
 * "WHAT SHOULD WE CALL YOU?" (Genesis, 14 Oct 2026: "Hi [name], welcome to
 * Genesis, all across"). Someone who signed in with an email code has no name
 * on file; they give it once on My account, and every greeting uses it.
 */
export async function saveName(form: FormData) {
  const viewer = await getViewer();
  if (!viewer) return;
  const name = String(form.get("name") ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
  if (!name) return;
  await getPrisma().user.update({ where: { id: viewer.id }, data: { name } });
  (await cookies()).set(SIGNED_IN_HINT, hintValue(name), { path: "/", maxAge: SIGNED_IN_HINT_MAX_AGE, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  revalidatePath("/account");
}
