'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { 
  Search, 
  Zap, 
  Plus, 
  Globe, 
  ArrowUpRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function BuscadorUniversalPage() {
  const [disciplina, setDisciplina] = useState('Informática');
  const [assunto, setAssunto] = useState('Funções CONT.SE e CONT.SES do Excel');
  const [banca, setBanca] = useState('VUNESP');
  const [orgao, setOrgao] = useState('TJ-SP');

  // Estado para cadastro rápido manual da questão encontrada se desejar salvar
  const [showCadastroRapido, setShowCadastroRapido] = useState(false);
  const [enunciado, setEnunciado] = useState('');
  const [gabarito, setGabarito] = useState('A');
  const [urlQuestao, setUrlQuestao] = useState('');

  // URLs ajustadas para direcionar para o motor de busca com parâmetros limpos e separados por vírgula/espaço
  const gerarUrlQConcursos = () => {
    const query = `${disciplina} ${assunto} ${banca} ${orgao}`;
    return `https://www.qconcursos.com/questoes-de-concursos/questoes?q=${encodeURIComponent(query)}`;
  };

  const gerarUrlTEC = () => {
    const query = `${assunto} ${banca} ${orgao}`;
    return `https://www.tecconcursos.com.br/questoes/foco?q=${encodeURIComponent(query)}`;
  };

  const gerarUrlGran = () => {
    const query = `${disciplina} ${assunto} ${banca} ${orgao}`;
    return `https://questoes.grancursosonline.com.br/questoes?busca=${encodeURIComponent(query)}`;
  };

  const gerarUrlPCI = () => {
    const query = `${orgao} ${banca} ${disciplina} ${assunto}`;
    return `https://www.pciconcursos.com.br/pesquisa/?q=${encodeURIComponent(query)}`;
  };

  const salvarQuestaoRapida = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enunciado.trim()) { alert('Preencha o enunciado.'); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Sessão expirada. Faça login.'); return; }

      const { error } = await supabase.from('questoes_buscador').insert([{
        user_id: user.id,
        disciplina,
        assunto,
        banca,
        orgao,
        enunciado,
        gabarito,
        url_questao: urlQuestao,
        status_verificacao: 'verificado'
      }]);

      if (error) throw error;
      alert('Questão registrada no seu caderno!');
      setEnunciado('');
      setUrlQuestao('');
      setShowCadastroRapido(false);
    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Cabeçalho */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex items-center justify-between">
          <div>
            <span className="bg-amber-400 text-zinc-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              FILTRO DIRETO INTELIGENTE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Buscador Dinâmico de Questões
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Altere os parâmetros e abra o filtro exato nos maiores bancos de questões do país.
            </p>
          </div>
          <Zap className="w-10 h-10 text-amber-400 hidden sm:block" />
        </div>

        {/* Formulário dos Parâmetros */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4" /> Configurar Filtros
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Disciplina</label>
              <input
                type="text"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Assunto Específico</label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-300 outline-none focus:border-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Banca</label>
              <input
                type="text"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Órgão / Concurso</label>
              <input
                type="text"
                value={orgao}
                onChange={(e) => setOrgao(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-amber-400 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação Direta Rápidos */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            Abrir Filtro em 1-Clique nos Sites Oficiais:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <a
              href={gerarUrlQConcursos()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-4 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">QConcursos</p>
                <p className="text-[10px] text-zinc-400">Filtrar VUNESP / TJ-SP</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </a>

            <a
              href={gerarUrlTEC()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-4 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">TEC Concursos</p>
                <p className="text-[10px] text-zinc-400">Foco em comentários</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </a>

            <a
              href={gerarUrlGran()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-4 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">Gran Questões</p>
                <p className="text-[10px] text-zinc-400">Filtro integrado</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </a>

            <a
              href={gerarUrlPCI()}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-4 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">PCI (Provas PDF)</p>
                <p className="text-[10px] text-zinc-400">Provas na íntegra</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400" />
            </a>

          </div>
        </div>

        {/* Cadastro Manual Opcional */}
        <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
          <p className="text-xs text-zinc-500">Achou uma questão excelente lá e quer guardar no seu caderno?</p>
          <button
            onClick={() => setShowCadastroRapido(!showCadastroRapido)}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-400/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> {showCadastroRapido ? 'Fechar' : 'Salvar no Caderno'}
          </button>
        </div>

        {showCadastroRapido && (
          <form onSubmit={salvarQuestaoRapida} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-xs font-bold text-white">Registro Rápido no Banco Supabase</h3>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Enunciado ou Resumo:</label>
              <textarea
                rows={3}
                value={enunciado}
                onChange={(e) => setEnunciado(e.target.value)}
                placeholder="Cole o enunciado da questão..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Gabarito Oficial:</label>
                <input
                  type="text"
                  value={gabarito}
                  onChange={(e) => setGabarito(e.target.value)}
                  placeholder="Ex: B"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Link da Questão (opcional):</label>
                <input
                  type="text"
                  value={urlQuestao}
                  onChange={(e) => setUrlQuestao(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-400 text-zinc-950 font-black rounded-xl text-xs hover:bg-amber-500 transition cursor-pointer"
              >
                Salvar Questão
              </button>
            </div>
          </form>
        )}

      </main>
    </div>
  );
}