import { ArrowRight, MapPin, Route as RouteIcon, Star, TrainFront } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAppStore } from '../stores/appStore';
import { representativeId, stationById, stationLines } from '../data/network';

const HUBS = ['234', '68', '18996', '19007', '94908', '67', '19069', '292'];

const ROUTES: [string, string][] = [
  ['275', '302'], // Halkalı → Gebze
  ['18996', '19007'], // Taksim → Kadıköy
  ['18962', '19069'], // Atatürk Havalimanı → Kabataş
  ['19025', '68'], // Hacıosman → Üsküdar
];

function Intro({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="px-4 pt-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink-850 text-mist-300 ring-1 ring-ink-700">
        {icon}
      </span>
      <h3 className="mt-3 text-[15px] font-semibold text-mist-50">{title}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-mist-400">{body}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-4 pt-5">
      <h4 className="text-[11px] font-semibold text-mist-500">{title}</h4>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function StationButton({
  stationId,
  onPick,
  starred,
}: {
  stationId: string;
  onPick: (id: string) => void;
  starred?: boolean;
}) {
  const station = stationById.get(stationId);
  if (!station) return null;
  return (
    <button
      type="button"
      onClick={() => onPick(representativeId(stationId))}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-ink-850"
    >
      {starred ? (
        <Star className="h-3.5 w-3.5 shrink-0 fill-current text-amber" />
      ) : (
        <MapPin className="h-3.5 w-3.5 shrink-0 text-mist-500" />
      )}
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-mist-100">
        {station.name}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {stationLines(stationId).map((line) => (
          <span
            key={line.id}
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: line.color }}
            title={line.code}
          />
        ))}
      </span>
    </button>
  );
}

export function DeparturesIntro() {
  const { t } = useLanguage();
  const favorites = useAppStore((state) => state.favorites);
  const setSelectedStation = useAppStore((state) => state.setSelectedStation);

  return (
    <div className="pb-6">
      <Intro
        icon={<TrainFront className="h-5 w-5" />}
        title={t('intro.departuresTitle')}
        body={t('intro.departuresBody')}
      />
      {favorites.length > 0 && (
        <Section title={t('departures.favorites')}>
          <div className="-mx-2">
            {favorites.map((id) => (
              <StationButton key={id} stationId={id} onPick={setSelectedStation} starred />
            ))}
          </div>
        </Section>
      )}
      <Section title={t('intro.hubs')}>
        <div className="-mx-2">
          {HUBS.filter((id) => !favorites.includes(id)).map((id) => (
            <StationButton key={id} stationId={id} onPick={setSelectedStation} />
          ))}
        </div>
      </Section>
    </div>
  );
}

export function JourneyIntro() {
  const { t } = useLanguage();
  const setRoute = useAppStore((state) => state.setRoute);

  return (
    <div className="pb-6">
      <Intro
        icon={<RouteIcon className="h-5 w-5" />}
        title={t('intro.journeyTitle')}
        body={t('intro.journeyBody')}
      />
      <Section title={t('intro.examples')}>
        <div className="-mx-2">
          {ROUTES.map(([from, to]) => (
            <button
              key={`${from}-${to}`}
              type="button"
              onClick={() => setRoute(from, to)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[13px] font-medium text-mist-100 transition-colors hover:bg-ink-850"
            >
              <span className="truncate">{stationById.get(from)?.name}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-mist-500" />
              <span className="truncate">{stationById.get(to)?.name}</span>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
