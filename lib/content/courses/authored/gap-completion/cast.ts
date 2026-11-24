import cast from './cast.json';
import type { GapSpec } from './build';

/**
 * Courses written for the program's own cast use {{ROLE}} tokens, such as {{SUPERVISOR}},
 * in place of character names. The names live in cast.json so the owner can swap the
 * placeholder cast for the program's characters in one place.
 */
const names = cast as Record<string, string>;
const TOKEN = /\{\{([A-Z_]+)\}\}/g;

export function castText(value: string): string {
  return value.replace(TOKEN, (match, role: string) => {
    const name = names[role];
    if (!name || role.startsWith('_')) throw new Error(`Unknown cast role ${match}`);
    return name;
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
