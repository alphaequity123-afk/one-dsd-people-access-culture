import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/gc-accessibility-barrier-remediation.json';

export default gapCourse(withCast(spec as GapSpec));
