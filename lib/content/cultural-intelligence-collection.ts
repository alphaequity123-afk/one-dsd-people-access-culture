import "server-only";
import { notFound } from "next/navigation";
import { publishedCourses, courseHref } from "@/lib/content/courses/published";
import {
  CAPABILITY_COURSE_IDS,
  COMMUNITY_GUIDE_COURSE_PATTERN,
  CULTURAL_FRAMEWORKS,
  FACILITATION_ROUTES,
  LEADER_AREA_GROUPS,
  LEADER_COURSE_IDS,
  OWN_CULTURE_COMMUNITY_IDS,
  TEAM_FACILITATION_ROUTE,
} from "@/lib/content/cultural-intelligence-hub";
import { culturalIntelligenceHubAvailable } from "@/lib/content/cultural-intelligence-publication";
import { getAvailableInterculturalCommunities } from "@/lib/content/intercultural-community-list";
import { getAvailableInterculturalResources } from "@/lib/content/intercultural-resource-resolver";
import { prepareEditableSurface } from "@/lib/content/prepare-editable-surface";
import { requestedContentScope } from "@/lib/product/request-context";

const request = (href: string) => ({ title: "", href, note: "" });
const courseRequest = (id: string) => request(courseHref(id));

const journeyWorkplaceCourses = [
  "dc-i30-culturally-intelligent-leadership",
  "dc-l53-reducing-bias-in-hiring-and-selection",
  "dc-l57-equitable-access-to-stretch-assignments-and-prom",
  "dc-l58-fair-and-bias-aware-performance-reviews",
  "dc-l59-mentoring-and-sponsorship-across-difference",
  "dc-l62-reasonable-accommodation-the-supervisor-s-role",
  "dc-l14-disability-justice-and-intersectionality",
];

