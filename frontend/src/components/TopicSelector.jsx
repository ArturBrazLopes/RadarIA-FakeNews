import React, { useState } from 'react';
import { Plus, X, Tag, Sparkles } from 'lucide-react';

const PREDEFINED_TOPICS = [
  'Política',
  'Economia',
  'Tecnologia',
  'Saúde',
  'Ciência',
  'Mundo',
  'Educação',
  'Meio Ambiente'
];

export default function TopicSelector({ selectedTopics, onToggleTopic, onAddCustomTopic, onRemoveTopic }) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (e) => {
    e.preventDefault();
    const clean = inputValue.trim();
    if (clean) {
      onAddCustomTopic(clean);
      setInputValue('');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-500/20 mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-slate-200">
            Personalize os Tópicos do seu Feed
          </h3>
        </div>
        <span className="text-xs text-purple-300/80 font-medium">
          {selectedTopics.length} selecionado(s)
        </span>
      </div>

      {/* Predefined Categories Chips */}
      <div className="flex flex-wrap gap-2">
        {PREDEFINED_TOPICS.map((topic) => {
          const isSelected = selectedTopics.some(t => t.toLowerCase() === topic.toLowerCase());
          return (
            <button
              key={topic}
              onClick={() => onToggleTopic(topic)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all select-none ${
                isSelected
                  ? 'bg-purple-600 text-white shadow-purple-glow border border-purple-400 scale-[1.02]'
                  : 'bg-purple-950/40 text-slate-300 hover:text-white hover:bg-purple-900/50 border border-purple-500/20'
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>

      {/* Custom Tag Input */}
      <form onSubmit={handleAddTag} className="flex gap-2 pt-1">
        <div className="relative flex-1">
          <Tag className="w-4 h-4 text-purple-400/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Adicionar palavra-chave (ex: Vacinas, Eleições, IA)..."
            className="w-full bg-[#0a0614]/80 border border-purple-500/20 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-3.5 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Adicionar</span>
        </button>
      </form>

      {/* Active Custom Tags Chips */}
      {selectedTopics.filter(t => !PREDEFINED_TOPICS.some(p => p.toLowerCase() === t.toLowerCase())).length > 0 && (
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 uppercase font-semibold">Tags extras:</span>
          {selectedTopics
            .filter(t => !PREDEFINED_TOPICS.some(p => p.toLowerCase() === t.toLowerCase()))
            .map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => onRemoveTopic(tag)}
                  className="hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

