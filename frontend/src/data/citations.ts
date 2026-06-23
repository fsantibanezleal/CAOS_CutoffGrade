import type { Citation } from '@fasl-work/caos-app-shell';

// The references CutoffGrade Studio's methodology rests on — Lane's economic cut-off-grade theory.
// None of these carry a DOI (the seminal works pre-date DOIs, or are books / conference proceedings),
// so each links to a verifiable, stable source: the publisher, a library catalogue, or an open archive.
export const CITATIONS: Citation[] = [
  {
    id: 'lane1964',
    label: 'Lane 1964',
    citation: 'Lane, K. F. (1964). Choosing the optimum cut-off grade. Colorado School of Mines Quarterly, 59(4), 811–829.',
    url: 'https://www.academia.edu/32253070/Choosing_the_Optimum_Cutoff_Grade_by_K_Lane_1964_',
  },
  {
    id: 'lane1988',
    label: 'Lane 1988',
    citation: 'Lane, K. F. (1988). The Economic Definition of Ore: Cut-off Grades in Theory and Practice. Mining Journal Books, London. ISBN 978-0-900117-45-9.',
    url: 'https://books.google.com/books/about/The_Economic_Definition_of_Ore.html?id=-igaAQAAIAAJ',
  },
  {
    id: 'dagdelen1992',
    label: 'Dagdelen 1992',
    citation: 'Dagdelen, K. (1992). Cutoff grade optimization. In Proc. 23rd APCOM Symposium, SME, Littleton, CO, 157–165. ISBN 978-0-87335-110-2.',
    url: 'https://search.worldcat.org/title/23rd-application-of-computers-and-operations-research-in-the-mineral-industry/oclc/26335886',
  },
  {
    id: 'asad2011',
    label: 'Asad & Topal 2011',
    citation: 'Asad, M. W. A. & Topal, E. (2011). Net present value maximization model for optimum cut-off grade policy of open pit mining operations. Journal of the SAIMM, 111(11), 741–750.',
    url: 'https://scielo.org.za/scielo.php?script=sci_arttext&pid=S2225-62532011001100005',
  },
  {
    id: 'hall2014',
    label: 'Hall 2014',
    citation: 'Hall, B. (2014). Cut-off Grades and Optimising the Strategic Mine Plan (Spectrum Series 20). AusIMM, Melbourne. ISBN 978-1-925100-21-1.',
    url: 'https://www.ausimm.com/publications/spectrum-series/cut-off-grades-and-optimising-the-strategic-mine-plan/',
  },
  {
    id: 'rendu2014',
    label: 'Rendu 2014',
    citation: 'Rendu, J.-M. (2014). An Introduction to Cut-off Grade Estimation, 2nd ed. SME, Englewood, CO. ISBN 978-0-87335-393-9.',
    url: 'https://books.google.com/books/about/An_Introduction_to_Cut_off_Grade_Estimat.html?id=jK1yAgAAQBAJ',
  },
];
