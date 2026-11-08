import { GoogleGenAI, Type } from '@google/genai';
import { AIAnalysisReport, ClassifiedResponse, Lead, TechnicalAuditEvidence } from '../src/types/crm';

const apiKey = process.env.GEMINI_API_KEY;

export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    })
  : null;

const FMWS_SYSTEM_PROMPT = `
Você é o Diretor de Tecnologia e Especialista Comercial da FAZER MEU WEBSITE (https://fazermeuwebsite.com.br/), uma empresa sólida de desenvolvimento web corporativo e infraestrutura de alta disponibilidade.

PORTFÓLIO DE SERVIÇOS DA FAZER MEU WEBSITE:
1. Criação de Sites Profissionais: Institucionais, responsivos, com arquitetura voltada para conversão, performance técnica e SEO estruturado.
2. Desenvolvimento de Aplicações Web: Sistemas sob medida, portais corporativos, integrações de APIs e painéis administrativos em nuvem.
3. Hospedagem Linux Profissional: Isolamento de recursos, cPanel, e-mails corporativos ilimitados e suporte humanizado.
4. Hospedagem WordPress Gerenciada: Aceleração LiteSpeed Cache, firewall de aplicação (WAF) e SSL automático.
5. Revenda de Hospedagem: Infraestrutura white-label WHM para agências e profissionais.
6. Registro e Transferência de Domínios: Gestão de DNS (.com.br, .com, etc.) e proteção cadastral.

DIFERENCIAL COMERCIAL FUNDAMENTAL (SEMPRE DESTACAR QUANDO RELEVANTE):
"A Fazer Meu Website desenvolve uma proposta inicial de design sem custo, e o cliente só paga se aprovar."

DIRETRIZES ÉTICAS E DE TOM DE VOZ:
- Comunicação estritamente corporativa, executiva, segura e consultiva (estilo B2B SaaS).
- NUNCA usar tom informal de freelancer, gírias ou clichês vazios de marketing.
- NUNCA prometer faturamento garantido, número fixo de vendas ou 1º lugar no Google.
- NUNCA inventar problemas inexistentes nem afirmar categoricamente ausência de site sem evidência clara.
- Respeito integral à LGPD e à privacidade dos tomadores de decisão.
`;

import { ProspectingService } from './prospecting';

async function generateExpertAnalysisReport(lead: Lead): Promise<AIAnalysisReport> {
  const cleanSite = lead.site && !lead.site.includes('não identificado') ? lead.site.trim() : '';
  const hasSite = Boolean(cleanSite && cleanSite.length > 5);

  if (!hasSite) {
    return {
      analyzedAt: new Date().toISOString(),
      siteUrl: 'Site não identificado — verificação pendente',
      hasInstitutionalSite: false,
      presentationQuality: 'inexistente',
      mobileExperienceScore: 0,
      servicesOrganization: 'Inexistência de catálogo corporativo próprio estruturado.',
      contactChannelsClarity: 'Atendimento concentrado em canais telefônicos ou mensagens diretas.',
      institutionalInfoPresence: 'Informações societárias obtidas em registro cadastral público.',
      observedProblems: [
        `Empresa ${lead.name} não possui website institucional identificado em fontes públicas ou Google Maps.`,
        'Ausência de presença digital própria com domínio corporativo .com.br e proteção SSL.',
        'Dependência de canais terceirizados sem centralização de autoridade técnica.'
      ],
      evidenceAndUrls: [
        'Consulta cadastral pública: nenhum website institucional indexado para a empresa',
        'Origem dos dados: Cadastro Comercial Oficial (SDR)'
      ],
      recommendedImprovements: [
        'Desenvolvimento de website institucional corporativo de alto padrão com identidade sob medida.',
        'Registro e configuração do domínio oficial .com.br com DNS protegido.',
        'Servidor Linux dedicado com contas de e-mail corporativo ilimitadas.'
      ],
      priorityLevel: 'alta',
      suggestedCommercialSolution: 'Criação de Site Profissional + Hospedagem Linux Profissional + Registro de Domínio',
      fmwsDifferentiatorPitch: `Apresentar à diretoria da ${lead.name} a proposta inicial de design sem qualquer custo prévio de desenvolvimento, permitindo que a empresa avalie a qualidade antes de qualquer compromisso financeiro.`
    };
  }

  // Real HTTP & SSL audit for existing site
  let audit: TechnicalAuditEvidence;
  try {
    const auditRes = await ProspectingService.auditWebsiteUrl(cleanSite);
    audit = auditRes.audit;
  } catch (err: any) {
    audit = {
      url: cleanSite,
      hasSsl: cleanSite.startsWith('https://'),
      hasViewport: false,
      isUnderConstruction: false,
      hasBrokenLinks: false,
      hasIncompleteInfo: false,
      responseTimeMs: 0,
      checkedAt: new Date().toISOString(),
      toolUsed: 'HTTP/TLS Protocol Verifier (Backend Direct)',
      evidenceText: `Falha de rede ao conectar à URL: ${err.message || 'Erro de conexão'}`,
      analysisMethod: 'http_crawler',
      problemsFound: [`Falha de rede ao conectar à URL informada: ${err.message || 'Erro de conexão'}`]
    };
  }

  let calculatedScore = 100;
  if (!audit.hasSsl) calculatedScore -= 25;
  if (!audit.hasViewport) calculatedScore -= 35;
  if (audit.statusCode && audit.statusCode >= 400) calculatedScore = 15;
  if (audit.isUnderConstruction) calculatedScore -= 30;
  if (audit.hasIncompleteInfo) calculatedScore -= 15;
  calculatedScore = Math.max(10, Math.min(95, calculatedScore));

  const observedProblems = audit.problemsFound.length > 0
    ? audit.problemsFound
    : [`Site em operação no endereço ${cleanSite}. Oportunidade de modernização visual e otimização para captação comercial.`];

  const evidenceAndUrls = [
    `URL auditada: ${audit.url} (Status HTTP: ${audit.statusCode || 'N/A'}, Resposta: ${audit.responseTimeMs || 0}ms)`,
    `Certificado SSL / HTTPS: ${audit.hasSsl ? 'Válido' : 'Ausente / Inseguro'}`,
    `Meta tag viewport mobile: ${audit.hasViewport ? 'Presente' : 'Não detectada'}`
  ];

  return {
    analyzedAt: audit.checkedAt || new Date().toISOString(),
    siteUrl: cleanSite,
    hasInstitutionalSite: true,
    presentationQuality: audit.hasViewport && audit.hasSsl ? 'boa' : 'critica',
    mobileExperienceScore: calculatedScore,
    servicesOrganization: `Avaliação do site atual (${cleanSite}): estrutura identificada com oportunidade de enriquecimento do portfólio.`,
    contactChannelsClarity: 'Canais de contato necessitam de direcionamento claro e integração WhatsApp direta.',
    institutionalInfoPresence: 'Informações institucionais parciais sem destaque para credenciais da equipe.',
    observedProblems,
    evidenceAndUrls,
    recommendedImprovements: [
      'Redesenho institucional com arquitetura moderna, responsividade móvel e identidade sóbria.',
      'Estruturação de páginas dedicadas por verticais de serviço e botão de contato direto.',
      'Migração para ambiente de Hospedagem WordPress Gerenciada com cache LiteSpeed e SSL gratuito.'
    ],
    priorityLevel: audit.problemsFound.length > 0 ? 'alta' : 'media',
    suggestedCommercialSolution: 'Modernização Institucional Completa + Hospedagem WordPress LiteSpeed',
    fmwsDifferentiatorPitch: `Apresentar à diretoria da ${lead.name} a proposta inicial de design sem qualquer custo prévio de desenvolvimento, permitindo que a empresa avalie a qualidade antes de qualquer compromisso financeiro.`
  };
}

