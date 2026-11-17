import { routes } from './routes';
import { stations } from './stations';
import { metroLines, metroSharedStops } from './metro';
import { metrobusLine } from './metrobus';
import { haversineKm } from '../utils/geo';
import type { Interchange, Line, Station } from '../types';

export const stationById = new Map(stations.map((station) => [station.id, station]));

function longestRoute(lineId: string): string[] {
  return routes
    .filter((route) => route.lineId === lineId)
    .reduce<string[]>((longest, route) => (route.stations.length > longest.length ? route.stations : longest), []);
}

export const lines: Line[] = [
  {
    id: 'marmaray',
    code: 'Marmaray',
    name: 'Halkalı – Gebze',
    mode: 'rail',
    color: '#4C8DFF',
    stationIds: longestRoute('marmaray'),
  },
  ...metroLines,
  metrobusLine,
];

export const lineById = new Map(lines.map((line) => [line.id, line]));

export const isEstimated = (lineId: string) => Boolean(lineById.get(lineId)?.estimated);

function mergeGroups(groups: string[][]): Interchange[] {
  const merged: Set<string>[] = [];
  for (const group of groups) {
    const overlapping = merged.filter((set) => group.some((id) => set.has(id)));
    const union = new Set([...group, ...overlapping.flatMap((set) => [...set])]);
    for (const set of overlapping) merged.splice(merged.indexOf(set), 1);
    merged.push(union);
  }
  const order = new Map(lines.flatMap((line) => line.stationIds).map((id, index) => [id, index]));
  return merged.map((set) => ({
    stationIds: [...set].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)),
  }));
}

/** Transfers between lines; platforms of one shared stop are added from the feed. */
export const interchanges: Interchange[] = mergeGroups([
  ['234', '18988-M1A', '18988-M1B', '19233'], // Yenikapı
  ['67', '94911'], // Ayrılık Çeşmesi
  ['68', '87256'], // Üsküdar
  ['65', '19077'], // Sirkeci
  ['292', '272186'], // Bostancı
  ['18959', '19080'], // Zeytinburnu M1A ↔ T1
  ['18957-M1A', '18957-M1B', '19058'], // Aksaray ↔ Yusufpaşa
  ['18971-M1A', '18971-M1B', '19063'], // Topkapı - Ulubatlı ↔ Vatan
  ['19000', '19054'], // Bağcılar Meydan ↔ Bağcılar
  ['19069', '18954'], // Kabataş
  ['18996', '18955'], // Taksim
  ['19005', '18953'], // Şişhane ↔ Beyoğlu (Tünel)
  ['19093', '18956'], // Karaköy
  ['18993', '40123'], // Levent
  ['94908', '272168'], // Mecidiyeköy
  ['18981', '272167'], // Mahmutbey
  ['19091', '19045'], // Topkapı T1 ↔ T4
  ['272178', '94895'], // Karadeniz Mah. ↔ KİPTAŞ Venezia
  ['18999-M3', '18999-M3A', '272184'], // İkitelli Sanayi
  ['94995', '272196'], // Dudullu
  ['18977', '272189'], // Kozyatağı
  ['19007', '19037'], // Kadıköy ↔ İskele Cami
  ['18992', '94833'], // Seyrantepe
  // Metrobüs: stops within a short walk of a rail platform
  ['mb810010', '273'], // Küçükçekmece
  ['mb810021', '18973'], // Yenibosna
  ['mb810020', '18974'], // Şirinevler ↔ Ataköy - Şirinevler
  ['mb810019', '18965'], // Bahçelievler
  ['mb810018', '18961'], // İncirli ↔ Bakırköy - İncirli
  ['mb810022', '18959'], // Zeytinburnu
  ['mb810005', '18960'], // Merter
  ['mb810024', '19065'], // Cevizlibağ
  ['mb810012', '19091'], // Topkapı
  ['mb292219', '19050'], // Edirnekapı ↔ Şehitlik
  ['mb810015', '272169'], // Çağlayan
  ['mb810014', '94908'], // Mecidiyeköy
  ['mb659267', '19018'], // Zincirlikuyu ↔ Gayrettepe
  ['mb806908', '87259'], // Altunizade
  ['mb806857', '18995'], // Uzunçayır ↔ Ünalan
  ['mb5249996', '297'], // Söğütlüçeşme
  ...metroSharedStops,
]);

