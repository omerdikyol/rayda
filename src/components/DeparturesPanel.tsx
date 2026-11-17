import { useMemo, useState } from 'react';
import { Moon, Star, TrainFront } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransit } from '../contexts/TransitContext';
import { useAppStore } from '../stores/appStore';
import { getStationArrivals } from '../utils/schedule';
import { isEstimated, lineById, stationLines } from '../data/network';
import type { Arrival } from '../types';
import { formatTime } from '../utils/time';
import { routeShortName } from '../utils/labels';
import StationPicker from './StationPicker';
import { DeparturesIntro } from './Onboarding';

interface Board {
  key: string;
  arrivals: Arrival[];
}

function LineBadge({ lineId }: { lineId: string }) {
  const line = lineById.get(lineId);
  if (!line) return null;
  return (
    <span
      className="inline-flex h-5 shrink-0 items-center rounded-md border px-1.5 font-mono text-[11px] font-semibold"
      style={{
        color: line.color,
        borderColor: `${line.color}66`,
        backgroundColor: `${line.color}14`,
      }}
    >
      {line.code}
    </span>
  );
}

export default function DeparturesPanel({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  const { now } = useTransit();
  const selectedStationId = useAppStore((state) => state.selectedStationId);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);
  const favorites = useAppStore((state) => state.favorites);
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const [lineFilter, setLineFilter] = useState<string | null>(null);

  const isFavorite = favorites.includes(selectedStationId);
  const servedLines = stationLines(selectedStationId);
  const activeLine = servedLines.some((line) => line.id === lineFilter) ? lineFilter : null;

  const arrivals = useMemo(
    () => (selectedStationId ? getStationArrivals(selectedStationId, now, 48) : []),
    [selectedStationId, now]
  );

  /** One board per line and destination, soonest first, like a platform display. */
  const boards = useMemo<Board[]>(() => {
    const byKey = new Map<string, Arrival[]>();
    for (const arrival of arrivals) {
      if (activeLine && arrival.lineId !== activeLine) continue;
      const key = `${arrival.lineId}:${arrival.destinationStationId}`;
      byKey.set(key, [...(byKey.get(key) ?? []), arrival]);
    }
    return [...byKey].map(([key, list]) => ({ key, arrivals: list }));
  }, [activeLine, arrivals]);

  const first = arrivals[0];
  const serviceEnded = Boolean(first && first.minutesAway > 180);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`shrink-0 border-b border-ink-700/60 px-4 pb-3 ${compact ? 'pt-2' : 'pt-4'}`}>
        {!compact && (
          <h2 className="text-[18px] font-semibold text-mist-50">{t('departures.title')}</h2>
        )}

        <div className={`flex items-stretch gap-2 ${compact ? '' : 'mt-3'}`}>
          <div className="min-w-0 flex-1">
            <StationPicker
              value={selectedStationId}
              onChange={(id) => {
                setSelectedStation(id);
                setLineFilter(null);
              }}
              placeholder={t('departures.selectStation')}
              onClear={() => setSelectedStation('')}
            />
          </div>
          {selectedStationId && (
            <button
              type="button"
              onClick={() => toggleFavorite(selectedStationId)}
              aria-pressed={isFavorite}
              aria-label={t('departures.star')}
              className={`grid w-11 shrink-0 place-items-center rounded-xl border transition ${
                isFavorite
                  ? 'border-amber/30 bg-amber/10 text-amber'
                  : 'border-ink-700 bg-ink-850/80 text-mist-500 hover:border-ink-500 hover:text-mist-200'
              }`}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>

        {servedLines.length > 1 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => setLineFilter(null)}
              aria-pressed={!activeLine}
              className={`h-6 shrink-0 rounded-md px-2 text-[11px] font-medium transition-colors ${
                !activeLine ? 'bg-ink-700 text-mist-50' : 'text-mist-500 hover:text-mist-200'
              }`}
            >
              {t('departures.all')}
            </button>
            {servedLines.map((line) => {
              const active = activeLine === line.id;
              return (
                <button
                  key={line.id}
                  type="button"
                  onClick={() => setLineFilter(active ? null : line.id)}
                  aria-pressed={active}
                  className={`flex h-6 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition-colors ${
                    active ? 'bg-ink-700 text-mist-50' : 'text-mist-300 hover:text-mist-50'
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: line.color }}
                  />
                  {line.code}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {serviceEnded && first && (
          <div className="mx-4 mt-3 flex items-center gap-2 text-[11px] text-amber/90">
            <Moon className="h-3.5 w-3.5 shrink-0" />
            <span>
              {t('departures.serviceEnded')} · {t('departures.nextServiceAt')}{' '}
              <span className="font-mono font-semibold">{formatTime(first.arrivalTime)}</span>
            </span>
          </div>
        )}

        {!selectedStationId ? (
          <DeparturesIntro />
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-850 text-mist-500 ring-1 ring-ink-700">
              <TrainFront className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-mist-200">
              {t('departures.noDepartures')}
            </p>
          </div>
        ) : (
          <ul className="space-y-2 px-3 py-3">
            {boards.map(({ key, arrivals: list }) => {
              const [next, ...rest] = list;
              const minutes = next.minutesAway;
              const soon = minutes < 60;
              const approx = isEstimated(next.lineId) ? '~' : '';

              return (
                <li
                  key={key}
                  className="rounded-xl border border-ink-700/70 bg-ink-850/50 px-3 py-2.5"
                  style={{ boxShadow: `inset 3px 0 0 ${next.routeColor}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <LineBadge lineId={next.lineId} />
                        <span className="truncate text-[14px] font-medium text-mist-50">
                          {next.destinationName}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-mist-500">
                        {routeShortName(next.routeId, t)}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div
                        className={`font-mono tabular leading-none ${minutes <= 1 ? 'text-mint' : 'text-mist-50'}`}
                      >
                        {minutes <= 0 ? (
                          <span className="text-[18px] font-semibold">{t('departures.now')}</span>
                        ) : soon ? (
                          <>
                            <span className="text-[22px] font-semibold">
                              {approx}
                              {minutes}
                            </span>
                            <span className="ml-0.5 text-[11px] font-medium text-mist-400">
                              {t('common.min')}
                            </span>
                          </>
                        ) : (
                          <span className="text-[18px] font-semibold">
                            {approx}
                            {formatTime(next.arrivalTime)}
                          </span>
                        )}
                      </div>
                      {soon && (
                        <div className="mt-1 font-mono text-[11px] tabular text-mist-500">
                          {approx}
                          {formatTime(next.arrivalTime)}
                        </div>
                      )}
                    </div>
                  </div>

                  {rest.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 border-t border-ink-700/50 pt-2 text-[11px]">
                      <span className="text-mist-500">{t('departures.then')}</span>
                      <span className="flex min-w-0 gap-2.5 overflow-hidden font-mono tabular text-mist-300">
                        {rest.slice(0, 4).map((arrival, index) => (
                          <span key={`${arrival.id}-${index}`}>
                            {approx}
                            {formatTime(arrival.arrivalTime)}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
