// Engine smoke checks: `npm test`. Bundled with esbuild and run in Node.
import assert from 'node:assert/strict';
import { lineById } from '../src/data/network';
import { getActiveTrains, getRoutePlan, getStationArrivals, planJourney } from '../src/utils/schedule';
import { atIstanbulTime, istanbulMidnight } from '../src/utils/time';

const wednesday = istanbulMidnight(new Date('2026-11-18T12:00:00+03:00'));
const at = (clock: string) => atIstanbulTime(wednesday, clock);
const rides = (from: string, to: string, clock: string) =>
  planJourney(from, to, at(clock), 3)[0]?.legs.flatMap((leg) => (leg.kind === 'ride' ? [leg.lineId] : []));

// Marmaray benchmark is untouched.
assert.equal(getRoutePlan('marmaray-full')!.forward.totalTime, 107 * 60);

// Metrobüs: one estimated line, 44 stops, 122 min end to end.
const metrobus = lineById.get('MB')!;
assert.equal(metrobus.estimated, true);
assert.equal(metrobus.stationIds.length, 44);
assert.equal(Math.round(getRoutePlan('mb')!.forward.totalTime / 60), 122);

// Never drawn as vehicles, but it departs and plans like any line.
assert.ok(getActiveTrains(at('08:00')).every((train) => train.lineId !== 'MB'));
const board = getStationArrivals('mb659267', at('08:00'), 10);
assert.ok(board.some((arrival) => arrival.lineId === 'MB' && arrival.minutesAway <= 10));

// Mecidiyeköy → Altunizade crosses the bridge on Metrobüs instead of going round by Marmaray.
assert.deepEqual(rides('94908', '87259', '08:00'), ['MB']);
// Beylikdüzü → Kadıköy: Metrobüs, then a rail transfer.
assert.equal(rides('mb290606', '19007', '08:00')?.[0], 'MB');
// Runs through the night when rail is closed.
assert.deepEqual(rides('mb659267', 'mb5249996', '03:30'), ['MB']);

console.log('check: ok');
