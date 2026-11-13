import Image from "next/image";
import styles from "./resource-context-photo.module.css";
import learning from "@/public/images/pilot-home/learn.jpg";
import planning from "@/public/images/pilot-home/apply-a-tool.jpg";
import community from "@/public/images/pilot-home/communities.jpg";
import conversation from "@/public/images/program-workplace-conversation.webp";

/** Program imagery sits outside the original reading and does not depict its publisher. */
export function ResourceContextPhoto({ subject }: { subject: string }) {
  const text = subject.toLowerCase();
  const photo = /accessib|disabilit|accommodation|analysis|planning|decision|toolkit|policy/.test(text)
    ? { src: planning, alt: "Illustration of colleagues working through a plan together in an office." }
    : /community|communities|engagement|outreach|partnership|belonging/.test(text)
      ? { src: community, alt: "Illustration of people sharing a meal and conversation in a community space." }
      : /workplace|employment|supervis|leadership|management|civil rights/.test(text)
        ? { src: conversation, alt: "Illustration of three colleagues in a workplace conversation." }
        : { src: learning, alt: "Illustration of colleagues exchanging ideas around an office table." };
  return <div className={styles.photo} data-program-context-photo="true">
    <Image src={photo.src} alt={photo.alt} unoptimized sizes="(max-width: 760px) 100vw, 900px" className={styles.image} />
  </div>;
}
