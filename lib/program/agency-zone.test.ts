import { expect, it } from "vitest";
import { isAgencyRoute } from "./agency-zone";
it("uses a full navigation for shared agency pages while keeping complete division tools in their zone", () => {
  for (const href of ['/', '/learn', '/library?q=equity', '/areas/dsd', '/r/training-cultural-humility-all-staff', '/trainings/cultural-humility?version=executive']) expect(isAgencyRoute(href)).toBe(true);
  for (const href of ['/learn/water-we-swim-in/module-1', '/library/equity-review-tools/tool.html', '/one-dsd', '/practice', '/my-work', '//outside.example/learn', 'https://outside.example/learn']) expect(isAgencyRoute(href)).toBe(false);
});
