import { useMemo } from 'react';
import { lines } from '../data/network';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransit } from '../contexts/TransitContext';
import { getLineSummary } from '../utils/schedule';
import { dayType, formatTime, istanbulMidnight } from '../utils/time';

export default function NetworkSummary() {
  const { t } = useLanguage();
  const { trains, now } = useTransit();
  const day = istanbulMidnight(now).getTime();
  const summaries = useMemo(
    () => lines.map((line) => getLineSummary(line.id, new Date(day))),
    [day]
  );

  return (
    <div className="shrink-0 border-t border-ink-700/60 bg-ink-900/45 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold text-mist-500">{t('network.title')}</span>
        <span className="hidden text-[11px] text-mist-600 sm:block">
          {t(`network.${dayType(new Date(day))}`)} · {t('network.subtitle')}
        </span>
      </div>

      <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
        {lines.map((line, index) => {
          const active = trains.filter((train) => train.lineId === line.id).length;
          const summary = summaries[index];
          const [low, high] = summary.headway ?? [0, 0];

          return (
            <div key={line.id} className="w-[216px] shrink-0 rounded-xl border border-ink-700/80 bg-ink-850/60 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-mist-100">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: line.color }} />
                  <span className="truncate">
                    {line.code} · {line.name}
                  </span>
                </span>
                <span
                  className={`shrink-0 font-mono text-[11px] font-semibold ${active > 0 ? 'text-mint' : 'text-mist-600'}`}
                >
                  {active}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-mist-500">
                <span className="truncate">
                  {summary.headway &&
                    `${t('network.every')} ${low === high ? low : `${low}–${high}`} ${t('network.minutes')}`}
                </span>
                {summary.firstDeparture && summary.lastDeparture && (
                  <span className="shrink-0 font-mono tabular text-mist-600">
                    {formatTime(summary.firstDeparture)}–{formatTime(summary.lastDeparture)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] text-mist-600">
        <span className="truncate">{t('footer.note')}</span>
        <span className="hidden shrink-0 sm:block">{t('footer.data')}</span>
      </div>
    </div>
  );
}
