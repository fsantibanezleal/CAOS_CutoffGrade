import { useCallback, useMemo } from 'react';
import type uPlot from 'uplot';
import { type SchedulePointRec } from '../lib/contract.types.ts';
import { themeColors, UPlotChart } from './UPlotChart.tsx';

/** The annual cashflow ($M) + the cumulative discounted value (NPV build-up) over the mine life. */
export function CashChart({ schedule, discountRate, lang = 'en', height = 240 }: {
  schedule: SchedulePointRec[]; discountRate: number; lang?: 'en' | 'es'; height?: number;
}) {
  const data = useMemo<uPlot.AlignedData>(() => {
    const yrs = schedule.map((s) => s.year);
    const cf = schedule.map((s) => s.cashflow);
    let cum = 0;
    const cumNpv = schedule.map((s) => { cum += s.cashflow / Math.pow(1 + discountRate, s.year); return cum; });
    return [yrs, cf, cumNpv];
  }, [schedule, discountRate]);

  const build = useCallback((w: number, h: number): uPlot.Options => {
    const c = themeColors();
    return {
      width: w, height: h,
      scales: { x: { time: false }, y: {}, n: {} },
      axes: [
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'año' : 'year' },
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: 'cashflow ($M)' },
        { scale: 'n', side: 1, stroke: c.accent, grid: { show: false }, label: lang === 'es' ? 'VAN acum. ($M)' : 'cum. NPV ($M)' },
      ],
      series: [
        {},
        { label: lang === 'es' ? 'cashflow anual' : 'annual cashflow', stroke: c.good, width: 2, fill: c.good + '22' },
        { label: lang === 'es' ? 'VAN acumulado' : 'cumulative NPV', stroke: c.accent, width: 2, scale: 'n' },
      ],
    } as uPlot.Options;
  }, [lang, discountRate]);

  return <UPlotChart data={data} build={build} height={height} />;
}
