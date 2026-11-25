import { gapCourse, type GapSpec } from './build';
import spec from './specs/cw-learning-organization.json';

export default gapCourse(spec as GapSpec);
