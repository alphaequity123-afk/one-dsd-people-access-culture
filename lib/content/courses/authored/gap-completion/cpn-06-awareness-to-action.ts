import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/cpn-06-awareness-to-action.json';

export default gapCourse(withCast(spec as GapSpec));
