'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { Search, Globe, ArrowUpRight, Zap } from 'lucide-react';

export default function BuscadorUniversalPage() {
  const [disciplina, setDisciplina] = useState('Informática');
  const [assunto, setAssunto] = useState('Funções CONT.SE e CONT.SES do Excel');
  const [banca, setBanca] = useState('VUNESP');
  const [orgao, setOrgao] = useState('TJ-SP');

  // URLs otimizadas com espaçamento limpo
  const abrirSite = (tipo: string) => {
    const query = [disciplina, assunto, banca, orgao].filter(Boolean).join(' ');
    let url = '';

    if (tipo === 'qconcursos') {
      url = `https://www.qconcursos.com/questoes-de-concursos/questoes?q=${encodeURIComponent(query)}`;
    } else if (tipo === 'tec') {
      url = `https://www.tecconcursos.com.br/questoes/foco?q=${encodeURIComponent(query)}`;
    } else if (tipo === 'gran') {
      url = `https://questoes.grancursosonline.com.br/questoes?busca=${encodeURIComponent(query)}`;
    } else if (tipo === 'estrategia') {
      url = `https://questoes.estrategiaconcursos.com.br/busca?q=${encodeURIComponent(query)}`;
    } else if (tipo === 'pci') {
      url = `https://www.pciconcursos.com.br/pesquisa/?q=${encodeURIComponent(`Prova ${orgao}${banca} ${disciplina}${assunto}`)}`;
    }

    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        
        {/* Cabeçalho */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex items-center justify-between">
          <div>
            <span className="bg-amber-400 text-zinc-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              ATALHOS DIRETO
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Buscador de Questões TJ-SP
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Insere o teu foco de estudo e clica direto no site para abrir a pesquisa filtrada.
            </p>
          </div>
          <Zap className="w-10 h-10 text-amber-400 hidden sm:block" />
        </div>

        {/* Inputs de Configuração */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4" /> Parâmetros de Estudo
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Disciplina</label>
              <input
                type="text"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Assunto Específico</label>
              <input
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 outline-none focus:border-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Banca</label>
              <input
                type="text"
                value={banca}
                onChange={(e) => setBanca(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Órgão / Concurso</label>
              <input
                type="text"
                value={orgao}
                onChange={(e) => setOrgao(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-400 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Botões de Atalho dos Sites */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            Atalhos Diretos para os Principais Sites de Questões:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <button
              onClick={() => abrirSite('qconcursos')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-5 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer text-left"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">QConcursos</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Abrir busca com os filtros informados</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
            </button>

            <button
              onClick={() => abrirSite('tec')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-5 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer text-left"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">TEC Concursos</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Abrir com foco em comentários</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
            </button>

            <button
              onClick={() => abrirSite('gran')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-5 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer text-left"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">Gran Questões</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Abrir acervo integrado</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
            </button>

            <button
              onClick={() => abrirSite('estrategia')}
              className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-400/60 p-5 rounded-2xl flex items-center justify-between transition group shadow-lg cursor-pointer text-left"
            >
              <div>
                <p className="text-sm font-bold text-white group-hover:text-amber-300">Estratégia Questões</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Abrir banco de questões</p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-amber-400 shrink-0" />
            </button>

          </div>
        </div>

      </main>
    </div>
  );
}