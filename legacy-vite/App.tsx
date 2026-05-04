/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { MonthlyReport } from './pages/MonthlyReport';
import { WeeklyReport } from './pages/WeeklyReport';
import { Log } from './pages/Log';
import { getUpdates, getAvailableWeeks, getAvailableMonths } from './data';
import type { MediaUpdate } from './types';

// Localization System
export type Locale = 'en' | 'cn';

interface AppContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// Data context
interface DataContextType {
  updates: MediaUpdate[];
  weeks: string[];
  months: string[];
  loading: boolean;
}

const DataContext = createContext<DataContextType>({
  updates: [],
  weeks: [],
  months: [],
  loading: true,
});

export const useData = () => useContext(DataContext);

export default function App() {
  const [locale, setLocale] = useState<Locale>('cn');
  const [isDark, setIsDark] = useState(false);
  const [updates, setUpdates] = useState<MediaUpdate[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    Promise.all([
      getUpdates(),
      getAvailableWeeks(),
      getAvailableMonths(),
    ]).then(([updatesData, weeksData, monthsData]) => {
      setUpdates(updatesData);
      setWeeks(weeksData);
      setMonths(monthsData);
      setLoading(false);
    });
  }, []);

  return (
    <AppContext.Provider value={{ locale, setLocale, isDark, toggleTheme: () => setIsDark(!isDark) }}>
      <DataContext.Provider value={{ updates, weeks, months, loading }}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report/:month" element={<MonthlyReport />} />
              <Route path="/weekly/:week" element={<WeeklyReport />} />
              <Route path="/log" element={<Log />} />
            </Routes>
          </Layout>
        </Router>
      </DataContext.Provider>
    </AppContext.Provider>
  );
}
