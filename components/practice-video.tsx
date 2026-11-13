const practiceVideos = {
  "north-crossing": {
    title: "Can I change my appointment?",
    description: "A person reads the North Crossing notice. “Your intake appointment is set for Tuesday at 10. Contact us if you need to change it.” She looks for a way to reschedule. The revised notice says, “Tuesday, May 18, at 10 a.m. Confirm, reschedule, or ask for language or access support. Call 651-555-0142.” She finds the number and picks up her phone.",
    prompt: "What would help you take the next step?",
  },
  "accessible-meeting": {
    title: "Make room for another way to participate",
    description: "A facilitator asks a question and gives everyone time to think. She invites people to speak or write their ideas on a card. A participant slides a card to her. She reads it and brings the written idea into the group discussion.",
    prompt: "How could someone contribute without speaking?",
  },
  "community-follow-up": {
    title: "Close the loop with participants",
    description: "A staff member returns to the people who gave input and shows them a written update. In this example, the team added a phone option after hearing from participants. The team is still deciding what hours to offer. The staff member points to the calendar and says when people will hear back: next Friday.",
    prompt: "What changed, what is still open, and when will people hear back?",
  },
} as const;

export function PracticeVideo({ clip }: { clip: keyof typeof practiceVideos }) {
  const { title, description, prompt } = practiceVideos[clip];
  const source = `/videos/practice/${clip}.mp4`;

  return (
    <details className="my-4 max-w-3xl rounded-lg border border-line px-4 print:hidden">
      <summary aria-label={`Watch: ${title}`} className="min-h-11 cursor-pointer py-2.5 font-semibold text-[#183247]">Watch</summary>
      <div className="space-y-3 pb-4">
        <video aria-label={title} className="aspect-video w-full rounded bg-[#102b40]" controls playsInline preload="none" poster={`/videos/practice/${clip}.jpg`}>
          <source src={source} type="video/mp4" />
          <a href={source}>Open the video</a>
        </video>
        <details>
          <summary className="min-h-11 cursor-pointer py-2.5">Read the video description</summary>
          <p>{description}</p>
          <p>{prompt}</p>
        </details>
      </div>
    </details>
  );
}
