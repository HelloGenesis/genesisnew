"use client";

import { useCallback, useEffect, useState } from "react";

import { finishTour } from "@/app/(crm)/tour-actions";

import { TourInvite, TryItCard } from "./app-tour";
import { findTarget, TourOverlay, type TourStep } from "./tour-overlay";

/*
 * NOVA COPILOT'S TOUR (Genesis, 31 Oct 2026: "tours for … copilot; after
 * it, ask them to try it themselves"). Offered the first time someone opens
 * Copilot, and from "How it works": every control in the chat, then example
 * requests to try, each opening Copilot with it typed in.
 */
const STEPS: TourStep[] = [
  { title: "Nova Copilot", body: "The AI that works inside the CRM with you. Ask in plain words and it does the work: makes quotes and influencer plans, adds leads, clients and tasks, finds creators, answers questions about your data. It works with your own permissions, and adds and updates but never deletes anything or messages anyone." },
  { target: 'textarea[aria-label="Message"]', title: "Ask it anything", body: "Type what you need, as you'd ask a colleague: “Make an influencer plan for Bloom Foods, 10 food creators in Mumbai under ₹50,000 each”. Paste screenshots straight in. Enter sends; Shift+Enter starts a new line." },
  { target: 'button[aria-label="Attach or start over"]', title: "Attach files", body: "Screenshots of creator profiles, a vendor's costing in Excel, a brief as a PDF: it reads them and fills the quote, plan or records. The same menu opens Connectors and starts a new chat." },
  { target: 'button[aria-label^="Mode:"]', title: "How hard it thinks", body: "Quick answer for simple questions and lookups, Balanced for most work, Deep think for long plans, big sheets or tricky pricing. Deeper is slower and costs more." },
  { target: 'button[aria-label^="Connectors"]', title: "Connectors", body: "What it can reach: Google (Gmail, Drive, Sheets), Razorpay, email, the ChatGPT / Claude connector, and any apps your admin adds. Each shows whether it is on." },
  { target: 'button[aria-label="Voice typing"]', title: "Speak instead", body: "Talk and it types what you say into the box; check it and send." },
  { target: "text:Shortcuts", title: "Shortcuts", body: "Ready-made starts for the common jobs: a quote from a vendor's costing, a plan from screenshots, finding creators, adding a lead or a task. Each fills the box for you to finish." },
  { target: "text:Your chats", title: "Your chats", body: "Every conversation is kept here, yours only. Open one to carry on where you left off; the plans and quotes it made are saved in the CRM either way." },
  { target: 'button[aria-label="Full screen"]', title: "Full screen", body: "More room for long answers and big plans. Esc comes back." },
  { target: "text:Your usage this month", title: "What it costs", body: "What you've used this month, in US dollars as Anthropic bills it. The full breakdown is on AI usage." },
];

const TRY = [
  { label: "Make an influencer plan", prompt: "Make an influencer plan for <brand>: <how many> creators in <city>, <niche>, under ₹<budget> each." },
  { label: "Quote from a costing", prompt: "Make a price quote for <client> from this vendor costing, adding 30% to each line: " },
  { label: "Find creators", prompt: "Find fitness creators in Delhi with 50K–300K followers and a phone number, not contacted in the last 30 days." },
  { label: "Add a lead and a task", prompt: "Add a lead: <name> from <company>, wants <what>. Remind me to follow up on Friday." },
];

export function CopilotTour({ firstTime }: { firstTime: boolean }) {
  const [stage, setStage] = useState<"idle" | "invite" | "tour" | "try">("idle");
  const [steps, setSteps] = useState<TourStep[]>([]);
  const start = useCallback(() => {
    setSteps(STEPS.filter((s) => !s.target || findTarget(s.target)));
    setStage("tour");
  }, []);
  useEffect(() => {
    if (!firstTime) return;
    const t = window.setTimeout(() => setStage("invite"), 700);
    return () => window.clearTimeout(t);
  }, [firstTime]);
  /* "How it works" for Copilot: any element with data-copilot-tour starts it. */
  useEffect(() => {
    const open = (e: Event) => (e.target as HTMLElement).closest("[data-copilot-tour]") && start();
    document.addEventListener("click", open);
    return () => document.removeEventListener("click", open);
  }, [start]);
  const end = (then: "idle" | "try") => {
    void finishTour("copilot");
    setStage(then);
  };

  if (stage === "invite") return <TourInvite product="Nova Copilot" what="Two minutes: what it can do for you, every button in the chat, and a few things to try." onStart={start} onSkip={() => end("idle")} />;
  if (stage === "tour" && steps.length) return <TourOverlay steps={steps} onClose={() => end("idle")} onDone={() => end("try")} startLabel="Show me" />;
  if (stage === "try")
    return (
      <TryItCard
        title="Now try it yourself"
        body="Pick one: it opens Copilot with the request written out. Change the parts in <brackets> and send."
        actions={TRY.map((t) => ({ href: `/admin/assistant?prompt=${encodeURIComponent(t.prompt)}`, label: t.label }))}
        onClose={() => setStage("idle")}
      />
    );
  return null;
}
