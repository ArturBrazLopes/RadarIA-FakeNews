import React from 'react';
import { Flame, Sparkles, Clock, ShieldCheck, RefreshCw, Layers } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onRefresh, isRefreshing, topicCount }) {
  const navItems = [
    {
      id: 'trending',
      label: 'Em Alta',
      icon: Flame,
      description: 'Mais votadas pela comunidade'
    },
    {
      id: 'topics',
      label: 'Meus Tópicos',
      icon: Sparkles,
      badge: topicCount > 0 ? topicCount : null,
      description: 'Filtrado por seus interesses'
    },
    {
      id: 'recent',
      label: 'Mais Recentes',
      icon: Clock,
      description: 'Últimas notícias checadas'
    }
  ];

  return (
    <aside className="w-64 xl:w-72 flex-shrink-0 hidden md:flex flex-col justify-between h-screen sticky top-0 px-4 py-6 border-r border-purple-500/10">
      <div className="space-y-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-3 py-2 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 flex items-center justify-center shadow-purple-glow group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-purple-300 via-purple-100 to-white bg-clip-text text-transparent">
              Radar<span className="text-purple-400">IA</span>
            </span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-purple-400/70">
              Fact-Check Feed
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-left font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30 shadow-card-glow backdrop-blur-md'
                    : 'text-slate-400 hover:text-purple-200 hover:bg-purple-900/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                  <span className="text-base">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Refresh Button */}
        <div className="pt-2">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-purple-glow transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Atualizando...' : 'Sincronizar Feed'}</span>
          </button>
        </div>
      </div>

      {/* Model & System Status */}
      <div className="p-3.5 rounded-2xl glass-panel space-y-2 border border-purple-500/15">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-semibold text-slate-300">Modelo 0.6B Online</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Classificador RoBERTa Fine-Tuned ativo analisando notícias a cada 12h.
        </p>
      </div>
    </aside>
  );
}

