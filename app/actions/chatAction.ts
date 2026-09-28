'use server';

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Cliente administrativo para ignorar políticas RLS e aceder a todas as tabelas livremente
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

export async function perguntarNvidiaAction(
  messages: { role: 'user' | 'assistant'; content: string }[], 
  userId?: string 
) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada no ficheiro .env.local.' };
  }

  try {
    // BUSCAR DADOS DE TODAS AS TABELAS DO SISTEMA EM PARALELO
    const [
      cadernoRes,
      mapasRes,
      melhoriasRes,
      questoesRes,
      redaccoesRes,
      simuladosRes,
      userQuestionsRes
    ] = await Promise.all([
      supabaseAdmin.from('caderno_revisao').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('mapas_mentais').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('pontos_melhoria').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('questoes_resolucao').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('redaccoes').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('simulados').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('user_questions').select('*')
    ]);

    // Converter os resultados em formato JSON legível para a IA analisar todas as colunas
    const dadosGerais = {
      caderno_revisao: cadernoRes.data || [],
      mapas_mentais: mapasRes.data || [],
      pontos_melhoria: melhoriasRes.data || [],
      questoes_resolucao: questoesRes.data || [],
      redaccoes: redaccoesRes.data || [],
      simulados: simuladosRes.data || [],
      user_questions: userQuestionsRes.data || []
    };

    const contextoBanco = JSON.stringify(dadosGerais, null, 2);

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.

Tens acesso total e direto a TODAS as tabelas, colunas e registos da base de dados do aluno no Supabase. O JSON abaixo contém o ecossistema completo de estudos do aluno (simulados, redações, questões resolvidas, pontos de melhoria, mapas mentais e caderno de revisão):

${contextoBanco}

DIRETRIZES ABSOLUTAS:
- Analisa profundamente estes dados sempre que o aluno fizer perguntas sobre o seu progresso, simulados, notas, acertos, redações ou pontos fracos.
- Nunca alegues que não existem dados se as respetivas tabelas contiverem registos no JSON acima.
- Responde sempre com tom analítico, cirúrgico, motivador e focado na aprovação no TJSP.
- NUNCA uses asteriscos, negritos, itálicos ou símbolos markdown de formatação. Responde em texto limpo e estruturado.`;

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
      temperature: 0.2,
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
    console.error('Erro ao consultar o banco de dados:', error);
    return { response: `Erro ao processar os dados do sistema: ${error?.message || 'Erro desconhecido'}.` };
  }
}