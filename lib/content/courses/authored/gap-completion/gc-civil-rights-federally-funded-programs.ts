import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/gc-civil-rights-federally-funded-programs.json';

export default gapCourse(withCast(spec as GapSpec));
