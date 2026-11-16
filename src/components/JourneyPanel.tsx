import { useMemo } from 'react';
import { ArrowRight, ArrowUpDown, Clock3, Footprints, Route as RouteIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransit } from '../contexts/TransitContext';
import { useAppStore } from '../stores/appStore';
import { getStationArrivals, planJourney } from '../utils/schedule';
import { lineById, stationById } from '../data/network';
import { formatDuration, formatMinutesAway } from '../utils/format';
import { formatTime } from '../utils/time';
import { routeShortName } from '../utils/labels';
import type { JourneyLeg } from '../types';
import StationPicker from './StationPicker';
import { JourneyIntro } from './Onboarding';

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-850 text-mist-500 ring-1 ring-ink-700">
        {icon}
      </span>
      <p className="mt-3 max-w-[230px] text-[13px] font-medium leading-snug text-mist-200">
        {title}
      </p>
      {detail && <p className="mt-1 text-[11px] leading-relaxed text-mist-500">{detail}</p>}
    </div>
  );
}

function LineChip({ lineId, color }: { lineId: string; color: string }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold ring-1"
      style={{ color, backgroundColor: `${color}14`, borderColor: `${color}33` }}
    >
      {lineById.get(lineId)?.code ?? lineId}
    </span>
  );
}

function LegRow({ leg }: { leg: JourneyLeg }) {
  const { t, language } = useLanguage();

  if (leg.kind === 'walk') {
    const line = lineById.get(stationById.get(leg.toStationId)?.lineId ?? '');
    return (
      <li className="flex items-center gap-2.5 py-2 pl-0.5 text-[11px] text-mist-500">
        <Footprints className="h-3.5 w-3.5 shrink-0" />
        <span>
          {t('journey.walk')} · {line?.code} {t('journey.platform')} · {formatDuration(leg.seconds, language)}
        </span>
      </li>
    );
  }

  const destination = stationById.get(leg.stationIds[leg.stationIds.length - 1]);
  return (
    <li className="flex gap-3 py-1.5">
      <div className="flex flex-col items-center pt-1.5">
        <span className="h-2.5 w-2.5 rounded-full border-2 bg-ink-900" style={{ borderColor: leg.routeColor }} />
        <span className="my-1 w-0.5 flex-1 rounded-full" style={{ backgroundColor: leg.routeColor }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: leg.routeColor }} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-mist-100">
            {stationById.get(leg.fromStationId)?.name}
          </span>
          <span className="font-mono text-[13px] font-semibold tabular text-mist-50">
            {formatTime(leg.departureTime)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-mist-500">
          <LineChip lineId={leg.lineId} color={leg.routeColor} />
          <span className="truncate">
            {routeShortName(leg.routeId, t)} ·{' '}
            {language === 'tr'
              ? `${destination?.name} ${t('map.towards')}`
              : `${t('map.towards')} ${destination?.name}`}{' '}
            · {leg.stationIds.length - 1}{' '}
            {t('journey.stops')}
          </span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <span className="truncate text-[13px] font-medium text-mist-100">
            {stationById.get(leg.toStationId)?.name}
          </span>
          <span className="font-mono text-[13px] font-semibold tabular text-mist-50">
            {formatTime(leg.arrivalTime)}
          </span>
        </div>
      </div>
    </li>
  );
}

