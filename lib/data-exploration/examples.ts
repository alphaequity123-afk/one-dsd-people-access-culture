import { validateDataset, type Dataset } from './model';
export { emptyDataset } from './model';

/** Practice aggregate counts teach the interaction; no historical source figures are imported. */
export function practiceDataset(): Dataset {
  const measures = [
    ['1', 'Service access', 'Requests completed within 30 days', 'In-person requests', 'Online requests', [60, 67, 74], [78, 80, 82]],
    ['2', 'Community engagement', 'Participants receiving a response to their feedback', 'Morning sessions', 'Evening sessions', [55, 63, 72], [65, 68, 73]],
    ['3', 'Hiring and retention', 'Applicants invited to an interview', 'Applications through job boards', 'Applications through community outreach', [32, 36, 41], [24, 33, 40]],
    ['4', 'Learning and development', 'Staff offered a development opportunity', 'Full-time schedules', 'Part-time schedules', [78, 80, 83], [54, 65, 74]],
    ['5', 'Contracts and procurement', 'Suppliers receiving clarification before a deadline', 'New suppliers', 'Returning suppliers', [51, 64, 75], [80, 82, 84]],
    ['6', 'Communication and accessibility', 'People receiving information in their requested format', 'Written requests', 'Telephone requests', [80, 83, 87], [61, 69, 78]],
  ] as const;
  return validateDataset({
    schemaVersion: 1,
    title: 'Practice: explore differences across DHS work',
    notes: 'All figures are practice. These examples show how to explore a measure; they do not describe DHS performance. Groups must use the same measure definition and inclusion rules before differences can be interpreted.',
    minimumGroupSize: 20,
    records: [...measures.flatMap(([goal, program, measure, first, second, firstCounts, secondCounts]) =>
      [first, second].flatMap((group, groupIndex) => [1, 2, 3].map((periodOrder, periodIndex) => ({
        id: `practice-${goal}-${groupIndex}-${periodOrder}`,
        program, goal, measure, group, period: `Period ${periodOrder}`, periodOrder,
        numerator: (groupIndex === 0 ? firstCounts : secondCounts)[periodIndex], denominator: 100,
        source: 'Practice example', sourceDate: '', practice: true,
      })))), ...[1, 2, 3].flatMap((periodOrder) => [
        { id: `practice-small-${periodOrder}`, program: 'Service access', goal: '1', measure: 'Requests completed within 30 days', group: 'Small-group example', period: `Period ${periodOrder}`, periodOrder, numerator: 7, denominator: 12, source: 'Practice example', sourceDate: '', practice: true },
        { id: `practice-missing-${periodOrder}`, program: 'Service access', goal: '1', measure: 'Requests completed within 30 days', group: 'Missing-information example', period: `Period ${periodOrder}`, periodOrder, numerator: null, denominator: 100, source: 'Practice example', sourceDate: '', practice: true },
      ])],
  });
}
