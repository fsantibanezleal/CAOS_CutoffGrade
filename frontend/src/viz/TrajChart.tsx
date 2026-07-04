import { useCallback, useMemo } from 'react';
import type uPlot from 'uplot';
import { type SchedulePointRec } from '../lib/contract.types.ts';
import { themeColors, UPlotChart } from './UPlotChart.tsx';

/** The optimal cut-off trajectory + the ore grade over the mine life, Lane's high-grading: the cut-off starts high
 * and DECLINES toward break-even as the reserve depletes (the opportunity cost F·δ falls). */
export function TrajChart({ schedule, lang = 'en', height = 240 }: {
  schedule: SchedulePointRec[]; lang?: 'en' | 'es'; height?: number;
}) {
  const data = useMemo<uPlot.AlignedData>(() => {
    const yrs = schedule.map((s) => s.year);
    const cut = schedule.map((s) => s.cutoff * 100);
    const grade = schedule.map((s) => s.oreGrade * 100);
    return [yrs, cut, grade];
  }, [schedule]);

  const build = useCallback((w: number, h: number): uPlot.Options => {
    const c = themeColors();
    return {
      width: w, height: h,
      scales: { x: { time: false }, y: {} },
      axes: [
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'año' : 'year' },
        { stroke: c.subtle, grid: { stroke: c.border, width: 1 }, label: lang === 'es' ? 'ley (%)' : 'grade (%)' },
      ],
      series: [
        {},
        { label: lang === 'es' ? 'ley de corte' : 'cut-off', stroke: c.bad, width: 2 },
        { label: lang === 'es' ? 'ley del mineral' : 'ore grade', stroke: c.good, width: 2, dash: [5, 3] },
      ],
    } as uPlot.Options;
  }, [lang]);

  return <UPlotChart data={data} build={build} height={height} />;
}
