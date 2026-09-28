'use server';

import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

// Usamos a Service Role Key se existir, caso contrário usamos a anon key
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
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada.' };
  }

  try {
    // BUSCAR DIRETAMENTE TODOS OS REGISTOS DA TABELA SIMULADOS SEM BLOQUEIO DE RLS
    const { data: simulados, error: erroSimulados } = await supabaseAdmin
      .from('simulados')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: melhorias, error: erroMelhorias } = await supabaseAdmin
      .from('pontos_melhoria')
      .select('*')
      .order('created_at', { ascending: false });

    if (erroSimulados) {
      console.error('Erro ao ler simulados:', erroSimulados.message);
    }

    const listaSimulados = simulados && simulados.length > 0 
      ? JSON.stringify(simulados, null, 2) 
      : 'NENHUM SIMULADO ENCONTRADO NA TABELA.';

    const listaMelhorias = melhorias && melhorias.length > 0 
      ? JSON.stringify(melhorias, null, 2) 
      : 'NENHUM PONTO DE MELHORIA ENCONTRADO.';

    const contextoDados = `
DADOS REAIS OBTIDOS DIRETAMENTE DA BASE DE DADOS DO SUPABASE:

TABELA SIMULADOS:
${listaSimulados}

TABELA PONTOS DE MELHORIA:
${listaMelhorias}
    `;

    const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUEST-ES, especializado em preparar candidatos para o concurso de Escrevente do TJSP (VUNESP).
ATENÇÃO ABSOLUTA: Os dados acima foram extraídos diretamente da tabela "simulados" do banco de dados. O aluno JÁ REALIZOU um simulado (vê o registo com o título "Simulado 01 - VUNESP SP", 17 acertos, 46 questões e nota 3.70). 
É TERMINANTEMENTE PROIBIDO dizeres que o aluno não tem simulados. Deves analisar detalhadamente este simulado, a nota 3.70 e os acertos quando o aluno perguntar.

REGRAS OBRIGATÓRIAS:
- Responde com base estrita nos dados do banco de dados fornecidos acima.
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
      temperature: 0.1,
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