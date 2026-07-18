import { Callout, Cite, Refs, Tabs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Implementation() {
  const es = useShellLang() === 'es';
  return (
    <article className="page-body prose">
      <h1>{es ? 'Implementación' : 'Implementation'}</h1>
      <p className="lede">{es
        ? 'Una arquitectura de dos carriles: el motor económico de Lane es TypeScript y corre idéntico en ambos, vivo en el navegador y en el precómputo (Node). El carril de precómputo además entrena los dos modelos y hornea los casos; dos contratos tipados unen ambos carriles, y un drift entre ellos rompe el chequeo de tipos.'
        : 'A dual-lane architecture: the Lane economic engine is TypeScript and runs identically in both, live in the browser and in precompute (Node). The precompute lane also trains the two models and bakes the cases; two typed contracts bind the lanes, and any drift between them fails the type-check.'}</p>

      <Tabs ariaLabel={es ? 'implementación' : 'implementation'} tabs={[
        {
          id: 'lanes', label: es ? 'Carriles' : 'Lanes',
          content: (
            <div className="cg-doc-sec">
              <table className="cmp-table">
                <thead><tr><th>{es ? 'carril' : 'lane'}</th><th>{es ? 'qué' : 'what'}</th><th>{es ? 'corre con' : 'runs on'}</th></tr></thead>
                <tbody>
                  <tr><td>{es ? 'Vivo (cliente)' : 'Live (client)'}</td><td>{es ? 'el optimizador de Lane en TypeScript + el surrogate ONNX, en el navegador' : 'the Lane optimizer in TypeScript + the ONNX surrogate, in the browser'}</td><td>onnxruntime-web (WASM)</td></tr>
                  <tr><td>{es ? 'Offline (precómputo)' : 'Offline (precompute)'}</td><td>{es ? 'el MISMO motor TS corrido en Node + el entrenamiento de los dos modelos (torch → ONNX)' : 'the SAME TS engine run in Node + training the two models (torch → ONNX)'}</td><td>{es ? 'entorno de precómputo (torch)' : 'precompute environment (torch)'}</td></tr>
                  <tr><td>{es ? 'Replay (ligero)' : 'Replay (light)'}</td><td>{es ? 'reconstruye las trazas + manifests por caso desde los artefactos committeados' : 'rebuilds the per-case traces + manifests from the committed artifacts'}</td><td>numpy</td></tr>
                </tbody>
              </table>
              <p className="cg-cap">{es ? 'El gate de carril decide qué corre vivo: cliente ∧ runtimes ⊆ {motor-TS, onnxruntime-web} ∧ dentro de presupuesto → vivo; cualquier otra cosa cae al precómputo.' : 'The lane gate decides what runs live: client-side ∧ runtimes ⊆ {TS-engine, onnxruntime-web} ∧ within budget → live; anything else falls to precompute.'}</p>
            </div>
          ),
        },
        {
          id: 'contracts', label: es ? 'Contratos' : 'Contracts',
          content: (
            <div className="cg-doc-sec">
              <p><b>{es ? 'CONTRATO 1, el validador de depósito' : 'CONTRACT 1, the deposit validator'}</b>{es ? ' ("trae tu propio depósito"): valida el depósito + la economía y rechaza o marca con una política de outliers explícita, de modo que un caso mal formado nunca llega al optimizador en silencio.' : ' (the "bring your own deposit" gate): validates the deposit + economics and rejects or flags with an explicit outlier policy, so a malformed case never reaches the optimizer silently.'}</p>
              <p><b>{es ? 'CONTRATO 2, la traza por caso' : 'CONTRACT 2, the per-case trace'}</b>{es ? ' (esquema versionado cutoffgrade.trace/v1): la curva ley-tonelaje, los 6 cortes, la trayectoria óptima + VAN + vida + flujo de caja, la sensibilidad y las métricas aprendidas. El frontend la espeja con un contrato tipado, así que cualquier drift entre el artefacto y el tipo rompe el chequeo de tipos.' : ' (the versioned cutoffgrade.trace/v1 schema): the grade-tonnage curve, the 6 cut-offs, the optimal trajectory + NPV + life + cashflow, the sensitivity and the learned metrics. The frontend mirrors it with a typed contract, so any drift between the artifact and the type fails the type-check.'}</p>
              <Callout variant="note" title={es ? 'Dos lenguajes, un motor' : 'Two languages, one engine'}>
                {es ? 'El paso de precalculado corre el MISMO TypeScript que el navegador (vía tsx) sobre los casos y emite el artefacto de resultados committeado. No hay un re-port de la economía a Python, el motor de Lane vive una sola vez, en TypeScript.' : 'The case-bake step runs the SAME TypeScript the browser runs (via tsx) over the cases and emits the committed results artifact. There is no Python re-port of the economics, the Lane engine lives once, in TypeScript.'}
              </Callout>
            </div>
          ),
        },
        {
          id: 'pipeline', label: 'pipeline',
          content: (
            <div className="cg-doc-sec">
              <p>{es
                ? 'El carril por defecto es ligero: el artefacto de resultados committeado ES la salida real del motor TS, así que la integración continua y el replay nunca necesitan torch ni Node. Un comando de precómputo reconstruye las trazas + manifests por caso (sólo numpy); con la bandera de re-entrenamiento, re-hornea los casos y entrena de nuevo los dos modelos (torch → ONNX). Todo es determinista: re-correrlo produce un resultado byte-idéntico.'
                : 'The default lane is light: the committed results artifact IS the real TS-engine output, so continuous integration and the replay never need torch or Node. A precompute command rebuilds the per-case traces + manifests (numpy only); with the retrain flag it re-bakes the cases and re-trains the two models (torch → ONNX). It is all deterministic: re-running produces a byte-identical result.'}</p>
              <table className="cmp-table">
                <thead><tr><th>{es ? 'paso' : 'step'}</th><th>{es ? 'entrada → salida' : 'input → output'}</th><th>{es ? 'tier' : 'tier'}</th></tr></thead>
                <tbody>
                  <tr><td>{es ? 'horneo de casos' : 'case bake'}</td><td>{es ? 'depósito + deck → traza + manifest por caso' : 'deposit + deck → per-case trace + manifest'}</td><td>{es ? 'ligero (numpy)' : 'light (numpy)'}</td></tr>
                  <tr><td>{es ? 're-entrenar' : 'retrain'}</td><td>{es ? 'casos → surrogate ONNX + AE de anomalía (con métricas held-out)' : 'cases → ONNX surrogate + anomaly AE (with held-out metrics)'}</td><td>{es ? 'pesado (torch)' : 'heavy (torch)'}</td></tr>
                </tbody>
              </table>
            </div>
          ),
        },
      ]} />
      <p className="cg-cap">{es ? 'El motor implementa el método económico de cortes de Lane ' : 'The engine implements Lane\'s economic cut-off method '}<Cite id="lane1988" paren />{es ? '; las ecuaciones están en Metodología.' : '; the equations are in Methodology.'}</p>
      <Refs ids={['lane1988']} label="Refs" />
    </article>
  );
}
