import React from 'react';
import { ArrowBigUp, ArrowBigDown, ExternalLink, ShieldCheck, AlertTriangle, ShieldAlert, Calendar } from 'lucide-react';

export default function NewsCard({ article, onVote }) {
  const {
    id,
    title,
    description,
    url,
    image_url,
    source_name,
    published_at,
    category,
    reliability_score,
    reliability_label,
    vote_balance,
    user_vote
  } = article;

  // Format relative date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
    if (diffHours < 1) return 'Agora pouco';
    if (diffHours < 24) return `há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  };

  // Badge configuration based on AI score
  const getBadgeConfig = (score) => {
    if (score >= 70) {
      return {
        bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        dot: 'bg-emerald-400',
        icon: ShieldCheck,
        text: 'Confiável'
      };
    } else if (score >= 40) {
      return {
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        dot: 'bg-amber-400',
        icon: AlertTriangle,
        text: 'Duvidoso'
      };
    } else {
      return {
        bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-400',
        icon: ShieldAlert,
        text: 'Alto Risco de Fake'
      };
    }
  };

  const badge = getBadgeConfig(reliability_score);
  const BadgeIcon = badge.icon;

  return (
    <article className="glass-card rounded-2xl p-4 sm:p-5 flex gap-3.5 sm:gap-4 relative overflow-hidden group">
      {/* Glow highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>

      {/* Reddit-style Upvote/Downvote Column */}
      <div className="flex flex-col items-center justify-start gap-0.5 pt-0.5 select-none">
        <button
          onClick={() => onVote(id, 1)}
          aria-label="Upvote"
          className={`p-1.5 rounded-lg transition-colors ${
            user_vote === 1
              ? 'text-purple-400 bg-purple-500/20 shadow-purple-glow'
              : 'text-slate-400 hover:text-purple-300 hover:bg-purple-950/30'
          }`}
        >
          <ArrowBigUp className={`w-6 h-6 ${user_vote === 1 ? 'fill-purple-400' : ''}`} />
        </button>

        <span className={`text-xs font-bold transition-colors ${
          vote_balance > 0
            ? 'text-purple-300'
            : vote_balance < 0
            ? 'text-rose-400'
            : 'text-slate-400'
        }`}>
          {vote_balance}
        </span>

        <button
          onClick={() => onVote(id, -1)}
          aria-label="Downvote"
          className={`p-1.5 rounded-lg transition-colors ${
            user_vote === -1
              ? 'text-rose-400 bg-rose-500/20'
              : 'text-slate-400 hover:text-rose-300 hover:bg-rose-950/20'
          }`}
        >
          <ArrowBigDown className={`w-6 h-6 ${user_vote === -1 ? 'fill-rose-400' : ''}`} />
        </button>
      </div>

      {/* Card Main Body */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Source, Category & Time Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-purple-600/30 border border-purple-500/30 flex items-center justify-center font-bold text-[10px] text-purple-300 uppercase">
              {source_name ? source_name.charAt(0) : 'N'}
            </span>
            <span className="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[200px]">
              {source_name || 'Fonte'}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" />
              {formatDate(published_at)}
            </span>
          </div>

          {category && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-950/40 text-purple-300/90 border border-purple-500/20">
              {category}
            </span>
          )}
        </div>

        {/* Headline */}
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug hover:text-purple-200 transition-colors">
          <a href={url} target="_blank" rel="noopener noreferrer" className="focus:outline-none">
            {title}
          </a>
        </h2>

        {/* Short Description */}
        {description && (
          <p className="text-xs sm:text-sm text-slate-300/80 line-clamp-2 leading-relaxed font-normal">
            {description}
          </p>
        )}

        {/* Image if available */}
        {image_url && (
          <div className="relative rounded-xl overflow-hidden max-h-48 sm:max-h-56 border border-purple-500/10">
            <img
              src={image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-300"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#08050e]/60 via-transparent to-transparent"></div>
          </div>
        )}

        {/* Footer: AI Reliability Badge & External Source Link */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-purple-500/10">
          {/* AI Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm ${badge.bg}`}>
            <BadgeIcon className="w-3.5 h-3.5" />
            <span>{badge.text}</span>
            <span className="px-1.5 py-0.2 rounded bg-black/20 text-[11px] font-bold">
              {reliability_score}%
            </span>
          </div>

          {/* Original News Link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 hover:underline transition-colors ml-auto"
          >
            <span>Matéria Original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

