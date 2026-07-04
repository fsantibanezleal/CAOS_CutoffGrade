import { useEffect, useState } from 'react';
import { Cite, Refs, useShellLang } from '@fasl-work/caos-app-shell';
import { loadCaseResults } from '../lib/artifacts.ts';
import type { CaseResultsFile } from '../lib/contract.types.ts';

const pct = (g: number) => `${(g * 100).toFixed(3)}%`;
const money = (v: number) => `$${Math.round(v).toLocaleString()}M`;

export default function Experiments() {
  const es = useShellLang() === 'es';
  const [data, setData] = useState<CaseResultsFile | null>(null);
  useEffect(() => { loadCaseResults().then(setData).catch(() => setData(null)); }, []);

  if (!data) return <article className="page-body prose"><h1>{es ? 'Experimentos' : 'Experiments'}</h1><p className="cg-note">{es ? 'cargando casos…' : 'loading cases…'}</p></article>;

  return (
    <article className="page-body prose">
      <h1>{es ? 'Experimentos' : 'Experiments'}</h1>
      <p className="lede">{es ? 'Los 10 casos baked por el motor de Lane, por categoría. El App muestra un caso; aquí están todos, con su corte óptimo, VAN, vida y restricción.' : 'The 10 cases baked by the Lane engine, by category. The App shows one case; here are all of them, with their optimal cut-off, NPV, life and binding constraint.'}</p>
      <table className="cmp-table">
        <thead><tr>
          <th>{es ? 'caso' : 'case'}</th><th>{es ? 'categoría' : 'category'}</th>
          <th>break-even</th><th>{es ? 'corte medio' : 'mean cut-off'}</th><th>VAN</th><th>{es ? 'vida' : 'life'}</th>
          <th>{es ? 'restricción' : 'binding'}</th><th>{es ? 'uplift' : 'uplift'}</th>
        </tr></thead>
        <tbody>
          {Object.entries(data.cases).map(([id, c]) => (
            <tr key={id}>
              <td><b>{id}</b></td>
              <td>{c.category.split(' (')[0]}</td>
              <td>{pct(c.breakEven)}</td>
              <td>{pct(c.optimal.meanCutoff)}</td>
              <td>{money(c.optimal.npv)}</td>
              <td>{c.optimal.lifeYears}</td>
              <td>{c.binding}</td>
              <td>{c.npvUpliftPct.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="cg-note">{es ? 'Anclas (controles de forma cerrada que validan el motor contra la teoría de Lane ' : 'Anchors (closed-form controls validating the engine against Lane theory '}<Cite id="lane1988" paren />{es ? '): C-BREAKEVEN, el corte óptimo iguala al break-even (sin costo temporal, δ=0). C-UNIFORM, depósito de ley única (todo o nada). S-HIGHPRICE > S-BASE > S-LOWPRICE en VAN.' : '): C-BREAKEVEN, the optimal cut-off equals the break-even (no time cost, δ=0). C-UNIFORM, single-grade deposit (all-or-nothing). S-HIGHPRICE > S-BASE > S-LOWPRICE in NPV.'}</p>
      <Refs ids={['lane1988', 'asad2011']} label="Refs" />
    </article>
  );
}
