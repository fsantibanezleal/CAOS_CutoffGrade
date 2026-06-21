// In-app Architecture / "How it works" modal config (ADR-0058) for CutoffGrade Studio.
// Passed to <AppShell config={{ ...config, architecture }}>. The ⓘ header button (shell >= 0.1.2) opens the modal.
// Each tab pairs one hand-authored THEMED SVG (frontend/public/svg/tech/, shell CSS-var tokens → repaints with the
// active theme, fetched + inlined) with a bilingual ES/EN body.
import type { ArchitectureConfig } from '@fasl-work/caos-app-shell';

export const architecture: ArchitectureConfig = {
  tabs: [
    {
      id: 'app',
      en: 'The app',
      es: 'La app',
      svg: 'svg/tech/01-the-app.svg',
      body_en:
        'CutoffGrade Studio answers "what is the most valuable cut-off grade?" — the boundary that splits rock into ore ' +
        '(milled) vs waste, chosen to maximise NPV (not just immediate profit). Feed a grade-tonnage curve + price, ' +
        'costs and the three stage capacities (mine / mill / market), and see the optimal DECLINING cut-off trajectory, ' +
        'the NPV, the mine life and the cashflow profile.\n\n' +
        'It is a real system, not a demo. The Lane optimizer (frontend/src/lane/) recomputes live in the browser on ' +
        'every price/cost/capacity/δ slider; a cut-off/NPV surrogate (ONNX) gives instant Monte-Carlo sweeps next to the ' +
        'exact optimizer; Contract 1 accepts your own deposit + economics. C-UNIFORM and C-BREAKEVEN are closed-form ' +
        'oracles — the exact optimizer is the authority, no fabricated wins.',
      body_es:
        'CutoffGrade Studio responde "¿cuál es la ley de corte más valiosa?" — la frontera que separa la roca en mineral ' +
        '(molido) vs estéril, elegida para maximizar el VAN (no sólo la ganancia inmediata). Alimenta una curva ' +
        'ley-tonelaje + precio, costos y las tres capacidades (mina / molino / mercado), y observa la trayectoria de ' +
        'corte óptima DECRECIENTE, el VAN, la vida de la mina y el perfil de flujo de caja.\n\n' +
        'Es un sistema real, no un demo. El optimizador de Lane (frontend/src/lane/) recalcula en vivo en el navegador ' +
        'con cada slider de precio/costo/capacidad/δ; un surrogate de corte/VAN (ONNX) da barridos Monte-Carlo ' +
        'instantáneos junto al optimizador exacto; el Contrato 1 acepta tu propio depósito + economía. C-UNIFORM y ' +
        'C-BREAKEVEN son oráculos de forma cerrada — el optimizador exacto es la autoridad, sin victorias fabricadas.',
    },
    {
      id: 'lanes',
      en: 'Lanes — web / offline / compute',
      es: 'Carriles — web / offline / cómputo',
      svg: 'svg/tech/02-lanes.svg',
      body_en:
        'Three lanes, and the split is the point. WEB (live, in the browser): the TypeScript Lane optimizer ' +
        '(frontend/src/lane/) re-runs on every control and onnxruntime-web runs cutoff-surrogate.onnx — no server. ' +
        'OFFLINE / COMPUTE (your machine, isolated .venv): the Python pipeline bakes the canonical case artifacts and ' +
        'the heavy lane (--retrain, .venv-precompute, torch) trains the surrogate + the scenario OOD-AE and exports them ' +
        'to ONNX. REPLAY: the small, committed artifacts in data/derived are overlaid into the SPA by copy-data.mjs and ' +
        'loaded live; the typed mirror (contract.types.ts) fails the build if the web and the pipeline shapes diverge.',
      body_es:
        'Tres carriles, y la división es lo central. WEB (en vivo, en el navegador): el optimizador de Lane en ' +
        'TypeScript (frontend/src/lane/) re-corre con cada control y onnxruntime-web ejecuta cutoff-surrogate.onnx — sin ' +
        'servidor. OFFLINE / CÓMPUTO (tu máquina, .venv aislado): el pipeline Python hornea los artefactos canónicos por ' +
        'caso y el carril pesado (--retrain, .venv-precompute, torch) entrena el surrogate + el OOD-AE de escenarios y ' +
        'los exporta a ONNX. REPLAY: los artefactos pequeños y versionados en data/derived se superponen al SPA con ' +
        'copy-data.mjs y se cargan en vivo; el espejo tipado (contract.types.ts) rompe el build si la web y el pipeline divergen.',
    },
    {
      id: 'web-flow',
      en: 'Web-app flow',
      es: 'Flujo de la web',
      svg: 'svg/tech/03-web-flow.svg',
      body_en:
        'The App page recomputes live: inputs (the case selector or your own deposit + economics, plus the price / cost ' +
        '/ capacity / discount-rate sliders) feed the TypeScript Lane optimizer and the onnxruntime-web surrogate, which ' +
        'feed the interactive viz — the grade-tonnage curve, the declining cut-off trajectory, the cashflow profile and ' +
        'the Lane cut-off panel, each reading values back on hover. The six sibling pages (App · Introduction · ' +
        'Methodology · Implementation · Experiments · Benchmark) are identical across every CAOS product. The build is ' +
        'gated by the contract-type mirror, the artifacts are overlaid by copy-data, vite builds the static output, and ' +
        'GitHub Pages serves it at cutoffgrade.fasl-work.com.',
      body_es:
        'La página App recalcula en vivo: las entradas (el selector de casos o tu propio depósito + economía, más los ' +
        'sliders de precio / costo / capacidad / tasa de descuento) alimentan el optimizador de Lane en TypeScript y el ' +
        'surrogate onnxruntime-web, que alimentan la visualización interactiva — la curva ley-tonelaje, la trayectoria ' +
        'de corte decreciente, el perfil de flujo de caja y el panel de cortes de Lane, cada uno devolviendo valores al ' +
        'pasar el cursor. Las seis páginas hermanas (App · Introducción · Metodología · Implementación · Experimentos · ' +
        'Benchmark) son idénticas en todos los productos CAOS. El build lo controla el espejo de tipos del contrato, los ' +
        'artefactos los superpone copy-data, vite construye el estático y GitHub Pages lo sirve en cutoffgrade.fasl-work.com.',
    },
    {
      id: 'science',
      en: 'The science',
      es: 'La ciencia',
      svg: 'svg/tech/04-the-science.svg',
      body_en:
        "Lane's theory, step by step: ① the lognormal grade-tonnage curve gives the ore fraction φ(g) and the average " +
        'ore grade ḡ(g) above any cut-off (analytic); ② the three limiting cut-offs g_m/g_h/g_k balance the marginal ' +
        'block against the binding stage, with the opportunity-cost term τ = f + F·δ (F = the NPV of the remaining ' +
        'operation), plus three balancing cut-offs and the Dagdelen median optimum; ③ because F appears in the cut-off ' +
        'AND the cut-off sets the cashflows that set F, the optimum is a FIXED POINT solved over the mine life by an ' +
        'exact year-by-year simulator; ④ the result is the DECLINING optimal cut-off trajectory (high-grading) — higher ' +
        'early, falling to break-even as the reserve depletes.\n\n' +
        'The exact optimizer is always on and transparent — the authority every learned prediction is measured against. ' +
        'The learned lane: an MLP surrogate (features → optimal cut-off, NPV, life) for instant sweeps, and a scenario ' +
        'autoencoder that flags out-of-envelope inputs; both run client-side as ONNX, reported by their error vs the ' +
        'exact optimizer, never as a black box.',
      body_es:
        'La teoría de Lane, paso a paso: ① la curva ley-tonelaje lognormal da la fracción mineral φ(g) y la ley media ḡ(g) ' +
        'sobre cualquier corte (analítico); ② los tres cortes limitantes g_m/g_h/g_k balancean el bloque marginal contra ' +
        'la etapa que limita, con el término de costo de oportunidad τ = f + F·δ (F = el VAN de la operación remanente), ' +
        'más tres cortes balanceadores y el óptimo mediano de Dagdelen; ③ como F aparece en el corte Y el corte fija los ' +
        'flujos que fijan F, el óptimo es un PUNTO FIJO resuelto sobre la vida por un simulador exacto año a año; ④ el ' +
        'resultado es la trayectoria de corte óptima DECRECIENTE (high-grading) — más alta al inicio, cayendo al ' +
        'break-even al agotarse la reserva.\n\n' +
        'El optimizador exacto está siempre activo y es transparente — la autoridad contra la que se mide toda predicción ' +
        'aprendida. El carril aprendido: un surrogate MLP (features → corte óptimo, VAN, vida) para barridos instantáneos, ' +
        'y un autoencoder de escenarios que marca entradas fuera del envolvente; ambos corren en el cliente como ONNX, ' +
        'reportados por su error vs el optimizador exacto, nunca como caja negra.',
    },
    {
      id: 'design',
      en: 'Data contracts / design',
      es: 'Contratos de datos / diseño',
      svg: 'svg/tech/05-data-contracts.svg',
      body_en:
        'Two validated data contracts bracket the pipeline. Contract 1 (ingestion) defines a valid deposit + economics — ' +
        'the grade mean/CV, tonnage, price, the four costs, recovery, the three capacities and the discount rate, with ' +
        'range/NaN guards — so the app accepts your data, not just the built-in cases. Contract 2 (artifact) defines the ' +
        'output the web reads (the grade-tonnage curve, the 6 cut-offs, the optimal trajectory + NPV + life + cashflow, ' +
        'the sensitivity, the model index), mirrored exactly by contract.types.ts. Between them the staged, ' +
        'deterministic pipeline runs the lane gate (numpy-light by default, --retrain for the heavy torch lane) and ' +
        'writes a provenance manifest, so every result is reproducible and the web can never silently drift.',
      body_es:
        'Dos contratos de datos validados encierran el pipeline. El Contrato 1 (ingesta) define un depósito + economía ' +
        'válidos — la media/CV de ley, el tonelaje, el precio, los cuatro costos, la recuperación, las tres capacidades ' +
        'y la tasa de descuento, con guardas de rango/NaN — para que la app acepte tus datos, no sólo los casos ' +
        'incluidos. El Contrato 2 (artefacto) define la salida que lee la web (la curva ley-tonelaje, los 6 cortes, la ' +
        'trayectoria óptima + VAN + vida + flujo de caja, la sensibilidad, el índice de modelos), espejada exactamente ' +
        'por contract.types.ts. Entre ambos, el pipeline por etapas y determinista corre el lane gate (numpy-light por ' +
        'defecto, --retrain para el carril pesado de torch) y escribe un manifest de procedencia, de modo que cada ' +
        'resultado es reproducible y la web nunca diverge en silencio.',
    },
  ],
};
