"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * A TEXT BOX THAT EXTENDS (Genesis, 26 Oct 2026: "give an option to extend
 * these boxes"). Long text wraps onto more lines and the box grows to fit, so
 * nothing is cut off; the corner handle drags it wider. Used for the table
 * cells that hold notes, contacts and added columns.
 */
export function GrowText({ className = "", ...props }: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "rows"> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} className={`crm-input crm-grow ${className}`} />;
}
