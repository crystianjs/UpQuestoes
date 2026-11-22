'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { Plus, Trash2, X, AlertTriangle, CheckCircle2, Target } from 'lucide-react';

interface MotivoItem {
  id: string;
  tag: string;
  texto: string;
}

interface MetaPilar {
  id: string;
  tag: string;
  titulo: string;
  imagem: string;
}

export default function HomePage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [motivos, setMotivos] = useState<MotivoItem[]>([
    { id: 'm1', tag: 'Motivo 01', texto: 'Hoje, se você perder o emprego, tem segurança financeira garantida?' },
    { id: 'm2', tag: 'Motivo 02', texto: 'Você se sujeita a qualquer tratamento indesejado apenas por conta da necessidade do salário?' },
    { id: 'm3', tag: 'Motivo 03', texto: 'Você vive segundo o que os outros determinam sobre a sua vida e o seu tempo?' },
    { id: 'm4', tag: 'Motivo 04', texto: 'Querer fazer um rolê, aproveitar a vida e simplesmente não ter dinheiro para isso.' }
  ]);

  const [metasPilares, setMetasPilares] = useState<MetaPilar[]>([
    { id: 'p1', tag: 'Base de Tudo', titulo: 'A Família', imagem: '/familia.jpeg' },
    { id: 'p2', tag: 'Conquista', titulo: 'O Carro dos Sonhos', imagem: '/polo_vw2025.jpg' },
    { id: 'p3', tag: 'Liberdade', titulo: 'Estabilidade e Paz', imagem: '/tribunal.jpg' },
    { id: 'p4', tag: 'Liberdade', titulo: 'Viagem - EUA, ESPANHA E OUTROS', imagem: '/eua.jpg' }
  ]);

  const [showMotivoModal, setShowMotivoModal] = useState(false);
  const [novoMotivoTag, setNovoMotivoTag] = useState('');
  const [novoMotivoTexto, setNovoMotivoTexto] = useState('');

  const [showMetaModal, setShowMetaModal] = useState(false);
  const [novaMetaTag, setNovaMetaTag] = useState('');
  const [novaMetaTitulo, setNovaMetaTitulo] = useState('');
  const [novaMetaImagem, setNovaMetaImagem] = useState('');

  const imagensCarrossel = [
    "/carrossel/1.png", "/carrossel/2.png", "/carrossel/3.png", "/carrossel/4.png",
    "/carrossel/5.png", "/carrossel/6.png", "/carrossel/7.png", "/carrossel/8.png",
    "/carrossel/9.png", "/carrossel/10.png", "/carrossel/11.png", "/carrossel/12.png"
  ];

  const [indiceAtual, setIndiceAtual] = useState(0);
  const [modalZoomAberto, setModalZoomAberto] = useState(false);
  const [indiceMeta, setIndiceMeta] = useState(0);
  const [modalMetaZoom, setModalMetaZoom] = useState(false);

  useEffect(() => {
    async function initSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }

      const uid = session.user.id;
      
      // REGRA DE REDIRECIONAMENTO: Se não for o seu ID, entra direto em /desempenho
      if (uid !== '96d5de06-229d-4a5c-97c0-dbb47224bb17') {
        router.push('/desempenho');
        return;
      }

      setUserId(uid);
      carregarHomeDoSupabase(uid);
    }
    initSession();
  }, [router]);

  const carregarHomeDoSupabase = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('user_home_config')
        .select('*')
        .eq('user_id', uid)
        .maybeSingle();

      if (data) {
        if (data.motivos) setMotivos(data.motivos);
        if (data.metas) setMetasPilares(data.metas);
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e);
    } finally {
      setLoading(false);
    }
  };

  const salvarNoSupabase = async (novosMotivos: MotivoItem[], novasMetas: MetaPilar[]) => {
    if (!userId) return;
    try {
      await supabase.from('user_home_config').upsert({
        user_id: userId,
        motivos: novosMotivos,
        metas: novasMetas,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    } catch (e) {
      console.error("Erro ao salvar:", e);
    }
  };

  const adicionarMotivo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoMotivoTexto.trim()) return;
    const atualizados = [
      ...motivos,
      { id: `m-${Date.now()}`, tag: novoMotivoTag.trim() || `Motivo 0${motivos.length + 1}`, texto: novoMotivoTexto.trim() }
    ];
    setMotivos(atualizados);
    salvarNoSupabase(atualizados, metasPilares);
    setNovoMotivoTexto('');
    setNovoMotivoTag('');
    setShowMotivoModal(false);
  };

  const removerMotivo = (id: string) => {
    const atualizados = motivos.filter(m => m.id !== id);
    setMotivos(atualizados);
    salvarNoSupabase(atualizados, metasPilares);
  };

  const adicionarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMetaTitulo.trim()) return;
    const atualizados = [
      ...metasPilares,
      { id: `p-${Date.now()}`, tag: novaMetaTag.trim() || 'Conquista', titulo: novaMetaTitulo.trim(), imagem: novaMetaImagem.trim() || '/polo_vw2025.jpg' }
    ];
    setMetasPilares(atualizados);
    salvarNoSupabase(motivos, atualizados);
    setNovaMetaTitulo('');
    setNovaMetaTag('');
    setNovaMetaImagem('');
    setShowMetaModal(false);
  };

  const removerMeta = (id: string) => {
    const atualizados = metasPilares.filter(m => m.id !== id);
    setMetasPilares(atualizados);
    salvarNoSupabase(motivos, atualizados);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
        <p className="text-sm font-bold text-amber-400 animate-pulse">A carregar o seu painel exclusivo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-8 space-y-8 max-w-5xl mx-auto">
        
        {/* Destaque Superior */}
        <div className="bg-amber-400 border border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-950 text-center space-y-2 relative overflow-hidden">
          <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
            PAINEL EXCLUSIVO • CRYSTIAN JESUS
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug pt-1">
            Você tem disciplina para realizar os sonhos dos outros, lute pelos seus sonhos também!
          </h2>
        </div>

        {/* VÍDEOS DE REFLEXÃO */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="space-y-1">
              <span className="bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Mentalidade de Alta Performance
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                Reflexão Diária e Foco
              </h2>
            </div>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl">
              <span className="text-xs font-bold text-amber-400">Coloque um fone de ouvido e reflita alguns minutos.</span>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            <div className="flex flex-col space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold text-zinc-400">Reflexão 01</span>
              <div className="relative w-full bg-amber-400/10 border border-amber-400/40 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <span className="inline-block bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  "PREPARAÇÃO: Sem estar preparado, não vai conquistar coisa nenhuma"
                </span>
                <p className="text-zinc-100 text-sm sm:text-base font-bold leading-relaxed max-w-xl">
                  <b style={{ color: '#FBBF24' }}>Clovis de Barros:</b> "Na hora 'H', eu resolvo. Não estando preparado, não vai conquistar coisa nenhuma"
                </p>
                <a 
                  href="https://youtu.be/ypGF8Gz-hzY?si=gJ3sYrYJHFbL4qA_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Assistir ao Vídeo
                </a>
              </div>
            </div>

            <div className="flex flex-col space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold text-zinc-400">Reflexão 02</span>
              <div className="relative w-full bg-amber-400/10 border border-amber-400/40 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <span className="inline-block bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  "MEDO: Experiência para vencer o medo de amanhã."
                </span>
                <p className="text-zinc-100 text-sm sm:text-base font-bold leading-relaxed max-w-xl">
                  <b style={{ color: '#FBBF24' }}>Clovis de Barros:</b> "Se voce vencer o medo hoje, vai ter ganhado experiência para vencer o medo de amanhã."
                </p>
                <a 
                  href="https://www.youtube.com/watch?v=88fyhzgogK4&t=200s" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Assistir ao Vídeo
                </a>
              </div>
            </div>

            <div className="flex flex-col space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold text-zinc-400">Reflexão 03</span>
              <div className="relative w-full bg-amber-400/10 border border-amber-400/40 rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center justify-center text-center space-y-4">
                <span className="inline-block bg-amber-400 text-zinc-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                  "TREINO: O seu resultado é fruto do seu treinamento."
                </span>
                <p className="text-zinc-100 text-sm sm:text-base font-bold leading-relaxed max-w-xl">
                  <b style={{ color: '#FBBF24' }}>Treino:</b> Disciplina, coragem e está disposto a fazer o que a maioria não faria, é o que mudará a vida de qualquer um.
                </p>
                <a 
                  href="https://www.youtube.com/watch?v=_aGPrzoQNHw" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-extrabold text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Assistir ao Vídeo
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FALHAS QUE NÃO PODEM SER COMETIDAS */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="space-y-1">
              <span className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" /> Alerta de Execução • Método Felipe Graton
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1 uppercase">
                Falhas que não podem ser cometidas
              </h2>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl">
              <span className="text-xs font-bold text-amber-400">Direcionamento prático para o TJSP</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Falha 1 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  Falha 01
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Estudar todas as matérias por igual</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Dar o mesmo tempo para matérias com pesos diferentes é ineficiente.
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correção:
                </span>
                <p className="text-xs text-zinc-300 mt-1">Use o ciclo de estudos: a matéria que mais pontua aparece mais vezes na semana.</p>
              </div>
            </div>

            {/* Falha 2 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  Falha 02
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Assistir à mesma videoaula várias vezes</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Rever a aula dá apenas a sensação de estar aprendendo, mas não fixa o conteúdo.
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correção:
                </span>
                <p className="text-xs text-zinc-300 mt-1">Assista apenas uma vez e volte estritamente no trecho que não entendeu.</p>
              </div>
            </div>

            {/* Falha 3 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  Falha 03
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Fazer mais resumo do que questão</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Cadernos coloridos geram falsa segurança; na prova, erra-se justamente o resumido.
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correção:
                </span>
                <p className="text-xs text-zinc-300 mt-1">Terminou um tópico? Vá para as questões e crie o seu caderno de erros.</p>
              </div>
            </div>

            {/* Falha 4 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  Falha 04
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Deixar a revisão para depois</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Estudar e seguir em frente faz parecer que você nunca viu o assunto um mês depois.
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correção:
                </span>
                <p className="text-xs text-zinc-300 mt-1">Revisão é diária e inegociável (questões de fixação ou folha em branco).</p>
              </div>
            </div>

            {/* Falha 5 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  Falha 05
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Esperar sobrar tempo para estudar</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Trabalhando 8 horas por dia, o tempo nunca sobra sozinho; é preciso criá-lo.
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correção:
                </span>
                <p className="text-xs text-zinc-300 mt-1">Acorde mais cedo, use o almoço, estude no transporte e compense no fim de semana.</p>
              </div>
            </div>

            {/* Falha 6 */}
            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20">
                  Falha 06
                </span>
                <h4 className="text-sm font-bold text-white mt-2">Deixar o celular do lado do livro</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Uma olhadinha vira meia hora e a noite de sono vira madrugada perdida.
                </p>
              </div>
              <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mt-2">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Correção:
                </span>
                <p className="text-xs text-zinc-300 mt-1">Corte o celular e proteja o seu sono; o rendimento de estudo vai multiplicar.</p>
              </div>
            </div>

          </div>

          {/* Falha 7 em Destaque Total */}
          <div className="p-6 rounded-2xl bg-amber-400 text-zinc-950 space-y-3 shadow-xl">
            <span className="text-[10px] font-black bg-zinc-950 text-amber-400 uppercase tracking-widest px-3 py-1 rounded-full">
              Falha 07 (A mais crítica)
            </span>
            <h4 className="text-base sm:text-lg font-black leading-snug">
              "Deixei os simulados para quando estivesse pronto."
            </h4>
            <p className="text-xs sm:text-sm font-bold leading-relaxed">
              Esse dia nunca chega. Quem só faz simulado no final descobre na hora da prova que não sabe administrar o tempo.
            </p>
            <div className="bg-zinc-950 text-zinc-100 p-4 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Target className="w-4 h-4" /> Ação Imediata:
              </span>
              <p className="text-xs text-zinc-300 mt-1">Marque um simulado completo para o próximo fim de semana, com cronômetro rigoroso, exatamente como o dia da prova.</p>
            </div>
          </div>

        </div>

        {/* MOTIVOS PARA ESTUDAR */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                MOTIVOS PARA ESTUDAR E CONQUISTAR A VAGA
              </h2>
              <p className="text-xs text-zinc-400 font-medium">O combustível diário para manter a disciplina.</p>
            </div>
            <button
              onClick={() => setShowMotivoModal(true)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Adicionar Motivo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {motivos.map((m) => (
              <div key={m.id} className="p-5 rounded-2xl bg-amber-400 border border-zinc-800 relative group space-y-2">
                <div className="flex justify-between items-center">
                  <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                    {m.tag}
                  </span>
                  <button
                    onClick={() => removerMotivo(m.id)}
                    className="text-zinc-950 hover:bg-zinc-950 hover:text-amber-400 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Remover motivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-bold text-zinc-950 leading-snug">{m.texto}</p>
              </div>
            ))}
          </div>

          {/* METAS E PILARES */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Nossas Metas e Pilares • Para quem e pelo que lutamos
              </h3>
              <button
                onClick={() => setShowMetaModal(true)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Meta
              </button>
            </div>

            <div 
              className="relative group rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 aspect-video sm:aspect-[21/9] flex items-end p-6 cursor-pointer shadow-2xl"
              onClick={() => setModalMetaZoom(true)}
            >
              {metasPilares[indiceMeta] && (
                <>
                  <Image 
                    src={metasPilares[indiceMeta].imagem} 
                    alt={metasPilares[indiceMeta].titulo} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-75 group-hover:opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                  
                  <div className="relative z-10 flex justify-between items-end w-full">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-zinc-950/80 px-2.5 py-1 rounded-md border border-zinc-800">
                        {metasPilares[indiceMeta].tag}
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-white mt-1">
                        {metasPilares[indiceMeta].titulo}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); removerMeta(metasPilares[indiceMeta].id); }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow cursor-pointer z-20"
                    >
                      Remover Meta
                    </button>
                  </div>
                </>
              )}

              {metasPilares.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIndiceMeta((prev) => (prev - 1 + metasPilares.length) % metasPilares.length); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-2xl transition-all border border-zinc-700 cursor-pointer"
                  >
                    ❮
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIndiceMeta((prev) => (prev + 1) % metasPilares.length); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-2xl transition-all border border-zinc-700 cursor-pointer"
                  >
                    ❯
                  </button>
                </>
              )}
            </div>
          </div>

          {/* CARROSSEL DAS 12 IMAGENS */}
          <div className="pt-6 border-t border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mensagens e Reflexões Diárias</h3>
                <p className="text-xs text-zinc-400">({imagensCarrossel.length} imagens)</p>
              </div>
              <span className="text-xs font-bold bg-amber-400/10 text-amber-400 px-3 py-1 rounded-full border border-amber-400/30">
                {indiceAtual + 1} / {imagensCarrossel.length}
              </span>
            </div>

            <div 
              className="relative group rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-square sm:aspect-video flex items-center justify-center cursor-pointer shadow-2xl p-4"
              onClick={() => setModalZoomAberto(true)}
            >
              <img src={imagensCarrossel[indiceAtual]} alt={`Card ${indiceAtual + 1}`} className="w-full h-full object-contain" />
              <button onClick={(e) => { e.stopPropagation(); setIndiceAtual((prev) => (prev - 1 + imagensCarrossel.length) % imagensCarrossel.length); }} className="absolute left-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">❮</button>
              <button onClick={(e) => { e.stopPropagation(); setIndiceAtual((prev) => (prev + 1) % imagensCarrossel.length); }} className="absolute right-4 bg-zinc-900/90 hover:bg-amber-400 hover:text-zinc-950 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">❯</button>
            </div>
          </div>
        </div>

        {/* INFORMAÇÕES TJSP */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
            <h1 className="text-4xl font-black text-white">TJSP<span className="text-amber-400">.</span></h1>
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-black font-black text-xs uppercase">Em Estudo</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-2">
              <span className="text-xs font-bold uppercase text-zinc-400">Remuneração Inicial</span>
              <div className="text-3xl font-black text-amber-400">R$ 8.519,54</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-2">
              <span className="text-xs font-bold uppercase text-zinc-400">Escolaridade</span>
              <div className="text-xl font-extrabold text-white">Ensino Médio</div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL ADICIONAR MOTIVO */}
      {showMotivoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={adicionarMotivo} className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-amber-400">Adicionar Novo Motivo</h3>
              <button type="button" onClick={() => setShowMotivoModal(false)} className="text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" value={novoMotivoTag} onChange={(e) => setNovoMotivoTag(e.target.value)} placeholder="Tag (ex: Motivo 05)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
            <textarea value={novoMotivoTexto} onChange={(e) => setNovoMotivoTexto(e.target.value)} placeholder="Texto descritivo do motivo..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white h-24" required />
            <button type="submit" className="w-full py-3 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer">Salvar Motivo</button>
          </form>
        </div>
      )}

      {/* MODAL ADICIONAR META */}
      {showMetaModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form onSubmit={adicionarMeta} className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-amber-400">Adicionar Nova Meta/Pilar</h3>
              <button type="button" onClick={() => setShowMetaModal(false)} className="text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <input type="text" value={novaMetaTag} onChange={(e) => setNovaMetaTag(e.target.value)} placeholder="Tag (ex: Conquista)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
            <input type="text" value={novaMetaTitulo} onChange={(e) => setNovaMetaTitulo(e.target.value)} placeholder="Título da Meta (ex: Casa Própria)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white" required />
            <input type="text" value={novaMetaImagem} onChange={(e) => setNovaMetaImagem(e.target.value)} placeholder="Caminho da imagem (ex: /carrossel/1.png)" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white" />
            <button type="submit" className="w-full py-3 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer">Salvar Meta</button>
          </form>
        </div>
      )}
    </div>
  );
}