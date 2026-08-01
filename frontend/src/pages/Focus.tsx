// ADR-0070 scenario focus view: one selected deposit, full page, nothing competing with the trajectory.
//
// ADDITIVE. The App (Tool.tsx) keeps every tab and all its explanation; this route is a second way to look
// at the SAME deposit through the SAME Lane solve. It renders OUTSIDE <AppShell> on purpose: the shell
// header and footer are exactly the chrome a focus view exists to escape.
//
// The stage is the CUT-OFF TRAJECTORY, not the grade-tonnage curve. Lane's whole result is that the optimal
// cut-off DECLINES over the life of the mine, and the value of the method is only visible when that decline
// is put against the best constant cut-off. Showing the deposit curve instead would be showing the input.

import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useShellLang } from '@fasl-work/caos-app-shell';
import { CASES, caseById, type CGCase } from '../lane/cases.ts';
import { analyze, type Economics } from '../lane/index.ts';
import { themeColors, UPlotChart } from '../viz/UPlotChart.tsx';

/** Which capacity is binding, said in plain language on the stage.
 *
 *  Lane's three-stage problem is bounded by mine, mill or market, and WHICH one binds is the single most
 *  actionable fact the solve produces: it tells you where more capacity would actually buy NPV. The engine
 *  already reports it as `Analysis.binding`; this only names it in words. */
function bindingState(binding: string, gain: number, es: boolean): { label: string; text: string } {
  const pct = (gain * 100).toFixed(1);
  const which = binding.toLowerCase();
  if (which.includes('mill') || which.includes('planta')) {
    return {
      label: es ? 'Limitado por la planta' : 'Mill-limited',
      text: es
        ? `La planta es la restriccion activa: el corte optimo sube para llenarla con el mejor mineral disponible. Ampliar la planta es lo unico que compra NPV aqui. La politica de Lane vale ${pct}% de NPV sobre el mejor corte constante.`
        : `The mill is the active constraint: the optimal cut-off rises to fill it with the best available ore. Mill capacity is the only expansion that buys NPV here. Lane's declining policy is worth ${pct}% of NPV over the best constant cut-off.`,
    };
  }
  if (which.includes('mine') || which.includes('mina')) {
    return {
      label: es ? 'Limitado por la mina' : 'Mine-limited',
      text: es
        ? `El movimiento de mina es la restriccion activa: el corte baja para enviar mas de lo que ya se extrajo. La politica de Lane vale ${pct}% de NPV sobre el mejor corte constante.`
        : `Mine movement is the active constraint: the cut-off falls to send more of what has already been dug. Lane's declining policy is worth ${pct}% of NPV over the best constant cut-off.`,
    };
  }
  return {
    label: es ? 'Limitado por el mercado' : 'Market-limited',
    text: es
      ? `El mercado es la restriccion activa: producir mas metal no lo vende. La politica de Lane vale ${pct}% de NPV sobre el mejor corte constante.`
      : `The market is the active constraint: producing more metal does not sell it. Lane's declining policy is worth ${pct}% of NPV over the best constant cut-off.`,
  };
}

