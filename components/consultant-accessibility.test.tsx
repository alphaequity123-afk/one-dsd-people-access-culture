import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { ResourceInlineEditor } from "./resource-inline-editor";
import { QueueItemClient } from "./queue-item-client";
import type { EditableResourceState } from "@/lib/content/resource-editor-contract";
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/app-link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/lib/intelligence/consult/schema", () => ({ STATUS_LABEL: { received: "Received", declined: "Declined" }, TRANSITIONS: { received: ["declined"], declined: [] } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const initial: EditableResourceState = { contentItemId: "example", expectedRevisionId: "draft", publishedRevisionId: "published", hasUnpublishedChanges: false,
 fields: { title: "Example resource", owner: "Learning team", type: "job_aid", authority: "guidance", layer: "L1", scope: "dsd", summary: "An example for testing.", body: ["A paragraph."], tags: [], intents: ["next_actions"], pathIds: [], nextActions: [{ label: "Learn", href: "/learn" }], reviewDate: "2026-11-16", whyItMatters: null, href: null, sourceName: null } };
describe("consultant accessibility without production writes", () => {
 it("moves focus into editing and returns it after closing", async () => {
  const v=render(<ResourceInlineEditor initial={initial} pathOptions={[]} />);
  fireEvent.click(v.getByRole("button", {name:"Open editing fields"}));
  await waitFor(()=>expect(document.activeElement).toBe(v.getByRole("textbox",{name:"Title"})));
  expect(v.getByRole("button",{name:"Remove this step: Learn"})).toBeTruthy();
  fireEvent.click(v.getByRole("button",{name:"Close editing fields"}));
  await waitFor(()=>expect(document.activeElement).toBe(v.getByRole("button",{name:"Open editing fields"})));
 });
 it("returns focus from the unsaved-change confirmation and discard", async () => {
  const v=render(<ResourceInlineEditor initial={initial} pathOptions={[]} />);
  fireEvent.click(v.getByRole("button",{name:"Open editing fields"}));
  fireEvent.change(v.getByRole("textbox",{name:"Title"}),{target:{value:"Revised title"}});
  fireEvent.click(v.getByRole("button",{name:"Close editing fields"}));
  await waitFor(()=>expect(document.activeElement).toBe(v.getByRole("button",{name:"Keep editing"})));
  fireEvent.click(v.getByRole("button",{name:"Keep editing"}));
  expect(document.activeElement).toBe(v.getByRole("button",{name:"Close editing fields"}));
  fireEvent.click(v.getByRole("button",{name:"Close editing fields"}));
  fireEvent.click(v.getByRole("button",{name:"Discard changes and close"}));
  await waitFor(()=>expect(document.activeElement).toBe(v.getByRole("button",{name:"Open editing fields"})));
 });
 it("exposes the decline requirement and announces save failures in an existing region", async () => {
  vi.stubGlobal("fetch",vi.fn().mockRejectedValue(new Error("offline")));
  const v=render(<QueueItemClient requestId="test" status="received" eligibilityStatus="confirmed_dsd" statusReason="" scheduledFor="" ownerNotes="" pinnedOrder={null} history={[]} />);
  const status=v.getByRole("status");
  fireEvent.change(v.getByRole("combobox",{name:"Status"}),{target:{value:"declined"}});
  const reason=v.getByRole("combobox",{name:"Reason and redirect (required when declining)"}) as HTMLSelectElement;
  expect(reason.required).toBe(true); expect(reason.checkValidity()).toBe(false);
  fireEvent.submit(v.container.querySelector("form")!);
  await waitFor(()=>expect(status.textContent).toBe("Could not save. Try again."));
  expect(v.getByRole("status")).toBe(status);
 });
});
