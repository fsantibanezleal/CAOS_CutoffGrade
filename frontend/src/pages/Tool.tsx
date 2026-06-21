import { useEffect, useMemo, useState } from 'react';
import { Tabs, useShellLang } from '@fasl-work/caos-app-shell';
import { analyze, type Economics } from '../lane/index.ts';
import { CASES, caseById, type CGCase } from '../lane/cases.ts';
import { runSurrogate } from '../lib/ort.ts';
import { loadLearned, loadManifest, type LearnedFile } from '../lib/artifacts.ts';
import type { CaseManifest } from '../lib/contract.types.ts';
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
  const [useSurrogate, setUseSurrogate] = useState(false);
  const [manifest, setManifest] = useState<CaseManifest | null>(null);
  const [learned, setLearned] = useState<LearnedFile | null>(null);
  const [surr, setSurr] = useState<{ cutoff: number; npv: number; life: number } | null>(null);
  const [surrPending, setSurrPending] = useState(true);

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
  useEffect(() => { loadManifest(caseId).then(setManifest).catch(() => setManifest(null)); }, [caseId]);
  useEffect(() => { loadLearned().then(setLearned).catch(() => setLearned(null)); }, []);
  useEffect(() => {
    let cancel = false;
    setSurrPending(true);
    runSurrogate(econ, theCase.deposit).then((r) => { if (cancel) return; setSurr(r); setSurrPending(r === null); });
    return () => { cancel = true; };
  }, [econ, theCase]);

  const Kpi = ({ label, value }: { label: string; value: string }) => (
    <div className="pf-kpi"><div className="pf-kpi-v">{value}</div><div className="pf-kpi-l">{label}</div></div>
  );
  const cut = a.cutoffs;
  const firstCut = a.optimal.schedule[0]?.cutoff ?? 0;

  const tabs = [
    {
      id: 'gt', label: es ? 'Curva ley-tonelaje' : 'Grade-tonnage',
      content: (
        <div className="pf-vizstack">
          <div className="pf-plot-t">{es ? 'Curva ley-tonelaje — fracción mineral + ley media vs la ley de corte. Líneas: break-even (ámbar), corte óptimo (rojo).' : 'Grade-tonnage curve — ore fraction + average grade vs the cut-off. Lines: break-even (amber), optimal cut-off (red).'}</div>
          <GTChart curve={a.gradeTonnage} breakEven={a.breakEven} effective={cut.effective} lang={lang} />
          <div className="pf-kpis">
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
        <div className="pf-vizstack">
          <div className="pf-plot-t">{es ? 'La política óptima de Lane: el corte parte alto y DECRECE hacia el break-even al agotarse la reserva (high-grading).' : 'The Lane optimal policy: the cut-off starts high and DECLINES toward break-even as the reserve depletes (high-grading).'}</div>
          <TrajChart schedule={a.optimal.schedule} lang={lang} />
          <p className="pf-note">{es
            ? `El corte cae de ${pct(firstCut)} (año 1) hacia el break-even ${pct(a.breakEven)}. El uplift de VAN del high-grading vs el mejor corte constante es ${a.npvUpliftPct.toFixed(2)}%.`
            : `The cut-off falls from ${pct(firstCut)} (year 1) toward break-even ${pct(a.breakEven)}. The high-grading NPV uplift over the best constant cut-off is ${a.npvUpliftPct.toFixed(2)}%.`}</p>
        </div>
      ),
    },
    {
      id: 'cash', label: es ? 'Flujo de caja' : 'Cashflow',
      content: (
        <div className="pf-vizstack">
          <div className="pf-plot-t">{es ? 'Flujo de caja anual ($M) + el VAN acumulado descontado sobre la vida de la mina.' : 'Annual cashflow ($M) + the cumulative discounted value (NPV build-up) over the mine life.'}</div>
          <CashChart schedule={a.optimal.schedule} discountRate={econ.discountRate} lang={lang} />
        </div>
      ),
    },
    {
      id: 'lane', label: es ? 'Cortes de Lane' : 'Lane cut-offs',
      content: (
        <div className="pf-vizstack">
          <div className="pf-plot-t">{es ? 'Los seis cortes característicos de Lane (al costo de oportunidad de inicio de vida).' : 'The six characteristic Lane cut-offs (at the start-of-life opportunity cost).'}</div>
          <table className="cmp-table">
            <thead><tr><th>{es ? 'tipo' : 'kind'}</th><th>{es ? 'limitante' : 'limiting'}</th><th>{es ? 'balanceador' : 'balancing'}</th></tr></thead>
            <tbody>
              <tr><td>{es ? 'mina' : 'mine'}</td><td>{pct(cut.gMine)}</td><td>{es ? 'mina-molino' : 'mine-mill'} {pct(cut.gMineMill)}</td></tr>
              <tr><td>{es ? 'molino' : 'mill'}</td><td>{pct(cut.gMill)}</td><td>{es ? 'molino-mercado' : 'mill-market'} {pct(cut.gMillMarket)}</td></tr>
              <tr><td>{es ? 'mercado' : 'market'}</td><td>{pct(cut.gMarket)}</td><td>{es ? 'mina-mercado' : 'mine-market'} {pct(cut.gMineMarket)}</td></tr>
            </tbody>
          </table>
          <div className="pf-kpis">
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
        <div className="pf-vizstack">
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
          <p className="pf-note">{es ? 'Cada fila aplica un shock relativo (±) al parámetro y re-optimiza con Lane — el valor de la teoría: cuantifica el riesgo económico.' : 'Each row applies a relative (±) shock to the parameter and re-optimizes with Lane — the value of the theory: it quantifies the economic risk.'}</p>
        </div>
      ),
    },
    {
      id: 'vs', label: es ? 'Lane vs constante' : 'Lane vs constant',
      content: (
        <div className="pf-vizstack">
          <table className="cmp-table">
            <thead><tr><th>{es ? 'política' : 'policy'}</th><th>{es ? 'corte' : 'cut-off'}</th><th>VAN</th></tr></thead>
            <tbody>
              <tr><td><b>{es ? 'Lane (decreciente)' : 'Lane (declining)'}</b></td><td>{pct(a.optimal.meanCutoff)} {es ? '(medio)' : '(mean)'}</td><td><b>{money(a.optimal.npv)}</b></td></tr>
              <tr><td>{es ? 'mejor constante' : 'best constant'}</td><td>{pct(a.constant.cutoff)}</td><td>{money(a.constant.npv)}</td></tr>
            </tbody>
          </table>
          <p className="pf-note">{es
            ? `El high-grading de Lane añade ${a.npvUpliftPct.toFixed(2)}% de VAN sobre el mejor corte constante. Cuanto más variable la ley, mayor el uplift.`
            : `The Lane high-grading adds ${a.npvUpliftPct.toFixed(2)}% NPV over the best constant cut-off. The more variable the grade, the larger the uplift.`}</p>
        </div>
      ),
    },
    {
      id: 'learned', label: es ? 'Modelos aprendidos' : 'Learned models',
      content: (
        <div className="pf-vizstack">
          {learned ? (
            <>
              <table className="cmp-table">
                <thead><tr><th>{es ? 'modelo' : 'model'}</th><th>{es ? 'métrica (held-out)' : 'metric (held-out)'}</th><th>{es ? 'valor' : 'value'}</th></tr></thead>
                <tbody>
                  <tr><td>{es ? 'surrogate corte/VAN' : 'cut-off/NPV surrogate'}</td><td>{es ? 'error VAN vs exacto' : 'NPV err vs exact'}</td><td><b>{(learned.surrogate.npv_err * 100).toFixed(1)}%</b></td></tr>
                  <tr><td>{es ? 'OOD de escenarios' : 'scenario OOD-AE'}</td><td>AUC</td><td><b>{learned.ood.auc.toFixed(3)}</b></td></tr>
                </tbody>
              </table>
              <p className="pf-note">{surrPending
                ? (es ? 'El ONNX del surrogate aún no está cargado en esta sesión — el App usa el optimizador EXACTO de Lane (barato, corre en vivo).' : 'The surrogate ONNX is not loaded this session — the App uses the EXACT Lane optimizer (cheap, runs live).')
                : (es ? `Surrogate cargado: corte ${surr ? pct(surr.cutoff) : '-'}, VAN ${surr ? money(surr.npv) : '-'} (vs exacto: corte ${pct(cut.effective)}, VAN ${money(a.optimal.npv)}).` : `Surrogate loaded: cut-off ${surr ? pct(surr.cutoff) : '-'}, NPV ${surr ? money(surr.npv) : '-'} (vs exact: cut-off ${pct(cut.effective)}, NPV ${money(a.optimal.npv)}).`)}</p>
              <p className="pf-cap">{learned.honesty}</p>
            </>
          ) : (
            <div className="pf-pending">
              <strong>{es ? 'Modelos aprendidos: pendientes de entrenamiento' : 'Learned models: pending training'}</strong>
              <p>{es ? 'Corre `python -m cglab.pipeline all --retrain` para entrenar el surrogate de corte/VAN + el OOD-AE (torch -> ONNX). El App usa el optimizador EXACTO de Lane EN VIVO mientras tanto.' : 'Run `python -m cglab.pipeline all --retrain` to train the cut-off/NPV surrogate + the OOD-AE (torch -> ONNX). The App uses the EXACT Lane optimizer LIVE meanwhile.'}</p>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'contract', label: es ? 'Contrato · gate' : 'Contract · gate',
      content: (
        <div className="pf-vizstack">
          {manifest ? (
            <>
              <div className="pf-kpis">
                <Kpi label="lane" value={manifest.lane} />
                <Kpi label="runtimes" value={manifest.gate.runtimes.join(', ')} />
                <Kpi label={es ? 'bytes traza' : 'trace bytes'} value={`${manifest.gate.trace_bytes}`} />
              </div>
              {manifest.flags.length > 0 && <p className="pf-note">flags: {JSON.stringify(manifest.flags)}</p>}
              <p className="pf-note">{manifest.honesty}</p>
            </>
          ) : <p className="pf-note">{es ? 'cargando manifiesto…' : 'loading manifest…'}</p>}
        </div>
      ),
    },
    {
      id: 'byo', label: es ? 'Tus datos' : 'Bring your own',
      content: (
        <div className="pf-vizstack">
          <p className="pf-note">{es
            ? 'CutoffGrade optimiza TU depósito + economía, no solo los casos sintéticos. CONTRATO 1 (data/examples/deposits.csv) valida grade_mean, grade_cv, tonnage_mt, price, los costos, recovery, las 3 capacidades y discount_rate: rechaza precio/capacidades/costos no-positivos, recovery fuera de (0,1], delta fuera de [0,1]; marca margen p-k<=0 (nada es mineral), molino>=mina (el molino nunca limita) y descuentos/CV extremos.'
            : 'CutoffGrade optimizes YOUR deposit + economics, not just the synthetic cases. CONTRACT 1 (data/examples/deposits.csv) validates grade_mean, grade_cv, tonnage_mt, price, the costs, recovery, the 3 capacities and discount_rate: it rejects non-positive price/capacities/costs, recovery outside (0,1], delta outside [0,1]; it flags a p-k<=0 margin (nothing is ore), mill>=mine (the mill never binds) and extreme discount/CV.'}</p>
        </div>
      ),
    },
    {
      id: 'raw', label: es ? 'Traza' : 'Trace',
      content: (
        <pre className="codeblock" style={{ maxHeight: 360 }}>{JSON.stringify({
          case: theCase.id, deposit: theCase.deposit, econ,
          optimal: { npv: a.optimal.npv, lifeYears: a.optimal.lifeYears, meanCutoff: a.optimal.meanCutoff },
          breakEven: a.breakEven, binding: a.binding, cutoffs: cut, npvUpliftPct: a.npvUpliftPct,
        }, null, 2)}</pre>
      ),
    },
  ];

  return (
    <div className="pf-layout">
      <aside className="pf-side">
        <div className="pf-card">
          <div className="pf-card-t">{es ? 'Caso' : 'Case'}</div>
          {CATS.map((cat) => (
            <div key={cat} className="pf-catgroup">
              <div className="pf-catlabel">{cat.split(' (')[0]}</div>
              <div className="pf-chips">
                {CASES.filter((c) => c.category === cat).map((c) => (
                  <button key={c.id} className={`chip ${caseId === c.id ? 'on' : ''}`} title={c.name} onClick={() => setCaseId(c.id)}>{c.id}</button>
                ))}
              </div>
            </div>
          ))}
          <div className="pf-cap">{theCase.name}</div>
          <div className="pf-cap pf-muted">{theCase.expectedBand}</div>
        </div>
        <div className="pf-card">
          <div className="pf-card-t">{es ? 'Economía (en vivo)' : 'Economics (live)'}</div>
          <label className="pf-ctl">{es ? 'precio' : 'price'}: ${Math.round(econ.price).toLocaleString()}/t (×{priceMul.toFixed(2)})
            <input className="range" type="range" min={0.5} max={1.6} step={0.02} value={priceMul} onChange={(e) => setPriceMul(+e.target.value)} />
          </label>
          <label className="pf-ctl">{es ? 'costo proceso' : 'processing cost'}: ×{costMul.toFixed(2)}
            <input className="range" type="range" min={0.5} max={1.8} step={0.02} value={costMul} onChange={(e) => setCostMul(+e.target.value)} />
          </label>
          <label className="pf-ctl">{es ? 'capacidad molino' : 'mill capacity'}: ×{millMul.toFixed(2)}
            <input className="range" type="range" min={0.5} max={1.6} step={0.02} value={millMul} onChange={(e) => setMillMul(+e.target.value)} />
          </label>
          <label className="pf-ctl">{es ? 'tasa descuento δ' : 'discount rate δ'}: {(econ.discountRate * 100).toFixed(1)}%
            <input className="range" type="range" min={0} max={2} step={0.05} value={discMul} onChange={(e) => setDiscMul(+e.target.value)} />
          </label>
          <div className="pf-catlabel">{es ? 'optimizador' : 'optimizer'}</div>
          <div className="pf-chips">
            <button className={`chip ${!useSurrogate ? 'on' : ''}`} onClick={() => setUseSurrogate(false)}>{es ? 'exacto (Lane)' : 'exact (Lane)'}</button>
            <button className={`chip ${useSurrogate ? 'on' : ''}`} onClick={() => setUseSurrogate(true)} title={surrPending ? 'surrogate pending' : 'surrogate'}>surrogate{useSurrogate && surrPending ? ' ⏳' : ''}</button>
          </div>
          {useSurrogate && surrPending && <div className="pf-cap pf-muted">{es ? 'surrogate pendiente — usando el exacto' : 'surrogate pending — using the exact optimizer'}</div>}
        </div>
      </aside>
      <main className="pf-main">
        <Tabs tabs={tabs} ariaLabel={es ? 'vistas de la optimización' : 'optimization views'} />
      </main>
    </div>
  );
}
