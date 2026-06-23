import { useEffect, useMemo, useState } from 'react';
import { Tabs, useShellLang } from '@fasl-work/caos-app-shell';
import { analyze, type Economics } from '../lane/index.ts';
import { CASES, caseById, type CGCase } from '../lane/cases.ts';
import { runOod, runSurrogate, surrogateAvailable } from '../lib/ort.ts';
import { loadLearned, type LearnedFile } from '../lib/artifacts.ts';
import { GTChart } from '../viz/GTChart.tsx';
import { TrajChart } from '../viz/TrajChart.tsx';
import { CashChart } from '../viz/CashChart.tsx';

const CATS = [
  'capacity regime (the binding stage)',
  'economic scenario (price/cost regime)',
  'deposit type (grade variability)',
  'oracle control (closed-form check)',
];

const pct = (g: number, n = 3) => `${(g * 100).toFixed(n)}%`;
const money = (v: number) => `$${Math.round(v).toLocaleString()}M`;

export default function Tool() {
  const lang = useShellLang();
  const es = lang === 'es';
  const [caseId, setCaseId] = useState('S-BASE');
  const [priceMul, setPriceMul] = useState(1);
  const [costMul, setCostMul] = useState(1);
  const [millMul, setMillMul] = useState(1);
  const [discMul, setDiscMul] = useState(1);
  const [learned, setLearned] = useState<LearnedFile | null>(null);
  const [surr, setSurr] = useState<{ cutoff: number; npv: number; life: number } | null>(null);
  const [ood, setOod] = useState<number | null>(null);
  // model availability is checked ONCE (a HEAD probe; both ONNX models ship together) and drives the pending-vs-ready
  // gate — separate from the per-recompute inference, so a trained+served model never flashes "pending training".
  const [modelsPresent, setModelsPresent] = useState<boolean | null>(null);   // null = checking · false = absent · true = served
  const oodThr = learned?.ood?.thr ?? null;

  const theCase = useMemo<CGCase>(() => caseById(caseId), [caseId]);
  const econ = useMemo<Economics>(() => ({
    ...theCase.econ,
    price: theCase.econ.price * priceMul,
    processingCost: theCase.econ.processingCost * costMul,
    millCapacity: theCase.econ.millCapacity * millMul,
    discountRate: theCase.econ.discountRate * discMul,
  }), [theCase, priceMul, costMul, millMul, discMul]);

  const a = useMemo(() => analyze(econ, theCase.deposit), [econ, theCase]);

  useEffect(() => { setPriceMul(1); setCostMul(1); setMillMul(1); setDiscMul(1); }, [caseId]);
  useEffect(() => { loadLearned().then(setLearned).catch(() => setLearned(null)); }, []);
  useEffect(() => { surrogateAvailable().then(setModelsPresent).catch(() => setModelsPresent(false)); }, []);
  useEffect(() => {
    let cancel = false;
    runSurrogate(econ, theCase.deposit).then((r) => { if (cancel) return; setSurr(r); });
    runOod(econ, theCase.deposit).then((m) => { if (!cancel) setOod(m); });
    return () => { cancel = true; };
  }, [econ, theCase]);

  const Kpi = ({ label, value }: { label: string; value: string }) => (
    <div className="cg-kpi"><div className="cg-kpi-v">{value}</div><div className="cg-kpi-l">{label}</div></div>
  );
  const cut = a.cutoffs;
  const firstCut = a.optimal.schedule[0]?.cutoff ?? 0;

  const tabs = [
    {
      id: 'gt', label: es ? 'Curva ley-tonelaje' : 'Grade-tonnage',
      content: (
        <div className="cg-vizstack">
          <div className="cg-plot-t">{es ? 'Curva ley-tonelaje — fracción mineral + ley media vs la ley de corte. Líneas: break-even (ámbar), corte óptimo (rojo).' : 'Grade-tonnage curve — ore fraction + average grade vs the cut-off. Lines: break-even (amber), optimal cut-off (red).'}</div>
          <GTChart curve={a.gradeTonnage} breakEven={a.breakEven} effective={cut.effective} lang={lang} />
          <div className="cg-kpis">
            <Kpi label={es ? 'VAN óptimo' : 'optimal NPV'} value={money(a.optimal.npv)} />
            <Kpi label={es ? 'vida (años)' : 'life (yr)'} value={`${a.optimal.lifeYears}`} />
            <Kpi label={es ? 'corte medio' : 'mean cut-off'} value={pct(a.optimal.meanCutoff)} />
            <Kpi label="break-even" value={pct(a.breakEven)} />
            <Kpi label={es ? 'restricción' : 'binding'} value={a.binding} />
          </div>
        </div>
      ),
    },
    {
      id: 'traj', label: es ? 'Trayectoria de corte' : 'Cut-off trajectory',
      content: (
        <div className="cg-vizstack">
          <div className="cg-plot-t">{es ? 'La política óptima de Lane: el corte parte alto y DECRECE hacia el break-even al agotarse la reserva (high-grading).' : 'The Lane optimal policy: the cut-off starts high and DECLINES toward break-even as the reserve depletes (high-grading).'}</div>
          <TrajChart schedule={a.optimal.schedule} lang={lang} />
          <p className="cg-note">{es
            ? `El corte cae de ${pct(firstCut)} (año 1) hacia el break-even ${pct(a.breakEven)}. El uplift de VAN del high-grading vs el mejor corte constante es ${a.npvUpliftPct.toFixed(2)}%.`
            : `The cut-off falls from ${pct(firstCut)} (year 1) toward break-even ${pct(a.breakEven)}. The high-grading NPV uplift over the best constant cut-off is ${a.npvUpliftPct.toFixed(2)}%.`}</p>
        </div>
      ),
    },
    {
      id: 'cash', label: es ? 'Flujo de caja' : 'Cashflow',
      content: (
        <div className="cg-vizstack">
          <div className="cg-plot-t">{es ? 'Flujo de caja anual ($M) + el VAN acumulado descontado sobre la vida de la mina.' : 'Annual cashflow ($M) + the cumulative discounted value (NPV build-up) over the mine life.'}</div>
          <CashChart schedule={a.optimal.schedule} discountRate={econ.discountRate} lang={lang} />
        </div>
      ),
    },
    {
      id: 'lane', label: es ? 'Cortes de Lane' : 'Lane cut-offs',
      content: (
        <div className="cg-vizstack">
          <div className="cg-plot-t">{es ? 'Los seis cortes característicos de Lane (al costo de oportunidad de inicio de vida).' : 'The six characteristic Lane cut-offs (at the start-of-life opportunity cost).'}</div>
          <table className="cmp-table">
            <thead><tr><th>{es ? 'tipo' : 'kind'}</th><th>{es ? 'limitante' : 'limiting'}</th><th>{es ? 'balanceador' : 'balancing'}</th></tr></thead>
            <tbody>
              <tr><td>{es ? 'mina' : 'mine'}</td><td>{pct(cut.gMine)}</td><td>{es ? 'mina-molino' : 'mine-mill'} {pct(cut.gMineMill)}</td></tr>
              <tr><td>{es ? 'molino' : 'mill'}</td><td>{pct(cut.gMill)}</td><td>{es ? 'molino-mercado' : 'mill-market'} {pct(cut.gMillMarket)}</td></tr>
              <tr><td>{es ? 'mercado' : 'market'}</td><td>{pct(cut.gMarket)}</td><td>{es ? 'mina-mercado' : 'mine-market'} {pct(cut.gMineMarket)}</td></tr>
            </tbody>
          </table>
          <div className="cg-kpis">
            <Kpi label={es ? 'corte efectivo' : 'effective cut-off'} value={pct(cut.effective)} />
            <Kpi label={es ? 'restricción' : 'binding'} value={cut.binding} />
            <Kpi label="break-even" value={pct(a.breakEven)} />
          </div>
        </div>
      ),
    },
    {
      id: 'sens', label: es ? 'Sensibilidad' : 'Sensitivity',
      content: (
        <div className="cg-vizstack">
          <table className="cmp-table">
            <thead><tr><th>{es ? 'parámetro' : 'parameter'}</th><th>VAN (-)</th><th>VAN (base)</th><th>VAN (+)</th><th>{es ? 'corte (-/base/+)' : 'cut-off (-/base/+)'}</th></tr></thead>
            <tbody>
              {a.sensitivity.map((s) => (
                <tr key={s.param}>
                  <td>{s.param}</td>
                  <td>{money(s.npvLo)}</td><td>{money(s.npvBase)}</td><td>{money(s.npvHi)}</td>
                  <td>{pct(s.cutLo, 2)} / {pct(s.cutBase, 2)} / {pct(s.cutHi, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="cg-note">{es ? 'Cada fila aplica un shock relativo (±) al parámetro y re-optimiza con Lane — el valor de la teoría: cuantifica el riesgo económico.' : 'Each row applies a relative (±) shock to the parameter and re-optimizes with Lane — the value of the theory: it quantifies the economic risk.'}</p>
        </div>
      ),
    },
    {
      id: 'vs', label: es ? 'Lane vs constante' : 'Lane vs constant',
      content: (
        <div className="cg-vizstack">
          <table className="cmp-table">
            <thead><tr><th>{es ? 'política' : 'policy'}</th><th>{es ? 'corte' : 'cut-off'}</th><th>VAN</th></tr></thead>
            <tbody>
              <tr><td><b>{es ? 'Lane (decreciente)' : 'Lane (declining)'}</b></td><td>{pct(a.optimal.meanCutoff)} {es ? '(medio)' : '(mean)'}</td><td><b>{money(a.optimal.npv)}</b></td></tr>
              <tr><td>{es ? 'mejor constante' : 'best constant'}</td><td>{pct(a.constant.cutoff)}</td><td>{money(a.constant.npv)}</td></tr>
            </tbody>
          </table>
          <p className="cg-note">{es
            ? `El high-grading de Lane añade ${a.npvUpliftPct.toFixed(2)}% de VAN sobre el mejor corte constante. Cuanto más variable la ley, mayor el uplift.`
            : `The Lane high-grading adds ${a.npvUpliftPct.toFixed(2)}% NPV over the best constant cut-off. The more variable the grade, the larger the uplift.`}</p>
        </div>
      ),
    },
    {
      id: 'whatif', label: es ? 'What-if (ONNX)' : 'What-if (ONNX)',
      content: (
        <div className="cg-vizstack">
          <div className="cg-plot-t">{es ? 'El surrogate de corte/VAN (ONNX) emula el optimizador de Lane para barridos instantáneos del envolvente económico.' : 'The cut-off/NPV surrogate (ONNX) emulates the Lane optimizer for instant economic-envelope sweeps.'}</div>
          {modelsPresent === null ? (
            <div className="cg-pending"><strong>{es ? 'Cargando el surrogate…' : 'Loading the surrogate…'}</strong></div>
          ) : modelsPresent === false ? (
            <div className="cg-pending">
              <strong>{es ? 'Surrogate: no entrenado' : 'Surrogate: not trained'}</strong>
              <p>{es ? 'Corre `python -m cglab.pipeline all --retrain` para entrenar el surrogate (torch → ONNX). El optimizador EXACTO de Lane corre en vivo mientras tanto.' : 'Run `python -m cglab.pipeline all --retrain` to train the surrogate (torch → ONNX). The EXACT Lane optimizer runs live meanwhile.'}</p>
            </div>
          ) : (
            <>
              <div className="cg-kpis">
                <Kpi label={es ? 'corte (surrogate)' : 'cut-off (surrogate)'} value={surr ? pct(surr.cutoff) : '…'} />
                <Kpi label={es ? 'corte (exacto)' : 'cut-off (exact)'} value={pct(cut.effective)} />
                <Kpi label={es ? 'VAN (surrogate)' : 'NPV (surrogate)'} value={surr ? money(surr.npv) : '…'} />
                <Kpi label={es ? 'VAN (exacto)' : 'NPV (exact)'} value={money(a.optimal.npv)} />
                <Kpi label={es ? 'error VAN' : 'NPV error'} value={surr ? `${(Math.abs(surr.npv - a.optimal.npv) / Math.max(1, Math.abs(a.optimal.npv)) * 100).toFixed(1)}%` : '…'} />
              </div>
              <p className="cg-note">{es ? 'El optimizador exacto de Lane es la autoridad; el surrogate gana su lugar por la velocidad (barridos Monte-Carlo instantáneos sobre miles de escenarios), no por una victoria fabricada.' : 'The exact Lane optimizer is the authority; the surrogate earns its place on speed (instant Monte-Carlo sweeps over thousands of scenarios), not a fabricated win.'}</p>
              {learned && <p className="cg-cap cg-muted">{es ? 'Entrenado + en vivo' : 'Trained + live'} · {es ? 'error VAN held-out' : 'held-out NPV err'} {(learned.surrogate.npv_err * 100).toFixed(1)}% · {es ? 'error corte' : 'cut-off err'} {(learned.surrogate.cutoff_err * 100).toFixed(1)}% (n={learned.surrogate.nEval})</p>}
            </>
          )}
        </div>
      ),
    },
    {
      id: 'anomaly', label: es ? 'Anomalía (AE)' : 'Anomaly (AE)',
      content: (
        <div className="cg-vizstack">
          <div className="cg-plot-t">{es ? 'El autoencoder OOD marca escenarios fuera del envolvente económico entrenado (precios/costos/leyes extremos) — el guardia en vivo de "el surrogate está extrapolando".' : 'The OOD autoencoder flags scenarios outside the trained economic envelope (extreme prices/costs/grades) — the live "the surrogate is extrapolating" guard.'}</div>
          {modelsPresent === null ? (
            <div className="cg-pending"><strong>{es ? 'Cargando el autoencoder…' : 'Loading the autoencoder…'}</strong></div>
          ) : modelsPresent === false ? (
            <div className="cg-pending">
              <strong>{es ? 'Autoencoder OOD: no entrenado' : 'OOD autoencoder: not trained'}</strong>
              <p>{es ? 'Entrénalo con `--retrain`. Mientras tanto, el optimizador exacto de Lane corre en vivo y las banderas del Contrato 1 (en los docs) son el guardia honesto.' : 'Train it with `--retrain`. Meanwhile the exact Lane optimizer runs live and the Contract-1 flags (in the docs) are the honest guard.'}</p>
            </div>
          ) : (
            <>
              <div className="cg-kpis">
                <Kpi label={es ? 'puntaje de anomalía' : 'anomaly score'} value={ood != null ? ood.toFixed(2) : '…'} />
                {oodThr != null && <Kpi label={es ? 'umbral (p95 in-dist)' : 'threshold (in-dist p95)'} value={oodThr.toFixed(2)} />}
                {oodThr != null && ood != null && (
                  <Kpi label={es ? 'veredicto' : 'verdict'} value={ood > oodThr ? (es ? 'fuera de envolvente' : 'off-envelope') : (es ? 'en envolvente' : 'in-envelope')} />
                )}
              </div>
              {oodThr != null && ood != null && (
                <p className="cg-note">{ood > oodThr
                  ? (es ? 'El escenario está fuera del envolvente entrenado — el surrogate está extrapolando; confía en el optimizador exacto.' : 'The scenario is outside the trained envelope — the surrogate is extrapolating; trust the exact optimizer.')
                  : (es ? 'El escenario está dentro del envolvente entrenado — el surrogate es confiable aquí.' : 'The scenario is inside the trained envelope — the surrogate is reliable here.')}</p>
              )}
              {learned?.ood && <p className="cg-cap cg-muted">{es ? 'Entrenado + en vivo' : 'Trained + live'} · AUC {learned.ood.auc.toFixed(3)} (n={learned.ood.nEval})</p>}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-body cg-layout">
      <aside className="cg-side">
        <div className="cg-card">
          <div className="cg-card-t">{es ? 'Caso' : 'Case'}</div>
          {CATS.map((cat) => (
            <div key={cat} className="cg-catgroup">
              <div className="cg-catlabel">{cat.split(' (')[0]}</div>
              <div className="cg-chips">
                {CASES.filter((c) => c.category === cat).map((c) => (
                  <button key={c.id} className={`chip ${caseId === c.id ? 'on' : ''}`} title={c.name} onClick={() => setCaseId(c.id)}>{c.id}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="cg-cap">{theCase.name}</div>
          <div className="cg-cap cg-muted">{theCase.expectedBand}</div>
        </div>
        <div className="cg-card">
          <div className="cg-card-t">{es ? 'Economía (en vivo)' : 'Economics (live)'}</div>
          <label className="cg-ctl">{es ? 'precio' : 'price'}: ${Math.round(econ.price).toLocaleString()}/t (×{priceMul.toFixed(2)})
            <input className="range" type="range" min={0.5} max={1.6} step={0.02} value={priceMul} onChange={(e) => setPriceMul(+e.target.value)} />
          </label>
          <label className="cg-ctl">{es ? 'costo proceso' : 'processing cost'}: ×{costMul.toFixed(2)}
            <input className="range" type="range" min={0.5} max={1.8} step={0.02} value={costMul} onChange={(e) => setCostMul(+e.target.value)} />
          </label>
          <label className="cg-ctl">{es ? 'capacidad molino' : 'mill capacity'}: ×{millMul.toFixed(2)}
            <input className="range" type="range" min={0.5} max={1.6} step={0.02} value={millMul} onChange={(e) => setMillMul(+e.target.value)} />
          </label>
          <label className="cg-ctl">{es ? 'tasa descuento δ' : 'discount rate δ'}: {(econ.discountRate * 100).toFixed(1)}%
            <input className="range" type="range" min={0} max={2} step={0.05} value={discMul} onChange={(e) => setDiscMul(+e.target.value)} />
          </label>
        </div>
      </aside>
      <main className="cg-main">
        <Tabs tabs={tabs} ariaLabel={es ? 'vistas de la optimización' : 'optimization views'} />
      </main>
    </div>
  );
}
