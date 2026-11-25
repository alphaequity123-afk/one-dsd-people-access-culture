import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/gc-role-design-qualifications.json';

export default gapCourse(withCast(spec as GapSpec));
