'use server';

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

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
    // BUSCAR DADOS DE TODAS AS TABELAS EM PARALELO (Limitando aos registos mais recentes para otimizar o tamanho do payload)
    const [
      cadernoRes,
      mapasRes,
      melhoriasRes,
      questoesRes,
      redaccoesRes,
      simuladosRes,
      userQuestionsRes
    ] = await Promise.all([
      supabaseAdmin.from('caderno_revisao').select('*').limit(20),
      supabaseAdmin.from('mapas_mentais').select('*').limit(20),
      supabaseAdmin.from('pontos_melhoria').select('*').limit(20),
      supabaseAdmin.from('questoes_resolucao').select('*').limit(50),
      supabaseAdmin.from('redaccoes').select('*').limit(20),
      supabaseAdmin.from('simulados').select('*').limit(20),
      supabaseAdmin.from('user_questions').select('*').limit(100)
    ]);

    // Resumo estruturado para poupar tokens e garantir leitura infalível pela IA
    const resumoDados = {
      simulados: simuladosRes.data || [],
      redaccoes: redaccoesRes.data || [],
      pontos_melhoria: melhoriasRes.data || [],
      caderno_revisao: cadernoRes.data || [],
      mapas_mentais: mapasRes.data || [],
      questoes_resolucao: questoesRes.data || [],
      user_questions: userQuestionsRes.data || []
    };

    const contextoBanco = JSON.stringify(resumoDados, null, 2);

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.

Tens acesso direto aos dados do aluno no banco de dados. Segue abaixo o resumo completo em JSON com o registo de simulados, redações, questões e desempenho:

${contextoBanco}

DIRETRIZES ABSOLUTAS:
- Analisa rigorosamente estes dados para responder a qualquer pergunta sobre simulados, redações, notas ou acertos.
- Nota informativa essencial: O concurso do TJSP (VUNESP) inclui prova discursiva (redação), portanto apoia plenamente o treino dissertativo do aluno.
- NUNCA uses asteriscos, negritos, itálicos ou símbolos markdown de formatação. Responde sempre em texto limpo, direto, objetivo e estruturado em Português natural.`;

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