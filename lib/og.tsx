import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

import { caseStudiesPage } from "./case-studies";
import { caseStudyPages } from "./case-study-pages";
import { careersPage, creatorPage } from "./page-content";
import { OG_SIZE } from "./seo";
import { servicePages } from "./services";
import { divisionPages, siteConfig } from "./site-config";
import { reelPoster } from "./work";

/**
 * THE SHARE CARDS — what a link to any page looks like in WhatsApp, LinkedIn,
 * Slack or X. One card per indexable page, drawn at build time by app/og.
 *
 * NONE OF THIS EXISTED. No page had an og:image, so a shared link showed
 * whatever the platform scraped — usually nothing, sometimes a stray logo. For
 * an agency whose work travels by being forwarded, the card IS the first
 * impression.
 *
 * THE SITE'S OWN LOOK, in satori's subset of CSS: the charcoal cover ground
 * from the guidelines (#242426), Mont for the title and Codec Pro Italic for
 * its accent word in Genesis Yellow — the same pairing every heading on the
 * site uses — the white-ink wordmark, and on a division's card its gradient
 * name mark. A case study adds its own poster frame.
 *
 * The copy is read from the same places the pages read it, so a card cannot
 * disagree with the page it stands for.
 */

export type OgCard = {
  /** The page this card stands for — the route after /og. */
  path: string;
  eyebrow: string;
  title: string;
  /** Set in the serif italic, in brand yellow, after the title. */
  accent?: string;
  /** A division's name mark, from /brand/divisions/name. */
  division?: { slug: string; width: number; height: number };
  /** A case study's poster frame: its file name in public/work/posters. */
  poster?: string;
  landscape?: boolean;
};

/* The name set's files and sizes — the same numbers DivisionLockup uses. */
const DIVISION_MARK: Record<string, { slug: string; width: number; height: number }> = {
  Influence: { slug: "influence", width: 362, height: 98 },
  Studios: { slug: "studios", width: 296, height: 103 },
  "AI Lab": { slug: "ai-lab", width: 250, height: 98 },
  "Brand & Design": { slug: "brand-design", width: 616, height: 100 },
};

const MARK_HEIGHT = 64;

export const ogCards: OgCard[] = [
  {
    path: "/",
    eyebrow: "Influencer marketing · Content · AI · Brand & Design",
    title: siteConfig.tagline,
  },
  ...servicePages.map((page) => ({
    path: `/${page.slug}`,
    eyebrow: divisionPages.find((d) => d.href === `/${page.slug}`)?.label ?? page.division,
    title: page.heading.lead,
    accent: page.heading.accent,
    division: DIVISION_MARK[page.division],
  })),
  {
    path: "/case-studies",
    eyebrow: caseStudiesPage.label,
    title: caseStudiesPage.heading,
    accent: caseStudiesPage.headingAccent,
  },
  { path: "/creator", eyebrow: creatorPage.label, title: creatorPage.heading },
  {
    path: "/careers",
    eyebrow: careersPage.label,
    title: careersPage.heading,
    accent: careersPage.headingAccent,
  },
  { path: "/privacy", eyebrow: "Legal", title: "Privacy Policy" },
  ...caseStudyPages.map((page) => ({
    path: page.path,
    eyebrow: `Case study · ${page.copy.brand}`,
    title: page.copy.headline,
    // The committed frame, not mediaUrl's: this is read from disk at build.
    poster: reelPoster(page.copy.clip).split("/").pop(),
    landscape: page.ratio > 1,
  })),
];

export function findOgCard(path: string): OgCard | undefined {
  return ogCards.find((card) => card.path === path);
}

// --- Rendering ---------------------------------------------------------------

const CHARCOAL = "#242426";
const YELLOW = "#ffc516";

/*
  EACH READ IS SCOPED TO ITS OWN FOLDER, and that is a build fix. One helper
  taking any path made Turbopack trace the entire project — all of /public,
  fifteen megabytes of film included — into this route's server bundle,
  because it could not tell which files a variable path might reach. A fixed
  folder plus a file name is something it can bound.
*/
const font = (name: string) => readFile(join(process.cwd(), "app/fonts", name));
const brand = (name: string) => readFile(join(process.cwd(), "public/brand", name));
const posterFrame = (name: string) =>
  readFile(join(process.cwd(), "public/work/posters", name));

