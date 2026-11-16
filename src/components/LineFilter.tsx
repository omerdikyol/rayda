import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { lines } from '../data/network';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppStore } from '../stores/appStore';
import type { Line } from '../types';

const MODES: Line['mode'][] = ['rail', 'metro', 'tram', 'funicular', 'cable'];

export default function LineFilter({ journeyLineIds }: { journeyLineIds: string[] }) {
  const { t } = useLanguage();
  const hiddenLines = useAppStore((state) => state.hiddenLines);
  const setHiddenLines = useAppStore((state) => state.setHiddenLines);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !rootRef.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const hidden = new Set(hiddenLines);
  const visibleCount = lines.length - lines.filter((line) => hidden.has(line.id)).length;
  const showOnly = (ids: string[]) =>
    setHiddenLines(lines.map((line) => line.id).filter((id) => !ids.includes(id)));
  const toggle = (ids: string[]) => {
    const allVisible = ids.every((id) => !hidden.has(id));
    setHiddenLines(
      allVisible
        ? [...new Set([...hiddenLines, ...ids])]
        : hiddenLines.filter((id) => !ids.includes(id))
    );
  };

  const quick =
    'rounded-md px-2 py-1 text-[11px] font-medium text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-50';

  return (
    <div ref={rootRef} className="absolute bottom-4 left-4 z-20">
      {open && (
        <div className="glass absolute bottom-full left-0 mb-2 max-h-[min(60vh,520px)] w-[300px] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl p-3 shadow-panel">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-mist-50">{t('map.filter')}</span>
            <span className="font-mono text-[11px] text-mist-500">
              {visibleCount}/{lines.length}
            </span>
          </div>

          <div className="-mx-2 mt-1.5 flex flex-wrap gap-0.5">
            <button type="button" className={quick} onClick={() => setHiddenLines([])}>
              {t('map.all')}
            </button>
            <button type="button" className={quick} onClick={() => showOnly([])}>
              {t('map.none')}
            </button>
            {journeyLineIds.length > 0 && (
              <button type="button" className={quick} onClick={() => showOnly(journeyLineIds)}>
                {t('map.journeyLines')}
              </button>
            )}
          </div>

          {MODES.map((mode) => {
            const group = lines.filter((line) => line.mode === mode);
            if (group.length === 0) return null;
            const ids = group.map((line) => line.id);
            const groupVisible = ids.every((id) => !hidden.has(id));

            return (
              <div key={mode} className="mt-3 border-t border-ink-700/60 pt-2.5">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(ids)}
                    aria-pressed={groupVisible}
                    className={`text-[11px] font-semibold transition-colors ${
                      groupVisible
                        ? 'text-mist-300 hover:text-mist-50'
                        : 'text-mist-600 hover:text-mist-300'
                    }`}
                  >
                    {t(`mode.${mode}`)}
                  </button>
                  <button
                    type="button"
                    onClick={() => showOnly(ids)}
                    className="text-[11px] text-mist-500 transition-colors hover:text-mist-100"
                  >
                    {t('map.only')}
                  </button>
                </div>

                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  {group.map((line) => {
                    const off = hidden.has(line.id);
                    return (
                      <button
                        key={line.id}
                        type="button"
                        aria-pressed={!off}
                        title={line.name}
                        onClick={() => toggle([line.id])}
                        onDoubleClick={() => showOnly([line.id])}
                        className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                          off
                            ? 'border-transparent text-mist-600 hover:text-mist-300'
                            : 'border-ink-700/80 bg-ink-850/70 text-mist-100 hover:border-ink-600'
                        } ${line.code.length > 4 ? 'col-span-2' : ''}`}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            backgroundColor: off ? 'transparent' : line.color,
                            boxShadow: `inset 0 0 0 1.5px ${line.color}`,
                          }}
                        />
                        {line.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={`glass flex h-9 items-center gap-2 rounded-xl px-3 text-[12px] font-medium transition-colors ${
          open ? 'text-mist-50' : 'text-mist-300 hover:text-mist-50'
        }`}
      >
        <SlidersHorizontal className="h-4 w-4" />
        {t('map.filter')}
        <span
          className={`font-mono text-[11px] ${visibleCount < lines.length ? 'text-marmaray' : 'text-mist-500'}`}
        >
          {visibleCount}/{lines.length}
        </span>
      </button>
    </div>
  );
}
