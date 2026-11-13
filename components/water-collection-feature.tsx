import Link from "@/components/app-link";
import Image from "next/image";
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";
import styles from "./water-collection-feature.module.css";

export function WaterCollectionFeature({ withPhoto = false }: { withPhoto?: boolean }) {
  return (
    <section className={withPhoto ? styles.photoFeature : styles.feature} aria-labelledby="water-collection-feature-title">
      {withPhoto && <Image src="/images/pilot-home/water-we-swim-in.jpg" alt="Two staff members meet with a family around a table in a bright room." width={1000} height={667} sizes="(min-width: 760px) 480px, 100vw" />}
      <div>
        <h2 id="water-collection-feature-title">{WATER_RESOURCE_COLLECTION_TITLE}</h2>
        <p>Explore culture at work through the American and Minnesota briefs and the Equity Analysis Toolkit.</p>
        {withPhoto && <Link className="pilot-primary" href={WATER_RESOURCE_COLLECTION_PATH}>Open the collection</Link>}
      </div>
      {!withPhoto && <Link className="btn btn--primary" href={WATER_RESOURCE_COLLECTION_PATH}>Open the collection</Link>}
    </section>
  );
}
