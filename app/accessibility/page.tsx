import Link from "next/link";
import { currentUnit } from "@/lib/dsd-live/unit";

export function generateMetadata() { return { title: `Accessibility and help using ${currentUnit().short}` }; }

export default function AccessibilityPage() {
  const unit = currentUnit();
  return <div className="shell reading article-layout">
    <p className="crumbs"><Link href="/">{unit.short}</Link></p>
    <h1>Accessibility and help using {unit.short}</h1>
    <p>You should be able to take part in the learning and use the resources in {unit.name}. Here you will find the ways you can move around and learn, and how to tell us about a barrier if something stops you.</p>
    <h2>Choose how to navigate and learn</h2>
    <ul>
      <li>Use Tab and Shift+Tab to move between links and controls. A visible outline shows your position. The first link, Skip to main content, moves past the banner and navigation.</li>
      <li>Use headings and landmarks with your screen reader to move through a page. Links to your learning pathway help you return after a course or practice.</li>
      <li>Increase your browser zoom or use your device’s contrast settings. The home-page animation starts only when you choose to play it and respects reduced-motion preferences.</li>
      <li>Choose captions in the video player, pause whenever useful, or use the available transcript. Course players also offer a Listen option where an audio version is available.</li>
      <li>In Ask, press Enter to send a question or Shift+Enter for a new line. When your answer is ready, use Read latest answer to reach it and review its sources.</li>
    </ul>
    <h2>Report an access barrier or request another format</h2>
    <p>Open <a href="/support">Help and Support</a> to see the ways we can help. Describe the page or resource, what you were trying to do and what prevented you from continuing. If useful, include your browser and assistive technology. Leave out private staff information and confidential case details.</p>
    <p>If a download or video is difficult to use, check for its web-page version or transcript while you seek help. An alternative format should provide the information needed for the same task.</p>
    <h2>Our accessibility work</h2>
    <p>We are reviewing the application against the Minnesota Digital Accessibility Standard and the project’s accessible-document requirements. This includes navigation, Ask, learning pathways, practice, videos and downloadable materials.</p>
    <p>Automated checks can&apos;t confirm accessibility on their own. Screen-reader use, media descriptions and downloadable formats also need a person to review them, and we don&apos;t claim that every resource has had that review yet.</p>
    <p><a href="https://mn.gov/mnit/government/policies/accessibility/">Read Minnesota’s digital accessibility standard</a>, or visit the <Link href="/user-guide">{unit.short} User Guide</Link>.</p>
  </div>;
}
