import React from 'react';
import { BarChart3, TrendingUp, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';

export default function RightSidebar({ stats, onSelectTrend }) {
  const trends = [
    { tag: 'InteligenciaArtificial', posts: '1.4k checagens' },
    { tag: 'SaudePublica', posts: '980 checagens' },
    { tag: 'EconomiaBrasil', posts: '740 checagens' },
    { tag: 'TelescopioWebb', posts: '530 checagens' },
    { tag: 'Ciberseguranca', posts: '310 checagens' },
  ];

  return (
    <aside className="w-80 xl:w-96 flex-shrink-0 hidden lg:flex flex-col gap-5 py-6 px-4 border-l border-purple-500/10">
      {/* Fact-Check Statistics Widget */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-500/15 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">Painel de Auditoria</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-purple-400/80 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
            Hoje
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/15">
            <span className="text-[11px] text-slate-400 font-medium block">Total Analisadas</span>
            <span className="text-xl font-black text-white">{stats?.total_news || 0}</span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/15">
            <span className="text-[11px] text-slate-400 font-medium block">Índice Confiável</span>
            <span className="text-xl font-black text-emerald-400">
              {stats?.reliable_percentage || 0}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/15">
            <span className="text-[11px] text-slate-400 font-medium block">Alertas / Fake</span>
            <span className="text-xl font-black text-rose-400">
              {(stats?.suspicious_count || 0) + (stats?.fake_count || 0)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/15">
            <span className="text-[11px] text-slate-400 font-medium block">Votos da Galera</span>
            <span className="text-xl font-black text-purple-300">
              {stats?.total_votes || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Trending Topics Widget (Twitter style) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-500/15 space-y-3.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-100">Assuntos em Pauta</h3>
        </div>

        <div className="space-y-2.5">
          {trends.map((item) => (
            <div
              key={item.tag}
              onClick={() => onSelectTrend && onSelectTrend(item.tag)}
              className="p-2.5 rounded-xl hover:bg-purple-900/20 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div>
                <span className="block text-xs font-bold text-slate-200 group-hover:text-purple-300 transition-colors">
                  #{item.tag}
                </span>
                <span className="text-[11px] text-slate-500">{item.posts}</span>
              </div>
              <span className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                Ver notícias →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Fine-Tuned Model Info Card */}
      <div className="glass-panel rounded-2xl p-4 border border-purple-500/15 space-y-2.5">
        <div className="flex items-center gap-2 text-purple-400">
          <Cpu className="w-4 h-4" />
          <h4 className="text-xs font-bold uppercase tracking-wider">RoBERTa 0.6B Fine-Tuning</h4>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Nossa rede neural foi calibrada especificamente para o português brasileiro, avaliando indícios de sensacionalismo, coerência textual e veracidade factual.
        </p>
      </div>
    </aside>
  );
}

