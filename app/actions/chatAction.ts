'use server';

import OpenAI from 'openai';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function perguntarNvidiaAction(
  messages: { role: 'user' | 'assistant'; content: string }[], 
  dadosUtilizador: { totalFeitas: number; totalAcertos: number; totalErros: number; redacoesCount: number }
) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada no ficheiro .env.local.' };
  }

  const taxaAcerto = dadosUtilizador.totalFeitas > 0 
    ? ((dadosUtilizador.totalAcertos / dadosUtilizador.totalFeitas) * 100).toFixed(1) 
    : '0';

  const contextoDados = `
  DADOS REAIS DO ALUNO NO SISTEMA UPQUESTOS (TJSP / VUNESP):
  - Total de Questões Feitas: ${dadosUtilizador.totalFeitas}
  - Total de Acertos: ${dadosUtilizador.totalAcertos}
  - Total de Erros: ${dadosUtilizador.totalErros}
  - Taxa de Aproveitamento: ${taxaAcerto}%
  - Total de Redações Treinadas: ${dadosUtilizador.redacoesCount}
  `;

  const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUESTOS, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.
  Tens acesso direto aos dados de desempenho do aluno através do sistema. Utiliza estes dados para dar feedback cirúrgico, analítico e motivador. Responde sempre em Português natural, técnico e objetivo.

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

  try {
    // Utilizando o modelo GLM-5.3 da Z.ai na NVIDIA NIM, ideal para respostas longas, complexas e técnicas
    const completion: any = await nvidiaClient.chat.completions.create({
      model: 'z-ai/glm-5.3',
      messages: formattedMessages,
      temperature: 0.5,
      top_p: 0.9,
      max_tokens: 2048, // Aumentado para permitir respostas completas e profundas sem cortes
      stream: false,
    });

    let respostaIA = completion.choices[0]?.message?.content || '';

    if (!respostaIA) {
      return { response: 'O assistente processou o pedido mas não gerou conteúdo.' };
    }

    respostaIA = respostaIA.replace(/[*_#`~]/g, '');

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro detalhado da API NVIDIA:', error);
    
    return { 
      response: `Erro de conexão com a API da NVIDIA: ${error?.message || 'Erro desconhecido'}. Verifica se a chave em .env.local está correta.` 
    };
  }
}