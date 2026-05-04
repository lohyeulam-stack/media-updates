/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Share2, Printer, Bookmark } from 'lucide-react';
import { getMonthlyReport } from '../data';
import { motion } from 'motion/react';

export function MonthlyReport() {
  const { month } = useParams<{ month: string }>();
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!month) return;
    setLoading(true);
    getMonthlyReport(month).then((c) => {
      setContent(c);
      setLoading(false);
    });
  }, [month]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="text-center">
          <div className="text-6xl font-bold tracking-tighter text-brand-black/10 mb-4">Loading</div>
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-white">
        <div className="text-center">
          <p className="text-4xl font-bold text-brand-black/10">No report for {month}</p>
          <Link to="/" className="mt-4 text-brand-blue text-sm font-bold">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-brand-white min-h-screen text-brand-black"
    >
      <div className="max-w-[1400px] mx-auto border-x border-brand-black min-h-screen pb-32">
        {/* Header */}
        <header className="px-6 lg:px-12 py-8 border-b border-brand-black flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-black transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Origin
          </Link>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
            Intelligence / {month}
          </div>
        </header>

        {/* Title Section */}
        <section className="px-6 lg:px-12 py-16 lg:py-24 border-b border-brand-black">
          <h1 className="text-6xl lg:text-[120px] font-medium tracking-tighter leading-none mb-10">
            The{' '}
            <span className="italic-accent text-brand-blue">Monthly</span>{' '}
            Ledger.
          </h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-sm uppercase font-bold tracking-widest leading-loose">
            <div className="space-y-3">
              <p>Subject / Global Media Intelligence</p>
              <p>Period / {month}.2026</p>
            </div>
            <div className="space-y-3 opacity-40 lg:text-right">
              <p>By TopTou Strategy Team</p>
              <p>Confidential Publication</p>
            </div>
          </div>
        </section>

        {/* Article */}
        <article className="px-6 lg:px-12 py-16 lg:py-20 flex flex-col lg:flex-row gap-16">
          {/* Sidebar */}
          <aside className="lg:w-48 shrink-0 space-y-10">
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Reading Time</div>
              <div className="text-3xl font-serif italic">12 Min.</div>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand-blue">Focus Index</div>
              <div className="text-3xl font-serif italic">Critical</div>
            </div>
            <div className="pt-6 border-t border-brand-black/10 flex gap-4 text-brand-black/30">
              <button className="hover:text-brand-blue transition-colors" title="Bookmark">
                <Bookmark size={18} />
              </button>
              <button className="hover:text-brand-blue transition-colors" title="Share">
                <Share2 size={18} />
              </button>
              <button className="hover:text-brand-blue transition-colors" title="Print">
                <Printer size={18} />
              </button>
            </div>
          </aside>

          {/* Markdown content */}
          <div className="flex-1">
            <div className="markdown-body space-y-10">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        </article>

        {/* Footer */}
        <footer className="mt-20 px-6 lg:px-12 py-16 border-t border-brand-black text-center">
          <h2 className="text-[10vw] font-medium leading-none tracking-tighter uppercase mb-6 opacity-10 italic">
            Inevitable
          </h2>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-30">
            © 2026 / End of Broadcast
          </p>
        </footer>
      </div>
    </motion.div>
  );
}
