import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { cookies } from "next/headers";
import { cache } from "react";

/**
 * NOVA'S LIVE DEMO (Genesis, 31 Oct 2026: "our real dashboard interface,
 * usable … not all the backend features but just the interface; what you see
 * is what you get"). /demo signs a visitor in as the demo agency's admin
 * (lib/crm/demo-seed: Northstar Collective, every record made up), so they
 * click through the real CRM, in its own agency workspace like any agency's.
 *
 * READ ONLY. The proxy refuses every request from a demo visitor that would
 * change something (proxy.ts), and Google, Drive, Razorpay, email and the AI
 * refuse to be called while one is looking (assertNotDemo). Someone actually
 * signed in is never the demo, whatever cookies they have.
 */

export const DEMO_COOKIE = "nova_demo";
export const DEMO_SUB = "demo|nova";
export const DEMO_EMAIL = "riya@northstar.example";
export const DEMO_AGENCY = "Northstar Collective";

export class DemoReadOnly extends Error {
  constructor() {
    super("This is the Nova demo, so nothing is saved. Book a trial to use it for real.");
    this.name = "DemoReadOnly";
  }
}

const allowed = new AsyncLocalStorage<boolean>();
/** Lets the demo's own setup run (lib/crm/demo-seed), even from a demo visitor's request. */
export const withDemoWrites = <T>(fn: () => Promise<T>) => allowed.run(true, fn);

export async function hasDemoCookie() {
  try {
    return (await cookies()).get(DEMO_COOKIE)?.value === "1";
  } catch {
    /* Not in a request: a job or a script. */
    return false;
  }
}

const demoRequest = cache(async () => {
  if (!(await hasDemoCookie())) return false;
  const { currentIdentity } = await import("./session");
  return (await currentIdentity())?.sub === DEMO_SUB;
});

/** True while a demo visitor's request runs. */
export async function demoActive() {
  if (allowed.getStore()) return false;
  return demoRequest();
}

/** Refuses anything with a side effect outside the CRM in the demo. */
export async function assertNotDemo() {
  if (await demoActive()) throw new DemoReadOnly();
}
