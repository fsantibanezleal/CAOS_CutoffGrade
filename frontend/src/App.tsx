// Commit-3 placeholder App, proves the Lane engine runs live in the browser. The full 6-page SPA (the App with the
// grade-tonnage curve, the optimal cut-off trajectory, the cashflow profile and the economic sliders, on the shared
// caos-app-shell) lands in commit 4.
import { analyze } from './lane/index';
import { caseById } from './lane/cases';

export default function App() {
  const c = caseById('S-BASE');
  const a = analyze(c.econ, c.deposit);
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '3rem auto', padding: '0 1rem', lineHeight: 1.6 }}>
      <h1>CutoffGrade Studio</h1>
      <p>Lane&rsquo;s economic cut-off grade, the optimal cut-off that maximises NPV. The optimizer runs live in the browser.</p>
      <h2>{c.name} (live)</h2>
      <ul>
        <li>NPV: <b>${a.optimal.npv.toLocaleString()}M</b> over {a.optimal.lifeYears} years</li>
        <li>Mean optimal cut-off: <b>{(a.optimal.meanCutoff * 100).toFixed(3)}%</b> (break-even {(a.breakEven * 100).toFixed(3)}%)</li>
        <li>Binding constraint: <b>{a.binding}</b> · high-grading NPV uplift {a.npvUpliftPct.toFixed(2)}%</li>
      </ul>
      <p style={{ color: '#666' }}>Full 6-page SPA + the ⓘ Architecture modal: commit 4.</p>
    </main>
  );
}
