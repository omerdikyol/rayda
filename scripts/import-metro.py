"""Generate src/data/metro.ts from the IMM public transport GTFS feed.

Download the feed's CSVs (data.ibb.gov.tr, dataset "public-transport-gtfs-data")
into one folder, then run:

    python3 scripts/import-metro.py <gtfs-folder>

The feed is ISO-8859-9 encoded. Run times are arrival-to-arrival medians, so
they include the dwell at the departing stop. Departures are stored as seconds
after the service-day midnight; trips before 03:00 belong to the previous day.
Trips with frequencies.txt rows are expanded into individual departures.
"""

import csv
import math
import statistics
import sys
from collections import defaultdict
from pathlib import Path

# Colours approximate the operator's line colours, adjusted for a dark map.
LINES = {
    'M1A': {'color': '#E2453F', 'mode': 'metro'},
    'M1B': {'color': '#B8322E', 'mode': 'metro'},
    'M2': {'color': '#3FAE6A', 'mode': 'metro'},
    'M2A': {'color': '#2E8A52', 'mode': 'metro'},
    'M3': {'color': '#2FA4D9', 'mode': 'metro'},
    'M3A': {'color': '#2380AD', 'mode': 'metro'},
    'M4': {'color': '#E0559A', 'mode': 'metro', 'side': 'asia'},
    'M5': {'color': '#8A5BB5', 'mode': 'metro', 'side': 'asia'},
    'M6': {'color': '#B8915F', 'mode': 'metro'},
    'M7': {'color': '#F08DB8', 'mode': 'metro', 'trim': ['Yıldız', 'Fulya']},
    'M8': {'color': '#3BA7A0', 'mode': 'metro', 'side': 'asia'},
    'M9': {'color': '#E6C33F', 'mode': 'metro'},
    'T1': {'color': '#3E6FC2', 'mode': 'tram'},
    'T3': {'color': '#A07250', 'mode': 'tram', 'side': 'asia'},
    'T4': {'color': '#EE8A3C', 'mode': 'tram'},
    'F1': {'color': '#9AA1AD', 'mode': 'funicular'},
    'F2': {'color': '#9AA1AD', 'mode': 'funicular'},
    'F3': {'color': '#9AA1AD', 'mode': 'funicular'},
    'TF1': {'color': '#5FB8B0', 'mode': 'cable'},
    'TF2': {'color': '#5FB8B0', 'mode': 'cable'},
}
DAYS = {'weekday': 'monday', 'saturday': 'saturday', 'sunday': 'sunday'}
NIGHT_CUTOFF = 3 * 3600
VALID_FROM = '20240101'


def read(folder: Path, name: str):
    with open(folder / name, encoding='iso-8859-9', newline='') as handle:
        return list(csv.DictReader(handle))


def seconds(value: str) -> int:
    h, m, s = (int(part) for part in value.split(':'))
    return h * 3600 + m * 60 + s


def clock(value: int) -> str:
    return f'{value // 3600 % 24:02d}:{value % 3600 // 60:02d}'


def haversine_km(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, (a[1], a[0], b[1], b[0]))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371 * math.asin(min(1, math.sqrt(h)))


