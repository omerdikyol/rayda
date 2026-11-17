import type { Route } from '../types';
import { metroRoutes } from './metro';
import { metrobusRoutes } from './metrobus';

/**
 * Marmaray service patterns.
 *
 * Windows are the first and last departures from the origin terminus in
 * Istanbul local time, from the official timetable. Times past midnight are
 * written as 24:xx/25:xx so they stay on the service day that started them.
 * `lateNight` covers the nights from Friday into Saturday and Saturday into
 * Sunday. The simulator derives every run in between from the headway; the
 * last departure is always included even when it is off the headway grid.
 */
const marmarayRoutes: Route[] = [
  {
    id: 'marmaray-full',
    nameKey: 'route.full.name',
    shortNameKey: 'route.full.short',
    lineId: 'marmaray',
    termini: ['275', '302'],
    stations: [
      '275', '274', '273', '272', '271', '270', '269', '268', '267', '266',
      '265', '237', '234', '65', '68', '67', '297', '296', '295', '294',
      '293', '292', '291', '290', '289', '288', '287', '286', '285', '284',
      '283', '282', '281', '280', '279', '278', '277', '276', '298', '299',
      '300', '301', '302',
    ],
    color: '#4C8DFF',
    service: {
      forward: {
        kind: 'headway',
        frequency: 15,
        standard: { firstDeparture: '05:58', lastDeparture: '22:58' },
        lateNight: { firstDeparture: '05:58', lastDeparture: '25:28' },
      },
      backward: {
        kind: 'headway',
        frequency: 15,
        standard: { firstDeparture: '06:05', lastDeparture: '22:50' },
        lateNight: { firstDeparture: '06:05', lastDeparture: '25:20' },
      },
    },
  },
  {
    id: 'marmaray-short',
    nameKey: 'route.short.name',
    shortNameKey: 'route.short.short',
    lineId: 'marmaray',
    termini: ['268', '282'],
    stations: [
      '268', '267', '266', '265', '237', '234', '65', '68', '67', '297',
      '296', '295', '294', '293', '292', '291', '290', '289', '288', '287',
      '286', '285', '284', '283', '282',
    ],
    color: '#4C8DFF',
    service: {
      forward: {
        kind: 'headway',
        frequency: 8,
        standard: { firstDeparture: '06:09', lastDeparture: '21:54' },
        lateNight: { firstDeparture: '06:09', lastDeparture: '21:54' },
      },
      backward: {
        kind: 'headway',
        frequency: 8,
        standard: { firstDeparture: '06:09', lastDeparture: '20:39' },
        lateNight: { firstDeparture: '06:09', lastDeparture: '20:39' },
      },
    },
  },
  {
    id: 'marmaray-evening',
    nameKey: 'route.evening.name',
    shortNameKey: 'route.evening.short',
    lineId: 'marmaray',
    termini: ['282', '265'],
    stations: [
      '282', '283', '284', '285', '286', '287', '288', '289', '290', '291',
      '292', '293', '294', '295', '296', '297', '67', '68', '65', '234',
      '237', '265',
    ],
    color: '#4C8DFF',
    service: {
      forward: {
        kind: 'headway',
        frequency: 8,
        standard: { firstDeparture: '20:50', lastDeparture: '22:39' },
        lateNight: { firstDeparture: '20:50', lastDeparture: '22:39' },
      },
    },
  },
];

export const routes: Route[] = [...marmarayRoutes, ...metroRoutes, ...metrobusRoutes];

export const routeById = new Map(routes.map((route) => [route.id, route]));
