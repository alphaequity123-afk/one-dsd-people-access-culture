import { describe, expect, it } from "vitest";
import { COMMUNITY_PARTS, communityPartForAnchor, communityPartHref, isCommunityPartSlug } from "./cp-community-parts";

describe("community page parts", () => {
  it("builds the overview and part addresses", () => {
    expect(communityPartHref("oromo")).toBe("/minnesota-communities/oromo");
    expect(communityPartHref("oromo", "numbers")).toBe("/minnesota-communities/oromo/numbers");
    expect(COMMUNITY_PARTS.every(part => isCommunityPartSlug(part.slug))).toBe(true);
    expect(isCommunityPartSlug("calendar")).toBe(false);
  });
  it("sends anchors from the former single page to the part that holds them", () => {
    expect(communityPartForAnchor("community-history")).toBe("history");
    expect(communityPartForAnchor("community-observances")).toBe("history");
    expect(communityPartForAnchor("community-practice")).toBe("working-with");
    expect(communityPartForAnchor("community-before-outreach")).toBe("working-with");
    expect(communityPartForAnchor("community-connections")).toBe("working-with");
    expect(communityPartForAnchor("community-numbers-title")).toBe("numbers");
    expect(communityPartForAnchor("community-organizations")).toBe("organizations");
    expect(communityPartForAnchor("profile-limits")).toBe("profile");
    expect(communityPartForAnchor("research-institution-penumbra-theatre")).toBe("people");
    expect(communityPartForAnchor("community-sources")).toBe("sources");
    expect(communityPartForAnchor("community-collection-addition-title")).toBe("sources");
    expect(communityPartForAnchor("community-overview")).toBeNull();
  });
});
