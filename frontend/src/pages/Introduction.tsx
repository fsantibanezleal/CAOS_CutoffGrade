import { Callout, Cite, Refs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Introduction() {
  const es = useShellLang() === 'es';
  return (
    <article className="page-body prose">
      <h1>{es ? 'Introducción' : 'Introduction'}</h1>
      <p className="lede">{es
        ? '"Mineral" no es un hecho geológico — es una decisión económica. La ley de corte es esa frontera, y elegirla mal cuesta cientos de millones de VAN.'
        : '"Ore" is not a geological fact — it is an economic decision. The cut-off grade is that boundary, and choosing it badly costs hundreds of millions of NPV.'}</p>

      <p>{es
        ? 'Un bloque de roca es mineral sólo si procesarlo añade más valor que tratarlo como estéril. La respuesta ingenua — el break-even, procesar si el bloque paga su propio costo de proceso — es incorrecta sobre la vida de una mina: ignora el costo de oportunidad de la capacidad y el valor temporal del dinero. '
        : 'A parcel of rock is ore only if processing it adds more value than treating it as waste. The naïve answer — the break-even, process iff the block pays its own processing cost — is wrong over a mine life: it ignores the opportunity cost of capacity and the time value of money. '}
        {es ? 'Lane ' : 'Lane '}<Cite id="lane1964" paren />{es
        ? ' demostró que el corte que MAXIMIZA el VAN suele ser más alto al principio (high-grading mientras la reserva remanente vale más) y DECRECE sobre la vida.'
        : ' showed the NPV-maximising cut-off is generally higher early (high-grading while the remaining reserve is most valuable) and DECLINES over the life.'}</p>

      <h2>{es ? 'Qué hace' : 'What it does'}</h2>
      <ul>
        <li>{es ? 'Toma una curva ley-tonelaje (un depósito lognormal) + precio, costos y las tres capacidades (mina/molino/mercado).' : 'Takes a grade-tonnage curve (a lognormal deposit) + price, costs and the three capacities (mine/mill/market).'}</li>
        <li>{es ? 'Calcula los seis cortes característicos de Lane (3 limitantes + 3 balanceadores) y la trayectoria óptima de corte que maximiza el VAN.' : 'Computes the six characteristic Lane cut-offs (3 limiting + 3 balancing) and the optimal cut-off trajectory that maximises NPV.'}</li>
        <li>{es ? 'Muestra el VAN, la vida de la mina, el perfil de flujo de caja y la sensibilidad — todo recalculado EN VIVO al mover precio/costos/capacidades/δ.' : 'Shows the NPV, the mine life, the cashflow profile and the sensitivity — all recomputed LIVE as you move price/costs/capacities/δ.'}</li>
      </ul>

      <Callout variant="honest" title={es ? 'Honestidad' : 'Honesty'}>
        {es
          ? 'Los depósitos + economía son SINTÉTICOS (un caso base tipo pórfido cuprífero), declarado abiertamente; C-UNIFORM y C-BREAKEVEN son controles de forma cerrada. El surrogate aprendido se mide contra el optimizador EXACTO de Lane — sin victorias fabricadas; el optimizador exacto es la autoridad.'
          : 'The deposits + economics are SYNTHETIC (a porphyry-copper-like base case), stated openly; C-UNIFORM and C-BREAKEVEN are closed-form controls. The learned surrogate is measured against the EXACT Lane optimizer — no fabricated wins; the exact optimizer is the authority.'}
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
