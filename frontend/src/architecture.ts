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
        'CutoffGrade Studio answers "what is the most valuable cut-off grade?", the boundary that splits rock into ore ' +
        '(milled) vs waste, chosen to maximise NPV (not just immediate profit). Feed a lognormal grade-tonnage model ' +
        '(grade mean, variability, tonnage) + price, costs and the three stage capacities (mine / mill / market), and ' +
        'see the optimal DECLINING cut-off trajectory, the NPV, the mine life and the cashflow profile.\n\n' +
        'It is a real system, not a demo. The in-browser Lane optimizer recomputes live on ' +
        'every price/cost/capacity/δ slider; a cut-off/NPV surrogate (ONNX) runs one instant inference per control ' +
        'change next to the exact optimizer (mass Monte-Carlo sweeps are the roadmap stochastic tier); Contract 1 ' +
        'validates your own deposit + economics in the offline pipeline. C-UNIFORM and C-BREAKEVEN are closed-form ' +
        'oracles, the exact optimizer is the authority, no fabricated wins.',
      body_es:
        'CutoffGrade Studio responde "¿cuál es la ley de corte más valiosa?", la frontera que separa la roca en mineral ' +
        '(molido) vs estéril, elegida para maximizar el VAN (no sólo la ganancia inmediata). Alimenta un modelo ' +
        'ley-tonelaje lognormal (ley media, variabilidad, tonelaje) + precio, costos y las tres capacidades (mina / ' +
        'molino / mercado), y observa la trayectoria de corte óptima DECRECIENTE, el VAN, la vida de la mina y el ' +
        'perfil de flujo de caja.\n\n' +
        'Es un sistema real, no un demo. El optimizador de Lane recalcula en vivo en el navegador ' +
        'con cada slider de precio/costo/capacidad/δ; un surrogate de corte/VAN (ONNX) corre una inferencia instantánea ' +
        'por cambio de control junto al optimizador exacto (los barridos Monte-Carlo masivos son el tier estocástico ' +
        'del roadmap); el Contrato 1 valida tu propio depósito + economía en el pipeline offline. C-UNIFORM y ' +
        'C-BREAKEVEN son oráculos de forma cerrada, el optimizador exacto es la autoridad, sin victorias fabricadas.',
    },
    {
      id: 'lanes',
      en: 'Lanes, web / offline / compute',
      es: 'Carriles, web / offline / cómputo',
      svg: 'svg/tech/02-lanes.svg',
      body_en:
        'Three lanes, and the split is the point. WEB (live, in the browser): the TypeScript Lane optimizer ' +
        're-runs on every control and onnxruntime-web runs the cutoff surrogate as an ONNX model, no server. ' +
        'OFFLINE / COMPUTE (your machine, an isolated Python environment): the Python pipeline bakes the canonical case artifacts and ' +
        'the heavy lane (the precompute/retrain step, torch) trains the surrogate + the scenario OOD-AE and exports them ' +
        'to ONNX. REPLAY: the small, committed artifacts are overlaid into the SPA at build and ' +
        'loaded live; a typed contract mirror fails the build if the web and the pipeline shapes diverge.',
      body_es:
        'Tres carriles, y la división es lo central. WEB (en vivo, en el navegador): el optimizador de Lane en ' +
        'TypeScript re-corre con cada control y onnxruntime-web ejecuta el cutoff surrogate como modelo ONNX, sin ' +
        'servidor. OFFLINE / CÓMPUTO (tu máquina, un entorno Python aislado): el pipeline Python hornea los artefactos canónicos por ' +
        'caso y el carril pesado (el paso de precómputo/reentrenamiento, torch) entrena el surrogate + el OOD-AE de escenarios y ' +
        'los exporta a ONNX. REPLAY: los artefactos pequeños y versionados se superponen al SPA en el build ' +
        'y se cargan en vivo; un contrato tipado espejo rompe el build si la web y el pipeline divergen.',
    },
    {
      id: 'web-flow',
      en: 'Web-app flow',
      es: 'Flujo de la web',
      svg: 'svg/tech/03-web-flow.svg',
      body_en:
        'The App page recomputes live: inputs (the case selector plus the price / cost ' +
        '/ capacity / discount-rate sliders) feed the TypeScript Lane optimizer and the onnxruntime-web surrogate, which ' +
        'feed the interactive viz, the grade-tonnage curve, the declining cut-off trajectory, the cashflow profile and ' +
        'the Lane cut-off panel, each reading values back on hover. The six sibling pages (App · Introduction · ' +
        'Methodology · Implementation · Experiments · Benchmark) are identical across every CAOS product. The build is ' +
        'gated by the contract-type mirror, the artifacts are overlaid by a build step, vite builds the static output, and ' +
        'GitHub Pages serves it at cutoffgrade.fasl-work.com.',
      body_es:
        'La página App recalcula en vivo: las entradas (el selector de casos más los ' +
        'sliders de precio / costo / capacidad / tasa de descuento) alimentan el optimizador de Lane en TypeScript y el ' +
        'surrogate onnxruntime-web, que alimentan la visualización interactiva, la curva ley-tonelaje, la trayectoria ' +
        'de corte decreciente, el perfil de flujo de caja y el panel de cortes de Lane, cada uno devolviendo valores al ' +
        'pasar el cursor. Las seis páginas hermanas (App · Introducción · Metodología · Implementación · Experimentos · ' +
        'Benchmark) son idénticas en todos los productos CAOS. El build lo controla el espejo de tipos del contrato, los ' +
        'artefactos los superpone un paso del build, vite construye el estático y GitHub Pages lo sirve en cutoffgrade.fasl-work.com.',
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
        'exact year-by-year simulator; ④ the result is the DECLINING optimal cut-off trajectory (high-grading), higher ' +
        'early, falling to break-even as the reserve depletes.\n\n' +
        'The exact optimizer is always on and transparent, the authority every learned prediction is measured against. ' +
        'The learned lane: an MLP surrogate (features → optimal cut-off, NPV, life) compared live against the exact ' +
        'optimizer in the What-if tab, and a scenario ' +
        'autoencoder that flags out-of-envelope inputs; both run client-side as ONNX, reported by their error vs the ' +
        'exact optimizer, never as a black box.',
      body_es:
        'La teoría de Lane, paso a paso: ① la curva ley-tonelaje lognormal da la fracción mineral φ(g) y la ley media ḡ(g) ' +
        'sobre cualquier corte (analítico); ② los tres cortes limitantes g_m/g_h/g_k balancean el bloque marginal contra ' +
        'la etapa que limita, con el término de costo de oportunidad τ = f + F·δ (F = el VAN de la operación remanente), ' +
        'más tres cortes balanceadores y el óptimo mediano de Dagdelen; ③ como F aparece en el corte Y el corte fija los ' +
        'flujos que fijan F, el óptimo es un PUNTO FIJO resuelto sobre la vida por un simulador exacto año a año; ④ el ' +
        'resultado es la trayectoria de corte óptima DECRECIENTE (high-grading), más alta al inicio, cayendo al ' +
        'break-even al agotarse la reserva.\n\n' +
        'El optimizador exacto está siempre activo y es transparente, la autoridad contra la que se mide toda predicción ' +
        'aprendida. El carril aprendido: un surrogate MLP (features → corte óptimo, VAN, vida) comparado en vivo contra ' +
        'el optimizador exacto en la pestaña What-if, ' +
        'y un autoencoder de escenarios que marca entradas fuera del envolvente; ambos corren en el cliente como ONNX, ' +
        'reportados por su error vs el optimizador exacto, nunca como caja negra.',
    },
    {
      id: 'design',
      en: 'Data contracts / design',
      es: 'Contratos de datos / diseño',
      svg: 'svg/tech/05-data-contracts.svg',
      body_en:
        'Two validated data contracts bracket the pipeline. Contract 1 (ingestion) defines a valid deposit + economics, ' +
        'the grade mean/CV, tonnage, price, the four costs, recovery, the three capacities and the discount rate, with ' +
        'range/NaN guards, so the offline pipeline accepts your data, not just the built-in cases. Contract 2 (artifact) defines the ' +
        'output the web reads (the grade-tonnage curve, the 6 cut-offs, the optimal trajectory + NPV + life + cashflow, ' +
        'the sensitivity, the model index), mirrored exactly by a typed contract. Between them the staged, ' +
        'deterministic pipeline runs the lane gate (numpy-light by default, the heavy torch retrain step on demand) and ' +
        'writes a provenance manifest, so every result is reproducible and the web can never silently drift.',
      body_es:
        'Dos contratos de datos validados encierran el pipeline. El Contrato 1 (ingesta) define un depósito + economía ' +
        'válidos, la media/CV de ley, el tonelaje, el precio, los cuatro costos, la recuperación, las tres capacidades ' +
        'y la tasa de descuento, con guardas de rango/NaN, para que el pipeline offline acepte tus datos, no sólo los casos ' +
        'incluidos. El Contrato 2 (artefacto) define la salida que lee la web (la curva ley-tonelaje, los 6 cortes, la ' +
        'trayectoria óptima + VAN + vida + flujo de caja, la sensibilidad, el índice de modelos), espejada exactamente ' +
        'por un contrato tipado. Entre ambos, el pipeline por etapas y determinista corre el lane gate (numpy-light por ' +
        'defecto, el paso de reentrenamiento pesado de torch a demanda) y escribe un manifest de procedencia, de modo que cada ' +
        'resultado es reproducible y la web nunca diverge en silencio.',
    },
  ],
};
