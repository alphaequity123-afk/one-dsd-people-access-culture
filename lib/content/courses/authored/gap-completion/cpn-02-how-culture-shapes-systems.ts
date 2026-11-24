import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/cpn-02-how-culture-shapes-systems.json';

export default gapCourse(withCast(spec as GapSpec));