/** Resolve current published titles and availability for every request. */
export async function culturalIntelligenceCollection() {
  const scope = await requestedContentScope();
  // The linked equity curriculum explicitly accepts only these scopes.
  if (scope !== "dsd" && scope !== "one-dhs") notFound();
  if (!await culturalIntelligenceHubAvailable(scope)) notFound();

  const [communities, catalog] = await Promise.all([
    getAvailableInterculturalCommunities(scope),
    publishedCourses(scope),
  ]);
  // The catalog is an initial index only. The resolver checks each actual
  // course surface in the requested scope and returns its current published title.
  const requestedGuides = catalog
    .filter(({ pack }) => COMMUNITY_GUIDE_COURSE_PATTERN.test(pack.course.id))
    .map(({ pack }) => courseRequest(pack.course.id));
  const facilitationRoutes = [...FACILITATION_ROUTES, ...(scope === "dsd" ? [TEAM_FACILITATION_ROUTE] : [])];
  const requestedFrameworks = CULTURAL_FRAMEWORKS.flatMap(framework => framework.hrefs.filter(href => !href.startsWith("/learn/clas") && !href.startsWith("/practice/clas")).map(request));
  const requestedResources = [
    request("/learn/equity-toolkit"),
    request("/learn/community-connections"),
    request("/library/ja-access-checks"),
  ];
  const requestedJourneyResources = [
    request("/courses/ipe-04-person-centered-systems"),
    request("/library/tool-lifecourse"),
    request("/library/tool-idi"),
    request("/library/ja-access-checks"),
    request("/learn/community-connections"),
    request("/learn/equity-toolkit"),
    request("/learn/equity-toolkit/practice"),
    request("/practice/gp-4"),
    request("/practice/gp-6"),
    request("/areas/workforce"),
    request("/areas/culture-trust"),
    ...journeyWorkplaceCourses.map(courseRequest),
  ];
  const [guides, capabilities, frameworkLinks, resolvedResources, resolvedJourney, leaderCourses, leaderAreas, facilitation] = await Promise.all([
    getAvailableInterculturalResources(scope, requestedGuides),
    getAvailableInterculturalResources(scope, CAPABILITY_COURSE_IDS.map(courseRequest)),
    getAvailableInterculturalResources(scope, requestedFrameworks),
    getAvailableInterculturalResources(scope, requestedResources),
    getAvailableInterculturalResources(scope, requestedJourneyResources),
    getAvailableInterculturalResources(scope, LEADER_COURSE_IDS.map(courseRequest)),
    getAvailableInterculturalResources(scope, LEADER_AREA_GROUPS.flatMap(group => group.areaIds.map(id => request(`/areas/${id}`)))),
    getAvailableInterculturalResources(scope, facilitationRoutes.map(route => request(route.href))),
  ]);
  // This child route checks equity-toolkit.home directly, not its own registry route.
  // Recheck here after all lookups; a failed or withdrawn surface hides both links.
  let toolkitAvailable = false;
  try {
    toolkitAvailable = (await prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false })).available === true;
  } catch { /* Do not expose either toolkit route when the scoped check fails. */ }
  // The decision workspace is nested inside both the Toolkit parent and its
  // decision surface. A late withdrawal or lookup failure must hide the link.
  let decisionAvailable = false;
  if (toolkitAvailable) {
    const [currentToolkit, currentDecision] = await Promise.allSettled([
      prepareEditableSurface("equity-toolkit.home", { scope, includeOwner: false }),
      prepareEditableSurface("equity-toolkit.decision", { scope, includeOwner: false }),
    ]);
    toolkitAvailable = currentToolkit.status === "fulfilled" && currentToolkit.value.available === true;
    decisionAvailable = currentDecision.status === "fulfilled" && currentDecision.value.available === true;
  }
  // The intercultural topic can now be withdrawn while the hub stays. Its learning
  // path follows that topic's own publication, and a failed check hides the links.
  let interculturalAvailable = false;
  try {
    interculturalAvailable = (await prepareEditableSurface("learn.intercultural", { scope, includeOwner: false })).available === true;
  } catch { /* Keep the hub usable without the topic's links. */ }
  const hideWithdrawnToolkit = <T extends { href: string }>(item: T) =>
    (toolkitAvailable || item.href !== "/learn/equity-toolkit") &&
    (item.href !== "/learn/equity-toolkit/practice" || (toolkitAvailable && decisionAvailable));
  const resources = resolvedResources.filter(hideWithdrawnToolkit);
  const journeyResources = resolvedJourney.filter(hideWithdrawnToolkit);
  if (toolkitAvailable && journeyResources.some(item => item.href === "/learn/equity-toolkit")) {
    journeyResources.push({ title: "Equity in everyday decisions", href: "/learn/equity-toolkit/curriculum", note: "" });
  }
  // These CLAS page implementations have no editable-surface withdrawal gate
  // for the base routes. The collection page dynamically resolves scoped courses
  // and resources. Keep the base routes explicit, not in the registry resolver.
  const clasLinks = [
    { title: "National CLAS Standards", href: "/learn/clas", note: "" },
    { title: "Cultural and language access planning", href: "/practice/clas", note: "" },
  ];
  resources.push(clasLinks[0]);
  journeyResources.push(
    clasLinks[0],
    { title: "Put the CLAS Standards into practice", href: "/learn/clas/curriculum", note: "" },
    clasLinks[1],
  );
  // Do not return data if the hub was withdrawn while child lookups ran.
  if (!await culturalIntelligenceHubAvailable(scope)) notFound();
  const currentDirectory = await prepareEditableSurface("communities.index", { scope, includeOwner: false });
  const availableCommunities = currentDirectory.available ? communities : [];
  if (currentDirectory.available) journeyResources.push({ title: "Minnesota Communities", href: "/minnesota-communities", note: "" });
  if (interculturalAvailable) journeyResources.push({ title: "Intercultural understanding in everyday work", href: "/learn/intercultural/curriculum", note: "" });
  const ownCulture = OWN_CULTURE_COMMUNITY_IDS.flatMap(id => availableCommunities.filter(community => community.id === id));
  journeyResources.push(...ownCulture.map(community => ({ title: community.title, href: community.href, note: "" })));

  const linkByHref = new Map([...frameworkLinks.filter(hideWithdrawnToolkit), ...clasLinks].map(link => [link.href, link]));
  // A framework whose links are all withdrawn in this scope is left out, not shown as a dead end.
  const frameworks = CULTURAL_FRAMEWORKS.flatMap(framework => {
    const links = framework.hrefs.flatMap(href => linkByHref.has(href) ? [linkByHref.get(href)!] : []);
    return links.length ? [{ ...framework, links }] : [];
  });
  const areaByHref = new Map(leaderAreas.map(area => [area.href, area]));
  const useByHref = new Map<string, string>(facilitationRoutes.map(route => [route.href, route.use]));
  const leaderLinks = LEADER_AREA_GROUPS.map(group => ({
    title: group.title,
    links: group.areaIds.flatMap(id => areaByHref.has(`/areas/${id}`) ? [areaByHref.get(`/areas/${id}`)!] : []),
  })).filter(group => group.links.length > 0);

  return {
    communities: availableCommunities,
    ownCulture,
    courseGroups: [
      { id: "community-guides", title: "Community guides", intro: "Background on a community, to help you ask better questions. A guide does not describe any individual.", courses: guides },
      { id: "capabilities", title: "Cultural understanding and practice", intro: "Explore cultural understanding, implicit bias and ways to use frameworks responsibly.", courses: capabilities },
    ].filter(group => group.courses.length > 0),
    frameworks,
    leader: { courses: leaderCourses, groups: leaderLinks, divisionRoute: scope === "dsd" },
    facilitation: facilitation.map(route => ({ ...route, use: useByHref.get(route.href) ?? "" })),
    resources,
    journeyResources,
    interculturalAvailable,
  };
}
