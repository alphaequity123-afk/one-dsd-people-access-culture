import cast from './cast-roles.json';
import type { GapSpec } from './build';

/**
 * Courses written for the program's own cast use {{ROLE}} tokens, such as {{SUPERVISOR}}.
 * cast-roles.json says how each role is written. The recurring cast has no character names, so each
 * role is written as a role ("the supervisor"), capitalized where it starts a sentence.
 */
const names = cast as Record<string, string>;
const TOKEN = /\{\{([A-Z_]+)\}\}/g;
/** Text before a token that means the token opens a sentence, a line or a quotation. */
const SENTENCE_START = /(?:^|[.!?:]["'”’)]?\s+|\n\s*|["“(]\s*)$/;

export function castText(value: string): string {
  return value.replace(TOKEN, (match, role: string, offset: number) => {
    const name = names[role];
    if (!name || role.startsWith('_')) throw new Error(`Unknown cast role ${match}`);
    return SENTENCE_START.test(value.slice(0, offset)) ? name[0].toUpperCase() + name.slice(1) : name;
  });
}

function cast_<T>(value: T): T {
  if (typeof value === 'string') return castText(value) as T;
  if (Array.isArray(value)) return value.map(cast_) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, cast_(child)])) as T;
  return value;
}

/** Replaces cast tokens throughout a gap-completion spec. */
export function withCast(spec: GapSpec): GapSpec {
  return cast_(spec);
}
