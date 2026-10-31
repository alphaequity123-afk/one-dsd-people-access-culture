import 'server-only';
import { notFound } from 'next/navigation';
import { prepareEditableSurface } from '@/lib/content/prepare-editable-surface';
import { requestedContentScope } from '@/lib/product/request-context';
import { getAvailableInterculturalCommunities } from '@/lib/content/intercultural-community-list';
import { getAvailableInterculturalResources } from '@/lib/content/intercultural-resource-resolver';
import connections from '@/lib/content/intercultural-community-connections.json';
import sources from '@/lib/content/intercultural-curriculum-sources.json';
import curriculum from '@/lib/content/intercultural-curriculum.json';
import mediaData from '@/lib/content/intercultural-verified-media.json';

type Connection = { lesson: number; prompt: string };
type Source = { title: string; href: string; note: string };

/** All source and community filtering stays on the server for each request. */
export async function interculturalRequestData(lessonId?: string) {
  const scope = await requestedContentScope();
  const parent = await prepareEditableSurface('learn.intercultural', { scope, includeOwner: false });
  if (!parent.available) notFound();
  const [available, resources] = await Promise.all([
    getAvailableInterculturalCommunities(scope),
    getAvailableInterculturalResources(scope, lessonId ? (sources as Record<string, Source[]>)[lessonId] ?? [] : []),
  ]);
  // A parent may have been withdrawn while the optional links were resolved.
  // Check it again before returning any lesson content or filtered link data.
  const currentParent = await prepareEditableSurface('learn.intercultural', { scope, includeOwner: false });
  if (!currentParent.available) notFound();
  const approvedConnections = connections as Record<string, Connection>;
  const communities = available.flatMap(item => {
    const connection = approvedConnections[item.id];
    return connection && (!lessonId || connection.lesson === Number(lessonId)) ? [{ ...item, ...connection }] : [];
  });
  return { communities, resources, curriculum, mediaData };
}
