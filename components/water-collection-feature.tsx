import Link from "next/link";
import { WATER_RESOURCE_COLLECTION_PATH, WATER_RESOURCE_COLLECTION_TITLE } from "@/lib/learning/water-resource-collection";
import styles from "./water-collection-feature.module.css";

export function WaterCollectionFeature() {
  return (
    <section className={styles.feature} aria-labelledby="water-collection-feature-title">
      <div>
        <h2 id="water-collection-feature-title">{WATER_RESOURCE_COLLECTION_TITLE}</h2>
        <p>Start here to explore how culture shapes everyday work. Read the American and Minnesota culture briefs, practice with the Equity Analysis Toolkit, and find the other published culture briefs.</p>
      </div>
      <Link className="btn btn--primary" href={WATER_RESOURCE_COLLECTION_PATH}>Open the curriculum collection</Link>
    </section>
  );
}
