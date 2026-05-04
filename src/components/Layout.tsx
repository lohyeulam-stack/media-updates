/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, Sun, Moon, Globe, X, Rss, FileText } from 'lucide-react';
import { useApp } from '../App';
import { motion, AnimatePresence } from 'motion/react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, isDark, toggleTheme } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-white flex flex-col selection:bg-brand-blue selection:text-white">
      {/* Header */}
      <header className="h-20 sticky top-0 z-50 bg-brand-white border-b border-brand-black flex items-center justify-between px-6 lg:px-12">
        <Link to="/" className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-2 group">
          <span className="bg-brand-black text-white px-2 py-0.5 group-hover:bg-brand-blue transition-colors">Media</span>
          <span className="group-hover:text-brand-blue transition-colors">Studio</span>
        </Link>

        <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
          <button
            onClick={() => setLocale(locale === 'en' ? 'cn' : 'en')}
            className="hover:text-brand-blue transition-colors hidden sm:flex items-center gap-1"
          >
            <Globe size={12} />
            {locale === 'en' ? '中文' : 'EN'}
          </button>

          <Link to="/feed.xml" className="hover:text-brand-blue transition-colors hidden sm:flex items-center gap-1">
            <Rss size={12} />
          </Link>

          <Link to="/log" className="hover:text-brand-blue transition-colors hidden sm:flex items-center gap-1">
            <FileText size={12} />
          </Link>

          <button
            onClick={toggleTheme}
            className="hover:text-brand-blue transition-colors hidden sm:flex items-center gap-1"
          >
            {isDark ? <Sun size={12} /> : <Moon size={12} />}
            {isDark ? 'Light' : 'Dark'}
          </button>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 bg-brand-black text-white px-5 py-2 rounded-full hover:bg-brand-blue transition-all text-[10px]"
          >
            <Menu size={12} /> Menu
          </button>
        </div>
      </header>

      {/* Mobile Header Bar */}
      <div className="lg:hidden border-b border-brand-black px-4 py-3 flex items-center justify-between gap-3 sticky top-20 z-40 bg-brand-white">
        <Link to="/" className="text-lg font-bold tracking-tighter uppercase">
          <span className="bg-brand-black text-white px-1.5 py-0.5">Media</span>
          <span className="ml-1">Studio</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === 'en' ? 'cn' : 'en')}
            className="text-[10px] font-bold uppercase tracking-wider hover:text-brand-blue"
          >
            {locale === 'en' ? '中文' : 'EN'}
          </button>
          <Link to={`/report/2026-04`}>
            <span className="text-[10px] font-bold bg-brand-blue text-white px-2 py-1 rounded-full">
              月报
            </span>
          </Link>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full border border-brand-black/10 hover:border-brand-blue transition-colors"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </div>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-brand-black/20 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full lg:w-[420px] bg-brand-white z-[70] border-l border-brand-black"
            >
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-6 right-6 text-brand-black hover:text-brand-blue transition-colors"
              >
                <X size={28} />
              </button>
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