export default function Focus() {
  const { caseId } = useParams();
  const es = useShellLang() === 'es';
  const theCase = useMemo<CGCase>(() => caseById(caseId ?? CASES[0].id), [caseId]);

  const [priceMul, setPriceMul] = useState(1);
  const [costMul, setCostMul] = useState(1);
  const [millMul, setMillMul] = useState(1);
  const [discMul, setDiscMul] = useState(1);

  // Selecting a different deposit must reset the multipliers, or the chips move the URL and the title while
  // the economics stay those of the deposit the user just left.
  const [seen, setSeen] = useState(theCase.id);
  if (seen !== theCase.id) { setSeen(theCase.id); setPriceMul(1); setCostMul(1); setMillMul(1); setDiscMul(1); }

  const econ = useMemo<Economics>(() => ({
    ...theCase.econ,
    price: theCase.econ.price * priceMul,
    processingCost: theCase.econ.processingCost * costMul,
    millCapacity: theCase.econ.millCapacity * millMul,
    discountRate: theCase.econ.discountRate * discMul,
  }), [theCase, priceMul, costMul, millMul, discMul]);

  // The SAME solve the App runs. A focus view on a cheaper approximation would show a different answer.
  const a = useMemo(() => analyze(econ, theCase.deposit), [econ, theCase]);

  const gain = a.constant.npv > 0 ? (a.optimal.npv - a.constant.npv) / a.constant.npv : 0;
  const st = bindingState(a.binding, gain, es);

  const traj = a.optimal.trajectory;
  const data = useMemo(() => {
    const xs = traj.map((_, i) => i);
    return [Float64Array.from(xs), Float64Array.from(traj), Float64Array.from(xs.map(() => a.constant.cutoff))] as unknown as import('uplot').AlignedData;
  }, [traj, a.constant.cutoff]);

  const build = (w: number, h: number) => {
    const c = themeColors();
    return {
      width: w, height: h,
      scales: { x: { time: false } },
      axes: [
        { label: es ? 'periodo' : 'period', stroke: c.fg, grid: { stroke: c.border } },
        { label: es ? 'corte (%)' : 'cut-off (%)', stroke: c.fg, grid: { stroke: c.border } },
      ],
      series: [
        {},
        { label: es ? 'Lane (declinante)' : 'Lane (declining)', stroke: c.accent, width: 2 },
        { label: es ? 'mejor constante' : 'best constant', stroke: c.subtle, width: 1, dash: [5, 4] },
      ],
    } as never;
  };

  const hud = [
    { v: `$${a.optimal.npv.toFixed(0)}M`, l: 'NPV (Lane)', tone: 'accent' },
    { v: `${(gain * 100).toFixed(1)}%`, l: es ? 'sobre constante' : 'over constant', tone: 'blue' },
    { v: `${a.optimal.lifeYears.toFixed(1)} y`, l: es ? 'vida' : 'life' },
    { v: `${a.optimal.meanCutoff.toFixed(2)}%`, l: es ? 'corte medio' : 'mean cut-off' },
    { v: `${a.constant.cutoff.toFixed(2)}%`, l: es ? 'mejor constante' : 'best constant' },
    { v: `${a.breakEven.toFixed(2)}%`, l: es ? 'equilibrio' : 'break-even' },
  ];

  return (
    <div className="cgf">
      <div className="cgf-stage">
        <UPlotChart data={data} build={build} fill />

        <div className="cgf-badge">
          <div className="cgf-badge-t">{st.label}</div>
          <div className="cgf-badge-d">{st.text}</div>
        </div>

        <div className="cgf-hud">
          {hud.map((h) => (
            <div className="cgf-hud-item" key={h.l}>
              <div className={`cgf-hud-v${h.tone ? ' ' + h.tone : ''}`}>{h.v}</div>
              <div className="cgf-hud-l">{h.l}</div>
            </div>
          ))}
        </div>

        <Link className="cgf-exit" to="/">{es ? 'Volver a la app' : 'Back to the app'}</Link>
      </div>

      <aside className="cgf-rail">
        <div className="cgf-title">{theCase.name}</div>
        <div className="cgf-sub">{theCase.id}</div>

        <label className="cgf-ctl">
          <span className="cgf-ctl-l">{es ? 'Precio' : 'Price'}<b>{(priceMul * 100).toFixed(0)}%</b></span>
          <input type="range" min={0.5} max={2} step={0.05} value={priceMul} onChange={(e) => setPriceMul(+e.target.value)} />
        </label>
        <label className="cgf-ctl">
          <span className="cgf-ctl-l">{es ? 'Costo de proceso' : 'Processing cost'}<b>{(costMul * 100).toFixed(0)}%</b></span>
          <input type="range" min={0.5} max={2} step={0.05} value={costMul} onChange={(e) => setCostMul(+e.target.value)} />
        </label>
        <label className="cgf-ctl">
          <span className="cgf-ctl-l">{es ? 'Capacidad de planta' : 'Mill capacity'}<b>{(millMul * 100).toFixed(0)}%</b></span>
          <input type="range" min={0.5} max={2} step={0.05} value={millMul} onChange={(e) => setMillMul(+e.target.value)} />
        </label>
        <label className="cgf-ctl">
          <span className="cgf-ctl-l">{es ? 'Tasa de descuento' : 'Discount rate'}<b>{(discMul * 100).toFixed(0)}%</b></span>
          <input type="range" min={0.5} max={2} step={0.05} value={discMul} onChange={(e) => setDiscMul(+e.target.value)} />
        </label>

        <div className="cgf-note">
          {es
            ? 'Lane (1964, 1988): el corte optimo NO es el de equilibrio, porque enviar material marginal ocupa capacidad que un mineral mejor podria usar mas adelante. Ese costo de oportunidad tau(t) cae a medida que se agota la reserva, y por eso el corte optimo declina. La linea punteada es el mejor corte CONSTANTE, para que la diferencia sea la ganancia real del metodo.'
            : 'Lane (1964, 1988): the optimal cut-off is NOT break-even, because sending marginal material occupies capacity that better ore could use later. That opportunity cost tau(t) falls as the reserve depletes, which is why the optimal cut-off declines. The dashed line is the best CONSTANT cut-off, so the gap is the method\\u2019s real gain.'}
        </div>

        <div className="cgf-cases">
          {CASES.slice(0, 12).map((c) => (
            <Link key={c.id} to={`/focus/${c.id}`} className={c.id === theCase.id ? 'on' : ''}>{c.id}</Link>
          ))}
        </div>
      </aside>
    </div>
  );
}
