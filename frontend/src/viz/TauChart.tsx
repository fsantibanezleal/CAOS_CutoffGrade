import { useCallback, useMemo } from 'react';
import type uPlot from 'uplot';
import { type SchedulePointRec } from '../lib/contract.types.ts';
import { themeColors, UPlotChart } from './UPlotChart.tsx';

/** The opportunity-cost trajectory τ(t) = f + F(t)·δ over the mine life, the driver of high-grading.
 * F(t) is the NPV of the remaining operation from year t (Σ future cashflows discounted to t); occupying a year of
 * the binding capacity forgoes that, so the cut-off is raised by τ. As the reserve depletes F→0 and τ→f, which is why
 * the optimal cut-off declines to break-even. Computed live from the schedule cashflows, reacts to every slider. */
export function TauChart({ schedule, fixedCostYr, discountRate, lang = 'en', height = 240 }: {
  schedule: SchedulePointRec[]; fixedCostYr: number; discountRate: number; lang?: 'en' | 'es'; height?: number;
}) {
  const data = useMemo<uPlot.AlignedData>(() => {
    const n = schedule.length;
    const yrs = schedule.map((s) => s.year);
    // F(t) = NPV of the remaining operation from year t = Σ_{s≥t} cashflow_s / (1+δ)^(s−t)
    const F = new Array<number>(n).fill(0);
    for (let t = n - 1; t >= 0; t--) {
      const future = t + 1 < n ? F[t + 1] : 0;
      F[t] = schedule[t].cashflow + future / (1 + discountRate);
    }
    const tau = F.map((Ft) => fixedCostYr + Ft * discountRate); // τ = f + F·δ ($M/yr of binding capacity)
    const fBase = yrs.map(() => fixedCostYr);
    return [yrs, tau, fBase];
  }, [schedule, fixedCostYr, discountRate]);

  const build = useCallback((w: number, h: number): uPlot.Options => {
    const c = themeColors();
    return {
      width: w, height: h,
      scales: { x: { time: false }, y: {} },
      axes: [
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'año' : 'year' },
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'τ = f + F·δ ($M/año)' : 'τ = f + F·δ ($M/yr)' },
      ],
      series: [
        {},
        { label: lang === 'es' ? 'costo de oportunidad τ' : 'opportunity cost τ', stroke: c.accent, width: 2 },
        { label: lang === 'es' ? 'costo fijo f (τ → f al final)' : 'fixed cost f (τ → f at end)', stroke: c.warn, width: 1.4, dash: [4, 3] },
      ],
    } as uPlot.Options;
  }, [lang]);

  return <UPlotChart data={data} build={build} height={height} />;
}
