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

const OPTIONS: { value: WorkModeValue; label: string; hint: string; gradient: string }[] = [
  { value: "one-time", label: "One-Time Projects", hint: "Buy once. No subscription.", gradient: ONE_TIME_GRADIENT },
  { value: "membership", label: "Membership", hint: "A monthly creative team.", gradient: PLANS_GRADIENT },
];

/**
 * "CHOOSE HOW YOU WANT TO WORK" (Genesis, 28 Sep 2026): a switch between a
 * division's one-time products and its memberships, on /pricing. Each side
 * wears its own colours — the one-time violet-to-coral, the plans' sweep —
 * so the switch says which world a reader is in before they read a word.
 */
export function WorkMode({ oneTime, membership }: { oneTime: ReactNode; membership: ReactNode }) {
  const shared = useContext(Context);
  const [own, setOwn] = useState<WorkModeValue>("membership");
  const mode = shared?.mode ?? own;
  const setMode = shared?.setMode ?? setOwn;
  const reduce = useReducedMotion();
  const labelId = useId();

  return (
    <div className="mt-10">
      {/* IN THE MIDDLE (Genesis, 28 Sep 2026): the heading, the switch and its line, centred. */}
      <div className="flex flex-col items-center gap-4 text-center">
        <p id={labelId} className="font-sans text-lead text-bone">
          Choose how you want to work
        </p>
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
                  "min-h-11 whitespace-nowrap rounded-full px-2.5 text-[0.8125rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-6 sm:text-small",
                  selected ? "text-white shadow-[0_8px_24px_-10px_rgb(139_92_246/0.6)]" : "text-ash hover:text-bone",
                )}
                style={selected ? { background: option.gradient } : undefined}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <p className="mt-2 text-center text-small text-ash">{OPTIONS.find((option) => option.value === mode)?.hint}</p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          className="mt-8"
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
