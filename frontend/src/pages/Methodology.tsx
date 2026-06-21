import { Callout, Cite, Equation, InlineMath, ReferenceList, Tabs, useShellLang } from '@fasl-work/caos-app-shell';

export default function Methodology() {
  const es = useShellLang() === 'es';
  return (
    <article className="page-body prose">
      <h1>{es ? 'Metodología' : 'Methodology'}</h1>
      <p className="lede">{es
        ? 'Curva ley-tonelaje → los tres cortes limitantes + tres balanceadores → la optimización de VAN de punto fijo → la trayectoria de corte decreciente (high-grading).'
        : 'Grade-tonnage curve → the three limiting + three balancing cut-offs → the NPV fixed-point optimization → the declining cut-off trajectory (high-grading).'}</p>

      <Tabs ariaLabel={es ? 'metodología' : 'methodology'} tabs={[
        {
          id: 'gt', label: es ? 'Ley-tonelaje' : 'Grade-tonnage',
          content: (
            <div className="pf-doc-sec">
              <p>{es ? 'El depósito es una distribución lognormal de la ley con media ' : 'The deposit is a lognormal distribution of grade with mean '}<InlineMath tex="M" />{es ? ' y coeficiente de variación ' : ' and coefficient of variation '}<InlineMath tex="cv" />{es ? '. Para un corte ' : '. For a cut-off '}<InlineMath tex="g_c" />{es ? ' la fracción mineral y la ley media del mineral son analíticas:' : ' the ore fraction and the average ore grade are analytic:'}</p>
              <Equation tex="\phi(g_c)=\Phi\!\left(\tfrac{\mu-\ln g_c}{\sigma}\right),\qquad \bar g(g_c)=M\,\frac{\Phi\!\left(\tfrac{\mu-\ln g_c}{\sigma}+\sigma\right)}{\Phi\!\left(\tfrac{\mu-\ln g_c}{\sigma}\right)}" />
              <p>{es ? 'con ' : 'with '}<InlineMath tex="\sigma^2=\ln(1+cv^2)" />{es ? ' y ' : ' and '}<InlineMath tex="\mu=\ln M-\sigma^2/2" />{es ? '. Cuando ' : '. As '}<InlineMath tex="cv\to0" />{es ? ' el depósito es de ley única (todo o nada).' : ' the deposit is single-grade (all-or-nothing).'}</p>
            </div>
          ),
        },
        {
          id: 'lane', label: es ? 'Cortes de Lane' : 'Lane cut-offs',
          content: (
            <div className="pf-doc-sec">
              <p>{es ? 'El margen por unidad de ley por tonelada de mineral es ' : 'The margin per unit grade per tonne of ore is '}<InlineMath tex="y(p-k)" />{es ? '. Cada etapa que limita impone su corte. El término ' : '. Each binding stage sets its cut-off. The term '}<InlineMath tex="\tau=f+F\delta" />{es ? ' es el costo de oportunidad de un año de la capacidad escasa (' : ' is the opportunity cost of a year of the scarce capacity ('}<InlineMath tex="F" />{es ? ' = el VAN de la operación remanente):' : ' = the NPV of the remaining operation):'}</p>
              <Equation tex="g_{\text{mina}}=\frac{h}{y(p-k)},\quad g_{\text{molino}}=\frac{h+\tau/H}{y(p-k)},\quad g_{\text{mercado}}=\frac{h}{y\big((p-k)-\tau/K\big)}" />
              <Callout variant="note" title={es ? 'Por qué el corte DECRECE' : 'Why the cut-off DECLINES'}>
                {es ? 'Cuando el molino o el mercado limitan, ocupar esa capacidad un año cuesta ' : 'When the mill or the market binds, occupying that capacity for a year costs '}<InlineMath tex="\tau=f+F\delta" />{es ? ', así que el corte sube sobre el break-even. Al agotarse la reserva, ' : ', so the cut-off rises above break-even. As the reserve depletes, '}<InlineMath tex="F\to0" />{es ? ', ' : ', '}<InlineMath tex="\tau\to f" />{es ? ' y el corte cae al break-even. Eso es el high-grading ' : ' and the cut-off falls to break-even. That is high-grading '}<Cite id="lane1988" paren />{es ? '.' : '.'}
              </Callout>
              <p>{es ? 'Los tres cortes balanceadores (mina-molino, molino-mercado, mina-mercado) igualan los tiempos de las etapas; la construcción mediana de Dagdelen ' : 'The three balancing cut-offs (mine-mill, mill-market, mine-market) equalise the stage times; Dagdelen median construction '}<Cite id="dagdelen1992" paren />{es ? ' elige el óptimo efectivo.' : ' picks the effective optimum.'}</p>
            </div>
          ),
        },
        {
          id: 'npv', label: es ? 'Optimización VAN' : 'NPV optimization',
          content: (
            <div className="pf-doc-sec">
              <p>{es ? 'Como ' : 'Because '}<InlineMath tex="F" />{es ? ' aparece en el corte Y el corte determina los flujos que determinan ' : ' appears in the cut-off AND the cut-off determines the cashflows that determine '}<InlineMath tex="F" />{es ? ', el óptimo es un PUNTO FIJO resuelto sobre la vida:' : ', the optimum is a FIXED POINT solved over the life:'}</p>
              <Equation tex="\text{VAN}=\sum_{t}\frac{C_t}{(1+\delta)^t},\qquad C_t=\text{ore}_t\,\bar g_t\,y(p-k)-\text{ore}_t\,h-Q_t\,m-f" />
              <p>{es ? 'Un simulador exacto año a año (' : 'An exact year-by-year simulator ('}<InlineMath tex="Q_t=\min(M,\,H/\phi,\,K/(\phi\bar g y),\,R)" />{es ? ') da el VAN de cualquier política de corte. El óptimo constante (búsqueda 1-D con refinamiento golden-section) es la línea base verificable; la política decreciente de Lane (iteración de punto fijo) es ' : ') gives the NPV of any cut-off policy. The optimal constant cut-off (a 1-D search refined by golden-section) is the verifiable baseline; the declining Lane policy (the fixed-point iteration) is '}<InlineMath tex="\geq" />{es ? ' el mejor constante ' : ' the best constant '}<Cite id="asad2011" paren />{es ? '.' : '.'}</p>
            </div>
          ),
        },
        {
          id: 'learned', label: es ? 'Aprendido' : 'Learned',
          content: (
            <div className="pf-doc-sec">
              <p>{es ? 'Dos modelos aprendidos, honestos, medidos contra el optimizador EXACTO: (1) un SURROGATE MLP (features del depósito + economía → corte óptimo, VAN, vida) para sliders/Monte-Carlo instantáneos; (2) un AUTOENCODER de escenarios que marca puntos fuera del envolvente de entrenamiento (el surrogate está extrapolando).'
                : 'Two honest learned models measured against the EXACT optimizer: (1) an MLP SURROGATE (deposit + economic features → optimal cut-off, NPV, life) for instant sliders/Monte-Carlo; (2) a scenario AUTOENCODER that flags points outside the training envelope (the surrogate is extrapolating).'}</p>
              <p className="pf-cap">{es ? 'El optimizador exacto es barato y corre en vivo por defecto; el surrogate gana su lugar en barridos masivos. Refs: ' : 'The exact optimizer is cheap and runs live by default; the surrogate earns its place on mass sweeps. Refs: '}<Cite id="hall2014" />, <Cite id="rendu2014" />.</p>
            </div>
          ),
        },
      ]} />

      <h2>{es ? 'Referencias' : 'References'}</h2>
      <ReferenceList />
    </article>
  );
}
