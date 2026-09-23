"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";

import { GenesisMark } from "./genesis-mark";
import { cn } from "@/lib/utils";

/**
 * The animated Genesis lockup in the header.
 *
 * Genesis supplied two ProRes exports and asked for the animation to run in
 * the nav, where the wordmark sits.
 *
 * THE CROP IS THE POINT. The source frames are 1920x720 with the lockup
 * floating in the middle of a large black field, so used whole they would
 * render a 120px-wide mark whose lettering was about forty pixels across. The
 * ink's union bounding box across all 312 frames was measured (x 640..1568,
 * y 312..408) and the encode crops to it. Both files take the SAME crop, so
 * the two themes register on each other exactly.
 *
 * WHY THIS KEYS THE BLACK IN A CANVAS RATHER THAN WITH A BLEND MODE.
 *
 * Neither file has an alpha channel — both were exported over solid black,
 * 98.8% of every frame — so the background has to be removed somehow. The
 * cheap way is `mix-blend-mode: screen`, and the footer's ghost mark uses
 * exactly that. It does not work here, and the reason is worth writing down
 * because it looks like it should:
 *
 *   A BLEND MODE ONLY CANCELS BLACK AGAINST AN OPAQUE BACKDROP. Compositing
 *   is Cr = (1 - αb)·Cs + αb·B(Cb, Cs). Where the backdrop's alpha is low,
 *   the first term dominates and the SOURCE survives — so screen over a
 *   translucent surface still paints its black. The nav pill is `.glass`: a
 *   7.5% white fill. Measured, the mark rendered as a hard black rectangle,
 *   and removing the pill's backdrop-filter (the other suspect) changed
 *   nothing. The footer works because the page ground underneath it is
 *   opaque; the pill has no opaque surface anywhere in its stacking context.
 *
 * So the alpha is computed instead. Each frame is drawn to a canvas and
 * un-composited from the background it was exported over: from BLACK for the
 * white-ink file, from WHITE for the dark-ink one. That is a real alpha
 * channel, so it sits correctly on glass, on the page, on anything.
 *
 * WHY NOT AN ALPHA VIDEO FORMAT. VP9-with-alpha in WebM would do it in one
 * line of markup and is unsupported in Safari, which would then show the
 * black box this exists to remove. HEVC-with-alpha is the reverse. The canvas
 * runs anywhere an MP4 plays, and at this size it is nothing: the mark is
 * about 122x16 CSS pixels, so even at 2x it is under 8,000 pixels a frame.
 *
 * THE KEY RUNS ON THE GPU. It was a JavaScript loop over every pixel of
 * every frame — getImageData, the arithmetic, putImageData — and cheap as
 * that sounds at this size, it never stops: it runs on every page, for as
 * long as the page is open. A mobile Lighthouse profile put a second of main
 * thread in every eight on it, all of it competing with hydration and input.
 * The same arithmetic in a fragment shader costs the main thread one texture
 * upload a frame. The 2D loop stays as the fallback for a browser with no
 * WebGL, where it is still correct, only slower.
 *
 * `requestVideoFrameCallback` DRIVES IT where available, so the loop runs
 * once per decoded video frame rather than once per display refresh. rAF is
 * the fallback.
 *
 * REDUCE MOTION GETS THE STILL MARK, not a frozen frame. The animation cycles
 * through the division names, so any single frame says "GENESIS.Studios" or
 * half-draws a word; the correct still is the real wordmark, which already
 * exists.
 */

/**
 * The cropped footage's own dimensions, and they are a fix rather than a
 * detail.
 *
 * THE FIRST CROP WAS TOO LOOSE and the mark rendered small and adrift in the
 * bar. It was measured from a downsampled pass and came out 976x128 — a 7.6:1
 * box around ink that is 9.65:1 — so a quarter of the height was padding, and
 * `object-contain` then shrank the lettering to fit the padding rather than
 * the mark. Re-measured at full resolution across every frame the ink is
 * x 642..1568, y 315..411, and this crop is that box plus six pixels of air:
 * 8.7:1, which is within a hair of the still wordmark's own 8.8:1. The
 * animated mark and the still one are now the same shape.
 */
