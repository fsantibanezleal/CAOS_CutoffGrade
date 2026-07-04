// CutoffGrade Studio engine, Lane's cut-off-grade optimization. Dependency-free (no DOM, no npm runtime deps) so the
// SAME engine runs in the browser (live) and under Node in the offline bake (via tsx).
//
//   gradeTonnageCurve / oreFraction / avgGradeAbove, the lognormal grade-tonnage curve
//   breakEven / laneCutoffs                        , the break-even + Lane's six characteristic cut-offs
//   simulateLife / optimalConstantCutoff / laneTrajectory, the exact life simulator + the two NPV optimizers

export * from './types.ts';
export { erf, normCdf, lnParams, oreFraction, avgGradeAbove, metalAbove, gradeTonnageCurve } from './gradetonnage.ts';
export { breakEven, laneCutoffs } from './lane.ts';
export { simulateLife, optimalConstantCutoff, laneTrajectory } from './optimize.ts';
export { analyze } from './analyze.ts';
export type { Analysis, SensitivityRow } from './analyze.ts';
export { FEATURES } from './learned.ts';
