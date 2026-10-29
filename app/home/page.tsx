'use client';

import React from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-8 space-y-8 max-w-5xl mx-auto">
        
        {/* Seção de Destaque Superior */}
        <div className="bg-amber-400 border border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-950 text-center space-y-2 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-zinc-950/10 text-9xl font-black select-none pointer-events-none">
            🚀
          </div>
          <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
            FOCO TOTAL NO EDITAL • TJSP
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug pt-1">
            Você tem disciplina para realizar os sonhos dos outros, lute pelos seus sonhos também! 💭🚀
          </h2>
        </div>

        {/* SEÇÃO DE VÍDEOS DE REFLEXÃO E MENTALIDADE */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Cabeçalho com Orientação e Fone de Ouvido */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="space-y-1">
              <span className="bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Mentalidade de Alta Performance
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Reflexão Diária & Foco
              </h2>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-inner">
              <span className="text-xl">🎧</span>
              <span className="text-xs font-bold text-amber-400 tracking-wide">
                Coloque um fone de ouvido e reflita alguns minutos.
              </span>
            </div>
          </div>

          {/* Disposição em dois blocos: Topo (2x 9:16) e Base (1x 16:9) */}
          <div className="space-y-6 pt-2">
            
            {/* PARTE SUPERIOR: 2 Vídeos 9:16 Lado a Lado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
              
              {/* Vídeo 1 (9:16 - Vertical) */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Vídeo de Impacto 01</span>
                  <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">9:16</span>
                </div>
                <div className="relative w-full aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                  <video 
                    src="/video1.mp4" 
                    controls 
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                </div>
              </div>

              {/* Vídeo 2 (9:16 - Vertical) */}
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400">Vídeo de Impacto 02</span>
                  <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">9:16</span>
                </div>
                <div className="relative w-full aspect-[9/16] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                  <video 
                    src="/video2.mp4" 
                    controls 
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                </div>
              </div>

            </div>

            {/* PARTE INFERIOR: 1 Vídeo 16:9 Embaixo */}
            <div className="flex flex-col space-y-3 max-w-3xl mx-auto pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Vídeo Principal</span>
                <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">16:9</span>
              </div>
              <div className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <video 
                  src="/video3.mp4" 
                  controls 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </div>
            </div>

          </div>

        </div>

        {/* MOTIVOS PARA ESTUDAR E CONQUISTAR A VAGA */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <span className="p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-lg">
              🥷
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MOTIVOS PARA ESTUDAR E CONQUISTAR A VAGA🥹🙏
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                O combustível diário para manter a disciplina nos momentos difíceis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-amber-400 border border-zinc-800 hover:border-amber-400/50 transition-all space-y-2">
              <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Motivo 01
              </span>
              <p className="text-sm font-bold text-zinc-950 leading-snug">
                Hoje, se você perder o emprego, tem segurança financeira garantida?
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-400 border border-zinc-800 hover:border-amber-400/50 transition-all space-y-2">
              <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Motivo 02
              </span>
              <p className="text-sm font-bold text-zinc-950 leading-snug">
                Você se sujeita a qualquer tratamento indesejado apenas por conta da necessidade do salário?
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-400 border border-zinc-800 hover:border-amber-400/50 transition-all space-y-2">
              <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Motivo 03
              </span>
              <p className="text-sm font-bold text-zinc-950 leading-snug">
                Você vive segundo o que os outros determinam sobre a sua vida e o seu tempo?
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-400 border border-zinc-800 hover:border-amber-400/50 transition-all space-y-2">
              <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                Motivo 04
              </span>
              <p className="text-sm font-bold text-zinc-950 leading-snug">
                Querer fazer um rolê, aproveitar a vida e simplesmente não ter dinheiro para isso.
              </p>
            </div>
          </div>

          {/* Galeria de Fotos / Metas */}
          <div className="pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">
              Nossas Metas e Pilares • Para quem e pelo que lutamos
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="group relative h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-end p-4">
                <Image 
                  src="/familia.jpeg" 
                  alt="Família" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                    Base de Tudo
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">A Família</h4>
                </div>
              </div>

              <div className="group relative h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-end p-4">
                <Image 
                  src="/polo_vw2025.jpg" 
                  alt="Carro do Sonho" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                    Conquista
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">O Carro dos Sonhos</h4>
                </div>
              </div>

              <div className="group relative h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-end p-4">
                <Image 
                  src="/cracha.jpg" 
                  alt="Estabilidade" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                    Liberdade
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Estabilidade e Paz</h4>
                </div>
              </div>

              <div className="group relative h-48 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-end p-4">
                <Image 
                  src="/eua.jpg" 
                  alt="Viagem" 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-70 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                <div className="relative z-10">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-zinc-950/80 px-2 py-0.5 rounded border border-zinc-800">
                    Liberdade
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">Viagem - EUA, ESPANHA E OUTROS</h4>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Card Principal Estilo Radar de Concursos */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden space-y-8">
          
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        </div>

      </main>
    </div>
  );
}