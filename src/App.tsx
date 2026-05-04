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

export default function App() {
  const [locale, setLocale] = useState<Locale>('cn');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <AppContext.Provider value={{ locale, setLocale, isDark, toggleTheme: () => setIsDark(!isDark) }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report/:month" element={<MonthlyReport />} />
            <Route path="/weekly/:week" element={<WeeklyReport />} />
          </Routes>
        </Layout>
      </Router>
    </AppContext.Provider>
  );
}
