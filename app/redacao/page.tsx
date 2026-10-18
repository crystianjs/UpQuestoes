'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { Play, Square, CheckCircle, AlertCircle, Clock, FileText, PlusCircle, Timer, Trash2, X, Layers, AlertTriangle, Copy, Sparkles } from 'lucide-react';

interface RedacaoRegistro {
  id: string;
  tema: string;
  tempo_gasto_segundos: number;
  nota?: number | null;
  created_at: string;
}

interface TreinoPratico {
  data: string;
  etapa: 'introducao' | 'desenvolvimento1' | 'desenvolvimento2' | 'conclusao';
  tema: string;
  nota_obtida: number;
  importante_revisar: boolean;
  pontos_atencao: string[];
}

interface ModeloParametricoItem {
  id: string;
  etapa: 'introducao' | 'desenvolvimento1' | 'desenvolvimento2' | 'conclusao';
  titulo: string;
  descricao: string;
  estrutura_parametrica: {
    conectores_fixos: Record<string, string>;
    variaveis: Record<string, string>;
  };
  modelo_texto: string;
  exemplos_praticos?: {
    tema_aplicado: string;
    texto: string;
  }[];
}

export default function RedacaoPage() {
  const router = useRouter();
  const [modoRegistro, setModoRegistro] = useState<'cronometro' | 'manual'>('cronometro');

  // Estados do Cronômetro
  const [tema, setTema] = useState('');
  const [cronometroAtivo, setCronometroAtivo] = useState(false);
  const [tempoSegundos, setTempoSegundos] = useState(0);

  // Estados do Registro Manual
  const [temaManual, setTemaManual] = useState('');
  const [tempoMinutosManual, setTempoMinutosManual] = useState('');
  const [notaManual, setNotaManual] = useState('');

  // Listagens
  const [redacoesList, setRedacoesList] = useState<RedacaoRegistro[]>([]);
  const [modelosList, setModelosList] = useState<ModeloParametricoItem[]>([]);
  const [treinosPraticosList, setTreinosPraticosList] = useState<TreinoPratico[]>([]);

  // Seleções e Modais
  const [etapaSelecionada, setEtapaSelecionada] = useState<'introducao' | 'desenvolvimento1' | 'desenvolvimento2' | 'conclusao'>('introducao');
  const [etapaModalAlvo, setEtapaModalAlvo] = useState<'introducao' | 'desenvolvimento1' | 'desenvolvimento2' | 'conclusao'>('introducao');
  
  // Modais de JSON / Prompts
  const [modalPromptAtivo, setModalPromptAtivo] = useState<'novo_modelo' | 'novo_exemplo' | 'novo_treino_json' | null>(null);
  const [jsonInput, setJsonInput] = useState('');
  const [copiado, setCopiado] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const carregarDados = async (uid: string) => {
    // Redações
    const { data: dataRed } = await supabase.from('redaccoes').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (dataRed) setRedacoesList(dataRed);

    // Modelos
    const { data: dataMod } = await supabase.from('modelos_redacao').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (dataMod && dataMod.length > 0) {
      setModelosList(dataMod);
    } else {
      // Modelos Padrão Iniciais
      setModelosList([
        {
          id: 'default-intro-1',
          etapa: 'introducao',
          titulo: 'Constituição Federal de 1988 (Garantias Fundamentais)',
          descricao: 'Modelo paramétrico coringa para temas de direitos sociais, omissão estatal e problemas contemporâneos da VUNESP.',
          estrutura_parametrica: {
            conectores_fixos: {
              abertura: 'Conforme',
              contraste: 'No entanto, quando se observa',
              alerta_agente: 'liga-se um sinal de alerta quanto à',
              fechamento_tese: 'Dessa forma, tal cenário evidencia'
            },
            variaveis: {
              tema_exato: '[TEMA EXATO DA BANCA]',
              argumento_1: '[ARGUMENTO 1 / CAUSA 1]',
              argumento_2: '[ARGUMENTO 2 / CAUSA 2]',
              agente_falha: '[AGENTE RESPONSÁVEL: ex: inoperância do Estado]',
              repertorio_garantia: '[DIREITO/VALOR GARANTIDO]'
            }
          },
          modelo_texto: 'Conforme [REPERTÓRIO], [DIREITO/VALOR] são garantias fundamentais de todos os cidadãos. No entanto, quando se observa [TEMA EXATO], liga-se um sinal de alerta quanto à [AGENTE RESPONSÁVEL]. Dessa forma, tal cenário evidencia [ARGUMENTO 1] e [ARGUMENTO 2].',
          exemplos_praticos: [
            {
              tema_aplicado: 'Vivemos hoje uma epidemia da solidão?',
              texto: 'Conforme a Constituição Federal de 1988, o bem-estar e a convivência comunitária são garantias fundamentais de todos os cidadãos. No entanto, quando se observa a crescente epidemia de solidão na sociedade contemporânea, liga-se um sinal de alerta quanto à inoperância do Estado em cumprir sua obrigação. Dessa forma, tal cenário evidencia o isolamento provocado pelas redes sociais e a inexistência de projetos públicos integrativos.'
            }
          ]
        }
      ]);
    }

    // Treinos Práticos
    const { data: dataTreinos } = await supabase.from('treinos_praticos_redacao').select('*').eq('user_id', uid).order('created_at', { ascending: false });
    if (dataTreinos) setTreinosPraticosList(dataTreinos);
  };

  useEffect(() => {
    async function verificarSessao() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      } else {
        const uid = session.user.id;
        setUserId(uid);
        carregarDados(uid);
      }
    }
    verificarSessao();
  }, [router]);

  // Gestão Cronômetro
  useEffect(() => {
    if (cronometroAtivo) {
      timerRef.current = setInterval(() => setTempoSegundos((prev) => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [cronometroAtivo]);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}m ${secs}s`;
  };

  const iniciarTreino = () => {
    if (!tema.trim()) { setErro('Insira o tema antes de iniciar.'); return; }
    setErro(''); setCronometroAtivo(true);
  };

  const pararEGuardarTreino = async () => {
    if (!userId) return;
    setCronometroAtivo(false);
    if (tempoSegundos === 0) return;
    setSalvando(true);
    try {
      await supabase.from('redaccoes').insert([{ tema, texto: 'Treino cronometrado', tempo_gasto_segundos: tempoSegundos, user_id: userId }]);
      setSucesso(true); setTema(''); setTempoSegundos(0); carregarDados(userId);
    } catch { setErro('Erro ao salvar.'); } finally { setSalvando(false); }
  };

  const guardarManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !temaManual.trim()) return;
    setSalvando(true);
    try {
      const mins = parseInt(tempoMinutosManual) || 30;
      await supabase.from('redaccoes').insert([{ tema: temaManual, tempo_gasto_segundos: mins * 60, nota: parseFloat(notaManual) || null, user_id: userId }]);
      setSucesso(true); setTemaManual(''); setTempoMinutosManual(''); setNotaManual(''); carregarDados(userId);
    } catch { setErro('Erro ao guardar.'); } finally { setSalvando(false); }
  };

  // Abrir Modal configurando a etapa-alvo
  const abrirModalPrompt = (tipo: 'novo_modelo' | 'novo_exemplo' | 'novo_treino_json') => {
    setEtapaModalAlvo(etapaSelecionada);
    setModalPromptAtivo(tipo);
  };

  // Processar Inserções via JSON Modal
  const processarSubmissaoJson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    try {
      const parsed = JSON.parse(jsonInput);

      if (modalPromptAtivo === 'novo_modelo') {
        const novoModelo = {
          user_id: userId,
          etapa: parsed.etapa || etapaModalAlvo,
          titulo: parsed.titulo || `Modelo Paramétrico - ${parsed.etapa || etapaModalAlvo}`,
          descricao: parsed.descricao || '',
          estrutura_parametrica: parsed.estrutura_parametrica,
          modelo_texto: parsed.modelo_texto,
          exemplos_praticos: parsed.exemplos_praticos || []
        };
        await supabase.from('modelos_redacao').insert([novoModelo]);
        setModelosList(prev => [novoModelo as any, ...prev]);
        setEtapaSelecionada(parsed.etapa || etapaModalAlvo);
        alert('Nova estrutura paramétrica adicionada com sucesso!');

      } else if (modalPromptAtivo === 'novo_exemplo') {
        const modeloAlvo = modelosList.find(m => m.etapa === (parsed.etapa || etapaModalAlvo));
        if (modeloAlvo) {
          const exemplosAtualizados = [...(modeloAlvo.exemplos_praticos || []), parsed.exemplo_pratico];
          await supabase.from('modelos_redacao').update({ exemplos_praticos: exemplosAtualizados }).eq('id', modeloAlvo.id);
          setModelosList(prev => prev.map(m => m.id === modeloAlvo.id ? { ...m, exemplos_praticos: exemplosAtualizados } : m));
          alert('Novo exemplo prático anexado!');
        } else {
          alert('Nenhum modelo cadastrado encontrado para esta etapa. Crie a estrutura primeiro!');
        }

      } else if (modalPromptAtivo === 'novo_treino_json') {
        const novoTreino: TreinoPratico = {
          data: parsed.data || new Date().toISOString().split('T')[0],
          etapa: parsed.etapa || etapaModalAlvo,
          tema: parsed.tema,
          nota_obtida: parsed.nota_obtida ?? 10,
          importante_revisar: parsed.importante_revisar ?? false,
          pontos_atencao: parsed.pontos_atencao || []
        };
        await supabase.from('treinos_praticos_redacao').insert([{ user_id: userId, ...novoTreino }]);
        setTreinosPraticosList(prev => [novoTreino, ...prev]);
        setEtapaSelecionada(parsed.etapa || etapaModalAlvo);
        alert('Prática registrada com sucesso!');
      }

      setModalPromptAtivo(null);
      setJsonInput('');
    } catch (err) {
      alert('Sintaxe JSON inválida. Verifique o código e tente novamente.');
    }
  };

  // Geradores de Prompt
  const PROMPT_NOVA_ESTRUTURA = `Atue como Especialista VUNESP/TJSP. Gere uma NOVA ESTRUTURA PARAMÉTRICA para a etapa "${etapaModalAlvo.toUpperCase()}".

Retorne EXCLUSIVAMENTE este JSON:
{
  "etapa": "${etapaModalAlvo}",
  "titulo": "Título da Estrutura",
  "descricao": "Descrição estratégica do modelo",
  "estrutura_parametrica": {
    "conectores_fixos": {
      "abertura": "Conector...",
      "contraste": "Conector..."
    },
    "variaveis": {
      "tema_exato": "[TEMA EXATO DA BANCA]",
      "argumento_1": "[ARGUMENTO 1]"
    }
  },
  "modelo_texto": "Texto coringa montado..."
}`;

  const PROMPT_NOVO_EXEMPLO = `Atue como Mentor VUNESP. Gere um NOVO EXEMPLO PRÁTICO APLICADO para a etapa "${etapaModalAlvo.toUpperCase()}".

Retorne EXCLUSIVAMENTE este JSON:
{
  "etapa": "${etapaModalAlvo}",
  "exemplo_pratico": {
    "tema_aplicado": "Tema Real VUNESP",
    "texto": "Parágrafo completo redigido mantendo os conectores do esqueleto."
  }
}`;

  const PROMPT_PRATICANDO_REDACAO = `Atue como Mentor de Redação. Gere o JSON de REGISTRO DE PRÁTICA para a etapa "${etapaModalAlvo.toUpperCase()}".

Retorne EXCLUSIVAMENTE este JSON:
{
  "data": "2026-10-17",
  "etapa": "${etapaModalAlvo}",
  "tema": "Tema da redação treinada",
  "nota_obtida": 9.5,
  "importante_revisar": false,
  "pontos_atencao": [
    "Atenção à pontuação antes do conectivo",
    "Manter clareza na tese"
  ]
}`;

  const modeloAtual = modelosList.find(m => m.etapa === etapaSelecionada);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* 1. BARRA PRINCIPAL DE NAVEGAÇÃO DE ETAPAS */}
        <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400 pl-2">
            Selecione a Etapa da Redação:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {(['introducao', 'desenvolvimento1', 'desenvolvimento2', 'conclusao'] as const).map((etapa) => (
              <button
                key={etapa}
                onClick={() => setEtapaSelecionada(etapa)}
                className={`py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  etapaSelecionada === etapa ? 'bg-amber-400 text-zinc-950 shadow-md ring-2 ring-amber-400/50' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                }`}
              >
                {etapa === 'introducao' ? 'Introdução' : etapa === 'desenvolvimento1' ? 'Desenvolvimento 1' : etapa === 'desenvolvimento2' ? 'Desenvolvimento 2' : 'Conclusão'}
              </button>
            ))}
          </div>
        </div>

        {/* 2. CARD ÚNICO DO MODELO PARAMÉTRICO DA ETAPA SELECIONADA */}
        {modeloAtual ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  MODELO PARAMÉTRICO • {etapaSelecionada.toUpperCase()}
                </span>
                <h2 className="text-2xl font-black text-white mt-2">{modeloAtual.titulo}</h2>
                <p className="text-xs text-zinc-400 mt-1">{modeloAtual.descricao}</p>
              </div>

              {/* Botões para Subir Nova Estrutura ou Exemplo */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => abrirModalPrompt('novo_modelo')}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Nova Estrutura
                </button>
                <button
                  onClick={() => abrirModalPrompt('novo_exemplo')}
                  className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-amber-400 border border-amber-400/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Novo Exemplo Prático
                </button>
              </div>
            </div>

            {/* ESTRUTURA PARAMÉTRICA (FIXOS VS VARIÁVEIS) */}
            <div className="space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> ESTRUTURA PARAMÉTRICA (FIXOS VS VARIÁVEIS)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Conectores Fixos */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-amber-500/30 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    CONECTORES FIXOS (MEMORIZAÇÃO)
                  </span>
                  <ul className="space-y-2 pt-2 text-xs font-mono">
                    {modeloAtual.estrutura_parametrica?.conectores_fixos &&
                      Object.entries(modeloAtual.estrutura_parametrica.conectores_fixos).map(([k, v], idx) => (
                        <li key={idx} className="flex justify-between items-center gap-2 border-b border-zinc-800/60 pb-1.5">
                          <span className="text-amber-300 font-semibold">{k}:</span>
                          <span className="text-zinc-100 font-bold bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">{String(v)}</span>
                        </li>
                      ))}
                  </ul>
                </div>

                {/* Variáveis */}
                <div className="p-4 bg-zinc-900/60 rounded-2xl border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                    VARIÁVEIS (PREENCHIMENTO POR TEMA)
                  </span>
                  <ul className="space-y-2 pt-2 text-xs font-mono">
                    {modeloAtual.estrutura_parametrica?.variaveis &&
                      Object.entries(modeloAtual.estrutura_parametrica.variaveis).map(([k, v], idx) => (
                        <li key={idx} className="flex justify-between items-center gap-2 border-b border-zinc-800/60 pb-1.5">
                          <span className="text-amber-300 font-semibold">{k}:</span>
                          <span className="text-zinc-300 italic truncate max-w-[200px]">{String(v)}</span>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* MODELO DE TEXTO COMPILADO */}
            <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800 space-y-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">MODELO DE TEXTO COMPILADO</span>
              <p className="text-xs sm:text-sm text-zinc-100 leading-relaxed font-mono bg-zinc-950 p-4 rounded-xl border border-zinc-800">
                {modeloAtual.modelo_texto}
              </p>
            </div>

            {/* EXEMPLOS PRÁTICOS CADASTRADOS */}
            {modeloAtual.exemplos_praticos && modeloAtual.exemplos_praticos.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">EXEMPLOS PRÁTICOS APLICADOS ({modeloAtual.exemplos_praticos.length})</span>
                {modeloAtual.exemplos_praticos.map((ex, idx) => (
                  <div key={idx} className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 space-y-1.5">
                    <span className="text-xs font-bold text-amber-300">Tema: {ex.tema_aplicado}</span>
                    <p className="text-xs text-zinc-200 italic leading-relaxed">"{ex.texto}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-10 text-center space-y-3">
            <p className="text-zinc-400 text-xs">Nenhuma estrutura modelo cadastrada para <b>{etapaSelecionada.toUpperCase()}</b>.</p>
            <button
              onClick={() => abrirModalPrompt('novo_modelo')}
              className="px-4 py-2 bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow cursor-pointer"
            >
              + Criar Modelo Paramétrico para {etapaSelecionada}
            </button>
          </div>
        )}

        {/* 3. MÓDULO "PRATICANDO REDAÇÃO" (SESSÃO PRÁTICA E ENVIO VIA JSON) */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-4">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                Prática de Redação
              </span>
              <h3 className="text-xl font-black text-white mt-2">Praticando Redação ({etapaSelecionada.toUpperCase()})</h3>
              <p className="text-xs text-zinc-400 mt-1">Registros das suas sessões práticas de {etapaSelecionada}.</p>
            </div>

            <button
              onClick={() => abrirModalPrompt('novo_treino_json')}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
            >
              <PlusCircle className="w-4 h-4" /> Registrar Prática via JSON
            </button>
          </div>

          {/* LISTAGEM DE TREINOS REGISTRADOS */}
          <div className="space-y-3">
            {treinosPraticosList.filter(t => t.etapa === etapaSelecionada).length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">Nenhuma prática registrada para {etapaSelecionada}.</p>
            ) : (
              treinosPraticosList.filter(t => t.etapa === etapaSelecionada).map((treino, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border transition-all space-y-2 ${
                  treino.importante_revisar ? 'bg-amber-950/20 border-amber-400/60' : 'bg-zinc-900/60 border-zinc-800'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {treino.importante_revisar && (
                        <span className="bg-amber-400 text-zinc-950 font-extrabold text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> REVISAR
                        </span>
                      )}
                      <span className="font-bold text-white text-xs">Tema: {treino.tema}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-mono">{treino.data}</span>
                      <span className="px-2.5 py-1 rounded font-bold text-xs bg-amber-950 border border-amber-500/50 text-amber-300">
                        Nota: {Number(treino.nota_obtida).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {treino.pontos_atencao && treino.pontos_atencao.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80">
                      <span className="text-[10px] font-bold uppercase text-amber-400">Pontos de Atenção:</span>
                      <ul className="list-disc list-inside text-xs text-zinc-300 space-y-0.5 pt-0.5">
                        {treino.pontos_atencao.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. CRONÔMETRO AO VIVO & REGISTRO MANUAL */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-1.5 border border-zinc-800 rounded-2xl">
          <button onClick={() => setModoRegistro('cronometro')} className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoRegistro === 'cronometro' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
            <Timer className="w-4 h-4 inline mr-1" /> Cronômetro ao Vivo
          </button>
          <button onClick={() => setModoRegistro('manual')} className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${modoRegistro === 'manual' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
            <PlusCircle className="w-4 h-4 inline mr-1" /> Registro Manual
          </button>
        </div>

        {modoRegistro === 'cronometro' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center space-y-6">
            <input type="text" disabled={cronometroAtivo} value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema da redação..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-amber-400" />
            <div className="py-6 bg-zinc-900/50 rounded-2xl flex flex-col items-center">
              <Clock className={`w-8 h-8 ${cronometroAtivo ? 'text-amber-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="text-3xl font-black text-white font-mono mt-1">{formatarTempo(tempoSegundos)}</span>
            </div>
            {!cronometroAtivo ? (
              <button onClick={iniciarTreino} className="bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black py-3 px-6 rounded-xl cursor-pointer text-xs shadow-md"><Play className="w-4 h-4 inline mr-1" /> Iniciar Treino</button>
            ) : (
              <button onClick={pararEGuardarTreino} className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black py-3 px-6 rounded-xl cursor-pointer text-xs animate-pulse shadow-md"><Square className="w-4 h-4 inline mr-1" /> Parar e Guardar</button>
            )}
          </div>
        )}

        {modoRegistro === 'manual' && (
          <form onSubmit={guardarManual} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <input type="text" value={temaManual} onChange={(e) => setTemaManual(e.target.value)} placeholder="Tema..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" required />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" value={tempoMinutosManual} onChange={(e) => setTempoMinutosManual(e.target.value)} placeholder="Tempo em minutos" className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" required />
              <input type="number" step="0.1" value={notaManual} onChange={(e) => setNotaManual(e.target.value)} placeholder="Nota (0 a 10)" className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-400" />
            </div>
            <button type="submit" className="w-full bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black py-3 rounded-xl cursor-pointer text-xs shadow-md">Guardar Manual</button>
          </form>
        )}

      </main>

      {/* MODAL DE PROMPT MESTRE E SUBMISSÃO DE JSON */}
      {modalPromptAtivo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <button onClick={() => setModalPromptAtivo(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>

            <h3 className="text-base font-bold text-amber-400 uppercase">
              {modalPromptAtivo === 'novo_modelo' ? `Nova Estrutura Paramétrica` : modalPromptAtivo === 'novo_exemplo' ? `Novo Exemplo Prático` : `Registrar Prática via JSON`}
            </h3>

            {/* SELETOR EXPLÍCITO DE ETAPA DENTRO DO MODAL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Etapa Alvo:</label>
              <select
                value={etapaModalAlvo}
                onChange={(e) => setEtapaModalAlvo(e.target.value as any)}
                className="w-full bg-zinc-900 border border-zinc-800 text-amber-300 text-xs rounded-xl px-3 py-2.5 font-bold outline-none cursor-pointer"
              >
                <option value="introducao">Introdução</option>
                <option value="desenvolvimento1">Desenvolvimento 1</option>
                <option value="desenvolvimento2">Desenvolvimento 2</option>
                <option value="conclusao">Conclusão</option>
              </select>
            </div>

            {/* Prompt Generator */}
            <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-300">Prompt Mestre para copiar:</span>
                <button
                  onClick={() => {
                    const txt = modalPromptAtivo === 'novo_modelo' ? PROMPT_NOVA_ESTRUTURA : modalPromptAtivo === 'novo_exemplo' ? PROMPT_NOVO_EXEMPLO : PROMPT_PRATICANDO_REDACAO;
                    navigator.clipboard.writeText(txt);
                    setCopiado(true);
                    setTimeout(() => setCopiado(false), 3000);
                  }}
                  className="px-3 py-1 bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {copiado ? 'Copiado!' : 'Copiar Prompt'}
                </button>
              </div>
              <pre className="text-[11px] bg-black/60 p-2.5 rounded-xl text-amber-300 font-mono overflow-x-auto max-h-28">
                {modalPromptAtivo === 'novo_modelo' ? PROMPT_NOVA_ESTRUTURA : modalPromptAtivo === 'novo_exemplo' ? PROMPT_NOVO_EXEMPLO : PROMPT_PRATICANDO_REDACAO}
              </pre>
            </div>

            {/* Input Form */}
            <form onSubmit={processarSubmissaoJson} className="space-y-3">
              <label className="text-xs font-bold text-zinc-300">Cole o JSON retornado aqui:</label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-36 bg-zinc-900 text-amber-300 p-3 rounded-xl border border-zinc-800 font-mono text-xs outline-none focus:border-amber-400 resize-none"
                placeholder='{ ... }'
                required
              />
              <div className="flex justify-end gap-2">
                <button type="submit" className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer">
                  Incorporar JSON
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}