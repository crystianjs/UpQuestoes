'use client';

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  // 12 IMAGENS DA PASTA public/carrossel
  const imagensCarrossel = [
    "/carrossel/1.png",
    "/carrossel/2.png",
    "/carrossel/3.png",
    "/carrossel/4.png",
    "/carrossel/5.png",
    "/carrossel/6.png",
    "/carrossel/7.png",
    "/carrossel/8.png",
    "/carrossel/9.png",
    "/carrossel/10.png",
    "/carrossel/11.png",
    "/carrossel/12.png",
  ];

  // METAS E PILARES (FORMATO CARROSSEL COM TÍTULOS E ÍCONES SVG)
  const metasPilares = [
    {
      imagem: "/familia.jpeg",
      tag: "Base de Tudo",
      titulo: "A Família"
    },
    {
      imagem: "/polo_vw2025.jpg",
      tag: "Conquista",
      titulo: "O Carro dos Sonhos"
    },
    {
      imagem: "/cracha.jpg",
      tag: "Liberdade",
      titulo: "Estabilidade e Paz"
    },
    {
      imagem: "/eua.jpg",
      tag: "Liberdade",
      titulo: "Viagem - EUA, ESPANHA E OUTROS"
    }
  ];

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [modalZoomAberto, setModalZoomAberto] = useState(false);

  const [indiceMeta, setIndiceMeta] = useState(0);
  const [modalMetaZoom, setModalMetaZoom] = useState(false);

  const proximaImagem = () => {
    setIndiceAtual((prev) => (prev + 1) % imagensCarrossel.length);
  };

  const imagemAnterior = () => {
    setIndiceAtual((prev) => (prev - 1 + imagensCarrossel.length) % imagensCarrossel.length);
  };

  const proximaMeta = () => {
    setIndiceMeta((prev) => (prev + 1) % metasPilares.length);
  };

  const metaAnterior = () => {
    setIndiceMeta((prev) => (prev - 1 + metasPilares.length) % metasPilares.length);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-8 space-y-8 max-w-5xl mx-auto">
        
        {/* Seção de Destaque Superior */}
        <div className="bg-amber-400 border border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-950 text-center space-y-2 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 text-zinc-950/10 text-9xl font-black select-none pointer-events-none">
            <svg className="w-40 h-40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
          </div>
          <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
            FOCO TOTAL NO EDITAL • TJSP
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug pt-1">
            Você tem disciplina para realizar os sonhos dos outros, lute pelos seus sonhos também!
          </h2>
        </div>

        {/* SEÇÃO DE VÍDEOS DE REFLEXÃO E MENTALIDADE COM SOM CORRIGIDO */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 relative overflow-hidden">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="space-y-1">
              <span className="bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Mentalidade de Alta Performance
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Reflexão Diária e Foco
              </h2>
            </div>

            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl shadow-inner">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" /></svg>
              <span className="text-xs font-bold text-amber-400 tracking-wide">
                Coloque um fone de ouvido e reflita alguns minutos.
              </span>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            
            <div className="flex flex-col space-y-3 max-w-3xl mx-auto pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Vídeo Reflexivel 1</span>
                <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">16:9</span>
              </div>
              <div className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <video 
                  src="/video1.1.mp4" 
                  controls 
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </div>
            </div>

            <div className="flex flex-col space-y-3 max-w-3xl mx-auto pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Vídeo Reflexivel 2</span>
                <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">16:9</span>
              </div>
              <div className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <video 
                  src="/video2.2.mp4" 
                  controls 
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </div>
            </div>

            <div className="flex flex-col space-y-3 max-w-3xl mx-auto pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Vídeo Reflexivel 3</span>
                <span className="text-[10px] bg-zinc-900 text-amber-400 px-2 py-0.5 rounded border border-zinc-800 font-mono">16:9</span>
              </div>
              <div className="relative w-full aspect-video bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <video 
                  src="/video3.3.mp4" 
                  controls 
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover" 
                />
              </div>
            </div>

          </div>

        </div>

        {/* MOTIVOS PARA ESTUDAR E CONQUISTAR A VAGA */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
            <span className="p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MOTIVOS PARA ESTUDAR E CONQUISTAR A VAGA
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

          {/* --- CARROSSEL DE METAS E PILARES --- */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Nossas Metas e Pilares • Para quem e pelo que lutamos
                </h3>
              </div>
              <span className="text-xs font-bold bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full border border-amber-400/30">
                {indiceMeta + 1} / {metasPilares.length}
              </span>
            </div>

            <div 
              className="relative group rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video sm:aspect-[21/9] flex items-end p-6 cursor-pointer shadow-2xl"
              onClick={() => setModalMetaZoom(true)}
            >
              <Image 
                src={metasPilares[indiceMeta].imagem} 
                alt={metasPilares[indiceMeta].titulo} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
              
              <div className="relative z-10 space-y-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-zinc-950/80 px-2.5 py-1 rounded-md border border-zinc-800">
                  {metasPilares[indiceMeta].tag}
                </span>
                <h4 className="text-lg sm:text-xl font-black text-white mt-1">
                  {metasPilares[indiceMeta].titulo}
                </h4>
              </div>

              {/* SETAS DE NAVEGAÇÃO DO CARROSSEL DE METAS */}
              {metasPilares.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); metaAnterior(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-2xl transition-all border border-zinc-700 cursor-pointer opacity-80 group-hover:opacity-100"
                    title="Anterior"
                  >
                    ❮
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); proximaMeta(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-2xl transition-all border border-zinc-700 cursor-pointer opacity-80 group-hover:opacity-100"
                    title="Próxima"
                  >
                    ❯
                  </button>
                </>
              )}

              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-xl border border-zinc-800 text-[10px] font-bold text-amber-400">
                CLIQUE PARA VER EM TELA CHEIA
              </div>
            </div>
          </div>

          {/* --- CARROSSEL INTERATIVO DAS 12 IMAGENS DA PASTA CARROSSEL --- */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Mensagens e Reflexões Diárias
                </h3>
                <p className="text-xs text-zinc-400">Clique nas setas para passar pelos cards ({imagensCarrossel.length} imagens)</p>
              </div>
              <span className="text-xs font-bold bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full border border-amber-400/30">
                {indiceAtual + 1} / {imagensCarrossel.length}
              </span>
            </div>

            <div 
              className="relative group rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-square sm:aspect-video flex items-center justify-center cursor-pointer shadow-2xl p-4"
              onClick={() => setModalZoomAberto(true)}
            >
              <img 
                src={imagensCarrossel[indiceAtual]} 
                alt={`Card ${indiceAtual + 1}`} 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
              />

              {/* SETAS DE NAVEGAÇÃO LATERAL */}
              {imagensCarrossel.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); imagemAnterior(); }}
                    className="absolute left-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-2xl transition-all border border-zinc-700 cursor-pointer"
                    title="Anterior"
                  >
                    ❮
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); proximaImagem(); }}
                    className="absolute right-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-2xl transition-all border border-zinc-700 cursor-pointer"
                    title="Próxima"
                  >
                    ❯
                  </button>
                </>
              )}

              {/* OVERLAY DE ZOOM */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-xs font-black bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl shadow-2xl tracking-wider">
                  CLIQUE PARA VER EM TELA CHEIA
                </span>
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
                Em Estudo
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

      {/* MODAL DE ZOOM EM TELA CHEIA - CARROSSEL PRINCIPAL */}
      {modalZoomAberto && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setModalZoomAberto(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setModalZoomAberto(false)}
              className="absolute -top-12 right-0 bg-zinc-800 hover:bg-rose-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-2xl transition-all cursor-pointer border border-zinc-700 z-10"
            >
              ✕
            </button>

            <div className="relative w-full flex items-center justify-center p-4">
              <img 
                src={imagensCarrossel[indiceAtual]} 
                alt="Zoom" 
                className="max-w-full max-h-[80vh] object-contain rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-950"
              />

              <button 
                onClick={imagemAnterior}
                className="absolute left-2 sm:left-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl transition-all cursor-pointer border border-zinc-700"
              >
                ❮
              </button>
              <button 
                onClick={proximaImagem}
                className="absolute right-2 sm:right-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl transition-all cursor-pointer border border-zinc-700"
              >
                ❯
              </button>
            </div>

            <span className="text-xs font-bold text-zinc-400 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800">
              Imagem {indiceAtual + 1} de {imagensCarrossel.length}
            </span>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM EM TELA CHEIA - METAS E PILARES */}
      {modalMetaZoom && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setModalMetaZoom(false)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full flex flex-col items-center justify-center gap-4" onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setModalMetaZoom(false)}
              className="absolute -top-12 right-0 bg-zinc-800 hover:bg-rose-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-2xl transition-all cursor-pointer border border-zinc-700 z-10"
            >
              ✕
            </button>

            <div className="relative w-full flex items-center justify-center p-4">
              <div className="relative max-w-full max-h-[85vh] w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl">
                <Image 
                  src={metasPilares[indiceMeta].imagem} 
                  alt={metasPilares[indiceMeta].titulo} 
                  fill 
                  className="object-contain"
                />
              </div>

              <button 
                onClick={metaAnterior}
                className="absolute left-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl transition-all cursor-pointer border border-zinc-700"
              >
                ❮
              </button>
              <button 
                onClick={proximaMeta}
                className="absolute right-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-xl transition-all cursor-pointer border border-zinc-700"
              >
                ❯
              </button>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-white font-bold text-sm">{metasPilares[indiceMeta].titulo}</h3>
              <span className="text-xs text-zinc-400 bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 inline-block">
                Meta {indiceMeta + 1} de {metasPilares.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}