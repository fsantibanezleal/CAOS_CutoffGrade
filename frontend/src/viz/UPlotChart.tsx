import { useEffect, useRef } from 'react';
import uPlot from 'uplot';
import 'uplot/dist/uPlot.min.css';
import { useThemeStore } from '@fasl-work/caos-app-shell';

/** Interactive uPlot chart: wheel/drag zoom + pan, crosshair value readout, theme-aware, responsive. */
export function UPlotChart({ data, build, height = 240 }: {
  data: uPlot.AlignedData; build: (width: number, height: number) => uPlot.Options; height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const width = el.clientWidth || 600;
    const u = new uPlot(build(width, height), data, el);
    const ro = new ResizeObserver(() => u.setSize({ width: el.clientWidth || width, height }));
    ro.observe(el);
    return () => { ro.disconnect(); u.destroy(); };
  }, [theme, data, build, height]);
  return <div ref={ref} className="uplot-host" style={{ width: '100%', height }} />;
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
