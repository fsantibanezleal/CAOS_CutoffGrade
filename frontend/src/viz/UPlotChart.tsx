import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useShellLang, useThemeStore } from '@fasl-work/caos-app-shell';
import { tick } from '../lib/format.ts';

/** Ticks and readouts in the page's language. uPlot formats both with the BROWSER's locale, so an English page on a
 *  Spanish-locale browser drew "0,2" on its axes. An axis or series that sets its own formatter keeps it. */
function localised(opts: uPlot.Options, lang: 'en' | 'es'): uPlot.Options {
  const fmt = (v: number | null | undefined) => (v == null ? '-' : tick(v, lang));
  return {
    ...opts,
    axes: opts.axes?.map((a) => (a.values ? a : { ...a, values: (_u: uPlot, splits: number[]) => splits.map(fmt) })),
    series: opts.series.map((s, i) => (i === 0 || s.value ? s : { ...s, value: (_u: uPlot, v: number | null) => fmt(v) })),
  };
}

/** Interactive uPlot chart: wheel/drag zoom + pan, crosshair value readout, theme-aware, responsive. */
export function UPlotChart({ data, build, height = 240, fill = false, minHeight = 200 }: {
  data: uPlot.AlignedData; build: (width: number, height: number) => uPlot.Options; height?: number;
  /** Fill the parent's height instead of taking a fixed one. A chart pinned to 240px inside a
   *  full-height focus stage leaves the rest of the stage empty, which defeats the point of the view. */
  fill?: boolean; minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  const lang = useShellLang() === 'es' ? 'es' : 'en';
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const width = el.clientWidth || 600;
    const u = new uPlot(localised(build(width, height), lang), data, el);
    // With fill, the height comes from the PARENT and the parent lays out after mount, so it must be
    // re-measured on resize rather than captured on the first frame.
    const measure = () => (fill ? Math.max(minHeight, el.parentElement ? el.parentElement.clientHeight - 8 : minHeight) : height);
    const ro = new ResizeObserver(() => u.setSize({ width: el.clientWidth || width, height: measure() }));
    ro.observe(el);
    return () => { ro.disconnect(); u.destroy(); };
  }, [theme, lang, data, build, height]);
  // A fixed height clipped nothing but let the legend, which uPlot draws BELOW the plot inside this element, overflow
  // the host: the KPI cards under the grade-tonnage chart covered it in both themes. The plot keeps its height; the
  // host grows to hold the legend (CAOS_MANAGE conventions/shell-known-defects.md, entry 3, same class).
  return <div ref={ref} className="uplot-host" style={fill ? { width: '100%', flex: '1 1 auto', minHeight: 0 } : { width: '100%', minHeight: height }} />;
}

export function themeColors() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return {
    fg: v('--color-fg', '#e6edf3'), subtle: v('--color-fg-subtle', '#9aa7b4'), faint: v('--color-fg-faint', '#6b7682'),
    border: v('--color-border', '#30363d'), accent: v('--color-accent', '#6ea8ff'), good: v('--color-good', '#3fb950'),
    warn: v('--color-warn', '#d29922'), bad: v('--color-bad', '#f85149'),
  };
}
