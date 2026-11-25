import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/gc-classification-pay-equity.json';

export default gapCourse(withCast(spec as GapSpec));
