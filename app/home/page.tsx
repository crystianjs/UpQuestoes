'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-8 space-y-8 max-w-5xl mx-auto">
        
        {/* Nova Seção de Destaque Superior (Fundo Amarelo, Texto Preto) */}
        <div className="bg-amber-400 border border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-950 text-center space-y-2 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-zinc-950/10 text-9xl font-black select-none pointer-events-none">
            🚀
          </div>
          <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
            FOCO TOTAL NO EDITAL • TJSP
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug pt-1">
            Você tem disciplina para realizar o sonho dos outros ou vai lutar pelos seus próprios sonhos? 💭🚀
          </h2>
          <p className="text-xs sm:text-sm font-bold text-zinc-900 max-w-2xl mx-auto opacity-90">
            Cada questão resolvida e cada flashcard revisado hoje te aproximam da sua nomeação como Escrevente.
          </p>
        </div>

        {/* Card Principal Estilo Radar de Concursos */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
          
          {/* Topo do Radar (Limpo, apenas TJSP e Tribunal de Justiça) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  TJSP<span className="text-amber-400">.</span>
                </h1>
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              </div>
              <p className="text-sm font-semibold text-zinc-400 mt-1">
                Tribunal de Justiça de São Paulo
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-black text-xs shadow-lg uppercase tracking-wider">
                Em Estudo 🚀
              </span>
              <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                Escrevente Técnico Judiciário
              </span>
            </div>
          </div>

          {/* Grid de Informações Chave */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Remuneração */}
            <div className="md:col-span-2 bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-inner space-y-2 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Remuneração Inicial (com alimentação e transporte)
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                R$ 8.519,54
              </div>
              <p className="text-xs text-zinc-400 font-medium pt-1">
                R$ 6.345,94 + R$ 1.760 alimentação + R$ 413,60 transporte (22 dias)
              </p>
            </div>

            {/* Escolaridade */}
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-inner space-y-2 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Escolaridade Exigida
              </span>
              <div className="text-lg sm:text-xl font-extrabold text-white">
                Ensino Médio
              </div>
              <span className="text-xs font-semibold text-amber-400">
                Requisito padrão Escrevente
              </span>
            </div>

          </div>

          {/* Segunda Grid: Vagas e Banca */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-inner space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Vagas Previstas</span>
              <div className="text-3xl font-black text-white">720</div>
              <p className="text-xs text-zinc-500">Cargos criados pela LC nº 1.429</p>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl shadow-inner space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Banca Organizadora</span>
              <div className="text-2xl font-black text-white">Vunesp</div>
              <p className="text-xs text-zinc-500">Contrato com o TJSP vigente até jun/2027</p>
            </div>

          </div>

          {/* Status da Linha do Tempo */}
          <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Status do Concurso</span>
            
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-amber-400"></div>
                <span className="text-[11px] font-bold text-amber-400">PREVISTO</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-zinc-700"></div>
                <span className="text-[11px] font-semibold text-zinc-500">AUTORIZADO</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-zinc-700"></div>
                <span className="text-[11px] font-semibold text-zinc-500">BANCA</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-zinc-700"></div>
                <span className="text-[11px] font-semibold text-zinc-500">EDITAL</span>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-zinc-700"></div>
                <span className="text-[11px] font-semibold text-zinc-500">INSCRIÇÕES</span>
              </div>
            </div>
          </div>

          {/* No Radar / Alerta */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border-l-4 border-amber-400 border-t border-r border-b border-zinc-800 space-y-1.5">
            <p className="font-extrabold text-xs text-amber-400 uppercase tracking-wider">
              🚨 NO RADAR:
            </p>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
              O tribunal confirmou estudos para um novo edital. As listas da 2ª, 4ª, 5ª, 6ª, 8ª e 9ª RAJs vencem até junho de 2027 — o relógio está correndo.
            </p>
          </div>

          {/* Atalhos Rápidos para Estudo */}
          <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-500">Atualizado em 23/09/2026 • Sujeito a mudanças</span>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link 
                href="/desempenho" 
                className="w-full sm:w-auto px-5 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black rounded-xl text-xs transition-all shadow-lg text-center cursor-pointer"
              >
                Desempenho
              </Link>
              <Link 
                href="/caderno-revisao" 
                className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold rounded-xl text-xs border border-zinc-700 transition-all text-center cursor-pointer"
              >
                Flashcards
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}