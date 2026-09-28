'use server';

import OpenAI from 'openai';

const nvidiaClient = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function perguntarNvidiaAction(
  messages: { role: 'user' | 'assistant'; content: string }[], 
  dadosUtilizador: { 
    totalFeitas: number; 
    totalAcertos: number; 
    totalErros: number; 
    redacoesCount: number;
    simulados?: { titulo: string; acertos: number; total_questoes: number; nota: number; created_at: string }[];
    melhorias?: { materia: string; quantidade_erros: number; quantidade_acertos: number; assunto_estudar: string }[];
  }
) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    return { response: 'A variável de ambiente NVIDIA_API_KEY não está configurada no ficheiro .env.local.' };
  }

  const taxaAcerto = dadosUtilizador.totalFeitas > 0 
    ? ((dadosUtilizador.totalAcertos / dadosUtilizador.totalFeitas) * 100).toFixed(1) 
    : '0';

  // Formatar a lista de simulados para o contexto da IA
  const listaSimulados = dadosUtilizador.simulados && dadosUtilizador.simulados.length > 0
    ? dadosUtilizador.simulados.map(s => {
        const dataFormatada = new Date(s.created_at).toLocaleDateString('pt-BR');
        return `- Data: ${dataFormatada} | Título: ${s.titulo} \vert{} Acertos:${s.acertos}/${s.total_questoes} \vert{} Nota:${s.nota}`;
      }).join('\n')
    : 'Nenhum simulado registado ainda.';

  // Formatar os pontos de melhoria
  const listaMelhorias = dadosUtilizador.melhorias && dadosUtilizador.melhorias.length > 0
    ? dadosUtilizador.melhorias.map(m => 
        `- Matéria: ${m.materia} \vert{} Acertos:${m.quantidade_acertos} | Erros: ${m.quantidade_erros} \vert{} Assunto a estudar:${m.assunto_estudar}`
      ).join('\n')
    : 'Nenhum ponto de melhoria registado.';

  const contextoDados = `
DADOS REAIS DO ALUNO NO SISTEMA UPQUESTOS (TJSP / VUNESP):
- Total de Questões Feitas: ${dadosUtilizador.totalFeitas}
- Total de Acertos: ${dadosUtilizador.totalAcertos}
- Total de Erros: ${dadosUtilizador.totalErros}
- Taxa de Aproveitamento: ${taxaAcerto}%
- Total de Redações Treinadas: ${dadosUtilizador.redacoesCount}

HISTÓRICO DETALHADO DE SIMULADOS:
${listaSimulados}

PONTOS DE MELHORIA / ASSUNTOS CRÍTICOS:
${listaMelhorias}
  `;

  const systemPrompt = `És o assistente de inteligência artificial de elite do UPQUESTOS, especializado em preparar candidatos para o concurso de Escrevente Técnico Judiciário do Tribunal de Justiça de São Paulo (TJSP) sob os rigorosos padrões da banca VUNESP.
Tens acesso direto aos dados de desempenho e ao histórico de simulados do aluno através do sistema. Utiliza estes dados para dar feedback cirúrgico, analítico e motivador, referenciando datas e simulados específicos sempre que questionado. Responde sempre em Português natural, técnico e objetivo.

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

    respostaIA = respostaIA.replace(/[*_#`~]/g, '');

    return { response: respostaIA };
  } catch (error: any) {
    console.error('Erro detalhado da API NVIDIA:', error);
    
    return { 
      response: `Erro de conexão com a API da NVIDIA: ${error?.message || 'Erro desconhecido'}. Verifica se a chave em .env.local está correta.` 
    };
  }
}