const W = 940;
const H = 108;

/**
 * How tall the mark stands in the bar.
 *
 * THIS IS MATCHED TO THE STILL WORDMARK'S LETTERING, not to its box, and the
 * difference is the whole reason the first two attempts read as too small.
 *
 * The still mark is 8.8:1 of pure "GENESISMEDIA", so nearly all of its box is
 * ink: in a 120x14 box the lettering stands about 12.3px. This footage is not
 * comparable, because its box has to reserve room for the division name that
 * animates in — measured on the frame where only the wordmark is showing,
 * "GENESIS." is 380 of the 940 crop units wide and 65 of the 108 tall. So the
 * cap height here is 0.60 of the box where the still mark's is 0.90, and
 * setting the two boxes to the same height renders this one a third smaller.
 *
 * 22px puts the cap at 13.2px and the "GENESIS" at about 76px wide, which is
 * a hair above the still mark's 12.3px and 70px. The box is wider than the
 * still one at 191px, and most of that is deliberately empty — it is the
 * space the division name expands into.
 */
const CSS_HEIGHT = 22;

export function GenesisMarkMotion({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const darkRef = useRef<HTMLVideoElement>(null);
  const lightRef = useRef<HTMLVideoElement>(null);

  /*
    WHETHER TO ANIMATE AT ALL, as a subscription rather than as state set from
    an effect.

    The server has no media query, so it renders the still mark; the client
    swaps on its first pass and re-swaps if the preference changes mid-session.
    useSyncExternalStore is what makes that a read of an external value rather
    than a setState inside an effect, which React now flags — and it means
    anyone who has asked for less motion never gets a canvas, a decoder or a
    loop at all, rather than getting them and having them torn down.
  */
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  const animate = useSyncExternalStore(
    subscribe,
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    if (!animate) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    /*
      WHICH FILE IS SHOWING is the theme's business, and --logo-invert is
      already the site's answer to that question — every other instance of the
      mark cross-fades on it. Reading it per frame would force a style recalc
      each time, so it is read once here and again whenever the theme can
      have changed.
    */
    let light = false;
    const readTheme = () => {
      light =
        getComputedStyle(canvas).getPropertyValue("--logo-invert").trim() === "1";
    };
    readTheme();

    const scheme = window.matchMedia("(prefers-color-scheme: light)");
    scheme.addEventListener("change", readTheme);
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * (CSS_HEIGHT / H) * dpr);
    canvas.height = Math.round(CSS_HEIGHT * dpr);

    let stop = false;
    let handle = 0;

    /*
      The canvas can hold one kind of context for its life, so WebGL is asked
      for first and the 2D context only if it is refused.
    */
    const gl = keyWithWebGL(canvas);
    const ctx = gl ? null : canvas.getContext("2d", { willReadFrequently: true });
    if (!gl && !ctx) return;

    const draw = () => {
      if (stop) return;
      const video = light ? lightRef.current : darkRef.current;
      if (gl && video && video.readyState >= 2) {
        gl.draw(video, light);
      } else if (ctx && video && video.readyState >= 2) {
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(video, 0, 0, width, height);

        const frame = ctx.getImageData(0, 0, width, height);
        const d = frame.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          if (light) {
            /*
              Exported over WHITE: alpha is how far the pixel is FROM white,
              and the ink is recovered by removing the white that was
              composited under it.
            */
            const a = 255 - Math.min(r, Math.min(g, b));
            d[i + 3] = a;
            if (a > 0) {
              const k = 255 / a;
              d[i] = Math.max(0, Math.min(255, (r - (255 - a)) * k));
              d[i + 1] = Math.max(0, Math.min(255, (g - (255 - a)) * k));
              d[i + 2] = Math.max(0, Math.min(255, (b - (255 - a)) * k));
            }
          } else {
            /*
              Exported over BLACK: alpha is the brightest channel, and the ink
              is recovered by dividing it back out. Using the MAX rather than
              a luma weighting keeps the saturated parts of the lockup — the
              yellow wedge, the gradient — at full strength instead of
              thinning them because they are not bright in green.
            */
            const a = Math.max(r, Math.max(g, b));
            d[i + 3] = a;
            if (a > 0) {
              const k = 255 / a;
              d[i] = Math.min(255, r * k);
              d[i + 1] = Math.min(255, g * k);
              d[i + 2] = Math.min(255, b * k);
            }
          }
        }
        ctx.putImageData(frame, 0, 0);
      }

      const v = light ? lightRef.current : darkRef.current;
      if (v && "requestVideoFrameCallback" in v) {
        handle = (
          v as HTMLVideoElement & {
            requestVideoFrameCallback: (cb: () => void) => number;
          }
        ).requestVideoFrameCallback(draw);
      } else {
        handle = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      stop = true;
      cancelAnimationFrame(handle);
      gl?.dispose();
      scheme.removeEventListener("change", readTheme);
      observer.disconnect();
    };
  }, [animate]);

  const video = {
    muted: true,
    loop: true,
    autoPlay: true,
    playsInline: true,
    preload: "auto" as const,
    "aria-hidden": true,
    /*
      The sources are never displayed; the canvas is what is seen. They are
      kept in the layout at zero size rather than `display: none`, because a
      display:none video is not guaranteed to decode.
    */
    className: "pointer-events-none absolute size-px opacity-0",
  };

  return (
    <span className={cn("relative block shrink-0", className)}>
      {/* Server render and Reduce Motion both get the real still wordmark. */}
      {!animate && <GenesisMark />}

      {animate && (
        <>
          <video {...video} ref={darkRef} src="/brand/header/wordmark-dark-theme.mp4" />
          <video {...video} ref={lightRef} src="/brand/header/wordmark-light-theme.mp4" />
          <canvas
            ref={canvasRef}
            aria-hidden
            className="block"
            style={{ height: CSS_HEIGHT, width: (W / H) * CSS_HEIGHT }}
          />
        </>
      )}
    </span>
  );
}

