'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Navbar from '../components/Navbar';
import { Award, Plus, CheckCircle2, XCircle, Calendar, BarChart2, Target, Code, Copy, Check, Trash2, Sparkles, Pencil } from 'lucide-react';

interface Simulado {
  id: string;
  created_at: string;
  titulo: string;
  acertos: number;
  total_questoes: number;
  nota: number;
}

interface PontoMelhoria {
  id: string;
  materia: string;
  quantidade_erros: number;
  quantidade_acertos: number;
  assunto_estudar: string;
  created_at: string;
}

export default function SimuladosPage() {
  const router = useRouter();
  const [simulados, setSimulados] = useState<Simulado[]>([]);
  const [melhorias, setMelhorias] = useState<PontoMelhoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  
  // Estado para o Simulado Selecionado no Dashboard Analítico
  const [simuladoSelecionadoId, setSimuladoSelecionadoId] = useState<string>('');

  // Modais de Criação e Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEditMelhoriaOpen, setModalEditMelhoriaOpen] = useState(false);
  const [modalEditSimuladoOpen, setModalEditSimuladoOpen] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Estados do formulário de criação do Simulado
  const [titulo, setTitulo] = useState('');
  const [dataSimulado, setDataSimulado] = useState(new Date().toISOString().split('T')[0]);

  // Modo de Adição de Matérias dentro do Modal ('json' ou 'manual')
  const [modoPreenchimento, setModoPreenchimento] = useState<'json' | 'manual'>('json');

  // Estados para Inserção Manual 1 a 1
  const [materiaManual, setMateriaManual] = useState('');
  const [acertosManual, setAcertosManual] = useState('');
  const [errosManual, setErrosManual] = useState('');
  const [assuntoManual, setAssuntoManual] = useState('');
  const [listaManualTemporaria, setListaManualTemporaria] = useState<any[]>([]);

  // Estado para Payload JSON
  const [jsonInput, setJsonInput] = useState('');

  // Estados para Edição de Matéria / Ponto de Melhoria
  const [editMelhoriaId, setEditMelhoriaId] = useState('');
  const [editMateria, setEditMateria] = useState('');
  const [editAcertos, setEditAcertos] = useState(0);
  const [editErros, setEditErros] = useState(0);
  const [editAssunto, setEditAssunto] = useState('');

  // Estados para Edição de Simulado
  const [editSimuladoId, setEditSimuladoId] = useState('');
  const [editSimTitulo, setEditSimTitulo] = useState('');
  const [editSimAcertos, setEditSimAcertos] = useState(0);
  const [editSimTotal, setEditSimTotal] = useState(100);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const [simRes, melRes] = await Promise.all([
        supabase.from('simulados').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('pontos_melhoria').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (simRes.data && simRes.data.length > 0) {
        setSimulados(simRes.data);
        if (!simuladoSelecionadoId) {
          setSimuladoSelecionadoId(simRes.data[0].id);
        }
      }
      if (melRes.data) setMelhorias(melRes.data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  const simuladoAtivo = simulados.find(s => s.id === simuladoSelecionadoId) || simulados[0];

  const totalAcertosAnalitico = simuladoAtivo ? simuladoAtivo.acertos : 0;
  const totalQuestoesAnalitico = simuladoAtivo ? simuladoAtivo.total_questoes : 100;
  const totalErrosAnalitico = Math.max(0, totalQuestoesAnalitico - totalAcertosAnalitico);
  const aproveitamentoTotal = totalQuestoesAnalitico > 0 ? ((totalAcertosAnalitico / totalQuestoesAnalitico) * 100).toFixed(1) : '0';

  // Função para adicionar matéria na lista temporária manual
  function adicionarMateriaManualTemp(e: React.FormEvent) {
    e.preventDefault();
    if (!materiaManual.trim()) return;

    const novaItem = {
      materia: materiaManual,
      quantidade_acertos: Number(acertosManual) || 0,
      quantidade_erros: Number(errosManual) || 0,
      assunto_estudar: assuntoManual || 'Revisão geral'
    };

    setListaManualTemporaria([...listaManualTemporaria, novaItem]);
    setMateriaManual('');
    setAcertosManual('');
    setErrosManual('');
    setAssuntoManual('');
  }

  function removerMateriaManualTemp(index: number) {
    setListaManualTemporaria(listaManualTemporaria.filter((_, i) => i !== index));
  }

  // --- FUNÇÃO DE SALVAR TUDO (SIMULADO + MATÉRIAS) ---
  async function handleSalvarSimuladoCompleto(e: React.FormEvent) {
    e.preventDefault();
    if (aGuardar) return;
    setAGuardar(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAGuardar(false);
        return;
      }

      let itensParaInserir: any[] = [];
      let dataFinalSimulado = dataSimulado ? new Date(dataSimulado).toISOString() : new Date().toISOString();

      if (modoPreenchimento === 'json') {
        if (!jsonInput.trim()) {
          alert('Por favor, insira o JSON gerado pela IA.');
          setAGuardar(false);
          return;
        }
        try {
          let textoLimpo = jsonInput.trim();
          if (textoLimpo.startsWith('```')) {
            textoLimpo = textoLimpo.replace(/^```(json)?/, '').replace(/```$/, '').trim();
          }

          const parsed = JSON.parse(textoLimpo);

          // Extrai a lista de matérias seja de { materias: [...] } ou direto [...]
          let arrayMaterias: any[] = [];
          if (Array.isArray(parsed)) {
            arrayMaterias = parsed;
          } else if (parsed && Array.isArray(parsed.materias)) {
            arrayMaterias = parsed.materias;
            if (parsed.data) {
              dataFinalSimulado = new Date(parsed.data).toISOString();
            }
          } else if (parsed && typeof parsed === 'object') {
            arrayMaterias = [parsed];
          }

          if (arrayMaterias.length === 0) {
            alert('Nenhuma matéria válida foi encontrada no JSON.');
            setAGuardar(false);
            return;
          }

          itensParaInserir = arrayMaterias.map((item) => ({
            user_id: user.id,
            materia: item.materia || item.nome || item.disciplina || '',
            quantidade_erros: Number(item.quantidade_erros) || 0,
            quantidade_acertos: Number(item.quantidade_acertos) || 0,
            assunto_estudar: item.assunto_estudar || item.assunto || item.foco || '',
            created_at: item.data ? new Date(item.data).toISOString() : dataFinalSimulado
          }));
        } catch (err) {
          alert('JSON inválido. Verifique a sintaxe.');
          setAGuardar(false);
          return;
        }
      } else {
        if (listaManualTemporaria.length === 0) {
          alert('Adicione pelo menos uma matéria manualmente.');
          setAGuardar(false);
          return;
        }
        itensParaInserir = listaManualTemporaria.map(item => ({
          user_id: user.id,
          ...item,
          created_at: dataFinalSimulado
        }));
      }

      // Calcula acertos e total gerais com base nas matérias
      const somaAcertos = itensParaInserir.reduce((acc, item) => acc + item.quantidade_acertos, 0);
      const somaErros = itensParaInserir.reduce((acc, item) => acc + item.quantidade_erros, 0);
      const numTotal = somaAcertos + somaErros;
      const notaCalculada = numTotal > 0 ? Number(((somaAcertos / numTotal) * 10).toFixed(2)) : 0;

      // 1. Insere o Simulado principal
      const { data: novoSimuladoInserido, error: erroSimulado } = await supabase.from('simulados').insert([
        {
          user_id: user.id,
          titulo: titulo || 'Simulado VUNESP',
          acertos: somaAcertos,
          total_questoes: numTotal,
          nota: notaCalculada,
          created_at: dataFinalSimulado
        },
      ]).select().single();

      if (erroSimulado) {
        alert(`Erro ao guardar Simulado: ${erroSimulado.message}`);
        setAGuardar(false);
        return;
      }

      // 2. Insere os pontos de melhoria / matérias detalhadas
      if (itensParaInserir.length > 0) {
        const { error: erroMelhoria } = await supabase.from('pontos_melhoria').insert(itensParaInserir);
        if (erroMelhoria) {
          alert(`Erro ao guardar Matérias: ${erroMelhoria.message}`);
          setAGuardar(false);
          return;
        }
      }

      // Limpa formulários e fecha modal
      setTitulo('');
      setJsonInput('');
      setListaManualTemporaria([]);
      setModalOpen(false);
      
      await carregarDados();
      if (novoSimuladoInserido) {
        setSimuladoSelecionadoId(novoSimuladoInserido.id);
      }
    } catch (error) {
      console.error('Erro ao guardar:', error);
      alert('Erro inesperado ao guardar registo.');
    } finally {
      setAGuardar(false);
    }
  }

  function abrirEdicaoMelhoria(m: PontoMelhoria) {
    setEditMelhoriaId(m.id);
    setEditMateria(m.materia);
    setEditAcertos(m.quantidade_acertos);
    setEditErros(m.quantidade_erros);
    setEditAssunto(m.assunto_estudar);
    setModalEditMelhoriaOpen(true);
  }

  async function handleSalvarEdicaoMelhoria(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('pontos_melhoria')
        .update({
          materia: editMateria,
          quantidade_acertos: Number(editAcertos),
          quantidade_erros: Number(editErros),
          assunto_estudar: editAssunto
        })
        .eq('id', editMelhoriaId);

      if (error) { alert(`Erro: ${error.message}`); return; }
      setModalEditMelhoriaOpen(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  }

  function abrirEdicaoSimulado(sim: Simulado) {
    setEditSimuladoId(sim.id);
    setEditSimTitulo(sim.titulo);
    setEditSimAcertos(sim.acertos);
    setEditSimTotal(sim.total_questoes);
    setModalEditSimuladoOpen(true);
  }

  async function handleSalvarEdicaoSimulado(e: React.FormEvent) {
    e.preventDefault();
    try {
      const ac = Number(editSimAcertos);
      const tot = Number(editSimTotal);
      const notaCalculada = tot > 0 ? Number(((ac / tot) * 10).toFixed(2)) : 0;

      const { error } = await supabase
        .from('simulados')
        .update({ titulo: editSimTitulo, acertos: ac, total_questoes: tot, nota: notaCalculada })
        .eq('id', editSimuladoId);

      if (error) { alert(`Erro: ${error.message}`); return; }
      setModalEditSimuladoOpen(false);
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  }

  async function apagarMelhoria(id: string) {
    if (!confirm('Deseja apagar esta matéria?')) return;
    try {
      await supabase.from('pontos_melhoria').delete().eq('id', id);
      setMelhorias(melhorias.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  }

  async function apagarSimulado(id: string) {
    if (!confirm('Deseja apagar este simulado?')) return;
    try {
      await supabase.from('simulados').delete().eq('id', id);
      const restantes = simulados.filter((s) => s.id !== id);
      setSimulados(restantes);
      if (restantes.length > 0) setSimuladoSelecionadoId(restantes[0].id);
      else setSimuladoSelecionadoId('');
    } catch (err) {
      console.error(err);
    }
  }

  // Prompt atualizado que instrui a IA a trazer também a data
  const promptModelo = `Atue como meu mentor especializado no concurso do Tribunal de Justiça de São Paulo (TJSP) sob o padrão da banca VUNESP. 
Analise o meu desempenho no simulado e gere um payload JSON estrito contendo a data e um array de objetos para cada matéria:
{
  "data": "YYYY-MM-DD",
  "materias": [
    {
      "materia": "Nome exato da matéria",
      "quantidade_erros": 0,
      "quantidade_acertos": 0,
      "assunto_estudar": "Assunto específico cobrado pela VUNESP"
    }
  ]
}`;

  const copiarPrompt = () => {
    navigator.clipboard.writeText(promptModelo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const colarDaAreaTransferencia = async () => {
    try {
      const texto = await navigator.clipboard.readText();
      setJsonInput(texto);
    } catch (err) {
      alert('Não foi possível ler a área de transferência. Cole manualmente.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-400" />
              Simulados e Desempenho — VUNESP / TJSP
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Selecione o simulado abaixo para abrir o painel analítico detalhado e as estatísticas por matéria[cite: 10].
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 px-4 py-2.5 rounded-xl text-sm font-extrabold shadow-lg shadow-amber-400/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar Simulado
          </button>
        </div>

        {/* BARRA DE SELEÇÃO DO SIMULADO POR DATA/TÍTULO */}
        {simulados.length > 0 && (
          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 whitespace-nowrap">Simulado Ativo:</span>
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <select
                value={simuladoSelecionadoId}
                onChange={(e) => setSimuladoSelecionadoId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-amber-300 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-amber-400 cursor-pointer"
              >
                {simulados.map((sim) => (
                  <option key={sim.id} value={sim.id}>
                    {sim.titulo} — ({new Date(sim.created_at).toLocaleDateString('pt-BR')}) • Nota: {sim.nota}
                  </option>
                ))}
              </select>
            </div>

            {simuladoAtivo && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => abrirEdicaoSimulado(simuladoAtivo)}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => apagarSimulado(simuladoAtivo.id)}
                  className="px-3 py-2 bg-zinc-950 hover:bg-rose-950 text-rose-400 border border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
              </div>
            )}
          </div>
        )}

        {/* PAINEL ANALÍTICO COMPLETO */}
        {simuladoAtivo ? (
          <div className="space-y-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="border-b border-zinc-800 pb-4 flex justify-between items-center">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                  Relatório de Desempenho Analítico
                </span>
                <h2 className="text-xl font-black text-white mt-2">{simuladoAtivo.titulo}</h2>
              </div>
              <span className="text-xs text-zinc-400 font-mono">
                Realizado em {new Date(simuladoAtivo.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-950 p-6 rounded-2xl border border-zinc-800">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Acertos</span>
                <div className="text-3xl font-black text-emerald-400 font-mono">
                  {totalAcertosAnalitico} <span className="text-xs text-zinc-400 font-sans font-normal">de {totalQuestoesAnalitico} questões</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Erros</span>
                <div className="text-3xl font-black text-rose-500 font-mono">
                  {totalErrosAnalitico} <span className="text-xs text-zinc-400 font-sans font-normal">questões incorretas</span>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-zinc-900">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Aproveitamento Total</span>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  {aproveitamentoTotal}% <span className="text-xs text-zinc-400 font-sans font-normal">({totalAcertosAnalitico} de {totalQuestoesAnalitico} questões)</span>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-zinc-900">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wide">Nota do Simulado (0 a 10)</span>
                <div className="text-3xl font-black text-white font-mono">
                  {simuladoAtivo.nota} <span className="text-xs text-zinc-400 font-sans font-normal">pontos</span>
                </div>
              </div>
            </div>

            {/* Desempenho por Matéria */}
            <div className="space-y-4 pt-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-amber-400" />
                Desempenho por Matéria do Edital TJSP[cite: 10]
              </h3>

              {melhorias.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-4">Nenhum detalhe por matéria cadastrado para este simulado.</p>
              ) : (
                <div className="space-y-3">
                  {melhorias.map((m) => {
                    const acertosMat = m.quantidade_acertos || 0;
                    const errosMat = m.quantidade_erros || 0;
                    const totalMat = acertosMat + errosMat;
                    const percMat = totalMat > 0 ? Math.round((acertosMat / totalMat) * 100) : 0;
                    const corBarra = percMat >= 70 ? 'bg-emerald-500' : percMat >= 50 ? 'bg-amber-400' : 'bg-rose-600';

                    return (
                      <div key={m.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{m.materia}</span>
                          <span className="font-mono font-bold text-zinc-300">{acertosMat}/{totalMat} ({percMat}%)</span>
                        </div>
                        
                        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                          <div className={`h-full ${corBarra} transition-all duration-500`} style={{ width: `${percMat}%` }}></div>
                        </div>

                        <div className="flex justify-between items-center text-[11px] text-zinc-400 pt-1">
                          <span>Foco: <b className="text-zinc-200">{m.assunto_estudar}</b></span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => abrirEdicaoMelhoria(m)} className="text-amber-400 hover:underline cursor-pointer">Editar</button>
                            <button onClick={() => apagarMelhoria(m.id)} className="text-rose-400 hover:underline cursor-pointer">Excluir</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <BarChart2 className="w-12 h-12 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-semibold text-zinc-300">Nenhum simulado registado ainda</h3>
          </div>
        )}

        {/* MODAL DE ADICIONAR NOVO SIMULADO */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8 relative">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  Registar Simulado e Desempenho
                </h3>
                <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarSimuladoCompleto} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Título do Simulado</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Simulado 01 - TJSP"
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Data do Simulado</label>
                    <input
                      type="date"
                      required
                      value={dataSimulado}
                      onChange={(e) => setDataSimulado(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-800 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">Modo de Preenchimento das Matérias:</span>
                  
                  {/* Abas de Escolha entre JSON e Manual */}
                  <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setModoPreenchimento('json')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modoPreenchimento === 'json' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <Code className="w-4 h-4" /> Payload JSON (IA)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoPreenchimento('manual')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modoPreenchimento === 'manual' ? 'bg-amber-400 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'}`}
                    >
                      <Plus className="w-4 h-4" /> Inserção Manual (1 a 1)
                    </button>
                  </div>

                  {/* SE MODO JSON */}
                  {modoPreenchimento === 'json' && (
                    <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                      <div className="flex justify-between items-center">
                        <button
                          type="button"
                          onClick={copiarPrompt}
                          className="text-[11px] bg-zinc-900 border border-zinc-700 hover:border-amber-400 text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer font-bold"
                        >
                          {copiado ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                          {copiado ? 'Prompt Copiado!' : 'Copiar Prompt para IA (Com Data)'}
                        </button>
                        <button 
                          type="button" 
                          onClick={colarDaAreaTransferencia}
                          className="text-[11px] text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Colar JSON
                        </button>
                      </div>

                      <textarea
                        rows={7}
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='{"data": "2026-10-18", "materias": [{"materia": "Informática", "quantidade_erros": 1, "quantidade_acertos": 8, "assunto_estudar": "..."}]}'
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {/* SE MODO MANUAL */}
                  {modoPreenchimento === 'manual' && (
                    <div className="space-y-3 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Matéria</label>
                          <input
                            type="text"
                            value={materiaManual}
                            onChange={(e) => setMateriaManual(e.target.value)}
                            placeholder="Ex: Direito Constitucional"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Acertos</label>
                            <input
                              type="number"
                              value={acertosManual}
                              onChange={(e) => setAcertosManual(e.target.value)}
                              placeholder="0"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Erros</label>
                            <input
                              type="number"
                              value={errosManual}
                              onChange={(e) => setErrosManual(e.target.value)}
                              placeholder="0"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Assunto a ser estudado / focado</label>
                        <input
                          type="text"
                          value={assuntoManual}
                          onChange={(e) => setAssuntoManual(e.target.value)}
                          placeholder="Ex: Artigo 5º da CF/88"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={adicionarMateriaManualTemp}
                        className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        + Adicionar Matéria à Lista
                      </button>

                      {/* Lista temporária adicionada manualmente */}
                      {listaManualTemporaria.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-zinc-800">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">Matérias adicionadas ({listaManualTemporaria.length}):</span>
                          <div className="max-h-32 overflow-y-auto space-y-1.5">
                            {listaManualTemporaria.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-zinc-900 p-2 rounded-lg text-xs">
                                <span><b>{item.materia}</b> — ✓{item.quantidade_acertos} ✕{item.quantidade_erros}</span>
                                <button type="button" onClick={() => removerMateriaManualTemp(idx)} className="text-rose-400 hover:underline text-[11px]">Remover</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={aGuardar}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={aGuardar}
                    className="px-5 py-2 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-500 text-zinc-950 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {aGuardar ? 'A guardar...' : 'Guardar Registo Completo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edição de Matéria */}
        {modalEditMelhoriaOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" /> Editar Matéria
                </h3>
                <button onClick={() => setModalEditMelhoriaOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarEdicaoMelhoria} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Matéria</label>
                  <input
                    type="text"
                    required
                    value={editMateria}
                    onChange={(e) => setEditMateria(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Acertos</label>
                    <input
                      type="number"
                      required
                      value={editAcertos}
                      onChange={(e) => setEditAcertos(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Erros</label>
                    <input
                      type="number"
                      required
                      value={editErros}
                      onChange={(e) => setEditErros(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Assunto a ser estudado</label>
                  <textarea
                    rows={3}
                    required
                    value={editAssunto}
                    onChange={(e) => setEditAssunto(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalEditMelhoriaOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-zinc-950">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Edição de Simulado */}
        {modalEditSimuladoOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" /> Editar Simulado
                </h3>
                <button onClick={() => setModalEditSimuladoOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarEdicaoSimulado} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Título do Simulado</label>
                  <input
                    type="text"
                    required
                    value={editSimTitulo}
                    onChange={(e) => setEditSimTitulo(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Acertos</label>
                    <input
                      type="number"
                      required
                      value={editSimAcertos}
                      onChange={(e) => setEditSimAcertos(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Total de Questões</label>
                    <input
                      type="number"
                      required
                      value={editSimTotal}
                      onChange={(e) => setEditSimTotal(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalEditSimuladoOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-zinc-950">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}