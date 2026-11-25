import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/gc-workforce-data-life-cycle.json';

export default gapCourse(withCast(spec as GapSpec));
