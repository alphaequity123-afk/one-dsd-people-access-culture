import content from "@/data/dsd-live/leadership/practice.json";
import type { PracticeCase, PracticeSource } from "./practice-types";
import { currentUnit } from "../unit";
import { dsdLeadershipCases, dsdLeadershipIntroduction, dsdLeadershipSources } from "../dsd-practice/leadership";

const isDsd = currentUnit().id === "dsd";
export const practiceCases: PracticeCase[] = isDsd ? dsdLeadershipCases(content.simulations) : content.simulations;
export const practiceSources: PracticeSource[] = isDsd ? [...content.sources,...dsdLeadershipSources] : content.sources;
export const practiceIntroduction = isDsd ? dsdLeadershipIntroduction : content.introduction;
export const practiceHome = "/learn/leadership/practice";
