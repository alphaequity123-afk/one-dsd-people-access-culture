import Link from "next/link";
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";
import styles from "./water-collection-feature.module.css";

export function WaterCollectionFeature() {
  return (
    <section className={styles.feature} aria-labelledby="water-collection-feature-title">
      <div>
        <h2 id="water-collection-feature-title">{WATER_RESOURCE_COLLECTION_TITLE}</h2>
        <p>Explore culture at work through the American and Minnesota briefs and the Equity Analysis Toolkit.</p>
      </div>
      <Link className="btn btn--primary" href={WATER_RESOURCE_COLLECTION_PATH}>Open the collection</Link>
    </section>
  );
}
