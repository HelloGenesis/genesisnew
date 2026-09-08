"use client";

import { useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { VIDEO_GUARD_CLIENT } from "@/lib/video-guard";

/**
 * A looping reel.
 *
 * The spec asks for moving imagery in three places — the hero reel, the tools
 * stack, and the library tiles — all described the same way: playing on their
 * own, like a GIF. So this is muted, looping, inline and controlless by
 * default.
 *
 * Three behaviours that matter:
 *
 *  - Under `prefers-reduced-motion` it does NOT autoplay. It shows the poster
 *    with a play control instead, because auto-playing video is precisely
 *    what that setting exists to stop.
 *  - Without a `src` it renders the poster, or a labelled empty frame. The
 *    layout is therefore correct before any footage exists, and upgrades on
 *    data alone.
 *  - `preload="metadata"` so several on one page do not each pull a full file.
 */
export function Reel({
  src,
  poster,
  label,
  aspect = "16 / 9",
  className,
}: {
  /** Muted loop. Omit to render the poster or an empty frame. */
  src?: string;
  poster?: string;
  /** Announced to assistive tech, and shown on the empty frame. */
  label: string;
  aspect?: string;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const frame = cn(
    "relative overflow-hidden rounded-card border border-white/10 bg-elevated",
    className,
  );

  if (!src) {
    return (
      <div className={frame} style={{ aspectRatio: aspect }}>
        {poster ? (
          <Image
            src={poster}
            alt={label}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          // TODO(assets): footage pending. A labelled frame keeps the layout
          // honest rather than pretending with a stock gradient.
          <div className="grid size-full place-items-center bg-[radial-gradient(120%_100%_at_30%_10%,rgb(255_197_22/0.14),transparent_60%)]">
            <p className="micro-label">{label}</p>
          </div>
        )}
      </div>
    );
  }

  const autoPlay = !prefersReducedMotion;

  return (
    <div className={frame} style={{ aspectRatio: aspect }}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted
        loop
        playsInline
        autoPlay={autoPlay}
        preload="metadata"
        aria-label={label}
        {...VIDEO_GUARD_CLIENT}
        className="size-full object-cover"
      />

      {/* Reduced motion: the viewer starts it, not us. */}
      {!autoPlay && !playing && (
        <button
          type="button"
          onClick={() => {
            void videoRef.current?.play();
            setPlaying(true);
          }}
          className="absolute inset-0 grid place-items-center bg-black/40 transition-colors hover:bg-black/25"
          aria-label={`Play ${label}`}
        >
          <span className="glass grid size-14 place-items-center rounded-full text-bone">
            <Play className="size-5 fill-current" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * A YouTube embed, for the spec's "blog articles linked to the video uploaded
 * on YouTube".
 *
 * Uses youtube-nocookie and defers the iframe behind a poster click: an
 * autoloaded YouTube frame sets cookies and pulls several hundred kilobytes
 * before anyone has asked to watch. Clicking is consent, and it keeps the
 * article fast for the majority who only read.
 */
export function YouTubeEmbed({
  id,
  title,
  className,
}: {
  id: string;
  title: string;
  className?: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-white/10 bg-elevated",
        className,
      )}
      style={{ aspectRatio: "16 / 9" }}
    >
      {active ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group relative size-full"
          aria-label={`Play ${title}`}
        >
          {/*
            YouTube's own still. Loading it costs one image and sets no
            cookies, unlike mounting the player.
          */}
          <Image
            src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 720px"
            className="object-cover"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/35 transition-colors group-hover:bg-black/20">
            <span className="glass grid size-16 place-items-center rounded-full text-bone">
              <Play className="size-6 fill-current" aria-hidden />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