export default function JourneyPanel({ compact = false }: { compact?: boolean }) {
  const { t, language } = useLanguage();
  const { now } = useTransit();
  const fromStationId = useAppStore((state) => state.fromStationId);
  const toStationId = useAppStore((state) => state.toStationId);
  const setFromStation = useAppStore((state) => state.setFromStation);
  const setToStation = useAppStore((state) => state.setToStation);
  const swapStations = useAppStore((state) => state.swapStations);
  const selectedOptionId = useAppStore((state) => state.journeyOptionId);
  const selectJourney = useAppStore((state) => state.selectJourney);


  const options = useMemo(
    () =>
      fromStationId && toStationId && fromStationId !== toStationId
        ? planJourney(fromStationId, toStationId, now, 6)
        : [],
    [fromStationId, toStationId, now]
  );

  const activeOption =
    options.find((option) => option.id === selectedOptionId) ?? options[0] ?? null;

  const nextArrival = useMemo(
    () => (fromStationId ? getStationArrivals(fromStationId, now, 1)[0] : null),
    [fromStationId, now]
  );

  const sameStation = Boolean(fromStationId && toStationId && fromStationId === toStationId);
  const hasBoth = Boolean(fromStationId && toStationId);


  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={`shrink-0 border-b border-ink-700/60 px-4 pb-3 ${
          compact ? 'pt-2' : 'pt-4'
        }`}
      >
        {!compact && (
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-mist-500">
                <RouteIcon className="h-3 w-3 text-mint" />
                {t('journey.subtitle')}
              </div>
              <h2 className="mt-1 text-[18px] font-semibold text-mist-50">
                {t('journey.title')}
              </h2>
            </div>
          </div>
        )}

        <div className={`flex items-stretch gap-2 ${compact ? '' : 'mt-3'}`}>
          <div className="min-w-0 flex-1 space-y-2">
            <StationPicker
              label={t('journey.from')}
              value={fromStationId || null}
              onChange={setFromStation}
              onClear={() => setFromStation('')}
              placeholder={t('journey.selectFrom')}
              excludeId={toStationId || undefined}
            />
            <StationPicker
              label={t('journey.to')}
              value={toStationId || null}
              onChange={setToStation}
              onClear={() => setToStation('')}
              placeholder={t('journey.selectTo')}
              excludeId={fromStationId || undefined}
            />
          </div>
          <button
            type="button"
            onClick={swapStations}
            title={t('journey.swap')}
            aria-label={t('journey.swap')}
            className="grid w-10 shrink-0 place-items-center rounded-xl border border-ink-700 bg-ink-850/80 text-mist-400 transition hover:border-ink-500 hover:bg-ink-800 hover:text-mist-100"
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {!hasBoth || sameStation ? (
          <JourneyIntro />
        ) : options.length === 0 ? (
          <EmptyState
            icon={<Clock3 className="h-5 w-5" />}
            title={t('journey.noService')}
            detail={
              nextArrival
                ? `${t('journey.nextService')} · ${formatTime(nextArrival.arrivalTime)}`
                : t('journey.nextService')
            }
          />
        ) : (
          <div className="space-y-4 px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-mist-500">
                {t('journey.results')}
              </h3>
              <span className="font-mono text-[11px] text-mist-500">{options.length}</span>
            </div>

            <div className="space-y-2">
              {options.slice(0, 4).map((option) => {
                const active = option.id === activeOption?.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectJourney(option.id)}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      active
                        ? 'border-marmaray/50 bg-marmaray/8 shadow-[0_0_0_1px_rgba(76,141,255,0.12)]'
                        : 'border-ink-700 bg-ink-850/50 hover:border-ink-500 hover:bg-ink-850'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-baseline gap-2">
                        <span className="font-mono text-[15px] font-semibold tabular text-mist-50">
                          {formatTime(option.departureTime)}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-mist-500" />
                        <span className="font-mono text-[15px] font-semibold tabular text-mist-200">
                          {formatTime(option.arrivalTime)}
                        </span>
                      </div>
                      <span className="shrink-0 text-[11px] font-medium text-mist-400">
                        {formatDuration(option.durationSeconds, language)}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {option.legs.map((leg, index) =>
                        leg.kind === 'ride' ? (
                          <LineChip key={index} lineId={leg.lineId} color={leg.routeColor} />
                        ) : null
                      )}
                      <span className="text-mist-500">
                        {option.transfers === 0
                          ? t('journey.direct')
                          : `${option.transfers} ${t('journey.transfer')}`}
                      </span>
                      <span className="text-mist-600">·</span>
                      <span className="text-mist-500">
                        {option.waitMinutes <= 0
                          ? t('common.now')
                          : `${t('journey.wait')} ${formatMinutesAway(option.waitMinutes, language)}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {activeOption && (
              <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-850/60">
                <div className="flex items-center justify-between border-b border-ink-700/70 px-3.5 py-2.5">
                  <span className="text-[11px] font-semibold text-mist-500">{t('journey.yourTrip')}</span>
                  <span className="font-mono text-[11px] font-medium tabular text-mist-300">
                    {formatDuration(activeOption.durationSeconds, language)}
                  </span>
                </div>
                <ol className="px-3.5 py-3">
                  {activeOption.legs.map((leg, index) => (
                    <LegRow key={index} leg={leg} />
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