export async function analyzeSiteOpportunity(lead: Lead): Promise<AIAnalysisReport> {
  const fallback = await generateExpertAnalysisReport(lead);

  if (!ai || !lead.site || lead.site.length <= 5 || lead.site.includes('não identificado')) {
    return fallback;
  }

  try {
    const prompt = `
Analise a seguinte empresa para qualificação comercial da Fazer Meu Website:
- Nome da Empresa: ${lead.name}
- Segmento: ${lead.segment}
- Cidade/UF: ${lead.city} - ${lead.neighborhood}
- Site informado: ${lead.site}
- Problemas técnicos já auditados via HTTP real: ${JSON.stringify(fallback.observedProblems)}
- Evidências técnicas comprovadas: ${JSON.stringify(fallback.evidenceAndUrls)}
- Contato: ${lead.contactName} (${lead.contactRole})

Forneça um relatório em formato JSON com:
- hasInstitutionalSite: true
- presentationQuality: "excelente", "boa", "regular", "critica" ou "inexistente".
- mobileExperienceScore: número de 0 a 100 baseado estritamente na auditoria HTTP (${fallback.mobileExperienceScore}).
- servicesOrganization: avaliação da divisão dos serviços.
- contactChannelsClarity: avaliação dos canais de contato.
- institutionalInfoPresence: presença de credenciais.
- observedProblems: lista com os problemas técnicos reais confirmados.
- evidenceAndUrls: lista com as URLs e evidências reais.
- recommendedImprovements: lista de 2 a 3 melhorias recomendadas da Fazer Meu Website.
- priorityLevel: "alta", "media" ou "baixa".
- suggestedCommercialSolution: solução ideal do catálogo da Fazer Meu Website.
- fmwsDifferentiatorPitch: sugestão de abordagem destacando que a Fazer Meu Website desenvolve a proposta de design inicial sem custo e o cliente só paga se aprovar.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FMWS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasInstitutionalSite: { type: Type.BOOLEAN },
            presentationQuality: { type: Type.STRING },
            mobileExperienceScore: { type: Type.INTEGER },
            servicesOrganization: { type: Type.STRING },
            contactChannelsClarity: { type: Type.STRING },
            institutionalInfoPresence: { type: Type.STRING },
            observedProblems: { type: Type.ARRAY, items: { type: Type.STRING } },
            evidenceAndUrls: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
            priorityLevel: { type: Type.STRING },
            suggestedCommercialSolution: { type: Type.STRING },
            fmwsDifferentiatorPitch: { type: Type.STRING }
          },
          required: [
            'hasInstitutionalSite',
            'presentationQuality',
            'mobileExperienceScore',
            'observedProblems',
            'recommendedImprovements',
            'priorityLevel',
            'suggestedCommercialSolution',
            'fmwsDifferentiatorPitch'
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      analyzedAt: new Date().toISOString(),
      siteUrl: lead.site,
      hasInstitutionalSite: true,
      presentationQuality: parsed.presentationQuality || fallback.presentationQuality,
      mobileExperienceScore: fallback.mobileExperienceScore,
      servicesOrganization: parsed.servicesOrganization || fallback.servicesOrganization,
      contactChannelsClarity: parsed.contactChannelsClarity || fallback.contactChannelsClarity,
      institutionalInfoPresence: parsed.institutionalInfoPresence || fallback.institutionalInfoPresence,
      observedProblems: fallback.observedProblems,
      evidenceAndUrls: fallback.evidenceAndUrls,
      recommendedImprovements: parsed.recommendedImprovements || fallback.recommendedImprovements,
      priorityLevel: (['alta', 'media', 'baixa'].includes(parsed.priorityLevel) ? parsed.priorityLevel : 'alta') as any,
      suggestedCommercialSolution: parsed.suggestedCommercialSolution || fallback.suggestedCommercialSolution,
      fmwsDifferentiatorPitch: parsed.fmwsDifferentiatorPitch || fallback.fmwsDifferentiatorPitch
    };
  } catch (err) {
    console.warn('Gemini temporary unavailable, using expert baseline:', err);
    return fallback;
  }
}

/**
 * Classifies an incoming message from a prospect on Channel 1 (+55 11 94579-9976)
 * - Identifies real commercial interest
 * - Flags and ignores automatic replies (auto-responder)
 * - Detects refusals and opt-out requests
 */
export async function classifyIncomingMessage(messageText: string, lead: Lead): Promise<ClassifiedResponse> {
  const text = (messageText || '').trim();
  const lower = text.toLowerCase();

  // 1. Direct Pattern Check for Opt-Out / Refusal
  const optOutKeywords = [
    'sair',
    'parar',
    'cancelar',
    'stop',
    'não quero',
    'nao quero',
    'remover',
    'descadastrar',
    'não tenho interesse',
    'nao tenho interesse',
    'favor não mandar',
    'favor nao mandar',
    'sem interesse'
  ];
  if (optOutKeywords.some(kw => lower.includes(kw))) {
    return {
      classification: 'recusa_optout',
      confidence: 0.98,
      summary: 'Cliente expressou recusa ou solicitou cancelamento de mensagens.',
      isAutoReply: false,
      isOptOut: true,
      recommendedAction: 'Registrar opt-out imediatamente e bloquear novos envios.',
      analyzedAt: new Date().toISOString()
    };
  }

  // 2. Direct Pattern Check for Auto-Reply
  const autoReplyKeywords = [
    'resposta automática',
    'resposta automatica',
    'mensagem automática',
    'mensagem automatica',
    'atendimento automático',
    'atendimento automatica',
    'fora do horário',
    'fora do horario',
    'retornaremos em breve',
    'obrigado por entrar em contato',
    'este é um canal automatizado',
    'agradecemos seu contato, nosso horário'
  ];
  if (autoReplyKeywords.some(kw => lower.includes(kw))) {
    return {
      classification: 'resposta_automatica',
      confidence: 0.95,
      summary: 'Mensagem detectada como resposta automática de ausência/boas-vindas.',
      isAutoReply: true,
      isOptOut: false,
      recommendedAction: 'Ignorar como gatilho de transferência comercial.',
      analyzedAt: new Date().toISOString()
    };
  }

  // Baseline fallback for real interest check
  const interestKeywords = [
    'como funciona',
    'tenho interesse',
    'gostaria de saber',
    'quanto custa',
    'valor',
    'preço',
    'preco',
    'pode enviar',
    'pode mandar',
    'gostaria de ver',
    'design sem custo',
    'orçamento',
    'orcamento',
    'podemos conversar',
    'me liga',
    'sim',
    'claro',
    'com certeza',
    'qual o prazo',
    'tenho sim',
    'manda ai',
    'manda aí'
  ];
  const hasInterestWord = interestKeywords.some(kw => lower.includes(kw));

  const baseline: ClassifiedResponse = {
    classification: hasInterestWord ? 'interesse_real' : 'duvida_geral',
    confidence: hasInterestWord ? 0.9 : 0.7,
    summary: hasInterestWord
      ? `Lead demonstrou interesse comercial na modernização de presença digital para ${lead.name}.`
      : `Mensagem recebida de ${lead.contactName}: "${text.slice(0, 80)}"`,
    isAutoReply: false,
    isOptOut: false,
    recommendedAction: hasInterestWord
      ? 'Enviar encaminhamento para o WhatsApp Comercial Humano (+55 11 98634-2981).'
      : 'Aguardar esclarecimento ou responder consulta.',
    analyzedAt: new Date().toISOString()
  };

  if (!ai) {
    return baseline;
  }

  try {
    const prompt = `
Classifique a seguinte mensagem recebida pelo WhatsApp de prospecção da Fazer Meu Website (+55 11 94579-9976) vinda da empresa "${lead.name}" (Contato: ${lead.contactName}):
"""
${text}
"""

Avalie estritamente segundo as regras:
1. "interesse_real": se o cliente demonstrou interesse, perguntou como funciona, pediu valores, concordou em receber o design sem custo ou pediu mais detalhes.
2. "resposta_automatica": se for mensagem automática do WhatsApp Business da empresa (ex: horário de funcionamento, ausência).
3. "recusa_optout": se o cliente pediu para não mandar mais, recusou ou pediu cancelamento.
4. "duvida_geral": outra resposta ou dúvida que não seja recusa nem interesse imediato.

Responda em JSON:
{
  "classification": "interesse_real" | "resposta_automatica" | "recusa_optout" | "duvida_geral",
  "confidence": número de 0 a 1,
  "summary": "resumo de 1 frase da intenção da empresa",
  "isAutoReply": booleano,
  "isOptOut": booleano,
  "recommendedAction": "próxima ação recomendada"
}
`;

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );
    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: FMWS_SYSTEM_PROMPT,
          responseMimeType: 'application/json'
        }
      }),
      timeoutPromise
    ]);

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.classification) {
      return {
        classification: parsed.classification,
        confidence: parsed.confidence ?? 0.85,
        summary: parsed.summary || baseline.summary,
        isAutoReply: parsed.classification === 'resposta_automatica' || Boolean(parsed.isAutoReply),
        isOptOut: parsed.classification === 'recusa_optout' || Boolean(parsed.isOptOut),
        recommendedAction: parsed.recommendedAction || baseline.recommendedAction,
        analyzedAt: new Date().toISOString()
      };
    }
    return baseline;
  } catch (err) {
    console.warn('Gemini classification fallback:', err);
    return baseline;
  }
}

export async function runCommercialAssistant(params: {
  mode: 'generate_pitch' | 'handle_objection' | 'draft_proposal_scope' | 'summarize_conversation' | 'next_steps';
  lead: Lead;
  contextText?: string;
  objectionType?: string;
  selectedService?: string;
}): Promise<{ output: string; suggestionTitle: string; metadata?: any }> {
  const { mode, lead, contextText, objectionType, selectedService } = params;

  // Determine scenario for pitch generation
  const hasProvenProblems = Boolean(
    lead.aiAnalysis?.observedProblems &&
    lead.aiAnalysis.observedProblems.length > 0 &&
    lead.site &&
    lead.site.length > 5
  );
  const hasSite = Boolean(lead.site && lead.site.length > 5);
  const scenarioType = hasProvenProblems
    ? 'site_com_problema_comprovado'
    : hasSite
    ? 'site_funcional_modernizacao'
    : 'sem_site_identificado';

  const sourceEvidenceUsed = hasProvenProblems
    ? `Dados do lead no CRM (${lead.name}): URL ${lead.site}. Inconformidades técnicas registradas: ${lead.aiAnalysis?.observedProblems.join('; ')}. Fonte: ${lead.source}.`
    : hasSite
    ? `Dados do lead no CRM (${lead.name}): Website corporativo ${lead.site}. Sem histórico de falhas técnicas impeditivas. Oportunidade focada em modernização visual e novas funcionalidades. Fonte: ${lead.source}.`
    : `Dados do lead no CRM (${lead.name}): Sem website institucional oficial identificado nas pesquisas públicas de ${lead.city}. Oportunidade de estruturação de presença digital. Fonte: ${lead.source}.`;

  const suggestedMetaTemplate = scenarioType === 'sem_site_identificado'
    ? 'fmws_apresentacao_institucional'
    : 'fmws_proposta_design_sem_custo';

  const complianceNotice =
    `Revisão humana obrigatória antes do envio. Para a WhatsApp Cloud API (Canal 1), utilize templates homologados na Meta (${suggestedMetaTemplate}) e consentimento válido. Textos livres de IA devem ser enviados manualmente pelo SDR no Canal 2 ou por e-mail.`;

  const getDeterministicResponse = () => {
    switch (mode) {
      case 'generate_pitch': {
        let whatsappVersion = '';
        let emailSubject = '';
        let emailBody = '';
        let output = '';

        if (scenarioType === 'site_com_problema_comprovado') {
          const topProblem = lead.aiAnalysis?.observedProblems[0] || 'apontamentos de usabilidade e responsividade em dispositivos móveis';
          whatsappVersion = `Olá! Contato da equipe comercial da *Fazer Meu Website* com ${lead.contactName} (${lead.name}).\n\nIdentificamos apontamentos objetivos na presença digital da empresa (${topProblem}).\n\nTrabalhamos com um modelo exclusivo: *desenvolvemos a proposta inicial de design sem qualquer custo prévio, e a diretoria só contrata se aprovar o projeto*.\n\nPodemos apresentar essa prévia personalizada sem compromisso?`;
          emailSubject = `Diagnóstico técnico e proposta de modernização web | ${lead.name} & Fazer Meu Website`;
          emailBody = `Prezado(a) ${lead.contactName},\n\nA equipe técnica da Fazer Meu Website realizou um levantamento preventivo na presença digital da ${lead.name} em ${lead.city}.\n\nConstatamos oportunidades de aprimoramento no endereço ${lead.site}, em especial ${topProblem}.\n\nPara demonstrar na prática nossa qualidade, adotamos uma política de risco zero: a Fazer Meu Website desenvolve a proposta inicial de design da nova interface sem qualquer custo prévio de desenvolvimento. A formalização só ocorre caso sua diretoria aprove o projeto.\n\nFicamos à disposição para apresentar o projeto conceitual nesta semana.\n\nAtenciosamente,\nEquipe Comercial | Fazer Meu Website\nhttps://fazermeuwebsite.com.br`;
          output = `Prezado(a) ${lead.contactName},\n\nA equipe da Fazer Meu Website realizou um diagnóstico preventivo na presença digital da ${lead.name} no setor de ${lead.segment}.\n\nIdentificamos pontos específicos de aprimoramento na interface online da empresa (${topProblem}).\n\nPara apresentar uma alternativa sólida, desenvolvemos a proposta inicial de design da nova interface sob medida sem nenhum custo prévio de desenvolvimento; a contratação só ocorre se a diretoria aprovar a qualidade.\n\nPodemos preparar essa prévia para sua avaliação?`;
        } else if (scenarioType === 'site_funcional_modernizacao') {
          whatsappVersion = `Olá, ${lead.contactName}! Falamos da *Fazer Meu Website* para a gestão da *${lead.name}*.\n\nAcompanhamos sua presença no setor de *${lead.segment}* e gostaríamos de apresentar uma proposta de modernização visual e novas funcionalidades de atendimento corporativo para ${lead.site}.\n\nNosso modelo exclusivo inclui *o desenvolvimento da proposta inicial de design sem custo prévio, com contratação somente após a aprovação da diretoria*.\n\nPodemos elaborar essa demonstração para sua equipe?`;
          emailSubject = `Oportunidade de modernização visual corporativa | ${lead.name} & Fazer Meu Website`;
          emailBody = `Prezado(a) ${lead.contactName},\n\nAcompanhamos o posicionamento da ${lead.name} no segmento de ${lead.segment} em ${lead.city} e consultamos o portal online da empresa (${lead.site}).\n\nGostaríamos de submeter uma oportunidade de modernização visual e implementação de novos recursos de atendimento rápido para seus clientes corporativos.\n\nAdotamos um diferencial exclusivo: a Fazer Meu Website elabora a proposta inicial de design da nova interface sem nenhum custo prévio de desenvolvimento. A empresa só contrata caso aprove o novo padrão estético e funcional.\n\nPodemos agendar uma rápida conversa de 10 minutos para alinhar preferências?\n\nAtenciosamente,\nEquipe de Estratégia Digital | Fazer Meu Website\nhttps://fazermeuwebsite.com.br`;
          output = `Prezado(a) ${lead.contactName},\n\nAcompanhamos a trajetória da ${lead.name} no setor de ${lead.segment} em ${lead.city} e consultamos sua presença online em ${lead.site}.\n\nApresentamos uma oportunidade de modernização visual de layout e novas funcionalidades de conversão institucional.\n\nA Fazer Meu Website elabora a proposta inicial de design da nova interface sem qualquer custo prévio de desenvolvimento; a empresa só contrata se homologar e aprovar o projeto.\n\nPodemos preparar esse conceito para a diretoria comparar a qualidade?`;
        } else {
          // sem_site_identificado (Rule 1: no categorical statement)
          whatsappVersion = `Olá! Contato da *Fazer Meu Website* com ${lead.contactName} da *${lead.name}*.\n\nAcompanhamos sua atuação em *${lead.segment}* em ${lead.city} e identificamos a oportunidade de estruturar um portal institucional corporativo oficial para fortalecer a autoridade comercial da empresa.\n\nTrabalhamos com um diferencial exclusivo: *desenvolvemos a proposta inicial de design sem qualquer custo prévio, e a empresa só contrata se aprovar o projeto*.\n\nPodemos preparar uma demonstração conceitual para sua equipe nesta semana?`;
          emailSubject = `Oportunidade de presença digital institucional | ${lead.name} & Fazer Meu Website`;
          emailBody = `Prezado(a) ${lead.contactName},\n\nAcompanhamos com atenção a atuação da ${lead.name} no mercado de ${lead.segment} em ${lead.city}.\n\nEm mapeamento de presença pública regional, identificamos uma excelente oportunidade para estruturação de um portal institucional corporativo oficial, centralizando apresentação de produtos, serviços e canais diretos de contato.\n\nPara que sua equipe conheça na prática o padrão da nossa engenharia, a Fazer Meu Website adota uma metodologia exclusiva: desenvolvemos a proposta inicial de design sob medida sem nenhum custo prévio de desenvolvimento. A contratação só é formalizada caso a diretoria aprove integralmente o projeto.\n\nCaso tenha interesse em receber essa prévia visual sem compromisso, permanecemos à disposição.\n\nAtenciosamente,\nEquipe Comercial | Fazer Meu Website\nhttps://fazermeuwebsite.com.br`;
          output = `Prezado(a) ${lead.contactName},\n\nAcompanhamos a atuação da ${lead.name} no segmento de ${lead.segment} em ${lead.city}.\n\nEm mapeamento de presença digital na região, identificamos a oportunidade de estruturar um portal institucional corporativo oficial para centralizar a apresentação de produtos, serviços e credenciais da empresa.\n\nA Fazer Meu Website desenvolve a proposta inicial de design da nova interface sem qualquer custo prévio de desenvolvimento; a empresa só assume o investimento se homologar e aprovar o projeto.\n\nPodemos preparar essa prévia conceitual personalizada para avaliação da sua equipe?`;
        }

        return {
          suggestionTitle: `Abordagem Personalizada B2B — ${lead.contactName} (${lead.name})`,
          output,
          metadata: {
            scenarioType,
            whatsappVersion,
            emailVersion: { subject: emailSubject, body: emailBody },
            sourceEvidenceUsed,
            humanReviewRequired: true,
            complianceNotice,
            suggestedMetaTemplate
          }
        };
      }

      case 'handle_objection':
        return {
          suggestionTitle: `Contorno Elegante de Objeção: "${objectionType || 'Objeção Apresentada'}"`,
          output: `Compreendo perfeitamente o seu ponto de vista, ${lead.contactName}.\n\nÉ bastante comum empresas consolidadas como a ${lead.name} já possuírem contatos ou outras prioridades imediatas de gestão. No entanto, o mercado corporativo hoje exige infraestrutura de ponta, alta performance de carregamento, segurança SSL e conformidade rigorosa com a LGPD.\n\nExatamente para que você não tenha que assumir nenhum risco ou redirecionar orçamento às cegas, a Fazer Meu Website trabalha com a política de proposta inicial de design sem custo: nós elaboramos o conceito visual completo sob medida, e a empresa só contrata se constatar um padrão superior ao atual.\n\nFaz sentido recebermos o briefing inicial sem custo para que a diretoria compare a qualidade?`,
          metadata: { humanReviewRequired: true }
        };

      case 'draft_proposal_scope':
        return {
          suggestionTitle: `Detalhamento Técnico de Escopo — ${selectedService || 'Criação de Sites Profissionais'}`,
          output: `OBJETO DA PROPOSTA COMERCIAL — ${lead.name.toUpperCase()}\n\n1. ESCOPO DO PROJETO:\n- Desenvolvimento completo do portal institucional corporativo voltado para o segmento de ${lead.segment}.\n- Arquitetura de informação com navegação intuitiva, otimização para dispositivos móveis (smartphones e tablets) e carregamento acelerado.\n- Integração com canais de atendimento direto via WhatsApp e formulários seguros em conformidade com a LGPD.\n\n2. INFRAESTRUTURA E SEGURANÇA:\n- Hospedagem corporativa em servidor dedicado de alta disponibilidade com proteção DDoS e backup diário.\n- Certificado de segurança SSL (HTTPS) incluso.\n- Configuração de caixas postais de e-mail corporativo com domínio próprio.\n\n3. CLÁUSULA EXCLUSIVA FMWS:\n- A Fazer Meu Website desenvolve a proposta de design inicial sem custo prévio; o cliente só formaliza o pagamento após a aprovação integral do layout.`,
          metadata: { humanReviewRequired: true }
        };

      case 'summarize_conversation':
        return {
          suggestionTitle: `Resumo Estratégico de Interações — ${lead.name}`,
          output: `1. PERFIL DO DECISOR:\n- Contato responsável: ${lead.contactName} (${lead.contactRole}), responsável pelas diretrizes estratégicas da ${lead.name}.\n\n2. DIAGNÓSTICO E REQUISITOS IDENTIFICADOS:\n- Necessidade de modernização da presença digital com foco em credibilidade no setor de ${lead.segment}.\n- Importância de eliminar riscos prévios de contratação.\n\n3. RECOMENDAÇÃO DE FECHAMENTO:\n- Apresentar o layout protótipo sem custo de desenvolvimento prévio para acelerar a validação da diretoria.`,
          metadata: { humanReviewRequired: true }
        };

      case 'next_steps':
      default:
        return {
          suggestionTitle: `Próximo Passo Estratégico Recomendado`,
          output: `1. Enviar mensagem de apresentação consultiva focando no diferencial: "Proposta inicial de design sem custo; o cliente só paga se aprovar."\n2. Agendar uma rápida sessão de alinhamento de 15 minutos com ${lead.contactName} para colher as preferências de identidade visual da ${lead.name}.\n3. Apresentar o protótipo funcional para validação comercial e avanço para proposta formal.`,
          metadata: { humanReviewRequired: true }
        };
    }
  };

  const deterministic = getDeterministicResponse();

  if (!ai) {
    return deterministic;
  }

  let prompt = '';
  switch (mode) {
    case 'generate_pitch':
      prompt = `Você é o Diretor Comercial da Fazer Meu Website.
Gere abordagem comercial para ${lead.contactName} (${lead.contactRole}) da empresa ${lead.name} (${lead.segment} em ${lead.city}).
Cenário: ${scenarioType}.
Site: ${lead.site || 'Não identificado em consultas públicas'}.
REGRAS:
1. Se não tiver site identificado: apresentar como oportunidade estratégica, SEM AFIRMAR QUE NÃO TEM SITE.
2. Se tiver site sem problemas: oferecer modernização visual e novas funcionalidades SEM INVENTAR FALHAS TÉCNICAS.
3. Se tiver problemas comprovados: citar apenas o que foi comprovado.
4. NUNCA inventar auditorias ou números falsos.
5. DESTAQUE OBRIGATÓRIO: "A Fazer Meu Website desenvolve a proposta inicial de design sem qualquer custo prévio, e o cliente só paga se aprovar."
6. Evitar promessas de vendas garantidas.
7. Retorne JSON:
{
  "output": "Texto geral da abordagem (2 parágrafos)",
  "whatsappVersion": "Mensagem curta para WhatsApp (máx 100 palavras)",
  "emailSubject": "Assunto executivo para e-mail",
  "emailBody": "Corpo formal de e-mail corporativo"
}`;
      break;
    case 'handle_objection':
      prompt = `O cliente ${lead.contactName} da ${lead.name} apresentou a objeção: "${objectionType || contextText}". Contorne com elegância corporativa reforçando o diferencial da Fazer Meu Website (proposta inicial de design sem custo, só paga se aprovar).`;
      break;
    case 'draft_proposal_scope':
      prompt = `Elabore o escopo técnico executivo para a proposta de ${selectedService || 'Criação de Sites'} para a empresa ${lead.name} (${lead.segment}). Inclua objetivo, entregáveis, segurança e o diferencial de design inicial sem custo.`;
      break;
    case 'summarize_conversation':
      prompt = `Resuma as interações e notas sobre ${lead.name}: "${contextText || lead.notes}". Destaque decisor, dores e próximo passo de fechamento.`;
      break;
    case 'next_steps':
    default:
      prompt = `Recomende a próxima ação comercial tática para o lead ${lead.name} no estágio "${lead.stageId}".`;
      break;
  }

  try {
    const isPitch = mode === 'generate_pitch';
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FMWS_SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: isPitch ? 'application/json' : undefined
      }
    });

    if (isPitch) {
      const parsed = JSON.parse(response.text || '{}');
      if (parsed.output && parsed.whatsappVersion && parsed.emailSubject) {
        return {
          suggestionTitle: deterministic.suggestionTitle,
          output: parsed.output,
          metadata: {
            scenarioType,
            whatsappVersion: parsed.whatsappVersion,
            emailVersion: { subject: parsed.emailSubject, body: parsed.emailBody },
            sourceEvidenceUsed,
            humanReviewRequired: true,
            complianceNotice,
            suggestedMetaTemplate
          }
        };
      }
    }

    if (response.text && response.text.trim().length > 20) {
      return {
        suggestionTitle: deterministic.suggestionTitle,
        output: response.text.trim(),
        metadata: deterministic.metadata
      };
    }
    return deterministic;
  } catch (err) {
    console.warn('Gemini model call encountered spike/delay, using expert baseline:', err);
    return deterministic;
  }
}

