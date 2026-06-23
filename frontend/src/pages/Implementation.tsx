import { Callout, Tabs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Implementation() {
  const es = useShellLang() === 'es';
  return (
    <article className="page-body prose">
      <h1>{es ? 'Implementación' : 'Implementation'}</h1>
      <p className="lede">{es
        ? 'Instanciado sobre el arquetipo de repo-producto (ADR-0057): el motor de Lane es TypeScript (corre en el navegador Y en el bake Node); Python son los dos contratos + el pipeline.'
        : 'Instantiated on the product-repo archetype (ADR-0057): the Lane engine is TypeScript (runs in the browser AND in the Node bake); Python is the two contracts + the pipeline.'}</p>

      <Tabs ariaLabel={es ? 'implementación' : 'implementation'} tabs={[
        {
          id: 'lanes', label: es ? 'Carriles' : 'Lanes',
          content: (
            <div className="cg-doc-sec">
              <table className="cmp-table">
                <thead><tr><th>{es ? 'carril' : 'lane'}</th><th>{es ? 'qué' : 'what'}</th><th>deps</th></tr></thead>
                <tbody>
                  <tr><td>{es ? 'Vivo (cliente)' : 'Live (client)'}</td><td>{es ? 'el optimizador de Lane (src/lane/) + el surrogate ONNX' : 'the Lane optimizer (src/lane/) + the ONNX surrogate'}</td><td>web npm + onnxruntime-web</td></tr>
                  <tr><td>{es ? 'Offline (precómputo)' : 'Offline (precompute)'}</td><td>{es ? 'bake Node del MISMO motor TS + entrenamiento torch' : 'Node bake of the SAME TS engine + torch training'}</td><td>requirements-precompute.txt</td></tr>
                  <tr><td>{es ? 'Replay (ligero)' : 'Replay (light)'}</td><td>{es ? 'cglab.pipeline reconstruye trazas/manifests' : 'cglab.pipeline reshapes traces/manifests'}</td><td>requirements.txt (numpy)</td></tr>
                </tbody>
              </table>
              <p className="cg-cap">{es ? 'El gate (core/gate.py) mide cliente ∧ runtimes ⊆ {ts-econ, onnxruntime-web} ∧ presupuestos → vivo.' : 'The gate (core/gate.py) measures client-side ∧ runtimes ⊆ {ts-econ, onnxruntime-web} ∧ budgets → live.'}</p>
            </div>
          ),
        },
        {
          id: 'contracts', label: es ? 'Contratos' : 'Contracts',
          content: (
            <div className="cg-doc-sec">
              <p><b>CONTRATO 1</b> (io/contract.py){es ? ' — la puerta "trae tu propio depósito": valida el depósito + la economía y rechaza/marca con una política de outliers explícita.' : ' — the "bring your own deposit" gate: validates the deposit + economics and rejects/flags with an explicit outlier policy.'}</p>
              <p><b>CONTRATO 2</b> (core/{'{'}trace,manifest{'}'}.py){es ? ' — la traza por caso (cutoffgrade.trace/v1): la curva ley-tonelaje, los 6 cortes, la trayectoria óptima + VAN + vida + flujo de caja, la sensibilidad, las métricas aprendidas. Espejada por src/lib/contract.types.ts → un drift rompe tsc.' : ' — the per-case trace (cutoffgrade.trace/v1): the grade-tonnage curve, the 6 cut-offs, the optimal trajectory + NPV + life + cashflow, the sensitivity, the learned metrics. Mirrored by src/lib/contract.types.ts → a drift fails tsc.'}</p>
              <Callout variant="note" title={es ? 'Dos lenguajes, un motor' : 'Two languages, one engine'}>
                {es ? 'science/bake_cases.mjs corre el MISMO TypeScript que el navegador (vía tsx) sobre los casos → case-results.json. Sin re-port en Python de la economía.' : 'science/bake_cases.mjs runs the SAME TypeScript the browser runs (via tsx) over the cases → case-results.json. No Python re-port of the economics.'}
              </Callout>
            </div>
          ),
        },
        {
          id: 'pipeline', label: 'pipeline',
          content: (
            <div className="cg-doc-sec">
              <pre className="codeblock">{`python -m cglab.pipeline            # light (numpy): rebuild traces + manifests
python -m cglab.pipeline S-BASE     # one case
python -m cglab.pipeline all --retrain   # re-bake + train the 2 models (torch -> ONNX)`}</pre>
              <p>{es ? 'El carril por defecto es ligero: el case-results.json committeado ES la salida real del motor TS, así que CI + el replay nunca necesitan torch ni Node. Determinista (re-correr es byte-idéntico).' : 'The default lane is light: the committed case-results.json IS the real TS-engine output, so CI + the replay never need torch or Node. Deterministic (re-running is byte-identical).'}</p>
            </div>
          ),
        },
      ]} />
    </article>
  );
}
