import { describe, expect, it } from "vitest";
import { waterCollectionDoc, waterCourseDocs } from "./brain-content";
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_SOURCES } from "@/lib/learning/water-resource-collection";
import { searchDocs, type Doc } from "./search";
import { indexedProgramResources } from "./program-resources";

const sources: Doc[] = WATER_RESOURCE_COLLECTION_SOURCES.map(source => ({
  kind: "content", id: `water-test-${source.family}`, title: source.title, href: source.resourcePath,
  authority: "learning", type: "learning_navigation", status: "approved", reviewDate: "", scope: "dsd",
  summary: source.title, text: source.title, tags: [], intents: [],
}));

describe("Water collection discovery", () => {
  it("finds the full collection with its four published readings alongside the original course", () => {
    const collection = waterCollectionDoc("dsd", sources);
    for (const source of sources) {
      expect(collection.text).toContain(source.title);
      expect(collection.graphRelated).toContain(source.href);
    }
    const hits = searchDocs("What is The Water We Swim In collection, and which readings belong to it?", [collection, ...waterCourseDocs("dsd"), ...sources], {limit: 8});
    expect(hits.slice(0, 3).map(hit => hit.href)).toContain(WATER_RESOURCE_COLLECTION_PATH);
  });

  it("leaves withdrawn readings out of the collection evidence and graph", () => {
    const collection = waterCollectionDoc("dsd", sources.filter(source => !source.id.endsWith("american")));
    expect(collection.text).not.toContain("American Culture Brief");
    expect(collection.graphRelated).not.toContain("/minnesota-communities/american/profile");
  });

  it("makes the published collection discoverable in the complete live-content index", async () => {
    const { destinations } = await indexedProgramResources("dsd");
    const hits = searchDocs("What is The Water We Swim In collection, and which readings belong to it?", destinations, {limit: 8});
    expect(hits.slice(0, 3).map(hit => hit.href)).toContain(WATER_RESOURCE_COLLECTION_PATH);
    const collection = destinations.find(item => item.href === WATER_RESOURCE_COLLECTION_PATH)!;
    for (const source of WATER_RESOURCE_COLLECTION_SOURCES) expect(collection.text).toContain(source.title);
  }, 60000);
});
