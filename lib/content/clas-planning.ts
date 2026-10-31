/** Program-authored preparation prompts; never an agency compliance determination. */
export const CLAS_SOURCE = {title:"National CLAS Standards — HHS Office of Minority Health",href:"https://thinkculturalhealth.hhs.gov/clas/standards"} as const;
export const CLAS_PLANNING_FIELDS = [
 {id:"context",label:"The service and the people it reaches",help:"Describe the service, decision or communication in general terms. What cultural, language and other communication needs must you understand? Keep missing perspectives explicit."},
 {id:"standards",label:"Relevant CLAS standards and why they matter here",help:"Read the current standards. Note the relevant standard numbers and explain the connection to this service. A reference to the whole framework is not an applicability analysis."},
 {id:"requirements",label:"Other requirements to confirm",help:"Identify any separate law, approved agency policy or contract term that applies, with its source and responsible office. Keep a recommendation under CLAS separate from a confirmed binding requirement. Write unknown when interpretation is still needed."},
 {id:"actions",label:"Changes to consider",help:"Connect each concern and relevant standard to a proposed action. Consider accessible communication, qualified language support, workforce preparation and community participation as relevant. Compare options and note resources or constraints."},
 {id:"review",label:"Who needs to review this preparation",help:"Name responsible roles and the questions they must resolve: for example the service owner, language access coordinator or the right policy staff member. Do not enter personal or case details or treat a planned review as completed approval."},
 {id:"implementation",label:"How an agreed change would be put into practice",help:"Identify the responsible role, preparation and access arrangements, resources needed and the decision still required. Record approved timing only when known; this worksheet creates no commitment."},
 {id:"evaluation",label:"What to examine afterward and how to report back",help:"Describe evidence that could show whether people can use the service, who would interpret it, limitations and privacy protections, and how participants would hear what changed. Proposed checks are not approved indicators or results."},
] as const;
export function clasPlanningText(values:Readonly<Record<string,string>>):string {
 const sections=["Cultural and language access planning","Working notes — proposed actions and review questions"];
 for(const field of CLAS_PLANNING_FIELDS) sections.push(field.label+"\n"+(values[field.id]?.trim()||"Not yet recorded"));
 sections.push("Reference\n"+CLAS_SOURCE.title+" — "+CLAS_SOURCE.href,"These notes do not establish compliance, completed review or authorization. Confirm requirements and decisions through the responsible offices.");
 return sections.join("\n\n")+"\n";
}