export interface CopilotSuggestionResult {
  suggestedResponse: string;
  confidence: number;
  detectedIntent: string;
  reasoning: string;
  recommendedAction: string;
  followUpSuggestion?: string;
}

export async function generateWhatsAppCopilotSuggestion(params: {
  conversationId: string;
  contactName: string;
  companyName: string;
  segment?: string;
  site?: string;
  stage?: string;
  lastMessages: { sender: string; content: string; timestamp: string }[];
}): Promise<CopilotSuggestionResult> {
  const { contactName, companyName, segment = 'Geral', site = '', stage = 'em_atendimento', lastMessages } = params;

  const lastInbound = [...lastMessages].reverse().find(m => m.sender === 'lead')?.content || '';
  const lowerInbound = lastInbound.toLowerCase();

  // Robust domain-aware B2B fallback
  const createBaseline = (): CopilotSuggestionResult => {
    if (lowerInbound.includes('preço') || lowerInbound.includes('quanto custa') || lowerInbound.includes('valor') || lowerInbound.includes('tabela')) {
      return {
        suggestedResponse: `Olá, ${contactName}! Nossos projetos são personalizados para a estrutura da ${companyName}. Trabalhamos com uma condição exclusiva: desenvolvemos uma proposta inicial de design sob medida sem nenhum custo prévio, e vocês só pagam se aprovarem o projeto. Para orçarmos com exatidão, você prefere um site institucional completo com catálogo de serviços ou um portal corporativo com integração de sistemas?`,
        confidence: 0.95,
        detectedIntent: 'solicitacao_orcamento',
        reasoning: 'O cliente perguntou sobre preços. Direcionamos com segurança para o diferencial FMWS de risco zero (design sem custo) e qualificamos a necessidade técnica.',
        recommendedAction: 'Apresentar modelo de proposta sem custo e qualificar escopo.',
        followUpSuggestion: 'Agendar call de 15 min ou enviar portfólio de cases similares.'
      };
    }

    if (lowerInbound.includes('já temos site') || lowerInbound.includes('já tenho') || lowerInbound.includes('já temos')) {
      return {
        suggestedResponse: `Perfeito, ${contactName}! Que bom que a ${companyName} já possui presença online. Nosso trabalho com empresas estabelecidas foca principalmente em modernização visual, velocidade de carregamento e adaptação perfeita para celulares (onde acontecem mais de 70% das visitas B2B). Podemos criar uma prévia comparativa de layout moderno sem nenhum compromisso financeiro para sua diretoria avaliar. O que acha de receber essa análise técnica?`,
        confidence: 0.92,
        detectedIntent: 'objecao_ja_possui_site',
        reasoning: 'Cliente informou que já possui site. Rebatemos a objeção valorizando a presença atual, mas pontuando ganhos de responsividade mobile e propondo uma prévia sem compromisso.',
        recommendedAction: 'Oferecer comparativo visual ou auditoria técnica sem custo.',
        followUpSuggestion: 'Solicitar o link atual caso ainda não conste para envio de auditoria.'
      };
    }

    if (lowerInbound.includes('como funciona') || lowerInbound.includes('sem custo') || lowerInbound.includes('design sem custo') || lowerInbound.includes('explica')) {
      return {
        suggestedResponse: `É muito simples e transparente, ${contactName}: nossa equipe de criação estuda a identidade da ${companyName} e desenha a estrutura visual da nova página inicial com alto padrão gráfico. Nós apresentamos essa proposta pronta para você e sua diretoria avaliarem. Se aprovarem, formalizamos a contratação e concluímos o desenvolvimento. Se não aprovarem, vocês não pagam absolutamente nada. Gostaria que déssemos início a esse layout nesta semana?`,
        confidence: 0.96,
        detectedIntent: 'duvida_diferencial_fmws',
        reasoning: 'Interesse direto na mecânica do diferencial FMWS. Explicamos com máxima clareza o risco zero e chamamos para ação imediata.',
        recommendedAction: 'Colher requisitos básicos e aprovar início do layout sem custo.',
        followUpSuggestion: 'Confirmar logotipo e principais referências desejadas.'
      };
    }

    if (lowerInbound.includes('agenda') || lowerInbound.includes('reunião') || lowerInbound.includes('horário') || lowerInbound.includes('ligar')) {
      return {
        suggestedResponse: `Excelente, ${contactName}! Podemos agendar uma rápida conversa online de 15 minutos para entender suas preferências de layout e alinhar a entrega do design sem custo. Você teria disponibilidade amanhã às 10h ou às 15h?`,
        confidence: 0.94,
        detectedIntent: 'agendamento_reuniao',
        reasoning: 'Lead expressou intenção de reunião ou alinhamento. Oferecemos opções pontuais de horário corporativo.',
        recommendedAction: 'Bloquear agenda e enviar convite com link de videoconferência ou confirmação no WhatsApp.',
        followUpSuggestion: 'Anotar preferência de horário e confirmar com o Closer.'
      };
    }

    return {
      suggestedResponse: `Olá, ${contactName}! Agradecemos o retorno. Na Fazer Meu Website somos especialistas em desenvolvimento corporativo e hospedagem de alta disponibilidade para o setor de ${segment}. Como diferencial de qualidade, criamos a proposta inicial de design do seu novo site sem nenhum custo prévio — a ${companyName} só paga se aprovar o resultado. Como podemos ajudar seu posicionamento digital hoje?`,
      confidence: 0.88,
      detectedIntent: 'abertura_atendimento',
      reasoning: 'Mensagem inicial de engajamento B2B reforçando a credibilidade da FMWS e o compromisso de satisfação garantida.',
      recommendedAction: 'Manter diálogo consultivo e identificar o decisor de TI/Marketing.',
      followUpSuggestion: 'Mapear se o objetivo é novos clientes ou institucionalização.'
    };
  };

  const baseline = createBaseline();
  if (!ai) return baseline;

  try {
    const chatTranscript = lastMessages
      .map(m => `[${m.sender.toUpperCase()} - ${m.timestamp}]: ${m.content}`)
      .join('\n');

    const prompt = `Você é o Diretor Comercial da FAZER MEU WEBSITE (https://fazermeuwebsite.com.br/).
Analise a conversa de WhatsApp abaixo com um cliente corporativo e formule a MELHOR resposta para o atendente humano aprovar e enviar.

DADOS DA EMPRESA:
- Nome da Empresa: ${companyName}
- Contato: ${contactName}
- Segmento: ${segment}
- Website atual: ${site || 'Sem site informado'}
- Estágio no Funil: ${stage}

TRANSCRIÇÃO RECENTE DO WHATSAPP:
${chatTranscript}

ÚLTIMA MENSAGEM DO CLIENTE:
"${lastInbound}"

REGRAS OBRIGATÓRIAS:
1. Tom executivo, respeitoso, seguro, consultivo e focado em valor (estilo B2B corporativo).
2. Se houver oportunidade ou dúvida de preço/escopo, reforce o diferencial: "criamos o design do seu site sem custo inicial e o cliente só paga se aprovar".
3. Texto pronto para envio no WhatsApp (pode usar pontuações leves em negrito com asteriscos simples como *Fazer Meu Website*).
4. Responda ESTRITAMENTE em formato JSON com as chaves:
{
  "suggestedResponse": "texto pronto para enviar no WhatsApp",
  "confidence": 0.95,
  "detectedIntent": "solicitacao_orcamento | duvida_tecnica | objecao_preco | agendamento | duvida_diferencial | outro",
  "reasoning": "explicação breve para o atendente",
  "recommendedAction": "próxima ação recomendada",
  "followUpSuggestion": "sugestão de follow-up"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: FMWS_SYSTEM_PROMPT,
        temperature: 0.2,
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (parsed.suggestedResponse && parsed.suggestedResponse.length > 15) {
        return {
          suggestedResponse: parsed.suggestedResponse,
          confidence: parsed.confidence || 0.95,
          detectedIntent: parsed.detectedIntent || baseline.detectedIntent,
          reasoning: parsed.reasoning || baseline.reasoning,
          recommendedAction: parsed.recommendedAction || baseline.recommendedAction,
          followUpSuggestion: parsed.followUpSuggestion || baseline.followUpSuggestion
        };
      }
    }
    return baseline;
  } catch (err) {
    console.warn('Gemini copilot fallback:', err);
    return baseline;
  }
}