const baseStopId = (id: string) => id.split('-')[0];

/** Estimated walk between two platforms: 30 s on a shared platform, else at least 2 min by distance. */
export function walkSeconds(a: string, b: string): number {
  if (baseStopId(a) === baseStopId(b)) return 30;
  const from = stationById.get(a);
  const to = stationById.get(b);
  if (!from || !to) return 180;
  return Math.max(120, Math.round(60 + haversineKm(from.coordinates, to.coordinates) * 1000));
}

const groupByStation = new Map<string, string[]>();
for (const interchange of interchanges) {
  for (const id of interchange.stationIds) groupByStation.set(id, interchange.stationIds);
}

/** Every platform that belongs to the same named stop, the station itself first. */
export function stationGroup(stationId: string): string[] {
  const group = groupByStation.get(stationId);
  return group ? [stationId, ...group.filter((id) => id !== stationId)] : [stationId];
}

/** The id a picker shows for a stop: the first platform of its interchange. */
export function representativeId(stationId: string): string {
  return groupByStation.get(stationId)?.[0] ?? stationId;
}

export function stationLines(stationId: string): Line[] {
  return stationGroup(stationId)
    .map((id) => lineById.get(stationById.get(id)?.lineId ?? ''))
    .filter((line): line is Line => Boolean(line));
}

export function sameStop(a: string, b: string): boolean {
  return representativeId(a) === representativeId(b);
}

const marmaray = lineById.get('marmaray')!;

export const orderedStations: Station[] = lines.flatMap((line) =>
  line.stationIds
    .map((id) => stationById.get(id))
    .filter((station): station is Station => Boolean(station))
);

/** Stops as a picker lists them: one entry per interchange, in line order. */
export const pickerStations: Station[] = orderedStations.filter(
  (station) => representativeId(station.id) === station.id
);

export const MAJOR_STATION_IDS = new Set([
  '275', // Halkalı
  '273', // Küçükçekmece
  '268', // Ataköy
  '267', // Bakırköy
  '265', // Zeytinburnu
  '234', // Yenikapı
  '65', // Sirkeci
  '68', // Üsküdar
  '67', // Ayrılıkçeşme
  '297', // Söğütlüçeşme
  '292', // Bostancı
  '288', // Maltepe
  '284', // Kartal
  '282', // Pendik
  '276', // Tuzla
  '302', // Gebze
  '18996', // Taksim
  '94908', // Şişli - Mecidiyeköy
  '18993', // Levent
  '19025', // Hacıosman
  '19007', // Kadıköy
  '18977', // Kozyatağı
  '53122', // Tavşantepe
]);

export const ENDPOINT_STATION_IDS = new Set(
  lines.flatMap((line) => [line.stationIds[0], line.stationIds[line.stationIds.length - 1]])
);

export type StationSection = 'europe' | 'tunnel' | 'asia';

const tunnelIds = new Set(['65', '68', '67']);

export function getStationSection(stationId: string): StationSection {
  if (tunnelIds.has(stationId)) return 'tunnel';
  const station = stationById.get(stationId);
  const side = station ? lineById.get(station.lineId)?.side : undefined;
  if (side) return side;
  const index = marmaray.stationIds.indexOf(stationId);
  return index <= marmaray.stationIds.indexOf('234') ? 'europe' : 'asia';
}

export const SECTION_LABEL_KEY: Record<StationSection, string> = {
  europe: 'section.europe',
  tunnel: 'section.tunnel',
  asia: 'section.asia',
};

function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

export function searchStations(query: string): Station[] {
  const normalized = normalizeSearch(query);
  if (!normalized) return pickerStations;
  return pickerStations.filter((station) =>
    stationGroup(station.id).some((id) =>
      normalizeSearch(stationById.get(id)?.name ?? '').includes(normalized)
    )
  );
}

/** Position of a station along its own line; comparable only within one line. */
export function getStationIndex(stationId: string): number {
  const station = stationById.get(stationId);
  return station ? (lineById.get(station.lineId)?.stationIds.indexOf(stationId) ?? -1) : -1;
}
