import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useClock } from '../hooks/useClock';
import type { TrainPosition } from '../types';
import {
  getActiveTrains,
  getNetworkStatus,
  type NetworkStatus,
} from '../utils/schedule';

interface TransitContextValue {
  now: Date;
  trains: TrainPosition[];
  status: NetworkStatus;
}

const TransitContext = createContext<TransitContextValue | undefined>(undefined);

export function TransitProvider({ children }: { children: ReactNode }) {
  const now = useClock(1000);

  const trains = useMemo(() => getActiveTrains(now), [now]);
  const status = useMemo(() => getNetworkStatus(now, trains), [now, trains]);

  const value = useMemo(() => ({ now, trains, status }), [now, trains, status]);

  return <TransitContext.Provider value={value}>{children}</TransitContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTransit(): TransitContextValue {
  const context = useContext(TransitContext);
  if (!context) throw new Error('useTransit must be used inside TransitProvider');
  return context;
}
