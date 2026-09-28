'use server';

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Inicializa o cliente do Supabase para o lado do servidor
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function perguntarNvidiaAction(
  messages: { role: 'user' | 'assistant'; content: string }[], 
  userId: string // Recebe o ID do utilizador logado para filtrar corretamente
) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada no ficheiro .env.local.' };
  }

  try {
    // 1. BUSCAR OS DADOS DIRETAMENTE DO SUPABASE EM TEMPO REAL
    const [simRes, melRes, questRes] = await Promise.all([
      supabase.from('simulados').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('pontos_melhoria').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('user_questions').select('*').eq('user_id', userId) // Ajusta o nome da tabela se necessário
    ]);

    const simulados = simRes.data || [];
    const melhorias = melRes.data || [];
    const questoes = questRes.data || [];

    // Calcular totais gerais de desempenho
    const totalFeitas = questoes.length;
    const totalAcertos = questoes.filter((q: any) => q.acertou).length;
    const totalErros = totalFeitas - totalAcertos;
    const taxaAcerto = totalFeitas > 0 ? ((totalAcertos / totalFeitas) * 100).toFixed(1) : '0';

    // 2. FORMATAR O HISTÓRICO DE SIMULADOS PARA A IA (Inclui datas, títulos e notas)
    const listaSimulados = simulados.length > 0
      ? simulados.map(s => {
          const dataFormatada = new Date(s.created_at).toLocaleDateString('pt-BR');
          return `- Data: ${dataFormatada} | Título: ${s.titulo \vert{}\vert{} 'Simulado'} \vert{} Acertos:${s.acertos}/${s.total_questoes} \vert{} Nota:${s.nota}`;
        }).join('\n')
      : 'Nenhum simulado registado na base de dados.';

    // 3. FORMATAR OS PONTOS DE MELHORIA / MATÉRIAS
    const listaMelhorias = melhorias.length > 0
      ? melhorias.map(m => 
          `- Matéria: ${m.materia} \vert{} Acertos:${m.quantidade_acertos} | Erros: ${m.quantidade_erros} \vert{} Assunto:${m.assunto_estudar}`
        ).join('\n')
      : 'Nenhum ponto de melhoria registado.';

    const contextoDados = `
DADOS REAIS DO ALUNO NO SISTEMA UPQUEST-ES (TJSP / VUNESP):
- Total de Questões Feitas: ${totalFeitas}
- Total de Acertos: ${totalAcertos}
- Total de Erros: ${totalErros}
- Taxa de Aproveitamento Geral: ${taxaAcerto}%

HISTÓRICO COMPLETO DE SIMULADOS (DIRETO DA TABELA DO BANCO):
${listaSimulados}

PONTOS DE MELHORIA E ASSUNTOS CRÍTICOS:
${listaMelhorias}
    `;

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.
Tens acesso direto e em tempo real à base de dados do aluno. Utiliza estes dados para dar feedback cirúrgico, analítico e motivador, referenciando datas específicas de simulados (como o simulado de 28/09), notas e matérias sempre que questionado. Responde sempre em Português natural, técnico e objetivo.

REGRAS OBRIGATÓRIAS:
- Dá explicações completas, estruturadas e detalhadas quando solicitado.
- NUNCA uses asteriscos, negritos, itálicos ou símbolos markdown de formatação.

${contextoDados}`;

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }))
    ];

    const completion: any = await nvidiaClient.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: formattedMessages,
      temperature: 0.5,
      top_p: 0.9,
      max_tokens: 2048,
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    // Remover qualquer formatação markdown indesejada da resposta
    respostaIA = respostaIA.replace(/[*_#`~]/g, '');

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro detalhado ao consultar Supabase ou NVIDIA:', error);
    
    return { 
      response: `Erro ao processar os dados: ${error?.message || 'Erro desconhecido'}.` 
    };
  }
}