import type { CoursePack, Source } from '../../source-types';
import { conceptualChecks } from './checks';

export type FoundationLesson = {
  title: string; objectives: [string, string, string]; teaching: string; example: string;
  reflection: string; action: string; question: string;
  choices: [string, string, string]; feedback: [string, string, string];
};
export type FoundationSpec = {
  id: string; number: number; title: string; subtitle: string; lessons: FoundationLesson[];
  sources: Source[]; cards: {front: string; back: string}[];
  aid: {heading: string; items: string[]}[];
};
export function foundation(spec: FoundationSpec): CoursePack {
  const html = (value: string) => value.trim().split(/\n\s*\n/).map(p => `<p>${p.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>`).join('');
  return {
    course: {
      id: spec.id, indexNumber: 1300 + spec.number, title: spec.title,
      seriesLabel: 'Diversity learning · Foundation', subtitle: spec.subtitle,
      scope: 'For One DHS and One DSD colleagues exploring diversity in their lives and public-service work. Participation is voluntary and lessons can be opened in any order. Examples are practice. Keep reflection notes without identifying coworkers or members of the public.',
      treatment: 'Four lessons with explanations, practice cases, practice decisions and feedback, knowledge checks, private reflection, flashcards, and a practical job aid.',
      duration: 'About 48 minutes, plus optional practice', author: 'One DHS / One DSD — People, Access and Culture',
      coverImage: '/images/covers/stock-people-13.jpg', coverAlt: 'Two people examine an open book together; one points to a passage.',
      kind: 'course', contentType: 'foundation',
      learning: { objectives: spec.lessons.map(l => l.objectives[0]), evidence: ['Explain the distinctions in each knowledge check.', 'Compare the practice case responses and their consequences.', 'Prepare and revisit the course job aid using a situation you choose.'], appliedNextStep: spec.lessons[3].action },
      governance: { contentOwner: 'One DHS / One DSD — People, Access and Culture', reviewers: [], evidenceDate: '2026-09-22', lastReviewed: 'Authoring and source checks, 2026-09-22; no independent check recorded', nextReview: '2027-03-22 or when evidence or relevant guidance changes', updateTriggers: ['Updated research or official guidance', 'Learner feedback about accuracy, accessibility, or a stereotyping example'], relatedDoor: 'Take formal policy, employment, accommodation, or civil-rights decisions to the person or area responsible in the agency.', toolkitQuestion: 'What assumption, effect, or opportunity does this example help me examine?', status: 'current' },
      lessons: spec.lessons.map((l, i) => ({
        id: `${spec.id}-${i+1}`, number: i+1, title: l.title, summary: l.objectives[0], minutes: 12,
        learning: { objective: l.objectives[0], objectives: l.objectives, takeaways: l.teaching.split(/\n\s*\n/).map(p => p.trim().match(/^.*?[.!?](?:\s|$)/)?.[0].trim() ?? p.trim()), evidence: l.action, appliedNextStep: l.action },
        scenario: {context: l.example, prompt: l.question, options: l.choices.map((label, j) => ({label, response: l.feedback[j], recommended: j === 0}))},
        transfer: {prompt: l.reflection, options: ['Explore this privately using the practice case.', 'Apply the exercise to a situation I choose without identifying anyone.', 'Return to this practice later.']},
        blocks: [
          {type: 'text' as const, heading: l.title, body: html(l.teaching)},
          {type: 'text' as const, heading: 'A practice example to examine', body: html(l.example)},
          {type: 'text' as const, heading: 'Practice and review', body: html(l.action)},
          {type: 'text' as const, heading: 'Private reflection', body: html(l.reflection)},
          ...(i === 0 ? [{type: 'flashcards' as const, heading: 'Concepts to carry forward', cards: spec.cards}] : []),
          {type: 'knowledgeCheck' as const, id: `${spec.id}-${i+1}-check`, question: conceptualChecks[spec.number-1][i][0], options: conceptualChecks[spec.number-1][i].slice(1,4).map((text, j) => ({text, correct: j === 0})), feedbackCorrect: conceptualChecks[spec.number-1][i][4], feedbackIncorrect: conceptualChecks[spec.number-1][i][4]},
        ],
      })),
    },
    jobAid: {title: `${spec.title}: practice guide`, subtitle: 'A reusable guide for a situation you choose', use: {purpose: spec.subtitle, remember: ['Use observable details rather than assigning motives.', 'Invite perspectives without requiring personal disclosure.', 'Keep learning separate from individual assessment or personnel decisions.'], doNext: spec.lessons[3].action}, sections: [...spec.aid, {heading:'Try the guide and revisit it',items:[spec.lessons[3].action, spec.lessons[3].reflection]}]},
    sources: spec.sources,
  };
}

