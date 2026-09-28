"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

import { GenesisMark } from "@/components/genesis/genesis-mark";
import { GlassButton } from "@/components/genesis/glass-button";
import { MembershipCard } from "@/components/genesis/membership-card";
import { bookingCalendar, bookingUrl, slotHref } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const DAY = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });

/**
 * THE 15-MINUTE CALL, AT THE HEAD OF EVERY FOOTER — "ADD A CALENDAR ON ALL THE
 * FOOTERS (KEEP THIS SAME EVERYWHERE)", drawn after the reference's
 * month-grid-and-times layout, with the Genesis mark where the reference had
 * its illustration.
 *
 * WHAT A PICK DOES. Genesis has not sent a booking calendar yet, so nothing
 * here reserves anything: choosing a day and a time and pressing the button
 * opens WhatsApp with that slot written into the message, which is how every
 * other contact CTA on the site behaves. The moment `bookingUrl` is set in
 * lib/pricing, the button opens that calendar instead.
 *
 * THE DAYS ARE WORKED OUT IN THE BROWSER, after mount. The server has no idea
 * what "today" is for the reader, and rendering a month grid on the server
 * would put yesterday's date in the HTML of a cached page. Until then the
 * panel holds its size with an empty grid, so nothing shifts.
 */
const noop = () => () => {};

export function BookingCalendar() {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return (
    <div
      id="contact"
      className="glass glass-strong glass-lit relative mb-6 grid scroll-mt-24 overflow-hidden rounded-panel lg:grid-cols-[1fr_1.05fr]"
    >
      <Pitch />
      <div className="min-h-[26rem] border-t border-white/10 p-5 sm:p-8 lg:border-l lg:border-t-0">
        {mounted && <Picker />}
      </div>
    </div>
  );
}

function Picker() {
  const [today] = useState(() => startOfDay(new Date()));
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [day, setDay] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  const cells = useMemo(() => monthCells(month), [month]);
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const bookable = (date: Date) => {
    const weekday = date.getDay();
    return date > today && weekday !== 0 && weekday !== 6;
  };

  const chosen = day && slot ? `${DAY.format(day)}, ${slot} ${bookingCalendar.timezone}` : null;
  const href = bookingUrl || (chosen ? slotHref(chosen) : undefined);

  return (
    <>
        <div className="flex items-center justify-between">
          <p className="text-body text-bone" aria-live="polite">
            {MONTH.format(month)}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              aria-label="Previous month"
              disabled={isCurrentMonth}
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="grid size-8 place-items-center rounded-full text-ash transition-colors hover:bg-white/5 hover:text-bone disabled:opacity-30"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="grid size-8 place-items-center rounded-full text-ash transition-colors hover:bg-white/5 hover:text-bone"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div role="grid" aria-label="Choose a day" className="mt-4 grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((weekday) => (
            <span key={weekday} role="columnheader" className="pb-2 text-micro uppercase tracking-[0.14em] text-faint">
              {weekday}
            </span>
          ))}
          {cells.map((date, index) => {
            if (!date) return <span key={`blank-${index}`} role="gridcell" />;
            const open = bookable(date);
            const selected = day?.getTime() === date.getTime();
            return (
              <span key={date.toISOString()} role="gridcell">
                <button
                  type="button"
                  disabled={!open}
                  aria-pressed={selected}
                  aria-label={DAY.format(date)}
                  onClick={() => {
                    setDay(date);
                    setSlot(null);
                  }}
                  className={cn(
                    "mx-auto grid aspect-square w-full max-w-10 place-items-center rounded-card text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                    selected
                      ? "bg-brand text-on-brand"
                      : open
                        ? "bg-white/[0.06] text-bone hover:bg-white/[0.12]"
                        : "text-faint/60",
                  )}
                >
                  {date.getDate()}
                </button>
              </span>
            );
          })}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-small text-ash">
            {day ? (
              <>
                <span className="text-bone">{DAY.format(day)}</span> · {bookingCalendar.timezone}
              </>
            ) : (
              "Pick a day to see times."
            )}
          </p>
          {day && (
            <ul className="mt-3 grid max-h-36 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4" data-lenis-prevent>
              {bookingCalendar.slots.map((time) => (
                <li key={time}>
                  <button
                    type="button"
                    aria-pressed={slot === time}
                    onClick={() => setSlot(time)}
                    className={cn(
                      "h-9 w-full rounded-full border text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                      slot === time
                        ? "border-brand bg-brand text-on-brand"
                        : "border-white/12 text-bone hover:border-white/30",
                    )}
                  >
                    {time}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4" data-track="book-slot">
            {href ? (
              <GlassButton href={href} variant="brand" arrow className="w-full sm:w-auto">
                {bookingUrl ? bookingCalendar.confirmLive : bookingCalendar.confirm}
              </GlassButton>
            ) : (
              <GlassButton variant="brand" arrow disabled className="w-full sm:w-auto">
                {bookingCalendar.confirm}
              </GlassButton>
            )}
            {!bookingUrl && <p className="mt-3 text-small text-faint">{bookingCalendar.pending}</p>}
          </div>
        </div>
    </>
  );
}

function Pitch() {
  return (
      <div className="relative flex flex-col justify-between gap-10 p-6 sm:p-10">
        <div>
          <GenesisMark className="h-7 w-auto" />
          <h2 className="mt-8 text-balance text-h3 font-normal leading-[1.08] tracking-tight text-bone sm:text-h2">
            {bookingCalendar.heading}{" "}
            <span className="font-serif italic text-brand-ink">{bookingCalendar.headingAccent}</span>
          </h2>
          <p className="mt-4 max-w-md text-pretty text-body leading-relaxed text-ash">{bookingCalendar.body}</p>
        </div>
        {/*
          THE MEMBERSHIP CARD, BESIDE THE CALENDAR — after the Designjoy
          reference Genesis sent: the thing a call leads to, shown as an object.
        */}
        <div className="relative flex justify-center pb-2 pt-4 sm:justify-start lg:pl-4">
          <span aria-hidden className="absolute -bottom-16 left-10 size-72 rounded-full bg-brand/20 blur-3xl" />
          <MembershipCard size="lg" tilt={-9} className="relative" />
        </div>
      </div>
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** The month as a 7-column grid: leading blanks, then each day. */
function monthCells(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: days }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ];
}
