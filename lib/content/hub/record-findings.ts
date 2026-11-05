// Findings from the November 5, 2026 research into published records of
// relationships with the Disability Services Division. Two lists that are not
// organization pages: grants whose records name the Department of Human Services
// but not the division, and relationships for which no published record was found.

export type DepartmentGrant = {
  organizations: string;
  communities: string[];
  focus: string;
  program: string;
  years: string;
  amounts?: string;
  record: { title: string; date: string; url: string };
};

export const DEPARTMENT_WIDE_GRANTS: DepartmentGrant[] = [
  {
    organizations: "Access North Center for Independent Living; Independent Lifestyles",
    communities: ["rural"],
    focus: "People with disabilities in northeast and central Minnesota.",
    program: "One-time technology grants",
    years: "2022",
    amounts: "$96,000 and $379,000",
    record: { title: "Technology grants to benefit older adults and people with disabilities in Minnesota", date: "December 20, 2022", url: "https://content.govdelivery.com/accounts/MNDHS/bulletins/33e78b9" },
  },
  {
    organizations: "Kang Le; Accord; and other organizations named in the same release",
    communities: [],
    focus: "Technology for older adults and people with disabilities.",
    program: "One-time technology grants",
    years: "2022",
    record: { title: "Technology grants to benefit older adults and people with disabilities in Minnesota", date: "December 20, 2022", url: "https://content.govdelivery.com/accounts/MNDHS/bulletins/33e78b9" },
  },
  {
    organizations: "Access North Center for Independent Living ($149,999); Hmong Home Health Care ($147,367, a provider); Korean Service Center ($98,618)",
    communities: ["hmong", "korean", "rural"],
    focus: "Home and community-based services provider capacity in rural and underserved communities.",
    program: "Home and Community-Based Services Provider Capacity Grants, Round 3, run by the aging and disability administration's grants unit",
    years: "December 2024 to June 2026",
    record: { title: "Provider Capacity Grants for Rural and Underserved Communities, Round 3 grantee summaries", date: "2024", url: "https://mn.gov/dhs/assets/gear-round-3-grantee-summaries_tcm1053-664033.pdf" },
  },
  {
    organizations: "PACER Center, with Family Voices of Minnesota",
    communities: ["latino", "somali"],
    focus: "Latino and Somali families of children with autism.",
    program: "A 16-month Department of Human Services grant; the record does not name a division",
    years: "2024",
    record: { title: "PACER Center press release", date: "July 17, 2024", url: "https://www.pacer.org/?p=8448" },
  },
];

export const NO_PUBLISHED_RECORD: Array<{ subject: string; finding: string }> = [
  { subject: "Self-Advocates Minnesota", finding: "Run by Advocating Change Together and funded mainly by the Governor's Council on Developmental Disabilities. No grant record from the division for 2022 to 2026 was found." },
  { subject: "MOHR (Minnesota Organization for Habilitation and Rehabilitation)", finding: "No published record of a relationship with the division was found." },
  { subject: "Proof Alliance", finding: "No published record of a relationship with the division was found." },
  { subject: "PACER Center", finding: "A Department of Human Services grant is on record, but no record names the division." },
  { subject: "Hmong disability organizations", finding: "No record from the division was found, for example for United Hmong With Disabilities." },
  { subject: "Karen, African American and American Indian disability-led organizations", finding: "No grant record from the division for 2022 to 2026 beyond the culturally focused grants listed in the directory." },
  { subject: "Deaf and DeafBlind organizations", finding: "Funded by the separate Deaf and Hard of Hearing Services Division, not the Disability Services Division." },
  { subject: "Connecting Families grants (2022)", finding: "Six family support organizations were funded, but no published record names them." },
  { subject: "Community engagement grants for home and community-based services (2022)", finding: "No list of awardees was published." },
  { subject: "Innovation Grants after 2024", finding: "The 2026 round opened January 5, 2026. No awardees had been posted when this was checked." },
  { subject: "Disability Hub MN contact center", finding: "A 2025 request for proposals sought one operator from December 1, 2025. No record of the award was found, so the current contractors may have changed." },
  { subject: "Reports", finding: "No 2025 biennial report on services for people with disabilities was found, and no Olmstead or Employment First report naming community organizations." },
];
