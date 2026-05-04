/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export function Log() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-brand-white min-h-screen"
    >
      <div className="max-w-[1400px] mx-auto border-x border-brand-black min-h-screen">
        <header className="px-6 lg:px-12 py-8 border-b border-brand-black flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-blue hover:text-brand-black transition-colors"
          >
            <ArrowLeft size={14} />
            Return to Origin
          </Link>
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-30">
            Intelligence / Log
          </div>
        </header>

        <section className="px-6 lg:px-12 py-16 lg:py-24">
          <h1 className="text-6xl lg:text-[80px] font-bold tracking-tighter leading-none mb-8">
            Update <span className="italic-accent text-brand-blue">Log</span>
          </h1>
          <p className="text-xl text-brand-black/50 max-w-2xl">
            System update history and采集日志记录。
          </p>
        </section>

        <section className="px-6 lg:px-12 pb-24">
          <div className="border-t border-brand-black">
            <div className="py-6 border-b border-brand-black/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Weekly Collection — 2026-W17</div>
                <div className="text-xs text-brand-black/40 mt-1">采集完成 · 2026-04-27 06:00 CST</div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded">SUCCESS</span>
            </div>
            <div className="py-6 border-b border-brand-black/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Monthly Report — 2026-04</div>
                <div className="text-xs text-brand-black/40 mt-1">月报生成完成 · 2026-04-30 23:00 CST</div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded">SUCCESS</span>
            </div>
            <div className="py-6 border-b border-brand-black/10 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Weekly Collection — 2026-W16</div>
                <div className="text-xs text-brand-black/40 mt-1">采集完成 · 2026-04-20 06:00 CST</div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-1 rounded">SUCCESS</span>
            </div>
            <div className="py-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">TikTok iframe 重试</div>
                <div className="text-xs text-brand-black/40 mt-1">3次重试后成功 · 成功率 ~70%</div>
              </div>
              <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-1 rounded">WARNING</span>
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}
