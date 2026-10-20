'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

export default function BuscadorRapidoPage() {
  const [disciplina, setDisciplina] = useState('Informática');
  const [assunto, setAssunto] = useState('Funções CONT.SE e CONT.SES');
  const [banca, setBanca] = useState('VUNESP');
  const [orgao, setOrgao] = useState('TJ-SP');
  const [questoesSalvas, setQuestoesSalvas] = useState<any[]>([]);

  useEffect(() => {
    const salvo = localStorage.getItem('caderno_questoes_tj');
    if (salvo) {
      try { setQuestoesSalvas(JSON.parse(salvo)); } catch (e) {}
    }
  }, []);

  const abrirPortal = (tipo: string) => {
    const query = [disciplina, assunto, banca, orgao].filter(Boolean).join(' ');
    let url = '';

    if (tipo === 'qconcursos') {
      url = `https://www.qconcursos.com/questoes-de-concursos/questoes?q=${encodeURIComponent(query)}`;
    } else if (tipo === 'tec') {
      url = `https://www.tecconcursos.com.br/questoes/foco?q=${encodeURIComponent(query)}`;
    } else if (tipo === 'gran') {
      url = `https://questoes.grancursosonline.com.br/questoes?busca=${encodeURIComponent(query)}`;
    } else if (tipo === 'pci') {
      url = `https://www.pciconcursos.com.br/pesquisa/?q=${encodeURIComponent(`Prova ${orgao}${banca} ${disciplina}${assunto}`)}`;
    }

    window.open(url, '_blank');
  };

  const guardarNoCadernoLocal = () => {
    const novaQuestao = {
      id: Date.now(),
      disciplina,
      assunto,
      banca,
      orgao,
      data: new Date().toLocaleDateString()
    };
    const atualizado = [novaQuestao, ...questoesSalvas];
    setQuestoesSalvas(atualizado);
    localStorage.setItem('caderno_questoes_tj', JSON.stringify(atualizado));
    alert('Filtro guardado no teu caderno local!');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        <div className="border-b border-zinc-800 pb-4">
          <span className="text-amber-400 font-black text-xs uppercase tracking-wider">Modo Ultra-Rápido</span>
          <h1 className="text-2xl font-black mt-1">Buscador Inteligente TJ-SP</h1>
          <p className="text-xs text-zinc-400">Gera links com espaçamento correto e abre filtros diretos instantaneamente.</p>
        </div>

        {/* Inputs */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Disciplina</label>
              <input 
                type="text" 
                value={disciplina} 
                onChange={e => setDisciplina(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Assunto Específico</label>
              <input 
                type="text" 
                value={assunto} 
                onChange={e => setAssunto(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-amber-300 focus:border-amber-400 outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Banca</label>
              <input 
                type="text" 
                value={banca} 
                onChange={e => setBanca(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-1">Órgão / Concurso</label>
              <input 
                type="text" 
                value={orgao} 
                onChange={e => setOrgao(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:border-amber-400 outline-none font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Botões de Ação Direta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button 
            onClick={() => abrirPortal('qconcursos')}
            className="p-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-2xl text-xs transition shadow-lg cursor-pointer flex items-center justify-between"
          >
            <span>🔍 Abrir no QConcursos (Filtro Limpo)</span>
            <span>➔</span>
          </button>

          <button 
            onClick={() => abrirPortal('tec')}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold rounded-2xl text-xs transition shadow-lg cursor-pointer flex items-center justify-between"
          >
            <span>⚡ Abrir no TEC Concursos</span>
            <span>➔</span>
          </button>

          <button 
            onClick={() => abrirPortal('gran')}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-2xl text-xs transition shadow-lg cursor-pointer flex items-center justify-between"
          >
            <span>📚 Abrir no Gran Questões</span>
            <span>➔</span>
          </button>

          <button 
            onClick={() => abrirPortal('pci')}
            className="p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-2xl text-xs transition shadow-lg cursor-pointer flex items-center justify-between"
          >
            <span>📄 Baixar Provas no PCI Concursos</span>
            <span>➔</span>
          </button>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={guardarNoCadernoLocal}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-400/30 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Guardar este Filtro no Meu Histórico Local
          </button>
        </div>

        {/* Histórico Local */}
        {questoesSalvas.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Histórico de Pesquisas Recentes</h3>
            <div className="space-y-2">
              {questoesSalvas.map((item: any) => (
                <div key={item.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs flex justify-between items-center">
                  <span><b>{item.disciplina}</b>: {item.assunto} ({item.banca} / {item.orgao})</span>
                  <span className="text-[10px] text-zinc-500">{item.data}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}