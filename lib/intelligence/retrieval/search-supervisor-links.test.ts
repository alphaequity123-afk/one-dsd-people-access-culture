import { describe, expect, it } from "vitest";
import { contentGraphForDocs } from "@/lib/content/knowledge-graph";
import { SUPERVISOR_JOB_AIDS } from "@/lib/content/supervisor-job-aids";
import { docsFromStaffContent, type Doc } from "./search";
import { expandThroughGraph } from "./brain";
import { additionalPublicRouteDocs } from "./public-learning-docs";

describe("public supervisor job-aid course connections", () => {
  const aid = SUPERVISOR_JOB_AIDS.find(item => item.id === "ja-sm-first-week")!;
  const doc = docsFromStaffContent({ source: "postgres", items: [aid] })[0];
  const course: Doc = { ...doc, id: "public-sm-first-week", href: "/courses/sm-first-week", title: "Your First Week as a Supervisor", type: "program_destination", graphRelated: undefined };
  const lead = { kind: "content" as const, id: course.id, title: course.title, href: course.href, authority: course.authority, authorityLabel: "", type: course.type, status: course.status, reviewDate: course.reviewDate, scope: course.scope, excerpt: course.summary, score: 1 };

  it("connects each explicitly linked published job aid to its own course", () => {
    const projected = docsFromStaffContent({ source: "postgres", items: SUPERVISOR_JOB_AIDS });
    expect(projected).toHaveLength(19);
    for (const item of projected) expect(item.graphRelated).toEqual([`/courses/${item.id.slice(3)}`]);
    const docs = [doc, course];
    const graph = contentGraphForDocs(docs);
    expect(graph.neighbors(graph.nodesForDocument(doc.id)[0], ["related"]).map(({node}) => node.id)).toContain(graph.nodesForDocument(course.id)[0]);
    expect(expandThroughGraph([lead], docs, "first week supervisor job aid").map(hit => hit.id)).toContain(doc.id);
  });

  it("does not expose a withdrawn course or a withdrawn aid through graph expansion", () => {
    const noCourse = contentGraphForDocs([doc]);
    expect(noCourse.neighbors(noCourse.nodesForDocument(doc.id)[0], ["related"])).toEqual([]);
    expect(expandThroughGraph([lead], [course], "first week supervisor job aid")).toEqual([]);
  });

  it("connects the public My View description through the user guide without user records", () => {
    const guide = additionalPublicRouteDocs("dsd", new Set()).find(item => item.href === "/user-guide")!;
    const view: Doc = { ...doc, id: "public-my-view", href: "/my-view", title: "My View", graphRelated: undefined };
    const graph = contentGraphForDocs([guide, view]);
    expect(graph.neighbors(graph.nodesForDocument(view.id)[0], ["related"]).map(({node}) => node.id)).toContain(graph.nodesForDocument(guide.id)[0]);
    expect(contentGraphForDocs([guide]).neighbors(contentGraphForDocs([guide]).nodesForDocument(guide.id)[0], ["related"]).some(({node}) => node.href === "/my-view")).toBe(false);
  });

  it("does not infer links from unknown ids, private links, or removed source links", () => {
    const unknown = { ...aid, id: "ja-sm-not-a-registered-course" };
    const missingLink = { ...aid, nextActions: [{ label: "private", href: "/consultant/private" }] };
    const projections = docsFromStaffContent({ source: "postgres", items: [unknown, missingLink] });
    expect(projections.every(item => item.graphRelated === undefined)).toBe(true);
  });
});
