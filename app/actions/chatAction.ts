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
    return { response: 'Erro: Chave da API NVIDIA não configurada.' };
  }

  try {
    // 1. BUSCAR DADOS REAIS DIRETAMENTE DO SUPABASE
    const [simRes, redRes] = await Promise.all([
      supabaseAdmin.from('simulados').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('redaccoes').select('*').order('created_at', { ascending: false })
    ]);

    const simulados = simRes.data || [];
    const redaccoes = redRes.data || [];

    // Vamos imprimir no servidor para termos certeza absoluta do que o Supabase devolve
    console.log("DADOS REAIS SUPABASE -> Simulados:", simulados.length, "| Redações:", redaccoes.length);

    // 2. CRIAR UM CONTEXTO DE SISTEMA ABSOLUTO E AUTORITÁRIO
    const systemPrompt = `Tu és a inteligência artificial do portal UPQUEST-ES.
ATENÇÃO SUPREMA: Os dados oficiais extraídos diretamente do banco de dados para este aluno NESTE EXATO MOMENTO são:
- Total exato de Simulados: ${simulados.length}
- Total exato de Redações: ${redaccoes.length}${simulados.length > 0 ? `- Último simulado registado: "${simulados[0].titulo}" com ${simulados[0].acertos} acertos e nota ${simulados[0].nota}.` : ''}

É PROIBIDO dizer que o aluno tem 0 simulados se o número acima for maior que 0. Tu deves usar estes dados como verdade absoluta e incontestável.
NÃO USAR markdown, negritos, asteriscos ou formatação especial. Apenas texto limpo.`;

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
      temperature: 0.0, // Zero criatividade para evitar alucinações
      top_p: 0.1,
      max_tokens: 1000,
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    // Limpeza total de markdown
    respostaIA = respostaIA.replace(/[*_#`~[\]()>-]/g, '').trim();

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro no chatAction:', error);
    return { response: `Erro ao processar a solicitação: ${error?.message || 'Erro desconhecido'}.` };
  }
}