'use server';

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
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
    // 1. BUSCAR DIRETAMENTE DO SUPABASE (Com fallback se o userId vier vazio)
    let querySimulados = supabase.from('simulados').select('*').order('created_at', { ascending: false });
    if (userId) {
      querySimulados = querySimulados.eq('user_id', userId);
    }

    let queryMelhorias = supabase.from('pontos_melhoria').select('*').order('created_at', { ascending: false });
    if (userId) {
      queryMelhorias = queryMelhorias.eq('user_id', userId);
    }

    const [simRes, melRes] = await Promise.all([querySimulados, queryMelhorias]);

    const simulados = simRes.data || [];
    const melhorias = melRes.data || [];

    // 2. CONVERTER OS DADOS DIRETAMENTE EM TEXTO EXPLICÍCITO PARA A IA
    const simuladosTexto = simulados.length > 0 
      ? JSON.stringify(simulados, null, 2) 
      : 'NENHUM SIMULADO ENCONTRADO NA TABELA.';

    const melhoriasTexto = melhorias.length > 0 
      ? JSON.stringify(melhorias, null, 2) 
      : 'NENHUM PONTO DE MELHORIA ENCONTRADO.';

    const contextoDados = `
REGISTOS OFICIAIS EXTRAÍDOS DIRETAMENTE DA BASE DE DADOS (SUPABASE):

TABELA SIMULADOS:
${simuladosTexto}

TABELA PONTOS_MELHORIA:
${melhoriasTexto}
    `;

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente do TJSP (VUNESP).
Tens abaixo os dados brutos extraídos diretamente das tabelas do banco de dados do aluno. É OBRIGATÓRIO que leias estes dados e respondas com base neles. O aluno JÁ REALIZOU simulados (vê a tabela simulados acima). Nunca digas que o aluno não tem simulados se a tabela contiver registos.

REGRAS OBRIGATÓRIAS:
- Responde com base estrita nos dados do banco de dados fornecidos abaixo.
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
      temperature: 0.3, // Temperatura mais baixa para garantir foco absoluto nos dados
      top_p: 0.9,
      max_tokens: 2048,
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    respostaIA = respostaIA.replace(/[*_#`~]/g, '');

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro ao consultar Supabase:', error);
    return { response: `Erro ao processar os dados do banco: ${error?.message || 'Erro desconhecido'}.` };
  }
}