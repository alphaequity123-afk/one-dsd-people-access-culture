import records from './reading-collection.json';

export type Reading = typeof records[number];
export const readings: Reading[] = records;
export const readingSections = [
  'Foundations of equity practice', 'Workplace inclusion and leadership',
  'Equity strategy, systems change and measurement', 'Disability, accessibility and disability justice',
  'Cultural intelligence and intercultural competence', 'Race, ethnicity and history',
  'Gender, LGBTQ+ and intersectional identity', 'Allyship, dialogue and personal growth',
  'Public sector, health and human services equity',
];
export const readingById = (id: string) => readings.find(reading => reading.id === id);
export const readingHref = (id: string) => `/learn/readings/${id}`;
export function searchReadings(query: string, theme: string, section: string) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return readings.filter(book => (!theme || book.themes.includes(theme)) && (!section || String(book.section) === section) && words.every(word => `${book.title} ${book.authors} ${book.overview.join(' ')} ${book.mainPoints.join(' ')}`.toLocaleLowerCase().includes(word)));
}
