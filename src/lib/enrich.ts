import type { EnrichedKontakte } from '@/types/enriched';
import type { Kategorien, Kontakte } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface KontakteMaps {
  kategorienMap: Map<string, Kategorien>;
}

export function enrichKontakte(
  kontakte: Kontakte[],
  maps: KontakteMaps
): EnrichedKontakte[] {
  return kontakte.map(r => ({
    ...r,
    kategorieName: resolveDisplay(r.fields.kategorie, maps.kategorienMap, 'name'),
  }));
}