/**
 * The un-compositing in the 2D loop above, as a fragment shader — the same
 * formulas, so the two paths draw the same mark.
 *
 * The output is premultiplied, which is what a WebGL canvas composites as by
 * default: ink recovered and then multiplied back by its alpha is simply the
 * source minus the ground it was exported over, so the shader writes that
 * directly and never divides.
 */
const VERTEX = `
attribute vec2 p;
varying vec2 uv;
void main() {
  uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  gl_Position = vec4(p, 0.0, 1.0);
}`;

const FRAGMENT = `
precision mediump float;
varying vec2 uv;
uniform sampler2D frame;
uniform bool light;
void main() {
  vec3 c = texture2D(frame, uv).rgb;
  if (light) {
    // Exported over WHITE: alpha is the distance from white.
    float a = 1.0 - min(c.r, min(c.g, c.b));
    gl_FragColor = vec4(clamp(c - (1.0 - a), 0.0, 1.0), a);
  } else {
    // Exported over BLACK: alpha is the brightest channel.
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }
}`;

function keyWithWebGL(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext("webgl", {
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) return null;

  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
  };
  const vertex = compile(gl.VERTEX_SHADER, VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  // One triangle strip covering the canvas.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "p");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  // The footage is not a power of two, so no mipmaps and no wrapping.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const lightFlag = gl.getUniformLocation(program, "light");

  return {
    draw(video: HTMLVideoElement, light: boolean) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video);
      gl.uniform1i(lightFlag, light ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose() {
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    },
  };
}
