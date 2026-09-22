import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Sparkles, Clock, RefreshCw, ShieldAlert, Newspaper, AlertCircle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import RightSidebar from './components/RightSidebar';
import NewsCard from './components/NewsCard';
import TopicSelector from './components/TopicSelector';

// Obter ou gerar ID único de cliente no LocalStorage para os votos
function getClientId() {
  try {
    let id = localStorage.getItem('radar_client_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('radar_client_id', id);
    }
    return id;
  } catch (e) {
    return 'user_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState('trending'); // trending | topics | recent
  const [news, setNews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Tópicos salvos no LocalStorage
  const [selectedTopics, setSelectedTopics] = useState(() => {
    try {
      const saved = localStorage.getItem('radar_topics');
      return saved ? JSON.parse(saved) : ['Tecnologia', 'Saúde', 'Ciência'];
    } catch {
      return ['Tecnologia', 'Saúde', 'Ciência'];
    }
  });

  const clientId = getClientId();

  // Salvar tópicos no LocalStorage ao alterar
  useEffect(() => {
    try {
      localStorage.setItem('radar_topics', JSON.stringify(selectedTopics));
    } catch (e) {
      console.error('Erro ao salvar tópicos no LocalStorage:', e);
    }
  }, [selectedTopics]);

  // Carregar notícias da API
  const fetchNews = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      let url = `/api/news?tab=${activeTab}&client_id=${encodeURIComponent(clientId)}`;
      if (activeTab === 'topics' && selectedTopics.length > 0) {
        url += `&topics=${encodeURIComponent(selectedTopics.join(','))}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Falha ao carregar notícias (${res.status})`);
      const data = await res.json();
      setNews(data.news || []);
    } catch (err) {
      console.error(err);
      setError('Não foi possível conectar ao servidor de notícias.');
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  }, [activeTab, selectedTopics, clientId]);

  // Carregar estatísticas
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchStats();
  }, [fetchNews]);

  // Sincronizar / Atualizar manualmente
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    await fetchNews();
    await fetchStats();
  };

  // Gerenciamento de Tópicos
  const handleToggleTopic = (topic) => {
    setSelectedTopics((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === topic.toLowerCase());
      if (exists) {
        return prev.filter((t) => t.toLowerCase() !== topic.toLowerCase());
      } else {
        return [...prev, topic];
      }
    });
  };

  const handleAddCustomTopic = (topic) => {
    setSelectedTopics((prev) => {
      const exists = prev.some((t) => t.toLowerCase() === topic.toLowerCase());
      if (exists) return prev;
      return [...prev, topic];
    });
  };

  const handleRemoveTopic = (topic) => {
    setSelectedTopics((prev) => prev.filter((t) => t !== topic));
  };

  // Voto estilo Reddit com atualização otimista na interface
  const handleVote = async (articleId, direction) => {
    // Atualização otimista imediata
    setNews((prevList) =>
      prevList.map((item) => {
        if (item.id !== articleId) return item;

        let newUp = item.upvotes;
        let newDown = item.downvotes;
        let newUserVote = 0;

        if (item.user_vote === direction) {
          // Desfazer voto
          if (direction === 1) newUp = Math.max(0, newUp - 1);
          if (direction === -1) newDown = Math.max(0, newDown - 1);
          newUserVote = 0;
        } else {
          // Trocar ou dar novo voto
          if (item.user_vote === 1) newUp = Math.max(0, newUp - 1);
          if (item.user_vote === -1) newDown = Math.max(0, newDown - 1);

          if (direction === 1) newUp += 1;
          if (direction === -1) newDown += 1;
          newUserVote = direction;
        }

        return {
          ...item,
          upvotes: newUp,
          downvotes: newDown,
          vote_balance: newUp - newDown,
          user_vote: newUserVote,
        };
      })
    );

    // Envio para o backend
    try {
      const res = await fetch(`/api/news/${articleId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          direction: direction,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setNews((prevList) =>
          prevList.map((item) =>
            item.id === articleId
              ? {
                  ...item,
                  upvotes: updated.upvotes,
                  downvotes: updated.downvotes,
                  vote_balance: updated.vote_balance,
                  user_vote: updated.user_vote,
                }
              : item
          )
        );
        fetchStats();
      }
    } catch (e) {
      console.error('Erro ao registrar voto:', e);
    }
  };

  return (
    <div className="min-h-screen flex justify-center selection:bg-purple-600 selection:text-white">
      <div className="w-full max-w-7xl flex">
        {/* Coluna Esquerda: Navegação (Twitter-style) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onRefresh={handleManualRefresh}
          isRefreshing={isRefreshing}
          topicCount={selectedTopics.length}
        />

        {/* Feed Central */}
        <main className="flex-1 min-w-0 border-r border-purple-500/10 min-h-screen pb-20">
          {/* Header Superior com Abas Fixas Translúcidas (Glassmorphism) */}
          <header className="sticky top-0 z-30 glass-panel border-b border-purple-500/20 px-4 pt-3 pb-0">
            <div className="flex items-center justify-between pb-3">
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Feed de Notícias</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    IA 0.6B
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Checagem automatizada e validação pela comunidade
                </p>
              </div>

              {/* Botão de refresh para mobile */}
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl glass-card text-purple-300 hover:text-white md:hidden"
                title="Sincronizar"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* 3 Abas Estilo Twitter */}
            <div className="flex border-t border-purple-500/10">
              <button
                onClick={() => setActiveTab('trending')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 relative transition-colors ${
                  activeTab === 'trending' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className={`w-4 h-4 ${activeTab === 'trending' ? 'text-purple-400' : ''}`} />
                <span>Em Alta</span>
                {activeTab === 'trending' && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-purple-glow"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('topics')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 relative transition-colors ${
                  activeTab === 'topics' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeTab === 'topics' ? 'text-purple-400' : ''}`} />
                <span>Meus Tópicos</span>
                {activeTab === 'topics' && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-purple-glow"></div>
                )}
              </button>

              <button
                onClick={() => setActiveTab('recent')}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 relative transition-colors ${
                  activeTab === 'recent' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className={`w-4 h-4 ${activeTab === 'recent' ? 'text-purple-400' : ''}`} />
                <span>Recentes</span>
                {activeTab === 'recent' && (
                  <div className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-purple-glow"></div>
                )}
              </button>
            </div>
          </header>

          {/* Área de Conteúdo do Feed */}
          <div className="p-4 sm:p-6 space-y-4 max-w-3xl mx-auto">
            {/* Se estiver na aba Meus Tópicos, exibe o seletor de tópicos */}
            {activeTab === 'topics' && (
              <TopicSelector
                selectedTopics={selectedTopics}
                onToggleTopic={handleToggleTopic}
                onAddCustomTopic={handleAddCustomTopic}
                onRemoveTopic={handleRemoveTopic}
              />
            )}

            {/* Alerta de erro se houver */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading Skeleton */}
            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="glass-card rounded-2xl p-5 animate-pulse space-y-3">
                    <div className="h-4 bg-purple-900/30 rounded w-1/3"></div>
                    <div className="h-6 bg-purple-900/40 rounded w-4/5"></div>
                    <div className="h-4 bg-purple-900/20 rounded w-full"></div>
                    <div className="h-8 bg-purple-900/30 rounded-full w-28"></div>
                  </div>
                ))}
              </div>
            )}

            {/* Feed de Notícias Vazio */}
            {!loading && news.length === 0 && (
              <div className="glass-panel rounded-2xl p-10 text-center space-y-3 border border-purple-500/15">
                <Newspaper className="w-12 h-12 text-purple-400/50 mx-auto" />
                <h3 className="text-base font-bold text-slate-200">Nenhuma notícia encontrada</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {activeTab === 'topics'
                    ? 'Tente selecionar outros tópicos ou palavras-chave para ver mais conteúdos checados.'
                    : 'Aguarde o próximo ciclo de ingestão ou clique em "Sincronizar Feed" para carregar.'}
                </p>
                <button
                  onClick={handleManualRefresh}
                  className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold border border-purple-500/30"
                >
                  Carregar Notícias
                </button>
              </div>
            )}

            {/* Lista de Notícias */}
            {!loading && news.length > 0 && (
              <div className="space-y-4">
                {news.map((item) => (
                  <NewsCard key={item.id} article={item} onVote={handleVote} />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Coluna Direita: Estatísticas e Tópicos Quentes */}
        <RightSidebar
          stats={stats}
          onSelectTrend={(tag) => {
            setActiveTab('topics');
            handleAddCustomTopic(tag);
          }}
        />
      </div>
    </div>
  );
}

