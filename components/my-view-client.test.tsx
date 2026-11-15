import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MyViewClient } from "./my-view-client";
import { BROWSER_STORAGE_KEYS } from "@/lib/client/storage-keys";
vi.mock("@/components/app-link", () => ({default: ({children, href}: {children: React.ReactNode; href: string}) => <a href={href}>{children}</a>}));
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
const copy = {deleteItemLabel: "Remove item", clearAskLabel: "Clear conversation", askCountSingular: "saved turn", askEmpty: "No conversation", requestsTitle: "References"};
async function mount() { const host=document.createElement("div");document.body.append(host);root=createRoot(host);await act(async()=>{root.render(<MyViewClient intakeEnabled={false} copy={copy}/>);}); }
function button(text: string) {return [...document.querySelectorAll("button")].find(el=>el.textContent===text)!;}
beforeEach(()=>{localStorage.clear();sessionStorage.clear();});
afterEach(async()=>{vi.restoreAllMocks();if(root)await act(async()=>root.unmount());document.body.innerHTML="";});
describe("My work removal failures",()=>{
 it("keeps saved references visible after a failed list write and allows a successful retry",async()=>{
  const key=BROWSER_STORAGE_KEYS.savedConsultationReferences;
  localStorage.setItem(key,JSON.stringify([{id:"R-1",work_name:"First reference"},{id:"R-2",work_name:"Second reference"}]));
  await mount();
  const write=vi.spyOn(Storage.prototype,"setItem").mockImplementation(()=>{throw Error("Blocked");});
  await act(async()=>button("Remove item").click());
  expect(document.body.textContent).toContain("First reference");
  expect(document.body.textContent).toContain("could not be fully removed");
  expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(2);
  write.mockRestore();
  await act(async()=>button("Remove item").click());
  expect(document.body.textContent).not.toContain("First reference");
  expect(document.body.textContent).toContain("Second reference");
  expect(document.body.textContent).not.toContain("could not be fully removed");
 });
 it("keeps the visible path item available when its source metadata cannot be deleted",async()=>{
  const key=BROWSER_STORAGE_KEYS.pathArtifact("gp-1");
  const source=BROWSER_STORAGE_KEYS.pathArtifactSource("gp-1");
  localStorage.setItem(key,JSON.stringify({work_name:"Visible plan"}));
  localStorage.setItem(source,JSON.stringify({source:"Example"}));
  await mount();
  const original=Storage.prototype.removeItem;
  const remove=vi.spyOn(Storage.prototype,"removeItem").mockImplementation(function(this: Storage,k: string){if(k===source)throw Error("Blocked");original.call(this,k);});
  await act(async()=>button("Remove item").click());
  expect(document.body.textContent).toContain("Visible plan");
  expect(localStorage.getItem(key)).not.toBeNull();
  remove.mockRestore();
  await act(async()=>button("Remove item").click());
  expect(localStorage.getItem(key)).toBeNull();
  expect(localStorage.getItem(source)).toBeNull();
 });
 it("preserves the Ask conversation and controls when deletion fails",async()=>{
  sessionStorage.setItem(BROWSER_STORAGE_KEYS.askSession,JSON.stringify({turns:[{question:"Example"}]}));
  await mount();
  const remove=vi.spyOn(Storage.prototype,"removeItem").mockImplementation(()=>{throw Error("Blocked");});
  await act(async()=>button("Clear conversation").click());
  expect(document.body.textContent).toContain("1 saved turn");
  expect(document.body.textContent).toContain("could not be cleared");
  remove.mockRestore();
  await act(async()=>button("Clear conversation").click());
  expect(document.body.textContent).toContain("No conversation");
  expect(document.body.textContent).not.toContain("could not be cleared");
  expect(sessionStorage.getItem(BROWSER_STORAGE_KEYS.askSession)).toBeNull();
 });
});
