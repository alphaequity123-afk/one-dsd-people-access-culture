import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/cpn-01-understanding-organizational-culture.json';

export default gapCourse(withCast(spec as GapSpec));
