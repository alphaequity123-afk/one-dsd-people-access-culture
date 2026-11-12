import { gapCourse, type GapSpec } from './build';
import spec from './specs/gc-leading-without-authority.json';

export default gapCourse(spec as GapSpec);
