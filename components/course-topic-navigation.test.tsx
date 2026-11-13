import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { CourseLesson } from "./course-lesson";
import type { Lesson } from "@/lib/content/courses/source-types";

vi.mock("./geffen-course-read-aloud", () => ({ GeffenLessonReadAloud: () => null }));
vi.mock("./course-media-for-page", () => ({ CourseMediaSlot: () => null }));
vi.mock("./course-audio-discussion", () => ({ CourseAudioDiscussion: () => null, CourseAudioGuidance: () => null }));
afterEach(() => { cleanup(); localStorage.clear(); window.history.replaceState(null, "", "/"); });

describe("course topics", () => {
  it("keeps all reading and saved answers while a learner moves between topics", async () => {
    const lesson: Lesson = {id:"example",number:1,title:"A clear next step",summary:"Practice a useful handoff.",minutes:10,blocks:[
      {type:"text",heading:"Read the situation",body:"<p>The full opening example remains available.</p>"},
      {type:"image",src:"/example.jpg",alt:"Colleagues discussing a service notice"},
      {type:"knowledgeCheck",id:"handoff",question:"What helps the person move forward?",options:[{text:"Name the next contact",correct:true},{text:"Repeat the policy",correct:false}],feedbackCorrect:"A named contact helps.",feedbackIncorrect:"Consider what happens next."},
      {type:"text",heading:"Plan the handoff",body:"<p>The full closing discussion remains available.</p>"},
    ]};
    const view=render(<CourseLesson courseId="test" lesson={lesson} objectives={["Describe a helpful next step."]} />);
    await act(async()=>{});
    expect(view.getByRole("heading",{name:"Read the situation"})).toBeTruthy();
    expect(view.getByRole("img",{name:"Colleagues discussing a service notice"})).toBeTruthy();
    fireEvent.click(view.getByRole("button",{name:"Next"}));
    const answer=view.getByRole("radio",{name:"Name the next contact"});
    fireEvent.click(answer);
    fireEvent.click(view.getByRole("button",{name:"Check answer"}));
    expect(view.getByText("A named contact helps.")).toBeTruthy();
    fireEvent.click(view.getByRole("button",{name:"Next"}));
    expect(view.getByRole("heading",{name:"Plan the handoff"})).toBeTruthy();
    fireEvent.click(view.getByRole("button",{name:"Previous"}));
    expect((view.getByRole("radio",{name:"Name the next contact"}) as HTMLInputElement).checked).toBe(true);
    expect(view.getByText("A named contact helps.")).toBeTruthy();
    expect(view.container.textContent).toContain("The full opening example remains available.");
    expect(view.container.textContent).toContain("The full closing discussion remains available.");
    await waitFor(()=>expect(JSON.parse(localStorage.getItem("pac-course:test:example")!).fields["block-2"]).toBe("0"));
  });
});
