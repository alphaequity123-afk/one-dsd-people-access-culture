import { describe, expect, it } from "vitest";
import { Resolver } from "../links/links.ts";
import { loadTasks } from "./run.ts";

describe("A12 findability task file", () => {
  const tasks = loadTasks();

  it("has 30 representative tasks with unique ids, a query and expected items", () => {
    expect(tasks).toHaveLength(30);
    expect(new Set(tasks.map(t => t.id)).size).toBe(30);
    for (const task of tasks) {
      expect(task.task.length).toBeGreaterThan(5);
      expect(task.query.trim().length).toBeGreaterThan(1);
      expect(task.expected.length).toBeGreaterThan(0);
      for (const href of task.expected) expect(href).toMatch(/^\/[a-z]/);
    }
  });

  it("names expected items that exist in this repository", async () => {
    const resolver = await Resolver.create();
    const missing = tasks.flatMap(task => task.expected.filter(href => !resolver.resolve(href).ok).map(href => `${task.id} ${href}`));
    expect(missing).toEqual([]);
  });
});
