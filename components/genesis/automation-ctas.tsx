"use client";

import { useState } from "react";

import { FORMS } from "@/lib/forms";
import { GenesisForm } from "./genesis-form";
import { GlassButton } from "./glass-button";
import { Overlay } from "./overlay";

/**
 * The two calls to action under "Automate Your Business with AI".
 *
 * "Start Automating" opens the project form in the site's window-shaped
 * Overlay, over the page, instead of sending the reader down to the bottom
 * of the page. It is the same brand form as the one in the footer — the one
 * with the services question — because an automation enquiry is a project
 * brief, not the four-field quick note. `source` records that it came from
 * here.
 *
 * "Contact Us" is the other road: down to the form at the foot of the page.
 * A BARE "#contact", like AI Lab's library button, so it scrolls in place
 * rather than being a client navigation that re-renders the page.
 */
export function AutomationCtas({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const spec = FORMS.brand;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <GlassButton variant="brand" arrow onClick={() => setOpen(true)}>
          Explore AI Automation
        </GlassButton>
        <GlassButton href="#contact" variant="glass" arrow>
          Talk to Us
        </GlassButton>
      </div>

      <Overlay open={open} label="Start automating" onClose={() => setOpen(false)}>
        <header className="mb-6 flex flex-col gap-2">
          <p className="micro-label !text-brand">Genesis AI Lab</p>
          <h2 className="text-balance text-h3 font-normal leading-[1.08] tracking-tight text-bone sm:text-h2">
            {spec.title}
          </h2>
          <p className="text-pretty text-small leading-relaxed text-ash">{spec.blurb}</p>
        </header>
        <GenesisForm
          kind="brand"
          source="ai-automation:start-automating"
          compact
          panel={false}
        />
      </Overlay>
    </div>
  );
}
