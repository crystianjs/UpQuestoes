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

    // 2. CRIAR UM BLOCO DE DADOS INEGOCIÁVEL
    let infoBanco = `\n\n[DADOS OFICIAIS DO BANCO DE DADOS - LEIA OBRIGATORIAMENTE]:\n`;
    infoBanco += `- Total de simulados na tabela simulados: ${simulados.length}\n`;
    if (simulados.length > 0) {
      infoBanco += `- Detalhe do Simulado: Título="${simulados[0].titulo}", Acertos=${simulados[0].acertos}/${simulados[0].total_questoes}, Nota=${simulados[0].nota}\n`;
    }
    infoBanco += `- Total de redações na tabela redaccoes: ${redaccoes.length}\n`;

    // 3. INJETAR OS DADOS DIRETAMENTE NA ÚLTIMA MENSAGEM DO UTILIZADOR
    // Isto força o LLM a ver os dados quer queira quer não, pois faz parte da prompt ativa.
    const mensagensModificadas = [...messages];
    if (mensagensModificadas.length > 0) {
      const ultimaMsgIndex = mensagensModificadas.length - 1;
      if (mensagensModificadas[ultimaMsgIndex].role === 'user') {
        mensagensModificadas[ultimaMsgIndex] = {
          ...mensagensModificadas[ultimaMsgIndex],
          content: mensagensModificadas[ultimaMsgIndex].content + infoBanco
        };
      }
    }

    const systemPrompt = `És o assistente de inteligência artificial do UPQUEST-ES, mentor para o concurso de Escrevente do TJSP (VUNESP). 
O utilizador forneceu os dados reais do banco de dados na mensagem dele. Tu DEVES aceitar esses dados como a absoluta verdade. Nunca digas que o aluno tem 0 simulados se os dados disserem o contrário.
NUNCA uses asteriscos, negritos, itálicos ou símbolos markdown. Apenas texto limpo.`;

    const formattedMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...mensagensModificadas.map(m => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }))
    ];

    const completion: any = await nvidiaClient.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: formattedMessages,
      temperature: 0.1,
      top_p: 0.9,
      max_tokens: 1000,
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    // Limpeza rigorosa de markdown
    respostaIA = respostaIA.replace(/[*_#`~[\]()>-]/g, '').trim();

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro no chatAction:', error);
    return { response: `Erro ao processar a solicitação: ${error?.message || 'Erro desconhecido'}.` };
  }
}