export const sources = {
  privilege: {title: 'Peggy McIntosh — White Privilege: Unpacking the Invisible Knapsack', href: 'https://www.wcwonline.org/Fact-Sheets-Briefs/white-privilege-unpacking-the-invisible-knapsack-2', note: 'Original author resource on unearned racial advantages; a reflective framework, not an assessment of any individual.'},
  micro: {title: 'American Psychological Association — How to combat microaggressions', href: 'https://www.apa.org/news/podcasts/speaking-of-psychology/microaggressions', note: 'Interview with researcher Derald Wing Sue about identity-based everyday slights and responses.'},
  sue: {title: 'Sue and colleagues (2007) — Racial microaggressions in everyday life', href: 'https://www.uwindsor.ca/psychology/sites/uwindsor.ca.psychology/files/sue_et_al._2007_microaggression_in_everyday_life_implications_for_clinical_practice.pdf', note: 'Original conceptual paper; its clinical context is distinct from the original workplace exercises in this course.'},
  unesco: {title: 'UNESCO — Intercultural competences: conceptual and operational framework', href: 'https://unesdoc.unesco.org/ark:/48223/pf0000219768', note: 'Conceptual framework for intercultural dialogue, reflection, and communication; not a national-character checklist.'},
  clas: {title: 'HHS Think Cultural Health — Communication Guide', href: 'https://thinkculturalhealth.hhs.gov/education/communication-guide', note: 'Public education on cross-cultural communication; original exercises here apply communication questions to staff learning.'},
  stories: {title: 'UNESCO — Manual for Developing Intercultural Competencies: Story Circles', href: 'https://unesdoc.unesco.org/ark:/48223/pf0000370336', note: 'Intercultural learning through listening and reflection; this course does not reproduce or certify the manual’s method.'},
  iat: {title: 'Project Implicit — Frequently asked questions', href: 'https://implicit.harvard.edu/implicit/faqs.html', note: 'Explains what the IAT measures, variation in results, and caution about individual interpretation.'},
  iatEthics: {title: 'Project Implicit — Ethical considerations', href: 'https://implicit.harvard.edu/implicit/ethics.html', note: 'Read before deciding whether to take an external IAT.'},
  belonging: {title: 'UC Berkeley Othering & Belonging Institute — What is belonging?', href: 'https://belonging.berkeley.edu/what-is-belonging', note: 'Distinguishes belonging, recognition, voice, and participation in the institutions shaping people’s lives.'},
  design: {title: 'UC Berkeley Othering & Belonging Institute — Belonging design principles', href: 'https://belonging.berkeley.edu/belongingdesignprinciples', note: 'Institutional belonging and creating together; not an individual diagnostic scale.'},
  fiske: {title: 'Susan T. Fiske — Prejudice, discrimination, and stereotyping', href: 'https://nobaproject.com/modules/prejudice-discrimination-and-stereotyping', note: 'Researcher-authored educational chapter distinguishing affect, beliefs, and behavior.'},
  idi: {title: 'Intercultural Development Inventory — The Intercultural Development Continuum', href: 'https://www.idiinventory.com/idc', note: 'Official descriptions of Denial, Polarization, Minimization, Acceptance, and Adaptation. This course does not administer or infer an individual IDI result.'},
  crenshaw: {title: 'Kimberlé Crenshaw (1989) — Demarginalizing the Intersection of Race and Sex', href: 'https://chicagounbound.uchicago.edu/uclf/vol1989/iss1/8/', note: 'Original scholarship on how single-axis analysis can obscure Black women’s experiences; original cases here extend inquiry without erasing that origin.'},
  ada: {title: 'U.S. Department of Justice — Introduction to the Americans with Disabilities Act', href: 'https://www.ada.gov/topics/intro-to-ada/', note: 'Authoritative background on equal opportunity and disability access; formal applicability belongs to the person or area responsible in the agency.'},
  mappingPrejudice: {title: 'Mapping Prejudice, University of Minnesota — Racial covenants in Minnesota property records', href: 'https://mappingprejudice.umn.edu/', note: 'Research project that locates and maps racial covenants in Hennepin County and other Minnesota counties, with history of their use and the 2019 Minnesota law for discharging them.'},
  mappingInequality: {title: 'Mapping Inequality: Redlining in New Deal America, University of Richmond Digital Scholarship Lab', href: 'https://dsl.richmond.edu/panorama/redlining/', note: 'Digitized Home Owners’ Loan Corporation neighborhood maps and appraisal notes from the National Archives, including Minneapolis, St. Paul and Duluth.'},
  mnCompass: {title: 'Minnesota Compass (Wilder Research) — Housing: homeownership by race', href: 'https://www.mncompass.org/', note: 'Minnesota data on homeownership and other outcomes by race; open the Housing topic for current figures.'},
  callbackStudy: {title: 'Bertrand and Mullainathan (2004) — Are Emily and Greg More Employable than Lakisha and Jamal? American Economic Review', href: 'https://www.aeaweb.org/articles?id=10.1257/0002828042002561', note: 'Field experiment sending matched résumés to job ads in Boston and Chicago; names more common among white people received about 50 percent more callbacks.'},
  callbackMeta: {title: 'Quillian and others (2017) — Meta-analysis of field experiments shows no change in racial discrimination in hiring over time, Proceedings of the National Academy of Sciences', href: 'https://www.pnas.org/doi/10.1073/pnas.1706255114', note: 'Combines United States hiring field experiments since 1989; white applicants received about 36 percent more callbacks than equally qualified Black applicants.'},
  credibilityStudy: {title: 'Moss-Racusin and others (2012) — Science faculty’s subtle gender biases favor male students, Proceedings of the National Academy of Sciences', href: 'https://www.pnas.org/doi/10.1073/pnas.1211286109', note: 'Faculty rated an identical lab manager application as more competent and offered a higher salary when it carried a male name.'},
  titleVII: {title: 'Equal Employment Opportunity Commission — Title VII of the Civil Rights Act of 1964', href: 'https://www.eeoc.gov/statutes/title-vii-civil-rights-act-1964', note: 'Federal law prohibiting employment discrimination based on race, color, religion, sex and national origin, and retaliation for raising a concern.'},
  titleVI: {title: 'U.S. Department of Justice, Civil Rights Division — Title VI of the Civil Rights Act of 1964', href: 'https://www.justice.gov/crt/fcs/TitleVI', note: 'Prohibits discrimination based on race, color or national origin in federally funded programs, including meaningful access for people with limited English.'},
  mnHumanRightsAct: {title: 'Minnesota Statutes chapter 363A — Minnesota Human Rights Act', href: 'https://www.revisor.mn.gov/statutes/cite/363A', note: 'State law prohibiting discrimination in employment, housing, public services and other areas, and reprisal for raising a concern.'},
  eeocTechAssist: {title: 'Equal Employment Opportunity Commission (2025) — What You Should Know About DEI-Related Discrimination at Work', href: 'https://www.eeoc.gov/wysk/what-you-should-know-about-dei-related-discrimination-work', note: 'Technical assistance explaining that employment actions based on race or another protected trait are unlawful whatever the stated goal.'},
  heuristicsStudy: {title: 'Tversky and Kahneman (1974) — Judgment under Uncertainty: Heuristics and Biases, Science', href: 'https://www.science.org/doi/10.1126/science.185.4157.1124', note: 'Classic research showing that people rely on a few rules of thumb to make hard judgments quickly, and that these shortcuts can produce predictable errors.'},
  confirmationReview: {title: 'Nickerson (1998) — Confirmation Bias: A Ubiquitous Phenomenon in Many Guises, Review of General Psychology', href: 'https://doi.org/10.1037/1089-2680.2.2.175', note: 'Review of research on the tendency to seek and weigh evidence that fits a conclusion already reached.'},
  structuredInterviews: {title: 'United States Office of Personnel Management — Structured Interviews', href: 'https://www.opm.gov/policy-data-oversight/assessment-and-selection/structured-interviews/', note: 'Federal hiring guidance on asking every candidate the same questions and rating answers on a defined scale.'},
  titleVIManual: {title: 'United States Department of Justice, Civil Rights Division — Title VI Legal Manual', href: 'https://www.justice.gov/crt/fcs/T6Manual', note: 'Explains Title VI duties for federally funded programs, including criteria or methods that have the effect of discriminating, and language access.'},
};
