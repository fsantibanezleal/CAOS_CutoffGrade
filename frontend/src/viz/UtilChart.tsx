import { useCallback, useMemo } from 'react';
import type uPlot from 'uplot';
import { type SchedulePointRec } from '../lib/contract.types.ts';
import { themeColors, UPlotChart } from './UPlotChart.tsx';

/** Per-year capacity utilisation of the three stages, which one is saturated (binding) each year.
 * mine = mined/M, mill = ore/H, market = metal/K (metal = ore·grade·recovery). The binding stage rides at 100%;
 * the others have slack. This is why the cut-off changes when a different stage binds. Live from the schedule. */
export function UtilChart({ schedule, mineCapacity, millCapacity, marketCapacity, recovery, lang = 'en', height = 240 }: {
  schedule: SchedulePointRec[]; mineCapacity: number; millCapacity: number; marketCapacity: number;
  recovery: number; lang?: 'en' | 'es'; height?: number;
}) {
  const data = useMemo<uPlot.AlignedData>(() => {
    const yrs = schedule.map((s) => s.year);
    const mine = schedule.map((s) => (s.minedMt / mineCapacity) * 100);
    const mill = schedule.map((s) => (s.oreMt / millCapacity) * 100);
    const market = schedule.map((s) => ((s.oreMt * s.oreGrade * recovery) / marketCapacity) * 100);
    const full = yrs.map(() => 100);
    return [yrs, mine, mill, market, full];
  }, [schedule, mineCapacity, millCapacity, marketCapacity, recovery]);

  const build = useCallback((w: number, h: number): uPlot.Options => {
    const c = themeColors();
    return {
      width: w, height: h,
      scales: { x: { time: false }, y: { range: [0, 105] } },
      axes: [
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'año' : 'year' },
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'utilización (%)' : 'utilisation (%)' },
      ],
      series: [
        {},
        { label: lang === 'es' ? 'mina' : 'mine', stroke: c.accent, width: 2 },
        { label: lang === 'es' ? 'molino' : 'mill', stroke: c.good, width: 2 },
        { label: lang === 'es' ? 'mercado' : 'market', stroke: c.bad, width: 2 },
        { label: lang === 'es' ? 'saturación (binding)' : 'saturation (binding)', stroke: c.warn, width: 1.2, dash: [4, 3] },
      ],
    } as uPlot.Options;
  }, [lang]);

  return <UPlotChart data={data} build={build} height={height} />;
}
