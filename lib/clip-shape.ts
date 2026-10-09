import type { ReelId } from "./work";

/**
 * THE FEW CLIPS THAT ARE NOT 9:16, measured from their preview files.
 *
 * Almost everything Genesis shot is 1080x1920, so players were written to
 * a 9:16 frame — and a landscape film in that frame came out as a letterboxed
 * strip or, where the frame cropped, as the middle third of a TV set
 * (Genesis's note on Shivam's second avatar video). Listing the exceptions
 * lets a player take the film's own shape. Re-measure when clips are added:
 *
 *   ffprobe -v error -show_entries stream=width,height -of csv=p=0 <poster>
 */
const RATIOS: Record<string, number> = {
  "31": 16 / 9,
  "ai-lab-sinet-english-v004": 16 / 9,
  "ai-lab-shivam-sh2": 4 / 3,
  "ai-lab-tanvi-photos": 4 / 5,
  "studios-abhi-ex-coms": 16 / 9,
  "studios-mahindra-cut-44": 16 / 9,
  "studios-mr-mayank-bathwal-ceo-aditya-birla-health-insurance": 16 / 9,
  "studios-umang-2024": 16 / 9,
  "studios-wo-vo-sales-pro": 16 / 9,
  /* Genesis's case study library, 3 Oct 2026 (lib/case-study-2026). */
  "8-activ-yuva-male-vo-launch-film-24": 16 / 9,
  "27-tanvi-ailab-5": 4 / 5,
  "29-tanvi-ailab-7": 4 / 5,
  /* Genesis case studies sheet, 4 Oct 2026. */
  "30-sinet-ailabs-1": 16 / 9,
  "37-manthan-2026-power-of-10": 16 / 9,
  "38-sales-pro-power-of-10": 16 / 9,
  "hdfc-mayank-bathwal-message": 16 / 9,
};

/** Width over height for a clip; 9:16 unless listed above. */
export function clipRatio(id: ReelId): number {
  return RATIOS[String(id)] ?? 9 / 16;
}

export function isLandscape(id: ReelId): boolean {
  return clipRatio(id) > 1;
}
