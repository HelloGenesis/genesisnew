"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { NichePicker } from "./niche-picker";

/**
 * The influencer database's Category cell (Genesis, 26 Oct 2026): pick any
 * number from the list or add your own; saved when the list closes.
 */
export function NicheCell({ value, save }: { value: string[]; save: (value: string) => Promise<{ ok: boolean; message?: string }> }) {
  const router = useRouter();
  const [picked, setPicked] = useState(value);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const done = (next: string[]) => {
    if (next.join(", ") === value.join(", ")) return;
    start(async () => {
      const result = await save(next.join(", "));
      if (!result.ok) return setError(result.message ?? "Not saved.");
      setError("");
      router.refresh();
    });
  };
  return (
    <span className={`block ${pending ? "opacity-60" : ""}`}>
      <NichePicker compact value={picked} onChange={setPicked} onDone={done} label="Category" />
      {error && <span role="alert" className="mt-1 block text-[0.75rem] text-[#dc2626]">{error}</span>}
    </span>
  );
}
