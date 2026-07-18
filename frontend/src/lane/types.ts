// CutoffGrade Studio, shared types for Lane's cut-off-grade optimization.
//
// The deposit is a mineralised inventory with a (lognormal) grade distribution. A cut-off grade splits each parcel
// into ore (milled) vs waste (mined, dumped). The three stages, mine (total material), mill (ore), market (product)
//, each have a capacity; whichever binds drives the economics. Lane (1964, 1988): the NPV-maximising cut-off is
// generally higher early (high-grading) and declines over the life, because the opportunity cost of capacity (F·δ,
// F = the present value of the remaining operation) falls as the reserve depletes.

export interface Economics {
  /** product price, $/unit product (e.g. $/t metal). */
  price: number;
  /** mining cost, $/t of total material mined (m). */
  miningCost: number;
  /** processing cost, $/t ore (h). */
  processingCost: number;
  /** marketing/refining cost, $/unit product (k). */
  refiningCost: number;
  /** fixed/time cost, $/yr (f). */
  fixedCostYr: number;
  /** metallurgical recovery, fraction in (0,1] (y). */
  recovery: number;
  /** mine capacity, t total material / yr (M). */
  mineCapacity: number;
  /** mill capacity, t ore / yr (H). */
  millCapacity: number;
  /** market capacity, units product / yr (K). */
  marketCapacity: number;
  /** discount rate per yr (δ). */
  discountRate: number;
}

export interface Deposit {
  id: string;
  /** mean grade, units product per t ore (e.g. a fraction 0.012 = 1.2%). */
  gradeMean: number;
  /** coefficient of variation of grade (σ/μ of the lognormal). 0 → uniform single-grade deposit. */
  gradeCv: number;
  /** total mineralised inventory, million tonnes (Mt). */
  tonnageMt: number;
}

/** A point on the grade-tonnage curve. */
export interface GTPoint {
  cutoff: number;
  /** fraction of the inventory at or above this cut-off (ore fraction). */
  oreFraction: number;
  /** average grade of the ore (mean grade above the cut-off). */
  avgGrade: number;
}

/** Lane's six characteristic cut-offs + the effective optimum, at a given remaining-value F ($M). */
export interface LaneCutoffs {
  /** limiting cut-offs (one per binding stage). */
  gMine: number;
  gMill: number;
  gMarket: number;
  /** balancing cut-offs (one per pair of stages). */
  gMineMill: number;
  gMillMarket: number;
  gMineMarket: number;
  /** which stage (or pair) actually binds at the effective cut-off. */
  binding: string;
  /** the effective optimum cut-off for the current state. */
  effective: number;
}

/** One simulated period (year). */
export interface SchedulePoint {
  year: number;
  cutoff: number;
  /** average ore grade milled this year. */
  oreGrade: number;
  /** ore milled this year, Mt. */
  oreMt: number;
  /** total material mined this year, Mt. */
  minedMt: number;
  /** undiscounted cashflow this year, $M. */
  cashflow: number;
  /** the binding stage this year. */
  binding: string;
  /** remaining inventory at the end of the year, Mt. */
  remainingMt: number;
}

export interface LifeResult {
  schedule: SchedulePoint[];
  /** net present value, $M. */
  npv: number;
  lifeYears: number;
  /** ore-tonnage-weighted mean cut-off over the life. */
  meanCutoff: number;
  /** ore-tonnage-weighted mean ore grade over the life. */
  meanGrade: number;
}
