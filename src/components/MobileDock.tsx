import { useState } from 'react';
import { Route as RouteIcon, TrainFront } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import DeparturesPanel from './DeparturesPanel';
import JourneyPanel from './JourneyPanel';

type Tab = 'departures' | 'journey';

export default function MobileDock() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('departures');
  const [open, setOpen] = useState(true);
  const choose = (next: Tab) => {
    setOpen(next !== tab || !open);
    setTab(next);
  };

  const tabClass = (active: boolean) =>
    `flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-semibold transition ${
      active
        ? 'bg-ink-700 text-mist-50 shadow-sm'
        : 'text-mist-500 hover:text-mist-200'
    }`;

  return (
    <section className={`relative z-20 flex shrink-0 ${open ? 'h-[54dvh] min-h-[380px]' : ''} flex-col rounded-t-[22px] border-t border-ink-600 bg-ink-900 shadow-[0_-24px_60px_-12px_rgba(0,0,0,0.75)] lg:hidden`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={t(open ? 'common.collapse' : 'common.expand')}
        className="flex justify-center pb-1 pt-2"
      >
        <span className="h-1 w-10 rounded-full bg-ink-600" />
      </button>

      <div className={`px-3 ${open ? 'pb-1' : 'pb-3'}`}>
        <div className="flex items-center gap-1 rounded-xl bg-ink-850 p-1 ring-1 ring-ink-700">
          <button type="button" onClick={() => choose('departures')} className={tabClass(open && tab === 'departures')}>
            <TrainFront className="h-3.5 w-3.5" />
            {t('nav.departures')}
          </button>
          <button type="button" onClick={() => choose('journey')} className={tabClass(open && tab === 'journey')}>
            <RouteIcon className="h-3.5 w-3.5" />
            {t('nav.journey')}
          </button>
        </div>
      </div>

      {open && (
        <div className="min-h-0 flex-1">
          {tab === 'departures' ? <DeparturesPanel compact /> : <JourneyPanel compact />}
        </div>
      )}
    </section>
  );
}
