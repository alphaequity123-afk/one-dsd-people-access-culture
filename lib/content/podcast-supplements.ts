import type { PodcastReadingSupport } from "@/components/podcast-transcript-data";

/** Recording-derived machine transcripts; chapter topics reviewed against the text. */
export const PODCAST_SUPPLEMENTS: Partial<Record<string, PodcastReadingSupport>> = {
  "equity-toolkit": {
    "transcriptUrl": "/audio/transcripts/dhs-equity-policy-and-toolkit.json?v=trim25-20260926",
    "chapters": [
      {
        "start": 0,
        "title": "Policy purpose and who it applies to"
      },
      {
        "start": 129.9,
        "title": "Roles, tools and administration goals"
      },
      {
        "start": 542.84,
        "title": "Applying the policy in decisions and daily work"
      },
      {
        "start": 919.64,
        "title": "Shared terms: access, equity and engagement"
      },
      {
        "start": 1586.44,
        "title": "The equity analysis quick guide"
      },
      {
        "start": 1748.36,
        "title": "Steps 1–3: outcomes, data and engagement"
      },
      {
        "start": 2000.16,
        "title": "Steps 4–8: impacts, accountability and sustainability"
      },
      {
        "start": 2284.4,
        "title": "The equity scan"
      },
      {
        "start": 2482.72,
        "title": "Using the tools, collaborating and checking progress"
      }
    ]
  },
  "anti-racism-public-service": {
    "transcriptUrl": "/audio/transcripts/anti-racism-public-service.json",
    "chapters": [
      {
        "start": 0.25,
        "title": "The rules we inherit"
      },
      {
        "start": 131.66,
        "title": "What a rule says and what it does"
      },
      {
        "start": 254.07,
        "title": "The duties already on the books"
      },
      {
        "start": 365.05,
        "title": "History that still shapes decisions"
      },
      {
        "start": 489.47,
        "title": "Being honest about training"
      },
      {
        "start": 615.99,
        "title": "Evidence and evaluation"
      },
      {
        "start": 745.11,
        "title": "Taking concerns seriously"
      },
      {
        "start": 835.85,
        "title": "What you can do this week"
      }
    ]
  }
};
