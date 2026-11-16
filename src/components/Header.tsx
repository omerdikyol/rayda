import { useState } from 'react';
import { Github, Globe2, Moon, PanelBottom, PanelLeft, PanelRight, Sun } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTransit } from '../contexts/TransitContext';
import { useAppStore, type Panels } from '../stores/appStore';
import { formatTime } from '../utils/time';
import { Brand } from './Brand';

const PANEL_TOGGLES: { panel: keyof Panels; icon: typeof PanelLeft; label: string }[] = [
  { panel: 'departures', icon: PanelLeft, label: 'panels.departures' },
  { panel: 'summary', icon: PanelBottom, label: 'panels.summary' },
  { panel: 'journey', icon: PanelRight, label: 'panels.journey' },
];

function PanelToggles() {
  const { t } = useLanguage();
  const panels = useAppStore((state) => state.panels);
  const togglePanel = useAppStore((state) => state.togglePanel);

  return (
    <div className="mr-1 hidden items-center gap-0.5 rounded-lg border border-ink-700/80 p-0.5 lg:flex">
      {PANEL_TOGGLES.map(({ panel, icon: Icon, label }) => (
        <button
          key={panel}
          type="button"
          onClick={() => togglePanel(panel)}
          aria-pressed={panels[panel]}
          title={t(label)}
          aria-label={t(label)}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
            panels[panel] ? 'bg-ink-800 text-mist-100' : 'text-mist-600 hover:text-mist-300'
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { t } = useLanguage();
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? 'dark');
  const next = theme === 'light' ? 'dark' : 'light';
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', next === 'light' ? '#f4f5f7' : '#0b0c0e');
    try {
      localStorage.setItem('rayda.theme', next);
    } catch {
      // Theme still switches for this visit.
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      title={t(`common.theme.${next}`)}
      aria-label={t(`common.theme.${next}`)}
      className="grid h-9 w-9 place-items-center rounded-lg text-mist-400 transition hover:bg-ink-800 hover:text-mist-50"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

export default function Header() {
  const { language, toggleLanguage, t } = useLanguage();
  const { now } = useTransit();

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-ink-700/60 bg-ink-900/80 px-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <div className="flex items-center gap-5">
        <Brand />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <PanelToggles />
        <div className="mr-1 flex items-baseline gap-1.5 sm:mr-2">
          <span className="font-mono text-[13px] font-medium tabular text-mist-100 sm:text-[15px]">
            {formatTime(now, true)}
          </span>
          <span className="hidden text-[11px] font-semibold text-mist-500 sm:inline">
            IST
          </span>
        </div>

        <button
          type="button"
          onClick={toggleLanguage}
          title={t('common.language')}
          aria-label={`${t('common.language')}: ${language.toUpperCase()}`}
          className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-mist-300 transition hover:bg-ink-800 hover:text-mist-50"
        >
          <Globe2 className="h-4 w-4" />
          <span className="font-mono text-[11px] font-semibold">
            {language.toUpperCase()}
          </span>
        </button>

        <ThemeToggle />

        <a
          href="https://github.com/omerdikyol/rayda"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          className="grid h-9 w-9 place-items-center rounded-lg text-mist-400 transition hover:bg-ink-800 hover:text-mist-50"
        >
          <Github className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
