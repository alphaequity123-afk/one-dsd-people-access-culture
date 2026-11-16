import json
from pathlib import Path

inventory=json.loads(Path('output/editorial-source-inventory.json').read_text(encoding='utf-8-sig'))
surfaces={r['surfaceId']:r for r in inventory['surfaces']}
changes={
 'somali': [
  (['nameNote'], "A name may include a given name, a father's name, and a grandfather's name rather than the family surname a database expects. Ask how the person's name appears on their documents and how it should be recorded; do not invent a surname to satisfy a form."),
 ],
 'hmong': [
  (['whoAndWhere'], "Hmong forces allied with the CIA during the United States' Secret War in Laos. After 1975, persecution, camps in Thailand, and refugee resettlement shaped the history of Hmong communities in Minnesota. St. Paul became a national hub, and most Hmong Minnesotans live in the Twin Cities. Many are now second- or third-generation Minnesotans."),
  (['withinGroupDiversity'], "Traditional healing and Christianity are both widespread, but neither describes every household. Language preferences and views about family authority may differ across generations and within a family. Ask what role, if any, clan relationships have in the support this person wants."),
  (['whatNotToAssume',3], "Do not dismiss concerns about deportation or profiling. Ask what, if anything, the person wants you to understand about how those concerns affect access to services."),
 ],
 'karen': [
  (['withinGroupDiversity'], "Karen Minnesotans include Baptist and Buddhist communities. Religious affiliation does not tell you how a person wants to receive information, and a translated form may not be readable for everyone who speaks that language. Ask which spoken and written formats would help."),
  (['whatToAsk',3], "Which parts of this plan work for you, and what would you like changed or explained?"),
  (['accessChecks',1], "Ask which information channels the person uses, including any church or community network they name. Check that notices reach them rather than relying on mail alone."),
 ],
 'oromo': [
  (['withinGroupDiversity'], "Oromo Minnesotans include people who practice Islam, Christianity, and Waaqeffanna. U.S.-born children may never have lived in Oromia. Learn about the person's own beliefs and experiences rather than assuming a religious pattern from another East African community."),
  (['nameNote'], "Confirm the person's preferred language and request Afaan Oromoo when that is the language they need. Ask how names appear on their documents so the record reflects the person accurately."),
  (['accessChecks',0], "Confirm the requested language. When the person needs Afaan Oromoo, do not substitute Amharic or Somali."),
 ],
 'african-american': [
  (['whyItMatters'], "An approach described as color-blind can overlook unequal results, including disproportionate out-of-home placement. Minnesota's African American Family Preservation and Child Welfare Disproportionality Act establishes active-efforts responsibilities and attention to family social and cultural values. Check the Act's implementation guidance and the requirements that apply to the case; completing a training does not replace the required practice."),
  (['whatToAsk',1], "What, if anything, would you like us to know about previous experiences with this agency or police-involved referrals?"),
 ],
 'latino': [
  (['whyItMatters'], "A Spanish-language option may not meet the needs of a household whose preferred language is an Indigenous language. Fear about immigration status can also affect help-seeking within mixed-status families, including for citizens. Ask about language, distance, and work schedules so the service can respond to the person's circumstances rather than a broad label."),
  (['nameUncertainty'], "People differ in the identity terms they use, including across generations. Ask which term the person prefers rather than choosing one from age or appearance."),
 ],
 'vietnamese': [
  (['whyItMatters'], "An older adult may want Vietnamese for a service conversation even when younger relatives use English. Ask the person directly and arrange interpretation rather than assigning that responsibility to a child. Check name order against the person's documents, because a form built around a different order can create record errors."),
  (['withinGroupDiversity'], "Vietnamese Minnesotans include Buddhist, Catholic, and secular households, people who arrived as refugees, and later arrivals. Language preferences and experiences may differ across generations. These histories help frame questions; they do not establish what a particular person believes or needs."),
 ],
 'khmer': [
  (['whyItMatters'], "Experiences of war and genocide, and concerns about mental-health stigma, may affect how someone approaches services. They do not establish this person's history or needs. Ask whether a Khmer interpreter would help with the conversation, and allow the person to decide what personal history to share."),
  (['withinGroupDiversity'], "Buddhist temples are important to some families and not to others. Language use may also differ across generations. Ask which relationships and ways of communicating matter to the person instead of inferring them from Cambodian or Khmer identity."),
  (['nameNote'], "Khmer names may be listed with the family name first. Ask how the person's documents list the name and how they want to be addressed."),
 ],
 'lao': [
  (['whyItMatters'], "A national label such as Laotian does not identify the language a person needs. It may refer to Lao, Hmong, or other communities with different languages. Confirm the person's language before arranging an interpreter so a broad category does not determine the service offered."),
  (['withinGroupDiversity'], "Lao Minnesotans include Buddhist and Christian households, and language use may differ across generations. Ask about the person's preferred language and chosen supports rather than assuming that a religious or national label answers those questions."),
 ],
 'russian-speaking': [
  (['withinGroupDiversity'], "Russian-speaking Minnesotans include Jewish, Orthodox Christian, evangelical, and secular households, with different national identities. Those identities may carry tensions that a shared language does not reveal. Let people describe their own affiliations without expecting agreement about politics or history."),
  (['whatToAsk',0], "Which language would you like us to arrange for this conversation: Russian, Ukrainian, or another language?"),
 ],
 'arabic-speaking': [
  (['whyItMatters'], "An interpreter who uses one regional variety of Arabic may not communicate effectively with every Arabic-speaking person. Confirm the variety needed for the conversation. Arabic also has religious uses among many non-Arab Muslims, so religious affiliation alone does not identify a household's preferred language."),
  (['withinGroupDiversity'], "Arabic-speaking Minnesotans include Muslim, Christian, and secular households, with different national identities and dialects. Treat Arabic-speaking as a language description, not a complete account of a person's culture, beliefs, or service needs."),
 ],
 'deaf-deafblind-hard-of-hearing': [
  (['whyItMatters'], "Effective communication is a legal obligation. Ask which communication aid or service the person needs and give primary consideration to their request. Written notes may work for some exchanges but may not provide effective access to a complex service conversation. Do not make a family member the default interpreter. Telephone processes must also accept relay calls; work with the accessibility coordinator to arrange effective communication."),
  (['withinGroupDiversity'], "This community includes ASL users, people who communicate through speech, cochlear implant users, late-deafened older adults, DeafBlind people, and immigrants who use other sign languages. A device, diagnosis, or shared identity does not determine the communication support someone needs."),
 ],
 'rural': [
  (['withinGroupDiversity'], "The Iron Range, prairie, forest, and border communities have different local conditions. Name the town or area involved and examine its services, distances, and relationships rather than treating rural Minnesota as one uniform place."),
  (['accessChecks',2], "Use relevant community briefs alongside this place brief to prepare questions. Ask the people involved how local conditions and community connections affect their access."),
  (['whatNotToAssume',0], "Do not portray rural life as uniformly idyllic or as a collection of problems. Examine the specific place, its strengths, and the barriers people describe."),
 ],
}
records=[]
for key,fields in changes.items():
 s=surfaces['community-brief.'+key]
 pairs=[]
 for path,after in fields:
  before=s['values']
  for part in path: before=before[part]
  pairs.append({'path':path,'before':before,'after':after})
 records.append({'target':s['surfaceId'],'kind':'surface','route':s['route'],'changes':pairs,'status':'independent_review_pending','reviewNote':'Root read full original brief. Clarify compressed prose, individual choice, and staff action. Unchanged dates, statistics and source labels are not comprehensively reverified; protected fields and recordings remain unchanged.'})
out={'status':'independent_review_pending','revisions':records,'sourceEvidence':[
 {'url':'https://www.ada.gov/resources/effective-communication/','supports':'Effective communication depends on person and context; Title II primary consideration; note-taking may suffice for some communication; do not require a companion interpreter; accept relay calls.'},
 {'url':'https://www.revisor.mn.gov/statutes/cite/260.63','supports':'Active efforts include family participation and social and cultural values. Application and implementation guidance must be checked.'},
 {'url':'https://dcyf.mn.gov/partners-and-providers/child-safety-and-permanency/minnesota-african-american-family-preservation/implementing-minnesota-african-american-family-preservation-child-welfare-disproportionality-act','supports':'Statewide implementation January1,2027; current application must not be implied universal before that date.'}
], 'reviewedUnchanged':['communities.brief-shell','community-brief.tribal-nations'], 'pendingFactCheck':['African-American deeper0Body dated2023 statistics and2026 appropriation; reviewer checking original attribution.']}
Path('output/core-brief-manual-revisions.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'{len(records)} brief records; {sum(len(r["changes"]) for r in records)} proposed fields; two records retained editorially unchanged')
