import { CalendarClock, CreditCard, Repeat, ShieldCheck, Smartphone } from "lucide-react";

import { cn } from "@/lib/utils";

import { GlassIcon } from "./glass-icon";

/*
  Only what checkout really offers (Razorpay): cards, UPI and net banking on
  every order; card EMI where the buyer's card supports it; and autopay —
  a card or a bank mandate — for subscriptions, which is all a recurring
  charge can use.
*/
const OPTIONS = [
  { icon: CreditCard, glass: "card", title: "Credit & debit cards", body: "Visa, Mastercard and RuPay." },
  { icon: CalendarClock, glass: "emi", title: "Easy EMIs", body: "Split pay-per-project work into monthly instalments on eligible cards." },
  { icon: Smartphone, glass: "phone", title: "UPI & net banking", body: "Pay from any bank or UPI app in seconds." },
  { icon: Repeat, glass: "repeat", title: "Autopay for subscriptions", body: "Renews on your card or bank mandate until you cancel." },
] as const;

const GRADIENT = "linear-gradient(100deg, #8b5cf6 0%, #c066d9 30%, #f2607e 65%, #f5923e 100%)";

/**
 * THE PROMISE, AS ITS OWN LINE (Genesis, 2 Oct 2026: "this should be the hero
 * of the section and also be written on all the product pop-up windows").
 * The headline of the ways-to-pay block, and the banner near the top of
 * every homepage offer pop-up.
 */
export function NoTransferPromise({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 rounded-panel border border-brand/30 bg-brand/[0.06] px-4 py-3 sm:px-5",
        className,
      )}
    >
      <GlassIcon name="card" className="size-9 shrink-0" />
      <span className="text-pretty">
        <span className="block bg-clip-text font-sans text-lead leading-snug text-transparent" style={{ backgroundImage: GRADIENT }}>
          Most agencies want a bank transfer upfront. We don&rsquo;t.
        </span>
        <span className="mt-0.5 block text-[0.75rem] leading-snug text-ash">
          Pay by card, UPI or net banking, in EMIs on eligible cards, or on autopay.
        </span>
      </span>
    </p>
  );
}

/**
 * HOW YOU CAN PAY, AS A SELLING POINT (Genesis, 2 Oct 2026: "we give you the
 * flexibility of credit card and other payment options very few agencies
 * might give you"). Most agencies invoice and wait for a bank transfer;
 * Genesis checks out like a shop. Four small icons and a line each, and the
 * Razorpay mark that makes it safe.
 *
 * `compact` is the cart's version: the icons and titles only, in two
 * columns, under the pay button.
 */
export function PaymentOptions({ compact = false, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        <ul className="grid grid-cols-2 gap-2">
          {OPTIONS.map(({ icon: Icon, title }) => (
            <li key={title} className="flex items-center gap-2 text-[0.75rem] leading-snug text-ash">
              <Icon className="size-3.5 shrink-0 text-brand-ink" aria-hidden />
              {title}
            </li>
          ))}
        </ul>
        <p className="flex items-center gap-1.5 text-[0.75rem] text-faint">
          <ShieldCheck className="size-3.5" aria-hidden />
          Secure checkout by Razorpay. A receipt for every payment.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-panel border border-[var(--glass-border)] bg-ink/60 p-5 sm:p-6", className)}>
      {/* The promise is the headline; how to pay sits under it. */}
      <h3
        className="max-w-3xl text-balance bg-clip-text font-display text-h3 font-normal leading-tight tracking-tight text-transparent sm:text-h2"
        style={{ backgroundImage: GRADIENT }}
      >
        Most agencies want a bank transfer upfront. We don&rsquo;t.
      </h3>
      <p className="mt-2 text-body text-ash">Pay the way that suits your business.</p>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OPTIONS.map(({ glass, title, body }) => (
          <li key={title} className="flex items-start gap-3">
            <GlassIcon name={glass} className="size-11" />
            <span>
              <span className="block text-small text-bone">{title}</span>
              <span className="mt-0.5 block text-pretty text-[0.75rem] leading-snug text-ash">{body}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 flex items-center gap-1.5 border-t border-[var(--glass-border)] pt-4 text-[0.75rem] text-faint">
        <ShieldCheck className="size-3.5" aria-hidden />
        Secure checkout by Razorpay. A receipt for every payment.
      </p>
    </div>
  );
}
