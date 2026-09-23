import Image from "next/image";

import { AvatarPager } from "@/components/genesis/avatar-pager";
import { Media } from "@/components/genesis/media";
import { mediaUrl } from "@/lib/media-url";
import { posterSrc } from "@/lib/poster";
import { isPending } from "@/lib/home-content";
import { filmUrl } from "@/lib/films";
import { reelClip, reelPoster } from "@/lib/work";
import { clipRatio, isLandscape } from "@/lib/clip-shape";
import { cn } from "@/lib/utils";
import { avatars, AVATAR_TINT, type Avatar } from "@/lib/avatars";
import { VIDEO_GUARD } from "@/lib/video-guard";

/**
 * One AI avatar, rendered identically whether it arrived as a dialog over the
 * roster or as its own page.
 *
 * THE PORTRAIT KEEPS ITS OWN SHAPE, which is the fix for the crop Genesis
 * flagged. It used to be a full-width band whose height was clamped to the
 * viewport — a 2.3:1 letterbox cut out of a 9:16 photograph. Anchoring that
 * band to the top showed the wall above the subject's head; anchoring it to
 * the centre showed a torso. There is no crop of a portrait into a wide strip
 * that contains a face, so the strip is gone: the picture is a 3:4 panel in
 * its own column and the reading sits beside it.
 *
 * IT OMITS WHAT IS NOT WRITTEN. Bio, languages and use cases are Genesis's to
 * supply and every block disappears while its field is pending. What a
 * visitor sees today is the avatar, its name and the brand it fronts — all of
 * which are real.
 *
 * TODO(content): `bio` is the story Genesis asked to appear here and it is the
 * one thing this view cannot invent. Adi and Diya front a named insurer;
 * writing a backstory for them would be putting words in a client's mouth. The
 * Story section below renders the moment the field is filled.
 */
export function AvatarDetail({
  avatar,
  onNavigate,
}: {
  avatar: Avatar;
  /**
   * Steps to a neighbouring avatar in place, which is what puts the ‹ › pager
   * on the portrait. Only the landing-page dialog passes it; the avatar pages
   * this used to serve are gone, and so is the URL-based paging they used.
   */
  onNavigate?: (id: string) => void;
}) {
  const index = Math.max(0, avatars.findIndex((a) => a.id === avatar.id));
  const tint = AVATAR_TINT[index % AVATAR_TINT.length];
  const hasSamples = avatar.reel.length > 0 || avatar.stills.length > 0;

  return (
    /*
      Two columns where there is room, stacked where there is not. The picture
      column is capped at 20rem so a 3:4 panel is never taller than 427px —
      which is what keeps the dialog inside a laptop screen without the height
      of the photograph having to be clamped against the viewport.
    */
    <article className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start lg:gap-10">
      <figure className="relative aspect-[3/4] overflow-hidden rounded-panel border border-[var(--glass-border)] bg-ink">
        {avatar.portrait ? (
          <Image
            src={avatar.portrait}
            alt={`${avatar.name}, a Genesis AI avatar`}
            fill
            priority
            /*
              The column is 20rem at most and full width below lg, so this is
              the real measurement rather than a guess at the viewport. A 3:4
              window on a 9:16 source crops the top and bottom evenly and
              keeps the middle, which is where these are framed.
            */
            sizes="(min-width: 1024px) 20rem, 100vw"
            className="object-cover object-center"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(160deg, rgb(${tint} / 0.4) 0%, rgb(14 14 18 / 0.97) 62%), radial-gradient(70% 50% at 50% 18%, rgb(255 255 255 / 0.14), transparent 72%)`,
            }}
          />
        )}

        {/*
          THE SLIDER, over the portrait. Genesis asked the window to carry
          arrow buttons and arrow-key stepping; it lives inside this figure
          because the figure is the one element in this layout with a fixed
          shape at every width, so the controls have somewhere to be at 375px
          as well as at 1440. See AvatarPager for why it replaces rather than
          pushes history, and `paged` above for why the page does not get it.
        */}
        {onNavigate && <AvatarPager currentId={avatar.id} onNavigate={onNavigate} />}
      </figure>

      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <span className="micro-label text-brand-ink">Genesis AI Labs</span>
          {/*
            The name is set ONCE. It used to be burned across the bottom of the
            picture as well as printed here, which is the same say-it-twice
            fault the poster cards had with their baked-in captions.
          */}
          <h1 className="text-balance text-h2 font-normal leading-[1.05] tracking-tight text-bone sm:text-h1">
            {avatar.name}
          </h1>
          {avatar.role && (
            <p className="text-lead leading-relaxed text-ash">{avatar.role}</p>
          )}
        </header>

        {/*
          THE STORY, which is what Genesis asked to stand where the CTA was.
          "Build with this avatar" is gone from here at their request — it was
          asking for the brief before the reader had been told who they were
          looking at.
        */}
        {!isPending(avatar.bio) && (
          <section className="flex flex-col gap-2 border-t border-[var(--glass-border)] pt-6">
            <h2 className="micro-label">The story</h2>
            <p className="text-body leading-relaxed text-ash">{avatar.bio}</p>
          </section>
        )}

        {avatar.languages.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="micro-label">Speaks</h2>
            <ul className="flex flex-wrap gap-2">
              {avatar.languages.map((language) => (
                <li
                  key={language}
                  className="glass-chip rounded-full px-3 py-1.5 text-small text-bone"
                >
                  {language}
                </li>
              ))}
            </ul>
          </section>
        )}

        {avatar.useCases.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="micro-label">Used for</h2>
            <ul className="flex flex-wrap gap-2">
              {avatar.useCases.map((useCase) => (
                <li
                  key={useCase}
                  className="glass-chip rounded-full px-3 py-1.5 text-small text-bone"
                >
                  {useCase}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/*
          WHAT THIS AVATAR HAS BEEN USED TO MAKE. Films first, then stills.

          Two across from 640 rather than three: these now sit in the right
          column of a split, not across the full panel, so a third tile would
          put each one under 140px. `sizes` follows the same measurement.
        */}
        {hasSamples && (
          <section className="flex flex-col gap-4 border-t border-[var(--glass-border)] pt-6">
            <h2 className="micro-label">Made with {avatar.name}</h2>

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {avatar.reel.map((clip) => (
                /*
                  EACH FILM IN ITS OWN FRAME. A landscape one takes two
                  columns so it is not a thumbnail-sized strip.
                */
                <li key={clip} className={cn(isLandscape(clip) && "col-span-2")}>
                  {/*
                    The full film when Drive serves it, the preview when it
                    does not — the same fallback the portfolio's detail uses,
                    since `clip` is one of its ids.
                  */}
                  <video
                    poster={posterSrc(mediaUrl(reelPoster(clip)))}
                    playsInline
                    controls
                    preload="none"
                    {...VIDEO_GUARD}
                    style={{ aspectRatio: clipRatio(clip) }}
                    className="w-full rounded-card border border-[var(--glass-border)] bg-ink object-contain"
                    /* The film, with the preview held back for a film that
                       fails twice (recoverFilm). */
                    src={filmUrl(clip) ?? mediaUrl(reelClip(clip))}
                    data-preview={filmUrl(clip) ? mediaUrl(reelClip(clip)) : undefined}
                  />
                </li>
              ))}

              {avatar.stills.map((still) => (
                <li key={still}>
                  <Media
                    src={mediaUrl(still)}
                    alt={`${avatar.name}, sample still`}
                    aspect="portrait"
                    sizes="(min-width: 1024px) 14rem, 40vw"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </article>
  );
}
