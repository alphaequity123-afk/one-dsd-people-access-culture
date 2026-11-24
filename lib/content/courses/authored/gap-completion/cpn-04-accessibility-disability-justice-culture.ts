import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/cpn-04-accessibility-disability-justice-culture.json';

export default gapCourse(withCast(spec as GapSpec));
