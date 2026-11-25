import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/gc-affirmative-action-workforce-goals.json';

export default gapCourse(withCast(spec as GapSpec));
