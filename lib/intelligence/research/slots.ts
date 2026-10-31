/** The research provider refuses bursts, so calls beyond this number wait their turn. */
export const MAX_CONCURRENT_RESEARCH = 3;

let active = 0;
const waiting: Array<() => void> = [];

export async function withResearchSlot<T>(work: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT_RESEARCH) await new Promise<void>(resolve => waiting.push(resolve));
  else active++;
  try {
    return await work();
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}
