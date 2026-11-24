import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/cpn-05-building-cultures-of-belonging.json';

export default gapCourse(withCast(spec as GapSpec));