const dataUri = (bytes: Buffer, type: string) =>
  `data:${type};base64,${bytes.toString("base64")}`;

/* Read once per process — every card uses the same three faces and mark. */
const assets = Promise.all([
  font("Mont-ExtraLightDEMO.otf"),
  font("CodecPro-Regular.ttf"),
  font("CodecPro-Italic.ttf"),
  brand("genesis-wordmark-light.png"),
]);

/** Long titles step down so every one fits the frame without clipping. */
function titleSize(length: number, narrow: boolean): number {
  if (narrow) return length <= 60 ? 54 : length <= 85 ? 48 : 42;
  return length <= 28 ? 84 : length <= 48 ? 72 : length <= 80 ? 60 : 52;
}

export async function renderOgCard(card: OgCard): Promise<ImageResponse> {
  const [mont, codec, codecItalic, wordmark] = await assets;
  const mark = card.division
    ? dataUri(await brand(`divisions/name/${card.division.slug}.png`), "image/png")
    : undefined;
  const poster = card.poster
    ? dataUri(await posterFrame(card.poster), "image/jpeg")
    : undefined;
  const narrow = Boolean(poster);
  const size = titleSize(card.title.length + (card.accent?.length ?? 0), narrow);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          backgroundColor: CHARCOAL,
          backgroundImage: `radial-gradient(circle at 88% 12%, rgba(255,197,22,0.26), rgba(255,197,22,0) 55%), radial-gradient(circle at 0% 100%, rgba(247,113,158,0.16), rgba(247,113,158,0) 50%)`,
          padding: 64,
          color: "#ffffff",
          fontFamily: "Codec",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM */}
          <img src={dataUri(wordmark, "image/png")} width={308} height={35} alt="" />

          <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
            {mark && card.division ? (
              // eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM
              <img
                src={mark}
                width={Math.round((card.division.width * MARK_HEIGHT) / card.division.height)}
                height={MARK_HEIGHT}
                style={{ marginBottom: 20 }}
                alt=""
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  color: YELLOW,
                  marginBottom: 22,
                }}
              >
                {card.eyebrow}
              </div>
            )}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                fontFamily: "Mont",
                fontSize: size,
                lineHeight: 1.08,
                letterSpacing: -1,
                paddingRight: narrow ? 40 : 0,
              }}
            >
              {/*
                WORD BY WORD, because satori lays out a flex row: the title and
                the accent as two items wrapped as two blocks, so an accent
                pushed to its own line kept its left margin as an indent. As
                words, both faces flow as one sentence.
              */}
              {card.title.split(" ").map((word, index) => (
                <span key={`t${index}`} style={{ marginRight: size * 0.25 }}>
                  {word}
                </span>
              ))}
              {card.accent?.split(" ").map((word, index) => (
                <span
                  key={`a${index}`}
                  style={{ fontFamily: "Codec", fontStyle: "italic", color: YELLOW, marginRight: size * 0.25 }}
                >
                  {word}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 40, fontSize: 22, color: "rgba(255,255,255,0.6)" }}>
            {new URL(siteConfig.url).host.replace(/^www\./, "")} · Mumbai, India
          </div>
        </div>

        {poster && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- satori, not the DOM */}
            <img
              src={poster}
              width={card.landscape ? 400 : 282}
              height={card.landscape ? 225 : 502}
              style={{
                objectFit: "cover",
                borderRadius: 24,
                border: "2px solid rgba(255,255,255,0.14)",
              }}
              alt=""
            />
          </div>
        )}
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Mont", data: mont, weight: 200, style: "normal" },
        { name: "Codec", data: codec, weight: 400, style: "normal" },
        { name: "Codec", data: codecItalic, weight: 400, style: "italic" },
      ],
    },
  );
}
