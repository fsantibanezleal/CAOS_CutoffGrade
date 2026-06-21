import { useEffect, useState } from 'react';
import { useShellLang } from '@fasl-work/caos-app-shell';
import { loadCaseResults, loadLearned, type LearnedFile } from '../lib/artifacts.ts';
import type { CaseResultsFile } from '../lib/contract.types.ts';

const pct = (g: number) => `${(g * 100).toFixed(3)}%`;
const money = (v: number) => `$${Math.round(v).toLocaleString()}M`;

export default function Benchmark() {
  const es = useShellLang() === 'es';
  const [data, setData] = useState<CaseResultsFile | null>(null);
  const [learned, setLearned] = useState<LearnedFile | null>(null);
  useEffect(() => { loadCaseResults().then(setData).catch(() => setData(null)); }, []);
  useEffect(() => { loadLearned().then(setLearned).catch(() => setLearned(null)); }, []);

  if (!data) return <article className="page-body prose"><h1>Benchmark</h1><p className="pf-note">{es ? 'cargando…' : 'loading…'}</p></article>;

  const cases = data.cases;
  const scen = ['S-LOWPRICE', 'S-BASE', 'S-HIGHPRICE'];

  return (
    <article className="page-body prose">
      <h1>Benchmark</h1>
      <p className="lede">{es ? 'Comparaciones cross-case — las que NO dependen de un solo caso viven aquí (no en el App). Todas vienen del bake del motor TS.' : 'Cross-case comparisons — the ones that do NOT depend on a single case live here (not in the App). All come from the TS-engine bake.'}</p>

      <h2>{es ? 'VAN vs precio (sensibilidad)' : 'NPV vs price (sensitivity)'}</h2>
      <table className="cmp-table">
        <thead><tr><th>{es ? 'escenario' : 'scenario'}</th><th>{es ? 'precio' : 'price'}</th><th>VAN</th><th>{es ? 'corte medio' : 'mean cut-off'}</th><th>{es ? 'vida' : 'life'}</th></tr></thead>
        <tbody>
          {scen.map((id) => cases[id] && (
            <tr key={id}><td><b>{id}</b></td><td>${Math.round(cases[id].econ.price).toLocaleString()}/t</td><td>{money(cases[id].optimal.npv)}</td><td>{pct(cases[id].optimal.meanCutoff)}</td><td>{cases[id].optimal.lifeYears}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="pf-note">{es ? 'VAN monótono en precio (la propiedad de cordura). Un precio más alto baja el break-even → más es mineral → más VAN.' : 'NPV monotone in price (the sanity property). A higher price lowers the break-even → more is ore → more NPV.'}</p>

      <h2>{es ? 'Corte vs restricción binding' : 'Cut-off vs the binding stage'}</h2>
      <table className="cmp-table">
        <thead><tr><th>{es ? 'caso' : 'case'}</th><th>{es ? 'restricción' : 'binding'}</th><th>break-even</th><th>{es ? 'corte medio' : 'mean cut-off'}</th><th>{es ? 'uplift high-grading' : 'high-grading uplift'}</th></tr></thead>
        <tbody>
          {['K-MINE', 'K-MILL', 'K-MARKET'].map((id) => cases[id] && (
            <tr key={id}><td><b>{id}</b></td><td>{cases[id].binding}</td><td>{pct(cases[id].breakEven)}</td><td>{pct(cases[id].optimal.meanCutoff)}</td><td>{cases[id].npvUpliftPct.toFixed(2)}%</td></tr>
          ))}
        </tbody>
      </table>
      <p className="pf-note">{es ? 'Mina-limitada → corte cerca del break-even (tiempo de molino libre). Molino/mercado-limitada → corte elevado por el costo de oportunidad f+F·δ.' : 'Mine-limited → cut-off near break-even (mill time is free). Mill/market-limited → cut-off raised by the f+F·δ opportunity cost.'}</p>

      <h2>{es ? 'Modelos aprendidos vs el optimizador exacto' : 'Learned models vs the exact optimizer'}</h2>
      {learned ? (
        <table className="cmp-table">
          <thead><tr><th>{es ? 'modelo' : 'model'}</th><th>{es ? 'métrica (held-out)' : 'metric (held-out)'}</th><th>{es ? 'valor' : 'value'}</th></tr></thead>
          <tbody>
            <tr><td>{es ? 'surrogate corte/VAN' : 'cut-off/NPV surrogate'}</td><td>{es ? 'error VAN vs exacto' : 'NPV err vs exact'}</td><td><b>{(learned.surrogate.npv_err * 100).toFixed(1)}%</b></td></tr>
            <tr><td>{es ? 'OOD de escenarios' : 'scenario OOD-AE'}</td><td>AUC</td><td><b>{learned.ood.auc.toFixed(3)}</b></td></tr>
          </tbody>
        </table>
      ) : (
        <p className="pf-note">{es ? 'Modelos aprendidos pendientes — corre `python -m cglab.pipeline all --retrain`. El optimizador EXACTO de Lane corre en vivo mientras tanto.' : 'Learned models pending — run `python -m cglab.pipeline all --retrain`. The EXACT Lane optimizer runs live meanwhile.'}</p>
      )}
    </article>
  );
}
