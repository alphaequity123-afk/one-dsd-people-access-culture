import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { FocusedSections } from "./focused-sections";

afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });
const topicPage = () => <FocusedSections>
  <p>A short introduction</p>
  <section id="first"><h2>Understand the situation</h2><label>Working note<textarea defaultValue="" /></label></section>
  <section id="second"><h2>Explore choices</h2><p id="example">The complete example</p></section>
  <section id="third"><h2>Decide on a next step</h2><p>Keep every word of the guidance.</p></section>
</FocusedSections>;

describe("reading one topic at a time", () => {
  it("preserves entered notes while moving forward and back", () => {
    const view=render(topicPage());
    fireEvent.change(view.getByRole("textbox"), {target:{value:"Follow up with the team"}});
    fireEvent.click(view.getByRole("button",{name:"Next"}));
    expect(view.getByRole("heading",{name:"Explore choices"})).toBeTruthy();
    expect(view.queryByRole("textbox")).toBeNull();
    fireEvent.click(view.getByRole("button",{name:"Previous"}));
    expect((view.getByRole("textbox") as HTMLTextAreaElement).value).toBe("Follow up with the team");
    expect(view.container.textContent).toContain("Keep every word of the guidance.");
  });
  it("opens a linked subsection even after another topic was selected", () => {
    window.history.replaceState(null,"","/?section=first#example");
    const view=render(topicPage());
    expect(view.getByRole("heading",{name:"Explore choices"})).toBeTruthy();
    act(()=>{ window.history.replaceState(null,"","/?section=third");window.dispatchEvent(new PopStateEvent("popstate")); });
    expect(view.getByRole("heading",{name:"Decide on a next step"})).toBeTruthy();
    expect((view.getByRole("button",{name:"Next"}) as HTMLButtonElement).disabled).toBe(true);
  });
  it("keeps short pages simple and tolerates malformed fragments", () => {
    window.history.replaceState(null,"","/#%invalid");
    const view=render(<FocusedSections><section><h2>A single topic</h2><p>All the content.</p></section></FocusedSections>);
    expect(view.getByRole("heading",{name:"A single topic"})).toBeTruthy();
    expect(view.queryByRole("navigation",{name:"Page topics"})).toBeNull();
  });
});

it("keeps the page heading visible when a deep link opens a later topic", () => {
  window.history.replaceState(null, "", "/#third");
  const view = render(<FocusedSections>
    <section><h1>Implementation guidance</h1><p>How to use this page.</p></section>
    <section id="first"><h2>First topic</h2></section>
    <section id="second"><h2>Second topic</h2></section>
    <section id="third"><h2>Third topic</h2></section>
  </FocusedSections>);
  expect(view.getByRole("heading", { level: 1, name: "Implementation guidance" })).toBeTruthy();
  expect(view.getByRole("heading", { name: "Third topic" })).toBeTruthy();
  fireEvent.click(view.getByRole("button", { name: "Previous" }));
  expect(view.getByRole("heading", { level: 1 })).toBeTruthy();
  expect(view.getByRole("heading", { name: "Second topic" })).toBeTruthy();
});
