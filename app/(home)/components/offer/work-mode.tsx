"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { ONE_TIME_GRADIENT, PLANS_GRADIENT } from "./tier-colors";

export type WorkModeValue = "one-time" | "membership";

const Context = createContext<{ mode: WorkModeValue; setMode: (mode: WorkModeValue) => void } | null>(null);

/**
 * ONE CHOICE FOR THE WHOLE PAGE. Picking "One-Time Projects" on the AI tab
 * and then opening Studios should still show one-time projects, so the
 * choice lives above the tabs rather than in each one.
 */
export function WorkModeProvider({ children, initial = "membership" }: { children: ReactNode; initial?: WorkModeValue }) {
  const [mode, setMode] = useState<WorkModeValue>(initial);
  /* A link elsewhere on the page can pick the mode too: `data-work-mode="one-time"`. */
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const value = (event.target as Element | null)?.closest?.("[data-work-mode]")?.getAttribute("data-work-mode");
      if (value === "one-time" || value === "membership") setMode(value);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return <Context.Provider value={{ mode, setMode }}>{children}</Context.Provider>;
}

/** The page's choice, for anything outside the switch that should follow it. */
export function useWorkMode() {
  return useContext(Context);
}

/**
 * SUBSCRIPTION DETAILS THAT LIVE OUTSIDE THE SWITCH (Genesis, 2 Oct 2026:
 * "when toggled to PPP on each vertical it should disappear and only appear
 * when subscriptions are clicked"). Shown only while Subscriptions is the
 * page's choice; on a page with no shared choice it simply shows.
 */
export function SubscriptionOnly({ children }: { children: ReactNode }) {
  const shared = useContext(Context);
  if (shared && shared.mode !== "membership") return null;
  return <>{children}</>;
}

const OPTIONS: { value: WorkModeValue; label: string; hint: string; gradient: string }[] = [
  { value: "one-time", label: "Pay-per-project", hint: "Buy once. No subscription.", gradient: ONE_TIME_GRADIENT },
  { value: "membership", label: "Subscriptions", hint: "A monthly creative team.", gradient: PLANS_GRADIENT },
];

/**
 * "CHOOSE HOW YOU WANT TO WORK" (Genesis, 28 Sep 2026): a switch between a
 * division's one-time products and its memberships, on /pricing. Each side
 * wears its own colours — the one-time violet-to-coral, the plans' sweep —
 * so the switch says which world a reader is in before they read a word.
 */
export function WorkMode({
  oneTime,
  membership,
  controls,
  note,
}: {
  oneTime: ReactNode;
  membership: ReactNode;
  /** Beside the switch while Membership is chosen — the /pricing hub's billing switch. */
  controls?: ReactNode;
  /** Appended to the Membership line — "Paid upfront for 3 months." */
  note?: ReactNode;
}) {
  const shared = useContext(Context);
  const [own, setOwn] = useState<WorkModeValue>("membership");
  const mode = shared?.mode ?? own;
  const setMode = shared?.setMode ?? setOwn;
  const reduce = useReducedMotion();
  const labelId = useId();

  return (
    <div className="mt-6">
      {/*
        IN THE MIDDLE (Genesis, 28 Sep 2026), and ONE ROW (29 Sep 2026): the
        way of working and — for memberships — the billing, side by side
        under the division cards, with one line saying what the pair means.
        The prices are then the next thing down.
      */}
      <p id={labelId} className="sr-only">
        Choose how you want to work
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2.5">
        <div
          role="radiogroup"
          aria-labelledby={labelId}
          className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--hover-wash)] p-1 sm:w-auto sm:max-w-none"
        >
          {OPTIONS.map((option) => {
            const selected = mode === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                data-track={`work-mode:${option.value}`}
                onClick={() => setMode(option.value)}
                className={cn(
                  "min-h-10 whitespace-nowrap rounded-full px-2.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5 sm:text-small",
                  selected ? "text-white shadow-[0_8px_24px_-10px_rgb(139_92_246/0.6)]" : "text-ash hover:text-bone",
                )}
                style={selected ? { background: option.gradient } : undefined}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {mode === "membership" && controls}
      </div>
      <p className="mt-2 text-center text-[0.8125rem] text-ash">
        {OPTIONS.find((option) => option.value === mode)?.hint}
        {mode === "membership" && note && <span className="text-faint"> · {note}</span>}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          className="mt-5"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {mode === "one-time" ? oneTime : membership}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
