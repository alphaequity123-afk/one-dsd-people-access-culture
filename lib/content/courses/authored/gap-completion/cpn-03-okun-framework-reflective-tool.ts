import { gapCourse, type GapSpec } from './build';
import { withCast } from './cast';
import spec from './specs/cpn-03-okun-framework-reflective-tool.json';

export default gapCourse(withCast(spec as GapSpec));
