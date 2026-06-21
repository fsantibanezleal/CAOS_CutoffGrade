import { useCallback, useMemo } from 'react';
import type uPlot from 'uplot';
import { type GTPointRec } from '../lib/contract.types.ts';
import { themeColors, UPlotChart } from './UPlotChart.tsx';

/** The grade-tonnage curve: ore fraction (%) and average ore grade (%) vs the cut-off grade (%). The break-even and
 * the effective optimum cut-off are drawn as vertical reference lines. */
export function GTChart({ curve, breakEven, effective, lang = 'en', height = 260 }: {
  curve: GTPointRec[]; breakEven: number; effective: number; lang?: 'en' | 'es'; height?: number;
}) {
  const data = useMemo<uPlot.AlignedData>(() => {
    const xs = curve.map((p) => p.cutoff * 100);
    const ore = curve.map((p) => p.oreFraction * 100);
    const grade = curve.map((p) => p.avgGrade * 100);
    return [xs, ore, grade];
  }, [curve]);

  const build = useCallback((w: number, h: number): uPlot.Options => {
    const c = themeColors();
    const vline = (x: number, color: string) => (u: uPlot) => {
      const cx = u.valToPos(x, 'x', true);
      u.ctx.save();
      u.ctx.strokeStyle = color;
      u.ctx.setLineDash([4, 3]);
      u.ctx.beginPath();
      u.ctx.moveTo(cx, u.bbox.top);
      u.ctx.lineTo(cx, u.bbox.top + u.bbox.height);
      u.ctx.stroke();
      u.ctx.restore();
    };
    return {
      width: w, height: h,
      scales: { x: { time: false }, y: { range: [0, 100] }, g: {} },
      axes: [
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'ley de corte (%)' : 'cut-off grade (%)' },
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'fracción mineral (%)' : 'ore fraction (%)' },
        { scale: 'g', side: 1, stroke: c.good, grid: { show: false }, label: lang === 'es' ? 'ley media (%)' : 'avg grade (%)' },
      ],
      series: [
        {},
        { label: lang === 'es' ? 'fracción mineral' : 'ore fraction', stroke: c.accent, width: 2 },
        { label: lang === 'es' ? 'ley media' : 'avg grade', stroke: c.good, width: 2, scale: 'g' },
      ],
      hooks: { draw: [vline(breakEven * 100, c.warn), vline(effective * 100, c.bad)] },
    } as uPlot.Options;
  }, [lang, breakEven, effective]);

  return <UPlotChart data={data} build={build} height={height} />;
}
