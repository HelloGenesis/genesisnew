"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full border border-[#cbd5e1] bg-white px-4 py-2 text-[0.875rem] font-medium text-[#0f172a]">
      Download PDF
    </button>
  );
}
