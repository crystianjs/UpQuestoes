'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { supabase } from '@/lib/supabase';
import { BookOpen, CheckCircle, AlertCircle, AlertTriangle, Copy, Check, Trash2, Pencil, Sparkles, Filter, Eye, EyeOff, MessageSquare, Image as ImageIcon, Upload } from 'lucide-react';

const MATERIAS_TJSP = [
  'Língua Portuguesa',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Processual Civil',
  'Direito Constitucional',
  'Direito Administrativo',
  'Normas da Corregedoria',
  'Matemática',
  'Raciocínio Lógico',
  'Informática',
  'Atualidades',
  'Estatuto da Pessoa com Deficiência'
];

interface QuestaoConcurso {
  id: string;
  materia: string;
  assunto: string;
  enunciado: string;
  resolucao: string;
  observacao?: string;
  imagem_url?: string;
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  created_at: string;
}

export default function QuestoesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [questoesList, setQuestoesList] = useState<QuestaoConcurso[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Registo Numérico Original (Desempenho)
  const [materiaRegisto, setMateriaRegisto] = useState(MATERIAS_TJSP[0]);
  const [assuntoRegisto, setAssuntoRegisto] = useState('');
  const [totalFeitas, setTotalFeitas] = useState<number | ''>(1);
  const [acertos, setAcertos] = useState<number | ''>(1);
  const [erros, setErros] = useState<number | ''>(0);
  const [motivoErro, setMotivoErro] = useState('');
  const [salvandoRegisto, setSalvandoRegisto] = useState(false);
  const [sucessoRegisto, setSucessoRegisto] = useState(false);
  const [erroRegisto, setErroRegisto] = useState('');

  // Estados do Banco de Questões (Manual / JSON)
  const [materiaBanco, setMateriaBanco] = useState(MATERIAS_TJSP[0]);
  const [assuntoBanco, setAssuntoBanco] = useState('');
  const [enunciadoBanco, setEnunciadoBanco] = useState('');
  const [resolucaoBanco, setResolucaoBanco] = useState('');
  const [observacaoBanco, setObservacaoBanco] = useState('');
  const [imagemBanco, setImagemBanco] = useState<string | null>(null);
  const [prioridadeBanco, setPrioridadeBanco] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');

  const [modoPreenchimento, setModoPreenchimento] = useState<'manual' | 'json'>('json');
  const [jsonInput, setJsonInput] = useState('');
  const [copiadoPrompt, setCopiadoPrompt] = useState(false);
  const [salvandoBanco, setSalvandoBanco] = useState(false);
  const [sucessoBanco, setSucessoBanco] = useState(false);

  // Estados de Controle de Visibilidade
  const [resolucoesVisiveis, setResolucoesVisiveis] = useState<{ [key: string]: boolean }>({});
  const [observacoesVisiveis, setObservacoesVisiveis] = useState<{ [key: string]: boolean }>({});

  // Estados de Filtro
  const [filtroMateria, setFiltroMateria] = useState('todos');
  const [filtroAssunto, setFiltroAssunto] = useState('todos');

  // Estados de Edição do Banco
  const [editId, setEditId] = useState<string | null>(null);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editMateria, setEditMateria] = useState('');
  const [editAssunto, setEditAssunto] = useState('');
  const [editEnunciado, setEditEnunciado] = useState('');
  const [editResolucao, setEditResolucao] = useState('');
  const [editObservacao, setEditObservacao] = useState('');
  const [editImagemUrl, setEditImagemUrl] = useState<string | null>(null);
  const [editPrioridade, setEditPrioridade] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      const uid = session.user.id;
      setUserId(uid);
      carregarQuestoes(uid);
    }
    init();
  }, [router]);

  async function carregarQuestoes(uid: string) {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questoes_concurso')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setQuestoesList(data);
    } catch (err) {
      console.error('Erro ao carregar questões:', err);
    } finally {
      setLoading(false);
    }
  }

  async function uploadImagemParaSupabase(file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('questoes-imagens')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('questoes-imagens')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: any) {
      alert(`Erro ao carregar imagem: ${err.message || 'Erro desconhecido'}`);
      return null;
    }
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>, setImgFunc: (url: string) => void) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const url = await uploadImagemParaSupabase(file);
          if (url) {
            setImgFunc(url);
          }
        }
      }
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, setImgFunc: (url: string) => void) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = await uploadImagemParaSupabase(file);
      if (url) {
        setImgFunc(url);
      }
    }
  }

  function formatarTextoQuestao(texto: string) {
    if (!texto) return '';
    return texto
      .replace(/\s+(?=[A-E]\)\s)/g, '\n\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  const handleTotalChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setTotalFeitas(num);
    if (typeof num === 'number' && typeof acertos === 'number' && num >= acertos) {
      setErros(num - acertos);
    }
  };

  const handleAcertosChange = (val: string) => {
    const num = val === '' ? '' : Number(val);
    setAcertos(num);
    if (typeof num === 'number' && typeof totalFeitas === 'number' && totalFeitas >= num) {
      setErros(totalFeitas - num);
    }
  };

  async function handleSalvarRegisto(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    if (totalFeitas === '' || acertos === '' || erros === '') {
      setErroRegisto('Preencha todos os campos numéricos corretamente.');
      return;
    }

    if (acertos + erros !== totalFeitas) {
      setErroRegisto('A soma de acertos e erros deve ser igual ao total de questões feitas.');
      return;
    }

    setSalvandoRegisto(true);
    setErroRegisto('');
    setSucessoRegisto(false);

    try {
      const { error } = await supabase.from('user_questions').insert([
        {
          materia: materiaRegisto,
          assunto: assuntoRegisto.trim() || null,
          total_feitas: totalFeitas,
          acertos: acertos,
          erros: erros,
          motivo_erro: motivoErro.trim() || null,
          user_id: userId
        }
      ]);

      if (error) throw error;

      setSucessoRegisto(true);
      setAssuntoRegisto('');
      setTotalFeitas(1);
      setAcertos(1);
      setErros(0);
      setMotivoErro('');
      setTimeout(() => setSucessoRegisto(false), 3000);
    } catch (err: any) {
      setErroRegisto(`Erro ao guardar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setSalvandoRegisto(false);
    }
  }

  const promptMestreJson = `Atue como meu assistente de estudos para o concurso do TJSP (Banca VUNESP). 
A partir das questões ou comentários que eu colar aqui, formate a saída EXCLUSIVAMENTE em um código JSON puro (sem markdown extra, sem texto antes ou depois) seguindo exatamente esta estrutura de array:

[
  {
    "materia": "Direito Penal",
    "assunto": "Falsificação de papéis públicos",
    "enunciado": "Texto principal do enunciado da questão.\\n\\nA) Primeira alternativa...\\nB) Segunda alternativa...\\nC) Terceira alternativa...\\nD) Quarta alternativa...\\nE) Quinta alternativa...",
    "resolucao": "Gabarito: Letra X.\\n\\nExplicação detalhada da resolução...",
    "prioridade": "Alta"
  }
]

Regras estritas:
- O campo "materia" DEVE ser preenchido EXCLUSIVAMENTE com um dos seguintes valores exatos (não altere, não abrevie e não crie novos nomes):
  "Língua Portuguesa", "Direito Penal", "Direito Processual Penal", "Direito Processual Civil", "Direito Constitucional", "Direito Administrativo", "Normas da Corregedoria", "Matemática", "Raciocínio Lógico", "Informática", "Atualidades", "Estatuto da Pessoa com Deficiência".
- No campo "enunciado", se houver alternativas (A, B, C, D, E), insira obrigatoriamente quebras de linha duplas (\\n\\n) antes de cada letra de alternativa.
- O campo "prioridade" deve ser estritamente: "Baixa", "Média", "Alta" ou "Crítica".`;

  const copiarPromptMestre = () => {
    navigator.clipboard.writeText(promptMestreJson);
    setCopiadoPrompt(true);
    setTimeout(() => setCopiadoPrompt(false), 2500);
  };

  async function handleImportarJson(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;

    try {
      let textoLimpo = jsonInput.trim();
      if (textoLimpo.startsWith('```')) {
        textoLimpo = textoLimpo.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
      }

      const parsed = JSON.parse(textoLimpo);
      const listaArray = Array.isArray(parsed) ? parsed : [parsed];

      if (listaArray.length === 0) {
        alert('Nenhuma questão encontrada no JSON.');
        return;
      }

      setSalvandoBanco(true);
      const itensParaSalvar = listaArray.map(item => ({
        user_id: userId,
        materia: MATERIAS_TJSP.includes(item.materia) ? item.materia : 'Língua Portuguesa',
        assunto: item.assunto || 'Geral',
        enunciado: formatarTextoQuestao(item.enunciado || 'Enunciado não informado'),
        resolucao: item.resolucao || '',
        observacao: null,
        imagem_url: null,
        prioridade: ['Baixa', 'Média', 'Alta', 'Crítica'].includes(item.prioridade) ? item.prioridade : 'Média'
      }));

      const { error } = await supabase.from('questoes_concurso').insert(itensParaSalvar);
      if (error) throw error;

      setSucessoBanco(true);
      setJsonInput('');
      carregarQuestoes(userId);
      setTimeout(() => setSucessoBanco(false), 3000);
    } catch (err: any) {
      alert(`Erro ao processar JSON: ${err.message || 'Sintaxe inválida'}`);
    } finally {
      setSalvandoBanco(false);
    }
  }

  async function handleSalvarBancoManual(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !enunciadoBanco.trim()) return;

    setSalvandoBanco(true);
    try {
      const { error } = await supabase.from('questoes_concurso').insert([
        {
          user_id: userId,
          materia: materiaBanco,
          assunto: assuntoBanco.trim() || null,
          enunciado: formatarTextoQuestao(enunciadoBanco.trim()),
          resolucao: resolucaoBanco.trim(),
          observacao: observacaoBanco.trim() || null,
          imagem_url: imagemBanco,
          prioridade: prioridadeBanco
        }
      ]);

      if (error) throw error;

      setSucessoBanco(true);
      setAssuntoBanco('');
      setEnunciadoBanco('');
      setResolucaoBanco('');
      setObservacaoBanco('');
      setImagemBanco(null);
      carregarQuestoes(userId);
      setTimeout(() => setSucessoBanco(false), 3000);
    } catch (err: any) {
      alert(`Erro ao guardar: ${err.message}`);
    } finally {
      setSalvandoBanco(false);
    }
  }

  async function handleDeletar(id: string) {
    if (!confirm('Deseja realmente apagar esta questão do seu banco?')) return;
    try {
      const { error } = await supabase.from('questoes_concurso').delete().eq('id', id);
      if (error) throw error;
      setQuestoesList(questoesList.filter(q => q.id !== id));
    } catch (err) {
      alert('Erro ao apagar questão.');
    }
  }

  function abrirEdicao(q: QuestaoConcurso) {
    setEditId(q.id);
    setEditMateria(q.materia);
    setEditAssunto(q.assunto || '');
    setEditEnunciado(formatarTextoQuestao(q.enunciado));
    setEditResolucao(q.resolucao || '');
    setEditObservacao(q.observacao || '');
    setEditImagemUrl(q.imagem_url || null);
    setEditPrioridade(q.prioridade);
    setModalEditOpen(true);
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;

    try {
      const { error } = await supabase
        .from('questoes_concurso')
        .update({
          materia: editMateria,
          assunto: editAssunto,
          enunciado: formatarTextoQuestao(editEnunciado),
          resolucao: editResolucao,
          observacao: editObservacao.trim() || null,
          imagem_url: editImagemUrl,
          prioridade: editPrioridade
        })
        .eq('id', editId);

      if (error) throw error;

      setModalEditOpen(false);
      if (userId) carregarQuestoes(userId);
    } catch (err) {
      alert('Erro ao atualizar questão.');
    }
  }

  const toggleResolucao = (id: string) => {
    setResolucoesVisiveis(prev => ({ ...prev, [id]: !prev[id] }))
  };

  const toggleObservacao = (id: string) => {
    setObservacoesVisiveis(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Cores de Fundo do Card Inteiro baseadas na Prioridade (Alta/Crítica = Vermelho, Média = Amarelo, Baixa = Verde)
  const estiloCardPrioridade = (p: string) => {
    switch (p) {
      case 'Crítica':
      case 'Alta': 
        return 'bg-rose-950/40 border-rose-600/50 text-zinc-100';
      case 'Média': 
        return 'bg-amber-400 border-amber-500 text-zinc-950'; // Card inteiro amarelo forte
      case 'Baixa': 
      default: 
        return 'bg-emerald-950/40 border-emerald-600/50 text-zinc-100';
    }
  };

  const badgePrioridade = (p: string) => {
    switch (p) {
      case 'Crítica':
      case 'Alta': 
        return 'bg-rose-600 text-white border-rose-700';
      case 'Média': 
        return 'bg-zinc-950 text-amber-400 border-zinc-800';
      case 'Baixa': 
      default: 
        return 'bg-emerald-600 text-white border-emerald-700';
    }
  };

  const questoesFiltradas = questoesList.filter(q => {
    const matchMateria = filtroMateria === 'todos' || q.materia === filtroMateria;
    const matchAssunto = filtroAssunto === 'todos' || q.assunto === filtroAssunto;
    return matchMateria && matchAssunto;
  });

  const assuntosDisponiveis = Array.from(
    new Set(
      questoesList
        .filter(q => filtroMateria === 'todos' || q.materia === filtroMateria)
        .map(q => q.assunto)
        .filter(Boolean)
    )
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-amber-400 selection:text-zinc-950">
      <Navbar />

      <main className="w-full px-4 sm:px-8 py-8 space-y-10 max-w-5xl mx-auto">
        
        {/* Card Destaque */}
        <div className="bg-amber-400 border border-amber-500 rounded-3xl p-6 sm:p-8 shadow-2xl text-zinc-950 text-center space-y-2">
          <span className="inline-block bg-zinc-950 text-amber-400 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
            FOCO E CONSTÂNCIA • UPQUESTÕES
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug pt-1">
            Depende de você, aprenda de fato o que precisa aprender e curta o processo
          </h2>
        </div>

        {/* --- BLOCO 1: REGISTO NUMÉRICO ORIGINAL (DESEMPENHO) --- */}
        <div className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Registo de Questões — Desempenho
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Registe o seu progresso geral e mapeie os motivos dos seus erros para estatísticas.
            </p>
          </div>

          {sucessoRegisto && (
            <div className="bg-emerald-950/40 border border-emerald-600/40 p-4 rounded-xl text-emerald-400 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 shrink-0" />
              Registo de desempenho guardado com sucesso!
            </div>
          )}

          {erroRegisto && (
            <div className="bg-red-950/40 border border-red-600/40 p-4 rounded-xl text-red-400 text-sm flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {erroRegisto}
            </div>
          )}

          <form onSubmit={handleSalvarRegisto} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Disciplina / Matéria</label>
                <select 
                  value={materiaRegisto}
                  onChange={(e) => setMateriaRegisto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors cursor-pointer"
                >
                  {MATERIAS_TJSP.map((mat) => (
                    <option key={mat} value={mat}>{mat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Assunto / Tópico (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Ex: Negação de Proposições, Art. 5º CF..."
                  value={assuntoRegisto}
                  onChange={(e) => setAssuntoRegisto(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Feitas</label>
                <input 
                  type="number" 
                  min={1}
                  required
                  value={totalFeitas}
                  onChange={(e) => handleTotalChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Acertos
                </label>
                <input 
                  type="number" 
                  min={0}
                  required
                  value={acertos}
                  onChange={(e) => handleAcertosChange(e.target.value)}
                  className="w-full bg-emerald-950/20 border border-emerald-600/50 rounded-xl px-4 py-3 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Erros
                </label>
                <input 
                  type="number" 
                  min={0}
                  readOnly
                  value={erros}
                  className="w-full bg-red-950/20 border border-red-600/50 rounded-xl px-4 py-3 text-sm text-red-400 font-bold cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Motivo do Erro (Opcional / Caderno de Erros)
              </label>
              <textarea 
                rows={2}
                placeholder="Ex: Confundi o prazo do recurso, falta de atenção na leitura do comando..."
                value={motivoErro}
                onChange={(e) => setMotivoErro(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button 
              type="submit"
              disabled={salvandoRegisto}
              className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3.5 px-6 rounded-xl transition-colors shadow-lg shadow-amber-400/20 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
            >
              {salvandoRegisto ? 'A guardar...' : 'Guardar Registo de Desempenho'}
            </button>
          </form>
        </div>

        {/* --- BLOCO 2: BANCO DE QUESTÕES PRÁTICAS COM RESOLUÇÃO E SUPORTE A IMAGENS --- */}
        <div className="space-y-6 pt-6 border-t border-zinc-800">
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-5">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Caderno Prático de Questões & Resoluções
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Cole prints (Ctrl+V) diretamente no enunciado ou importe via JSON.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copiarPromptMestre}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow"
                >
                  {copiadoPrompt ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiadoPrompt ? 'Prompt Copiado!' : 'Copiar Prompt Mestre IA'}</span>
                </button>

                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setModoPreenchimento('json')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${modoPreenchimento === 'json' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Modo JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoPreenchimento('manual')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${modoPreenchimento === 'manual' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Manual
                  </button>
                </div>
              </div>
            </div>

            {sucessoBanco && (
              <div className="bg-emerald-950/40 border border-emerald-600/40 p-3 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" /> Questão guardada com sucesso no banco prático!
              </div>
            )}

            {/* MODO JSON */}
            {modoPreenchimento === 'json' && (
              <form onSubmit={handleImportarJson} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Cole o JSON gerado pela IA com as questões:
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[{"materia": "Direito Constitucional", "assunto": "Art. 5º", "enunciado": "Texto...\n\nA) ...\nB) ...", "resolucao": "...", "prioridade": "Alta"}]'
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={salvandoBanco}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  {salvandoBanco ? 'A importar...' : 'Importar Questões para o Caderno Prático'}
                </button>
              </form>
            )}

            {/* MODO MANUAL */}
            {modoPreenchimento === 'manual' && (
              <form onSubmit={handleSalvarBancoManual} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Matéria</label>
                    <select
                      value={materiaBanco}
                      onChange={(e) => setMateriaBanco(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 cursor-pointer"
                    >
                      {MATERIAS_TJSP.map((mat) => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Assunto</label>
                    <input
                      type="text"
                      placeholder="Ex: Pontuação, Habeas Corpus..."
                      value={assuntoBanco}
                      onChange={(e) => setAssuntoBanco(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Nível de Prioridade</label>
                    <select
                      value={prioridadeBanco}
                      onChange={(e) => setPrioridadeBanco(e.target.value as any)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-bold cursor-pointer"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Enunciado / Pergunta e Alternativas</label>
                    <span className="text-[10px] text-amber-400 italic">Dica: Você pode dar Ctrl+V para colar um print direto aqui!</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    placeholder="Cole o enunciado aqui ou dê Ctrl+V para colar um print..."
                    value={enunciadoBanco}
                    onChange={(e) => setEnunciadoBanco(e.target.value)}
                    onPaste={(e) => handlePaste(e, (url) => setImagemBanco(url))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100"
                  />
                </div>

                {/* Upload ou Pré-visualização da Imagem */}
                <div className="space-y-2 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" /> Imagem Anexada ao Enunciado (Opcional)
                  </label>
                  
                  {imagemBanco ? (
                    <div className="relative inline-block">
                      <img src={imagemBanco} alt="Preview" className="max-h-40 rounded-lg border border-zinc-700" />
                      <button
                        type="button"
                        onClick={() => setImagemBanco(null)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 text-[10px] hover:bg-red-700 cursor-pointer shadow"
                      >
                        ✕ Remover
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-amber-400 text-xs font-bold cursor-pointer shadow-sm transition">
                        <Upload className="w-4 h-4" />
                        <span>Carregar Imagem do Computador</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (url) => setImagemBanco(url))} className="hidden" />
                      </label>
                      <span className="text-[11px] text-zinc-500">ou cole com Ctrl+V na caixa de texto acima</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400">Resolução Comentada / Gabarito</label>
                  <textarea
                    rows={3}
                    placeholder="Explicação detalhada, letra da lei ou macete..."
                    value={resolucaoBanco}
                    onChange={(e) => setResolucaoBanco(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 whitespace-pre-line"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Observação / Comentário Pessoal (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Adicione anotações extras, lembretes ou observações particulares..."
                    value={observacaoBanco}
                    onChange={(e) => setObservacaoBanco(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 whitespace-pre-line"
                  />
                </div>

                <button
                  type="submit"
                  disabled={salvandoBanco}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 px-6 rounded-xl transition-colors shadow-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  {salvandoBanco ? 'A guardar...' : 'Guardar Questão no Caderno Prático'}
                </button>
              </form>
            )}
          </div>

          {/* LISTAGEM COM FILTRO E CARD INTERATIVO */}
          <div className="space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-400" />
                Caderno Cadastrado ({questoesFiltradas.length})
              </h2>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <select
                  value={filtroMateria}
                  onChange={(e) => {
                    setFiltroMateria(e.target.value);
                    setFiltroAssunto('todos');
                  }}
                  className="w-full sm:w-48 bg-zinc-900 border border-zinc-800 text-amber-300 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="todos">Todas as Matérias</option>
                  {MATERIAS_TJSP.map((mat, idx) => (
                    <option key={idx} value={mat}>{mat}</option>
                  ))}
                </select>

                <select
                  value={filtroAssunto}
                  onChange={(e) => setFiltroAssunto(e.target.value)}
                  className="w-full sm:w-48 bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
                >
                  <option value="todos">Todos os Assuntos</option>
                  {assuntosDisponiveis.map((ass, idx) => (
                    <option key={idx} value={ass}>{ass}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500 text-xs">
                A carregar questões...
              </div>
            ) : questoesFiltradas.length === 0 ? (
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-500 text-xs">
                Nenhuma questão encontrada para os filtros selecionados.
              </div>
            ) : (
              <div className="space-y-4">
                {questoesFiltradas.map((q) => {
                  const respostaAberta = resolucoesVisiveis[q.id];
                  const observacaoAberta = observacoesVisiveis[q.id];
                  const enunciadoFormatado = formatarTextoQuestao(q.enunciado);

                  return (
                    <div key={q.id} className={`border rounded-2xl p-5 sm:p-6 space-y-4 shadow-md transition-all ${estiloCardPrioridade(q.prioridade)}`}>
                      
                      {/* Cabeçalho do Card */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-black/10 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${q.prioridade === 'Média' ? 'bg-zinc-950 text-amber-400 border-zinc-900' : 'bg-black/30 text-white border-black/20'}`}>
                            {q.materia}
                          </span>
                          {q.assunto && (
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded border ${q.prioridade === 'Média' ? 'bg-zinc-900/50 text-zinc-900 border-amber-600/30' : 'bg-black/30 text-zinc-200 border-black/20'}`}>
                              {q.assunto}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgePrioridade(q.prioridade)}`}>
                            Prioridade: {q.prioridade}
                          </span>
                          <button
                            onClick={() => abrirEdicao(q)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${q.prioridade === 'Média' ? 'bg-zinc-950 text-amber-400 hover:bg-zinc-900' : 'bg-black/40 text-zinc-300 hover:text-amber-400'}`}
                            title="Editar Questão"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletar(q.id)}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${q.prioridade === 'Média' ? 'bg-zinc-950 text-amber-400 hover:bg-zinc-900' : 'bg-black/40 text-zinc-300 hover:text-rose-400'}`}
                            title="Excluir Questão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Imagem do Enunciado (se houver) */}
                      {q.imagem_url && (
                        <div className="rounded-xl overflow-hidden border border-black/20 bg-black/20 p-2 max-w-xl">
                          <img src={q.imagem_url} alt="Questão Anexo" className="rounded-lg max-h-80 w-auto object-contain" />
                        </div>
                      )}

                      {/* Enunciado */}
                      <div className={`text-xs sm:text-sm leading-relaxed font-medium whitespace-pre-line ${q.prioridade === 'Média' ? 'text-zinc-950' : 'text-zinc-100'}`}>
                        {enunciadoFormatado}
                      </div>

                      {/* Botões de Ação */}
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => toggleResolucao(q.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${q.prioridade === 'Média' ? 'bg-zinc-950 text-amber-400 hover:bg-zinc-900' : 'bg-black/40 text-zinc-100 hover:bg-black/60 border border-black/20'}`}
                        >
                          {respostaAberta ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          <span>{respostaAberta ? 'Ocultar Resposta Comentada' : 'Ver Resposta Comentada'}</span>
                        </button>

                        {q.observacao && (
                          <button
                            onClick={() => toggleObservacao(q.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${q.prioridade === 'Média' ? 'bg-zinc-950 text-amber-400 hover:bg-zinc-900' : 'bg-black/40 text-blue-300 hover:bg-black/60 border border-black/20'}`}
                          >
                            {observacaoAberta ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            <span>{observacaoAberta ? 'Ocultar Observação Pessoal' : 'Ver Observação Pessoal'}</span>
                          </button>
                        )}
                      </div>

                      {/* Observação Pessoal */}
                      {observacaoAberta && q.observacao && (
                        <div className={`p-4 rounded-r-xl space-y-1.5 border-l-2 ${q.prioridade === 'Média' ? 'bg-black/10 border-zinc-950 text-zinc-950' : 'bg-blue-950/20 border-blue-400 text-zinc-300'}`}>
                          <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Observação Pessoal:
                          </span>
                          <div className="text-xs leading-relaxed whitespace-pre-line">
                            {q.observacao}
                          </div>
                        </div>
                      )}

                      {/* Resolução Comentada */}
                      {respostaAberta && q.resolucao && (
                        <div className={`p-4 rounded-r-xl space-y-1.5 border-l-2 ${q.prioridade === 'Média' ? 'bg-black/10 border-zinc-950 text-zinc-950' : 'bg-black/30 border-amber-400 text-zinc-200'}`}>
                          <span className="text-[10px] font-black uppercase tracking-wider block">
                            Resolução Comentada / Gabarito:
                          </span>
                          <div className="text-xs leading-relaxed whitespace-pre-line font-mono">
                            {q.resolucao}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MODAL DE EDIÇÃO */}
        {modalEditOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" /> Editar Questão do Caderno
                </h3>
                <button onClick={() => setModalEditOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSalvarEdicao} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Matéria</label>
                    <select
                      value={editMateria}
                      onChange={(e) => setEditMateria(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      {MATERIAS_TJSP.map((mat) => (
                        <option key={mat} value={mat}>{mat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Prioridade</label>
                    <select
                      value={editPrioridade}
                      onChange={(e) => setEditPrioridade(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
                    >
                      <option value="Baixa">Baixa</option>
                      <option value="Média">Média</option>
                      <option value="Alta">Alta</option>
                      <option value="Crítica">Crítica</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Assunto</label>
                  <input
                    type="text"
                    value={editAssunto}
                    onChange={(e) => setEditAssunto(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Enunciado (Ctrl+V suportado)</label>
                  <textarea
                    rows={4}
                    value={editEnunciado}
                    onChange={(e) => setEditEnunciado(e.target.value)}
                    onPaste={(e) => handlePaste(e, (url) => setEditImagemUrl(url))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white whitespace-pre-line"
                  />
                </div>

                {/* Imagem no Modal de Edição */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-amber-400">Imagem Anexada</label>
                  {editImagemUrl ? (
                    <div className="relative inline-block">
                      <img src={editImagemUrl} alt="Edit Preview" className="max-h-32 rounded border border-zinc-800" />
                      <button
                        type="button"
                        onClick={() => setEditImagemUrl(null)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full px-1 text-[9px] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-amber-400 text-xs cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Adicionar Imagem
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, (url) => setEditImagemUrl(url))} className="hidden" />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Resolução Comentada</label>
                  <textarea
                    rows={3}
                    value={editResolucao}
                    onChange={(e) => setEditResolucao(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white whitespace-pre-line"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-blue-400 mb-1">Observação / Comentário Pessoal</label>
                  <textarea
                    rows={2}
                    value={editObservacao}
                    onChange={(e) => setEditObservacao(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white whitespace-pre-line"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                  <button type="button" onClick={() => setModalEditOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-300 cursor-pointer">Cancelar</button>
                  <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-400 text-zinc-950 cursor-pointer">Salvar Alterações</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}