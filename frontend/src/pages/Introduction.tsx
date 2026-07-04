import { Callout, Cite, Refs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Introduction() {
  const es = useShellLang() === 'es';
  return (
    <article className="page-body prose">
      <h1>{es ? 'Introducción' : 'Introduction'}</h1>
      <p className="lede">{es
        ? '"Mineral" no es un hecho geológico, es una decisión económica. La ley de corte es esa frontera, y elegirla mal cuesta cientos de millones de VAN.'
        : '"Ore" is not a geological fact, it is an economic decision. The cut-off grade is that boundary, and choosing it badly costs hundreds of millions of NPV.'}</p>

      <figure className="cg-fig">
        <svg viewBox="0 0 880 250" width="100%" role="img" aria-labelledby="cg-ov-t cg-ov-d" style={{ display: 'block', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
          <title id="cg-ov-t">{es ? 'De la curva ley-tonelaje + economía al corte óptimo, el VAN y la vida' : 'From the grade-tonnage curve + economics to the optimal cut-off, NPV and life'}</title>
          <desc id="cg-ov-d">{es ? 'El depósito (curva ley-tonelaje) y la economía (precio, costos, capacidades, descuento) alimentan al optimizador de Lane, que produce la trayectoria de corte decreciente, el VAN y la vida de la mina.' : 'The deposit (grade-tonnage curve) and the economics (price, costs, capacities, discount) feed the Lane optimizer, which produces the declining cut-off trajectory, the NPV and the mine life.'}</desc>
          <style>{`
            .cg-ov .bx { fill: var(--color-surface-2, var(--color-surface)); stroke: var(--color-border); stroke-width: 1.2; }
            .cg-ov .hi { stroke: var(--color-accent); } .cg-ov .gd { stroke: var(--color-good); }
            .cg-ov .t { fill: var(--color-fg); font-size: 12px; font-weight: 700; }
            .cg-ov .s { fill: var(--color-fg-subtle); font-size: 9.5px; }
            .cg-ov .ax { stroke: var(--color-border); stroke-width: 1; }
            .cg-ov .gt { fill: none; stroke: var(--color-accent); stroke-width: 2; }
            .cg-ov .tr { fill: none; stroke: var(--color-bad); stroke-width: 2; }
            .cg-ov .be { stroke: var(--color-warn); stroke-width: 1.1; stroke-dasharray: 3 3; }
            .cg-ov .fl { fill: none; stroke: var(--color-fg-faint); stroke-width: 1.6; }
          `}</style>
          <defs>
            <marker id="cg-ar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 z" fill="var(--color-fg-faint)" /></marker>
          </defs>
          <g className="cg-ov">
            {/* Stage 1, the deposit (GT curve) */}
            <rect className="bx hi" x="12" y="20" width="190" height="150" rx="10" />
            <text className="t" x="26" y="42">{es ? 'El depósito' : 'The deposit'}</text>
            <line className="ax" x1="30" y1="150" x2="186" y2="150" /><line className="ax" x1="30" y1="60" x2="30" y2="150" />
            <path className="gt" d="M30,66 C70,72 110,100 150,134 C168,146 178,148 186,149" />
            <text className="s" x="26" y="60">{es ? 'fracción mineral vs corte' : 'ore fraction vs cut-off'}</text>
            <text className="s" x="150" y="166">{es ? 'corte' : 'cut-off'}</text>
            <text className="s" x="26" y="166">{es ? 'curva ley-tonelaje (lognormal)' : 'grade-tonnage curve (lognormal)'}</text>
            {/* Stage 2, economics */}
            <rect className="bx" x="234" y="20" width="190" height="150" rx="10" />
            <text className="t" x="248" y="42">{es ? 'La economía' : 'The economics'}</text>
            <text className="s" x="248" y="64">{es ? 'precio · costos (mina/proceso/' : 'price · costs (mine/process/'}</text>
            <text className="s" x="248" y="78">{es ? 'refino/fijo) · recuperación' : 'refine/fixed) · recovery'}</text>
            <text className="s" x="248" y="100">{es ? 'capacidades: mina · molino · mercado' : 'capacities: mine · mill · market'}</text>
            <text className="s" x="248" y="122">{es ? 'tasa de descuento δ' : 'discount rate δ'}</text>
            <text className="s" x="248" y="150">{es ? 'depósito propio: pipeline offline (Contrato 1)' : 'own deposit: offline pipeline (Contract 1)'}</text>
            {/* Stage 3, Lane optimizer */}
            <rect className="bx hi" x="456" y="20" width="190" height="150" rx="10" />
            <text className="t" x="470" y="42">{es ? 'Optimizador de Lane' : 'Lane optimizer'}</text>
            <text className="s" x="470" y="64">{es ? '3 cortes limitantes (mina/' : '3 limiting cut-offs (mine/'}</text>
            <text className="s" x="470" y="78">{es ? 'molino/mercado)' : 'mill/market)'}</text>
            <text className="s" x="470" y="98">{es ? '3 cortes balanceadores' : '3 balancing cut-offs'}</text>
            <text className="s" x="470" y="118">{es ? 'punto fijo de VAN (τ = f + F·δ)' : 'NPV fixed point (τ = f + F·δ)'}</text>
            <text className="s" x="470" y="150">{es ? 'en vivo en el navegador' : 'live in the browser'}</text>
            {/* Stage 4, value */}
            <rect className="bx gd" x="678" y="20" width="190" height="150" rx="10" />
            <text className="t" x="692" y="42">{es ? 'El valor' : 'The value'}</text>
            <line className="ax" x1="696" y1="146" x2="858" y2="146" /><line className="ax" x1="696" y1="60" x2="696" y2="146" />
            <path className="tr" d="M700,66 C744,84 786,112 858,134" />
            <line className="be" x1="696" y1="134" x2="858" y2="134" />
            <text className="s" x="772" y="60">{es ? 'corte decreciente (high-grading)' : 'declining cut-off (high-grading)'}</text>
            <text className="s" x="788" y="162">{es ? 'vida' : 'life'}</text>
            <text className="s" x="692" y="162">{es ? 'corte · VAN · vida' : 'cut-off · NPV · life'}</text>
            {/* flows */}
            <path className="fl" d="M202,95 H232" markerEnd="url(#cg-ar)" />
            <path className="fl" d="M424,95 H454" markerEnd="url(#cg-ar)" />
            <path className="fl" d="M646,95 H676" markerEnd="url(#cg-ar)" />
            <text className="s" x="12" y="206">{es ? 'El corte que MAXIMIZA el VAN suele ser más alto al principio y decrece sobre la vida, eso es Lane. El break-even ignora el costo de oportunidad de la capacidad.' : 'The NPV-MAXIMISING cut-off is generally higher early and declines over the life, that is Lane. The break-even ignores the opportunity cost of capacity.'}</text>
            <text className="s" x="12" y="226">{es ? 'Controles C-UNIFORM (ley única) y C-BREAKEVEN (δ=0 → corte = break-even) validan el motor; nada está fabricado.' : 'C-UNIFORM (single grade) and C-BREAKEVEN (δ=0 → cut-off = break-even) controls validate the engine; nothing is fabricated.'}</text>
          </g>
        </svg>
        <figcaption>{es ? 'Depósito + economía → optimizador de Lane → trayectoria de corte decreciente, VAN y vida.' : 'Deposit + economics → Lane optimizer → declining cut-off trajectory, NPV and life.'}</figcaption>
      </figure>

      <p>{es
        ? 'Un bloque de roca es mineral sólo si procesarlo añade más valor que tratarlo como estéril. La respuesta ingenua, el break-even, procesar si el bloque paga su propio costo de proceso, es incorrecta sobre la vida de una mina: ignora el costo de oportunidad de la capacidad y el valor temporal del dinero. '
        : 'A parcel of rock is ore only if processing it adds more value than treating it as waste. The naïve answer, the break-even, process iff the block pays its own processing cost, is wrong over a mine life: it ignores the opportunity cost of capacity and the time value of money. '}
        {es ? 'Lane ' : 'Lane '}<Cite id="lane1964" paren />{es
        ? ' demostró que el corte que MAXIMIZA el VAN suele ser más alto al principio (high-grading mientras la reserva remanente vale más) y DECRECE sobre la vida.'
        : ' showed the NPV-maximising cut-off is generally higher early (high-grading while the remaining reserve is most valuable) and DECLINES over the life.'}</p>

      <h2>{es ? 'Qué hace' : 'What it does'}</h2>
      <ul>
        <li>{es ? 'Toma una curva ley-tonelaje (un depósito lognormal) + precio, costos y las tres capacidades (mina/molino/mercado).' : 'Takes a grade-tonnage curve (a lognormal deposit) + price, costs and the three capacities (mine/mill/market).'}</li>
        <li>{es ? 'Calcula los seis cortes característicos de Lane (3 limitantes + 3 balanceadores) y la trayectoria óptima de corte que maximiza el VAN.' : 'Computes the six characteristic Lane cut-offs (3 limiting + 3 balancing) and the optimal cut-off trajectory that maximises NPV.'}</li>
        <li>{es ? 'Muestra el VAN, la vida de la mina, el perfil de flujo de caja y la sensibilidad, todo recalculado EN VIVO al mover precio/costos/capacidades/δ.' : 'Shows the NPV, the mine life, the cashflow profile and the sensitivity, all recomputed LIVE as you move price/costs/capacities/δ.'}</li>
      </ul>

      <Callout variant="honest" title={es ? 'Honestidad' : 'Honesty'}>
        {es
          ? 'Los depósitos + economía son SINTÉTICOS (un caso base tipo pórfido cuprífero), declarado abiertamente; C-UNIFORM y C-BREAKEVEN son controles de forma cerrada. El surrogate aprendido se mide contra el optimizador EXACTO de Lane, sin victorias fabricadas; el optimizador exacto es la autoridad.'
          : 'The deposits + economics are SYNTHETIC (a porphyry-copper-like base case), stated openly; C-UNIFORM and C-BREAKEVEN are closed-form controls. The learned surrogate is measured against the EXACT Lane optimizer, no fabricated wins; the exact optimizer is the authority.'}
      </Callout>

      <Callout variant="strong" title={es ? 'Qué NO es' : 'What it is NOT'}>
        {es
          ? 'No es un planificador estratégico de mina (sin secuenciamiento de fases, sin pushbacks, sin blending multi-elemento ni incertidumbre geológica). Es la teoría de Lane implementada exactamente sobre una curva ley-tonelaje estacionaria.'
          : 'It is not a strategic mine planner (no phase sequencing, no pushbacks, no multi-element blending or geological uncertainty). It is Lane theory implemented exactly over a stationary grade-tonnage curve.'}
      </Callout>
      <Refs ids={['lane1964', 'lane1988']} label="Refs" />
    </article>
  );
}
