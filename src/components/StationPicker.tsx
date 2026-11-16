import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, MapPin, Search, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppStore } from '../stores/appStore';
import {
  ENDPOINT_STATION_IDS,
  SECTION_LABEL_KEY,
  getStationSection,
  lines,
  representativeId,
  searchStations,
  stationById,
  stationGroup,
  stationLines,
} from '../data/network';
import type { Station } from '../types';

interface StationPickerProps {
  value: string | null;
  onChange: (stationId: string) => void;
  label?: string;
  placeholder: string;
  excludeId?: string;
  /** Shows a clear button while a station is picked. */
  onClear?: () => void;
}

interface StationGroup {
  key: string;
  label: string;
  stations: Station[];
  /** Set when the group is one line in order: rows are drawn as a strip map in this colour. */
  rail?: string;
}

const onLine = (stationId: string, lineId: string) =>
  stationGroup(stationId).some((id) => stationById.get(id)?.lineId === lineId);

export default function StationPicker({
  value,
  onChange,
  label,
  placeholder,
  excludeId,
  onClear,
}: StationPickerProps) {
  const { t } = useLanguage();
  const favorites = useAppStore((state) => state.favorites);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [lineFilter, setLineFilter] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const selected = value ? stationById.get(value) : null;

  const groups = useMemo<StationGroup[]>(() => {
    const excluded = excludeId ? representativeId(excludeId) : undefined;
    const matching = searchStations(query).filter(
      (station) => station.id !== excluded && (!lineFilter || onLine(station.id, lineFilter))
    );

    if (query.trim()) {
      const needle = query.trim().toLocaleLowerCase('tr-TR');
      const starts = (station: Station) => station.name.toLocaleLowerCase('tr-TR').startsWith(needle);
      return [
        {
          key: 'results',
          label: '',
          stations: [...matching.filter(starts), ...matching.filter((station) => !starts(station))],
        },
      ];
    }

    const line = lines.find((entry) => entry.id === lineFilter);
    if (line) {
      const ordered = [...new Set(line.stationIds.map(representativeId))]
        .filter((id) => id !== excluded)
        .map((id) => stationById.get(id))
        .filter((station): station is Station => Boolean(station));
      return [{ key: line.id, label: `${line.code} · ${line.name}`, stations: ordered, rail: line.color }];
    }

    const favoriteStations = favorites
      .map((id) => stationById.get(id))
      .filter((station): station is Station => Boolean(station))
      .filter((station) => station.id !== excluded);

    const sectionGroups = lines
      .map((line) => ({
        key: line.id,
        label: `${line.code} · ${line.name}`,
        stations: matching.filter((station) => station.lineId === line.id),
      }))
      .filter((group) => group.stations.length > 0);

    return [
      ...(favoriteStations.length
        ? [{ key: 'favorites', label: t('departures.favorites'), stations: favoriteStations }]
        : []),
      ...sectionGroups,
    ];
  }, [excludeId, favorites, lineFilter, query, t]);

  const flatStations = useMemo(
    () => groups.flatMap((group) => group.stations),
    [groups]
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, lineFilter]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(id);
    }
    setQuery('');
  }, [open]);

  const select = (stationId: string) => {
    onChange(stationId);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, flatStations.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      const station = flatStations[activeIndex];
      if (station) select(station.id);
    }
  };

  const activeStationId = flatStations[activeIndex]?.id;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
          open
            ? 'border-marmaray/60 bg-ink-800 shadow-[0_0_0_3px_rgba(76,141,255,0.1)]'
            : 'border-ink-700 bg-ink-850/80 hover:border-ink-500 hover:bg-ink-800'
        }`}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-800 text-mist-400 ring-1 ring-ink-700">
            <MapPin className="h-3.5 w-3.5" />
          </span>
          <span className="min-w-0">
            {label && (
              <span className="block text-[11px] font-semibold text-mist-500">
                {label}
              </span>
            )}
            <span
              className={`block truncate text-[13.5px] font-medium ${
                selected ? 'text-mist-50' : 'text-mist-500'
              }`}
            >
              {selected?.name ?? placeholder}
            </span>
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-mist-500 transition-transform ${
            open ? 'rotate-180 text-mist-300' : ''
          } ${selected && onClear ? 'invisible' : ''}`}
        />
      </button>

      {selected && onClear && (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onClear();
          }}
          aria-label={`${t('common.clear')}: ${selected.name}`}
          title={t('common.clear')}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-mist-500 transition-colors hover:bg-ink-700 hover:text-mist-100"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-600 bg-ink-850 shadow-panel animate-fade-up">
          <div className="border-b border-ink-700/80 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mist-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('departures.search')}
                className="w-full rounded-lg border border-transparent bg-ink-800 py-2 pl-8 pr-3 text-[13px] text-mist-100 placeholder:text-mist-500 focus:border-ink-500 focus:outline-none"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label={t('map.filter')}>
              {[null, ...lines.map((line) => line.id)].map((lineId) => {
                const line = lineId ? lines.find((entry) => entry.id === lineId) : null;
                const active = lineFilter === lineId;
                return (
                  <button
                    key={lineId ?? 'all'}
                    type="button"
                    aria-pressed={active}
                    title={line?.name}
                    onClick={() => setLineFilter(lineId)}
                    className={`flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium transition-colors ${
                      active ? 'bg-ink-600 text-mist-50' : 'text-mist-400 hover:bg-ink-800 hover:text-mist-100'
                    }`}
                  >
                    {line && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: line.color }} />}
                    {line ? line.code : t('map.all')}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id={listboxId}
            role="listbox"
            className="max-h-[min(52vh,340px)] overflow-y-auto p-1.5 scrollbar-thin"
          >
            {flatStations.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-mist-500">
                {t('departures.noResults')}
              </div>
            )}

            {groups.map((group) => (
              <div key={group.key} className="mb-1 last:mb-0">
                {group.label && (
                  <div className="flex items-center justify-between px-2 pb-1 pt-2">
                    <span className="text-[11px] font-semibold text-mist-500">
                      {group.label}
                    </span>
                    <span className="font-mono text-[11px] text-mist-600">
                      {group.stations.length}
                    </span>
                  </div>
                )}
                {group.stations.map((station, index) => {
                  const isActive = station.id === activeStationId;
                  const isSelected = station.id === value;
                  const isFavorite = favorites.includes(station.id);
                  const isEndpoint = ENDPOINT_STATION_IDS.has(station.id);

                  return (
                    <button
                      key={station.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(flatStations.indexOf(station))}
                      onClick={() => select(station.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 text-left transition ${
                        group.rail ? 'py-1.5' : 'py-2'
                      } ${isActive ? 'bg-marmaray/12' : 'hover:bg-ink-800'}`}
                    >
                      {group.rail ? (
                        <span className="relative flex w-5 shrink-0 self-stretch items-center justify-center">
                          <span
                            className="absolute left-1/2 w-1 -translate-x-1/2"
                            style={{
                              backgroundColor: group.rail,
                              top: index === 0 ? '50%' : '-6px',
                              bottom: index === group.stations.length - 1 ? '50%' : '-6px',
                            }}
                          />
                          <span
                            className={`relative rounded-full border-2 bg-ink-850 ${
                              stationLines(station.id).length > 1 || isEndpoint ? 'h-3.5 w-3.5' : 'h-2.5 w-2.5'
                            }`}
                            style={{ borderColor: stationLines(station.id).length > 1 ? '#F5F6F8' : group.rail }}
                          />
                        </span>
                      ) : (
                      <span
                        className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                          isEndpoint
                            ? 'border-marmaray/50 bg-marmaray/15'
                            : 'border-ink-600 bg-ink-900'
                        }`}
                      >
                        <span
                          className={`rounded-full ${
                            isEndpoint
                              ? 'h-1.5 w-1.5 bg-marmaray'
                              : 'h-1 w-1 bg-mist-500'
                          }`}
                        />
                      </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-mist-100">
                          {station.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-mist-500">
                          {stationLines(station.id).map((line) => (
                            <span key={line.id} className="font-mono font-semibold" style={{ color: line.color }}>
                              {line.code}
                            </span>
                          ))}
                          <span>· {t(SECTION_LABEL_KEY[getStationSection(station.id)])}</span>
                        </span>
                      </span>
                      {isFavorite && <span className="text-[11px] text-amber">★</span>}
                      {isSelected && <Check className="h-3.5 w-3.5 text-marmaray" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
