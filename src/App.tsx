import Header from './components/Header';
import LineMap from './components/LineMap';
import DeparturesPanel from './components/DeparturesPanel';
import JourneyPanel from './components/JourneyPanel';
import MobileDock from './components/MobileDock';
import NetworkSummary from './components/NetworkSummary';
import { LanguageProvider } from './contexts/LanguageContext';
import { TransitProvider } from './contexts/TransitContext';
import { useAppStore } from './stores/appStore';

function App() {
  const panels = useAppStore((state) => state.panels);

  return (
    <LanguageProvider>
      <TransitProvider>
        <div className="app-bg flex h-dvh flex-col overflow-hidden">
          <Header />

          <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {panels.departures && (
              <aside className="hidden w-[356px] shrink-0 border-r border-ink-700/60 bg-ink-900/55 lg:block xl:w-[380px]">
                <DeparturesPanel />
              </aside>
            )}

            <section className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="relative min-h-0 flex-1">
                <LineMap />
              </div>
              {panels.summary && (
                <div className="hidden lg:block">
                  <NetworkSummary />
                </div>
              )}
            </section>

            {panels.journey && (
              <aside className="hidden w-[356px] shrink-0 border-l border-ink-700/60 bg-ink-900/55 lg:block xl:w-[380px]">
                <JourneyPanel />
              </aside>
            )}

            <MobileDock />
          </main>
        </div>
      </TransitProvider>
    </LanguageProvider>
  );
}

export default App;