def main(folder: Path):
    routes = {r['route_short_name']: r['route_id'] for r in read(folder, 'routes.csv') if r['agency_id'] == '11'}
    code_of = {routes[code]: code for code in LINES}
    stops = {s['stop_id']: s for s in read(folder, 'stops.csv')}
    active = {
        day: {c['service_id'] for c in read(folder, 'calendar.csv') if c[flag] == '1' and c['end_date'] >= VALID_FROM}
        for day, flag in DAYS.items()
    }
    services = set().union(*active.values())
    trips = {
        t['trip_id']: t
        for t in read(folder, 'trips.csv')
        if t['route_id'] in code_of and t['service_id'] in services
    }
    times = defaultdict(list)
    for row in read(folder, 'stop_times.csv'):
        if row['trip_id'] in trips:
            times[row['trip_id']].append(row)
    for rows in times.values():
        rows.sort(key=lambda r: int(r['stop_sequence']))
    frequencies = defaultdict(list)
    for row in read(folder, 'frequencies.csv'):
        if row['trip_id'] in trips:
            frequencies[row['trip_id']].append(row)

    notes = []
    patterns = {}
    for code, meta in LINES.items():
        line_trips = [t for t in trips.values() if code_of[t['route_id']] == code and len(times[t['trip_id']]) > 1]
        forward = [tuple(r['stop_id'] for r in times[t['trip_id']]) for t in line_trips if t['direction_id'] == '0']
        backward = [tuple(r['stop_id'] for r in times[t['trip_id']])[::-1] for t in line_trips if t['direction_id'] == '1']
        order = list(max(forward or backward, key=len))
        if 'trim' in meta:
            order = [s for s in order if stops[s]['stop_name'].strip() not in meta['trim']]
            notes.append(f'{code}: {", ".join(meta["trim"])} left out; the feed has placeholder 15 s run times for them')
        patterns[code] = (line_trips, order, bool(forward), bool(backward))

    owners = defaultdict(list)
    for code, (_, order, _, _) in patterns.items():
        for stop_id in order:
            owners[stop_id].append(code)

    def station_id(stop_id: str, code: str) -> str:
        return stop_id if len(owners[stop_id]) == 1 else f'{stop_id}-{code}'

    out_lines, out_stations, out_times, out_routes, shared = [], [], [], [], []
    for stop_id, codes in owners.items():
        if len(codes) > 1:
            shared.append([station_id(stop_id, code) for code in codes])

    for code, meta in LINES.items():
        line_trips, order, has_forward, has_backward = patterns[code]
        ids = [station_id(s, code) for s in order]
        position = {s: i for i, s in enumerate(order)}
        name = lambda s: stops[s]['stop_name'].strip()

        distance = 0.0
        for index, stop_id in enumerate(order):
            coords = (float(stops[stop_id]['stop_lon']), float(stops[stop_id]['stop_lat']))
            if index:
                prev = stops[order[index - 1]]
                distance += haversine_km((float(prev['stop_lon']), float(prev['stop_lat'])), coords)
            out_stations.append((ids[index], name(stop_id), coords, round(distance, 2), code))

        run_time = {}
        directions = [('0', order)] if has_forward else []
        if has_backward:
            directions.append(('1', order[::-1]))
        for direction, sequence in directions:
            measured = defaultdict(list)
            for trip in line_trips:
                if trip['direction_id'] != direction:
                    continue
                rows = [r for r in times[trip['trip_id']] if r['stop_id'] in position]
                for a, b in zip(rows, rows[1:]):
                    measured[(a['stop_id'], b['stop_id'])].append(seconds(b['arrival_time']) - seconds(a['arrival_time']))
            medians = {pair: statistics.median(values) for pair, values in measured.items()}

            index = 0
            while index < len(sequence) - 1:
                a, b = sequence[index], sequence[index + 1]
                if (a, b) in medians:
                    run_time[(a, b)] = round(medians[(a, b)])
                    index += 1
                    continue
                span = next((j for j in range(index + 2, len(sequence)) if (a, sequence[j]) in medians), None)
                if span is None:
                    run_time[(a, b)] = run_time.get((b, a), 120)
                    notes.append(f'{code} direction {direction}: no run time {name(a)} → {name(b)}; used the reverse')
                    index += 1
                    continue
                hints = [run_time.get((sequence[k + 1], sequence[k]), 1) for k in range(index, span)]
                skipped = [name(sequence[k]) for k in range(index + 1, span)]
                notes.append(f'{code} direction {direction}: {", ".join(skipped)} missing from feed; run time split from the opposite direction')
                for k, hint in zip(range(index, span), hints):
                    run_time[(sequence[k], sequence[k + 1])] = round(medians[(a, sequence[span])] * hint / sum(hints))
                index = span

        for (a, b), value in run_time.items():
            out_times.append((station_id(a, code), station_id(b, code), value))

        departures = {}
        for direction, sequence in directions:
            origin = sequence[0]
            departures[direction] = {}
            for day in DAYS:
                starts = []
                for trip in line_trips:
                    if trip['direction_id'] != direction or trip['service_id'] not in active[day]:
                        continue
                    rows = times[trip['trip_id']]
                    at_origin = next((r for r in rows if r['stop_id'] == origin), None)
                    if at_origin is None:
                        continue
                    shift = seconds(at_origin['departure_time']) - seconds(rows[0]['departure_time'])
                    if frequencies[trip['trip_id']]:
                        for block in frequencies[trip['trip_id']]:
                            start, end, step = seconds(block['start_time']), seconds(block['end_time']), int(block['headway_secs'])
                            starts.extend(t + shift for t in range(start, end, step))
                    else:
                        starts.append(seconds(at_origin['departure_time']))
                departures[direction][day] = sorted({s + 86400 if s < NIGHT_CUTOFF else s for s in starts})

            for day in DAYS:
                if not departures[direction][day] and departures[direction]['weekday']:
                    departures[direction][day] = departures[direction]['weekday']
                    notes.append(f'{code} direction {direction}: no {day} trips in feed; weekday timetable used')

        if len(directions) == 2:
            for day in DAYS:
                a, b = departures['0'][day], departures['1'][day]
                if a and b and b[-1] - a[-1] > 3600:
                    departures['0'][day] = a + [t for t in b if t > a[-1]]
                    notes.append(f'{code} direction 0 {day}: feed stops at {clock(a[-1])}; later departures mirrored from direction 1')

        out_lines.append((code, meta, ids, f'{name(order[0])} – {name(order[-1])}'))
        out_routes.append((code, meta, ids, departures))

    with open(Path(__file__).resolve().parent.parent / 'src/data/metro.ts', 'w', encoding='utf-8') as out:
        out.write('// Generated by scripts/import-metro.py from the IMM public transport GTFS feed. Do not edit.\n')
        for note in notes:
            out.write(f'// {note}\n')
        out.write("import type { InterStationTime, Line, Route, Station } from '../types';\n\n")

        out.write('export const metroLines: Line[] = [\n')
        for code, meta, ids, title in out_lines:
            side = f", side: '{meta['side'] if 'side' in meta else 'europe'}'"
            out.write(f"  {{ id: '{code}', code: '{code}', name: '{title}', mode: '{meta['mode']}', color: '{meta['color']}'{side}, stationIds: [{', '.join(repr(s) for s in ids)}] }},\n")
        out.write('];\n\n')

        out.write('/** One stop served by several lines: each line gets its own platform id. */\n')
        out.write('export const metroSharedStops: string[][] = [\n')
        for group in shared:
            out.write(f"  [{', '.join(repr(s) for s in group)}],\n")
        out.write('];\n\n')

        out.write('export const metroStations: Station[] = [\n')
        for sid, name, coords, km, code in out_stations:
            out.write(f"  {{ id: '{sid}', name: '{name}', coordinates: [{coords[0]:.6f}, {coords[1]:.6f}], distanceFromStart: {km}, lineId: '{code}' }},\n")
        out.write('];\n\n')

        out.write('export const metroInterStationTimes: InterStationTime[] = [\n')
        for a, b, t in out_times:
            out.write(f"  {{ fromStationId: '{a}', toStationId: '{b}', time: {t} }},\n")
        out.write('];\n\n')

        out.write('export const metroRoutes: Route[] = [\n')
        for code, meta, ids, departures in out_routes:
            out.write('  {\n')
            out.write(f"    id: '{code.lower()}',\n    lineId: '{code}',\n")
            out.write(f"    nameKey: '',\n    shortNameKey: 'mode.{meta['mode']}',\n")
            out.write(f"    termini: ['{ids[0]}', '{ids[-1]}'],\n")
            out.write(f"    stations: [{', '.join(repr(s) for s in ids)}],\n")
            out.write(f"    color: '{meta['color']}',\n    service: {{\n")
            for direction, key in (('forward', '0'), ('backward', '1')):
                if key not in departures:
                    continue
                out.write(f"      {direction}: {{\n        kind: 'timetable',\n        departures: {{\n")
                for day in DAYS:
                    out.write(f"          {day}: [{', '.join(str(v) for v in departures[key][day])}],\n")
                out.write('        },\n      },\n')
            out.write('    },\n  },\n')
        out.write('];\n')
    print('\n'.join(notes) or 'no gaps')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
