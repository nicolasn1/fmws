import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Lead,
  CommercialProposal,
  WhatsAppConfig,
  WhatsAppMessageLog,
  N8nConfig,
  AutomationCentralConfig,
  CrmEnvironment,
  AuditLog,
  CommercialDashboardStats,
  UserProfile,
  CommercialStageId,
  CommercialInteraction,
  LocalProspectingPlace,
  TechnicalAuditEvidence,
  OpportunityTier,
  LocalProspectingFilter,
  CommercialPitchResult,
  ProspectingDatabaseStats,
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppDashboardMetrics,
  WhatsAppAiMode,
  WhatsAppConversationStatus,
  VerificationStatus,
  LeadOriginType
} from '../src/types/crm';
import { OFFICIAL_TRANSFER_MESSAGE } from '../src/data/stages';
import { isGovernmentOrPoliticalEntity } from './prospecting';
import { relDb } from './db/database';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'fmws_crm.json');

export interface EnvironmentStore {
  leads: Lead[];
  proposals: CommercialProposal[];
  whatsappLogs: WhatsAppMessageLog[];
  conversations?: WhatsAppConversation[];
  chatMessages?: WhatsAppChatMessage[];
  auditLogs: AuditLog[];
  interactions: CommercialInteraction[];
  optOutPhoneNumbers: string[];
  prospectingPlaces?: LocalProspectingPlace[];
  contactedPlaces?: string[];
}

export interface DatabaseSchema {
  activeEnvironment: CrmEnvironment;
  production: EnvironmentStore;
  demo: EnvironmentStore;
  whatsappConfig: WhatsAppConfig;
  automationsConfig: AutomationCentralConfig;
  n8nConfig?: AutomationCentralConfig;
  placesApiKey?: string;
  users: UserProfile[];
}

const CANAL_1_DEFAULT = {
  phoneNumber: '+55 11 94579-9976',
  phoneNumberId: '333767429829080',
  wabaId: '419927517859112',
  hasApiToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN),
  status: (process.env.WHATSAPP_ACCESS_TOKEN ? 'conectado' : 'aguardando_configuracao') as 'conectado' | 'aguardando_configuracao' | 'erro'
};

const CANAL_2_DEFAULT = {
  phoneNumber: '+55 11 98634-2981',
  waLink: 'https://wa.me/5511986342981',
  channelType: 'manual_human_no_api' as const,
  deviceInfo: 'Celular e Computador (WhatsApp Web/App)' as const
};

const INITIAL_WHATSAPP_CONFIG: WhatsAppConfig = {
  channel1: CANAL_1_DEFAULT,
  channel2: CANAL_2_DEFAULT,
  webhookVerifyToken: 'fmws_webhook_token_secure_2026',
  lastCheckedAt: new Date().toISOString()
};

// Initial realistic Brazilian B2B companies seed data
const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    name: 'Advocacia Pinheiro & Associados',
    cnpj: '34.891.204/0001-82',
    segment: 'Jurídico e Compliance',
    city: 'São Paulo',
    neighborhood: 'Itaim Bibi',
    site: '',
    instagram: '@pinheiroassociados_adv',
    commercialPhone: '(11) 3450-8900',
    whatsapp: '5511994508900',
    contactName: 'Dr. Roberto Pinheiro',
    contactRole: 'Sócio Fundador',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    consentStatus: 'autorizado',
    consentRecordedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    stageId: 'oportunidade_qualificada',
    priority: 'alta',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Escritório tradicional de advocacia corporativa em expansão para direito tributário. Site institucional próprio não localizado em fontes públicas.',
    dealValue: 6800,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
    aiAnalysis: {
      analyzedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
      siteUrl: 'Site não identificado — verificação pendente',
      hasInstitutionalSite: false,
      presentationQuality: 'inexistente',
      mobileExperienceScore: 0,
      servicesOrganization: 'Escritório opera sem catálogo institucional online de áreas de atuação.',
      contactChannelsClarity: 'Atendimento concentrado em telefone e WhatsApp direto.',
      institutionalInfoPresence: 'Informações societárias obtidas em registro cadastral público.',
      observedProblems: [
        'Site institucional não identificado em fontes públicas após pesquisa cadastral.',
        'Ausência de portal corporativo com certificado de segurança SSL e formulário com conformidade LGPD.',
        'Dependência de indicações diretas sem captação de clientes jurídicos em buscas corporativas.'
      ],
      evidenceAndUrls: [
        'Consulta pública: nenhum website institucional indexado para a empresa.',
        'Origem dos dados: Cadastro Comercial Oficial (SDR)'
      ],
      recommendedImprovements: [
        'Desenvolvimento de website institucional corporativo de alto padrão com identidade sob medida.',
        'Páginas dedicadas para cada vertical do direito empresarial com integração WhatsApp direta.',
        'Servidor Linux seguro com contas de e-mail corporativo ilimitadas e proteção SSL.'
      ],
      priorityLevel: 'alta',
      suggestedCommercialSolution: 'Criação de Site Institucional Jurídico Premium + Hospedagem WordPress Gerenciada',
      fmwsDifferentiatorPitch: 'Apresentar à diretoria da Advocacia Pinheiro & Associados a proposta de design inicial da nova página institucional sem custo prévio de desenvolvimento.'
    }
  },
  {
    id: 'lead-2',
    name: 'Clínica CardioVida Diagnósticos',
    cnpj: '21.455.908/0001-30',
    segment: 'Saúde e Medicina Especializada',
    city: 'Campinas',
    neighborhood: 'Cambuí',
    site: 'https://cardiovida.med.br',
    instagram: '@cardiovida_campinas',
    commercialPhone: '(19) 3290-4100',
    whatsapp: '5519981204100',
    contactName: 'Dra. Mariana Vasconcelos',
    contactRole: 'Diretora Médica',
    source: 'Google Maps / Busca Local',
    lastVerifiedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    consentStatus: 'autorizado',
    stageId: 'atendimento_confirmado',
    humanChatConfirmedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    priority: 'alta',
    assignedTo: 'Beatriz Lima (Closer)',
    notes: 'Cliente clicou no link e iniciou atendimento direto no WhatsApp Comercial (+55 11 98634-2981).',
    dealValue: 7500,
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-3',
    name: 'Engenharia Estrutural Soluções',
    cnpj: '18.992.301/0001-14',
    segment: 'Engenharia Civil e Projetos',
    city: 'Curitiba',
    neighborhood: 'Batel',
    site: '',
    instagram: '@engestrutural_oficial',
    commercialPhone: '(41) 3044-7700',
    whatsapp: '5541999887700',
    contactName: 'Eng. Marcelo Toledo',
    contactRole: 'Sócio Gerente',
    source: 'Indicação Comercial',
    lastVerifiedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    consentStatus: 'autorizado',
    stageId: 'cliente_fechado',
    humanChatConfirmedAt: new Date(Date.now() - 3600000 * 150).toISOString(),
    priority: 'alta',
    assignedTo: 'Beatriz Lima (Closer)',
    notes: 'Contrato assinado! Desenvolvimento do novo portal institucional com portfólio de obras de grande porte.',
    dealValue: 8900,
    createdAt: new Date(Date.now() - 3600000 * 200).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-4',
    name: 'TechLog Soluções em Armazenagem',
    cnpj: '09.332.188/0001-90',
    segment: 'Logística e Supply Chain',
    city: 'Guarulhos',
    neighborhood: 'Cumbica',
    site: 'https://techlog-armazens.com.br',
    commercialPhone: '(11) 2468-1200',
    whatsapp: '5511977661200',
    contactName: 'Fernando Aguiar',
    contactRole: 'Gerente Comercial',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    consentStatus: 'autorizado',
    stageId: 'encaminhamento_enviado',
    transferDispatchedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    priority: 'alta',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Cliente demonstrou interesse via Canal 1; link oficial wa.me/5511986342981 enviado.',
    dealValue: 9200,
    createdAt: new Date(Date.now() - 3600000 * 140).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-5',
    name: 'Vértice Contabilidade Estratégica',
    cnpj: '45.109.870/0001-55',
    segment: 'Contabilidade e BPO Financeiro',
    city: 'Belo Horizonte',
    neighborhood: 'Savassi',
    site: 'http://verticecontabil-mg.com',
    instagram: '@vertice_contabilidade',
    commercialPhone: '(31) 3211-9000',
    whatsapp: '5531988779000',
    contactName: 'Luciana Queiroz',
    contactRole: 'Sócia Diretora',
    source: 'Outbound LinkedIn',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'interessado',
    priority: 'media',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Classificado com interesse real via Gemini: solicitou apresentação da proposta de design sem custo.',
    dealValue: 5400,
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-6',
    name: 'BioEquip Instrumentação Científica',
    cnpj: '11.890.344/0001-11',
    segment: 'Equipamentos Laboratoriais',
    city: 'Ribeirão Preto',
    neighborhood: 'Jardim Botânico',
    site: 'https://bioequip-sp.com.br',
    commercialPhone: '(16) 3602-5500',
    whatsapp: '5516997025500',
    contactName: 'Eduardo Farias',
    contactRole: 'Diretor de Operações',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'cliente_fechado',
    priority: 'alta',
    assignedTo: 'Beatriz Lima (Closer)',
    notes: 'Fechado desenvolvimento de catálogo técnico online e hospedagem corporativa Linux.',
    dealValue: 7100,
    createdAt: new Date(Date.now() - 3600000 * 250).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-7',
    name: 'Alpha Seguros & Benefícios',
    cnpj: '31.200.419/0001-72',
    segment: 'Corretora de Seguros',
    city: 'Rio de Janeiro',
    neighborhood: 'Barra da Tijuca',
    site: '',
    commercialPhone: '(21) 3144-8000',
    whatsapp: '5521989448000',
    contactName: 'Gustavo Mendonça',
    contactRole: 'Head Comercial',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'cliente_fechado',
    priority: 'media',
    assignedTo: 'Beatriz Lima (Closer)',
    notes: 'Fechado site responsivo institucional com cotador simplificado e hospedagem.',
    dealValue: 6400,
    createdAt: new Date(Date.now() - 3600000 * 300).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-8',
    name: 'Solaris Energia Fotovoltaica',
    cnpj: '28.776.512/0001-04',
    segment: 'Energia Solar e Sustentabilidade',
    city: 'Goiânia',
    neighborhood: 'Setor Bueno',
    site: 'https://solaris-energia-go.com.br',
    commercialPhone: '(62) 3998-1000',
    whatsapp: '5562991181000',
    contactName: 'Thiago Nogueira',
    contactRole: 'Gerente Geral',
    source: 'Google Maps / Busca Local',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'encaminhamento_enviado',
    transferDispatchedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    priority: 'media',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Respondeu perguntando sobre o design sem custo. Mensagem oficial de encaminhamento enviada.',
    dealValue: 4800,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-9',
    name: 'Inovare Odontologia Integrada',
    cnpj: '38.190.222/0001-99',
    segment: 'Saúde e Odontologia',
    city: 'Porto Alegre',
    neighborhood: 'Moinhos de Vento',
    site: 'http://inovareodontors.com',
    commercialPhone: '(51) 3320-1100',
    whatsapp: '5551996501100',
    contactName: 'Dra. Camila Bittencourt',
    contactRole: 'Responsável Técnica',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'aguardando_resposta',
    priority: 'baixa',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Apresentação formal enviada pelo WhatsApp oficial; aguardando retorno dentro do horário comercial.',
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-10',
    name: 'Delta Assessoria Aduaneira',
    cnpj: '15.433.881/0001-40',
    segment: 'Comércio Exterior',
    city: 'Santos',
    neighborhood: 'Centro',
    site: 'http://deltaaduaneira-sp.com',
    commercialPhone: '(13) 3219-4400',
    whatsapp: '5513988224400',
    contactName: 'Ricardo Alencar',
    contactRole: 'Diretor Comercial',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'contato_realizado',
    priority: 'media',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Primeiro contato realizado com template oficial Meta WhatsApp Canal 1 (+55 11 94579-9976).',
    createdAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-11',
    name: 'Grupo Prime Consultoria em RH',
    cnpj: '24.991.002/0001-65',
    segment: 'Recursos Humanos e Recrutamento',
    city: 'São Paulo',
    neighborhood: 'Vila Olímpia',
    site: '',
    commercialPhone: '(11) 3045-8800',
    whatsapp: '5511995558800',
    contactName: 'Juliana Prado',
    contactRole: 'Coordenadora de Atração de Talentos',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'pendente',
    stageId: 'aguardando_autorizacao',
    priority: 'media',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Empresa opera sem site profissional apenas com página no LinkedIn. Aguardando confirmação de consentimento.',
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-12',
    name: 'Construtora Horizonte Verde',
    cnpj: '07.654.321/0001-09',
    segment: 'Construção Civil',
    city: 'Florianópolis',
    neighborhood: 'Agronômica',
    site: '',
    commercialPhone: '(48) 3223-9000',
    whatsapp: '5548991239000',
    contactName: 'Sérgio Ramos',
    contactRole: 'Diretor Técnico',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'pendente',
    stageId: 'em_analise',
    priority: 'alta',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Site institucional não identificado em fontes públicas. Em análise de oportunidade comercial.',
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-13',
    name: 'Apex Soluções em Automação Industrial',
    cnpj: '33.111.444/0001-20',
    segment: 'Indústria e Manufatura',
    city: 'Joinville',
    neighborhood: 'Distrito Industrial',
    site: 'http://apexautomacao-sc.com.br',
    commercialPhone: '(47) 3433-8888',
    whatsapp: '5547998884444',
    contactName: 'Eng. Waldir Silveira',
    contactRole: 'Gerente Industrial',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'pendente',
    stageId: 'identificada',
    priority: 'media',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Novo lead identificado em catálogo industrial de Santa Catarina.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'lead-14',
    name: 'Office Clean Facilities',
    cnpj: '19.882.110/0001-77',
    segment: 'Serviços Terceirizados',
    city: 'São Bernardo do Campo',
    neighborhood: 'Rudge Ramos',
    site: '',
    commercialPhone: '(11) 4368-2000',
    whatsapp: '5511977112000',
    contactName: 'Márcia Diniz',
    contactRole: 'Supervisora Operacional',
    source: 'Prospecção Ativa B2B',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'opt_out',
    stageId: 'perdido',
    priority: 'baixa',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: 'Lead solicitou cancelamento de comunicações comerciais via mensagem (Opt-out LGPD registrado).',
    createdAt: new Date(Date.now() - 3600000 * 80).toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_PROPOSALS: CommercialProposal[] = [
  {
    id: 'prop-1',
    proposalCode: 'PROP-2026-001',
    leadId: 'lead-3',
    companyName: 'Engenharia Estrutural Soluções',
    contactName: 'Eng. Marcelo Toledo',
    contactRole: 'Sócio Gerente',
    contactWhatsapp: '5541999887700',
    serviceRequested: 'criacao_site_profissional',
    projectScope: 'Criação de novo portal corporativo de alto padrão com galeria dinâmica de obras, cálculo de pré-orçamento técnico, integração segura via SSL e hospedagem WordPress gerenciada com cache LiteSpeed.',
    estimatedTimelineDays: 18,
    price: 8900,
    paymentTerms: 'Entrada de 30% na aprovação do design sem custo + 3 parcelas mensais',
    validityDays: 15,
    validUntil: new Date(Date.now() + 3600000 * 24 * 10).toISOString(),
    status: 'aprovada',
    deliverables: [
      'Proposta inicial de design exclusivo sem custo prévio',
      'Layout corporativo responsivo (Desktop, Tablet, Mobile)',
      'Módulo de portfólio de projetos de engenharia em alta resolução',
      'Configuração de 10 caixas de e-mail corporativo',
      'Hospedagem inclusa por 12 meses com backup diário'
    ],
    fmwsDifferentialIncluded: true,
    notes: 'Proposta aceita e contrato celebrado.',
    createdByName: 'Beatriz Lima (Closer)',
    createdAt: new Date(Date.now() - 3600000 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    version: 1
  },
  {
    id: 'prop-2',
    proposalCode: 'PROP-2026-002',
    leadId: 'lead-6',
    companyName: 'BioEquip Instrumentação Científica',
    contactName: 'Eduardo Farias',
    contactRole: 'Diretor de Operações',
    contactWhatsapp: '5516997025500',
    serviceRequested: 'desenvolvimento_aplicacao_web',
    projectScope: 'Catálogo institucional e portal de especificações técnicas para equipamentos de laboratório com área de download de manuais e emissão de propostas.',
    estimatedTimelineDays: 25,
    price: 7100,
    paymentTerms: '4x sem juros (Boleto faturado para PJ)',
    validityDays: 15,
    validUntil: new Date(Date.now() + 3600000 * 24 * 12).toISOString(),
    status: 'aprovada',
    deliverables: [
      'Desenvolvimento do catálogo online com busca facetada',
      'Design inicial apresentado e validado sem custo',
      'Servidor Linux com isolamento cPanel',
      'Treinamento operacional para a equipe comercial'
    ],
    fmwsDifferentialIncluded: true,
    notes: 'Aprovada pela diretoria financeira.',
    createdByName: 'Beatriz Lima (Closer)',
    createdAt: new Date(Date.now() - 3600000 * 220).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 60).toISOString(),
    version: 1
  },
  {
    id: 'prop-3',
    proposalCode: 'PROP-2026-003',
    leadId: 'lead-7',
    companyName: 'Alpha Seguros & Benefícios',
    contactName: 'Gustavo Mendonça',
    contactRole: 'Head Comercial',
    contactWhatsapp: '5521989448000',
    serviceRequested: 'criacao_site_profissional',
    projectScope: 'Redesenho do site institucional com cotador de planos de saúde e seguro auto, integrado ao WhatsApp comercial da corretora.',
    estimatedTimelineDays: 15,
    price: 6400,
    paymentTerms: 'Sinal 40% + 60% na entrega final homologada',
    validityDays: 10,
    validUntil: new Date(Date.now() + 3600000 * 24 * 5).toISOString(),
    status: 'aprovada',
    deliverables: [
      'Design focado em captação de leads qualificados',
      'Certificado SSL e hospedagem WordPress LiteSpeed',
      'Formulário LGPD de consentimento'
    ],
    fmwsDifferentialIncluded: true,
    notes: 'Projeto em fase final de homologação.',
    createdByName: 'Beatriz Lima (Closer)',
    createdAt: new Date(Date.now() - 3600000 * 280).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 70).toISOString(),
    version: 1
  },
  {
    id: 'prop-4',
    proposalCode: 'PROP-2026-004',
    leadId: 'lead-2',
    companyName: 'Clínica CardioVida Diagnósticos',
    contactName: 'Dra. Mariana Vasconcelos',
    contactRole: 'Diretora Médica',
    contactWhatsapp: '5519981204100',
    serviceRequested: 'criacao_site_profissional',
    projectScope: 'Desenvolvimento de portal médico institucional para agendamento facilitado de exames cardiológicos, apresentação de convênios aceitos e orientações pré-exame.',
    estimatedTimelineDays: 14,
    price: 7500,
    paymentTerms: '50% na aprovação do layout sem custo + 50% na publicação',
    validityDays: 15,
    validUntil: new Date(Date.now() + 3600000 * 24 * 9).toISOString(),
    status: 'enviada',
    deliverables: [
      'Proposta inicial de design sem custo de desenvolvimento prévio',
      'Integração direta com WhatsApp da central de agendamento',
      'Páginas dos exames com preparação para o paciente',
      'Hospedagem segura com proteção DDoS e SSL'
    ],
    fmwsDifferentialIncluded: true,
    notes: 'Enviada ontem à tarde. Em análise pelo comitê gestor da clínica.',
    createdByName: 'Beatriz Lima (Closer)',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    version: 1
  }
];

const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    name: 'Diretoria Comercial FMWS',
    email: 'comercial@fazermeuwebsite.com.br',
    role: 'admin',
    roleLabel: 'Diretoria / Administrador'
  },
  {
    id: 'user-sdr',
    name: 'Carlos Mendes (SDR)',
    email: 'carlos.mendes@fazermeuwebsite.com.br',
    role: 'sdr',
    roleLabel: 'SDR / Prospecção'
  },
  {
    id: 'user-closer',
    name: 'Beatriz Lima (Closer)',
    email: 'beatriz.lima@fazermeuwebsite.com.br',
    role: 'closer',
    roleLabel: 'Closer / Executiva de Vendas'
  }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    user: 'Carlos Mendes (SDR)',
    userRole: 'sdr',
    action: 'CADASTRO_LEAD',
    entityType: 'lead',
    entityId: 'lead-1',
    details: 'Cadastro da empresa Advocacia Pinheiro & Associados com consentimento para abordagem B2B verificado.'
  },
  {
    id: 'audit-2',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    user: 'Beatriz Lima (Closer)',
    userRole: 'closer',
    action: 'PROPOSTA_GERADA',
    entityType: 'proposal',
    entityId: 'prop-1',
    details: 'Geração da proposta PROP-2026-001 no valor de R$ 8.900,00 com diferencial de proposta inicial de design sem custo.'
  },
  {
    id: 'audit-3',
    timestamp: new Date(Date.now() - 3600000 * 36).toISOString(),
    user: 'Carlos Mendes (SDR)',
    userRole: 'sdr',
    action: 'ANALISE_IA_SITE',
    entityType: 'lead',
    entityId: 'lead-1',
    details: 'Execução de auditoria técnica e comercial de presença digital via IA para Advocacia Pinheiro & Associados.'
  },
  {
    id: 'audit-4',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
    user: 'Sistema LGPD',
    userRole: 'admin',
    action: 'REGISTRO_OPT_OUT',
    entityType: 'consent',
    entityId: 'lead-14',
    details: 'Empresa Office Clean Facilities solicitou encerramento de comunicações comerciais. Bloqueio automático ativado.'
  }
];

const INITIAL_AUTOMATIONS_CONFIG: AutomationCentralConfig = {
  inboundWebhookUrl: '/api/webhooks/automations/leads',
  inboundApiKey: process.env.AUTOMATIONS_WEBHOOK_KEY || 'fmws_sec_' + Math.random().toString(36).substring(2, 12),
  outboundLeadWebhookUrl: '',
  outboundStageWebhookUrl: '',
  outboundTaskWebhookUrl: '',
  isActive: true,
  totalReceivedEvents: 0,
  lastEventAt: undefined,
  googleCloudTaskSlaEnabled: true,
  scheduledCronIntervalMinutes: 15,
  lastScheduledExecutionAt: new Date().toISOString(),
  autoTransferEnabled: true,
  metaWindowSlaHours: 24
};

const INITIAL_N8N_CONFIG: N8nConfig = INITIAL_AUTOMATIONS_CONFIG;

const INITIAL_DEMO_WHATSAPP_LOGS: WhatsAppMessageLog[] = [
  {
    id: 'wlog-1',
    leadId: 'lead-10',
    leadName: 'Delta Assessoria Aduaneira',
    to: '5513988224400',
    channel: 'canal_1_prospeccao',
    direction: 'outbound',
    type: 'template',
    templateName: 'fmws_apresentacao_institucional',
    content: 'Olá Ricardo Alencar, identificamos oportunidades de melhoria na experiência web da Delta Assessoria Aduaneira.',
    status: 'entregue',
    sentAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    approvedBy: 'Carlos Mendes (SDR)',
    whatsappMessageId: 'wamid.HBgLNTUxMzk4ODIyNDQwMBUCABEYE...'
  },
  {
    id: 'wlog-2',
    leadId: 'lead-8',
    leadName: 'Solaris Energia Fotovoltaica',
    to: '5562991181000',
    channel: 'canal_1_prospeccao',
    direction: 'inbound',
    type: 'custom_text',
    content: 'Bom dia Carlos. Vimos a mensagem de vocês. Como funciona essa proposta inicial de design sem custo que mencionaram?',
    status: 'recebido',
    sentAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    isHumanReply: true,
    classification: {
      classification: 'interesse_real',
      confidence: 0.95,
      summary: 'Cliente interessado no modelo de proposta de design sem custo.',
      isAutoReply: false,
      isOptOut: false,
      recommendedAction: 'Enviar mensagem de encaminhamento para WhatsApp Comercial Humano.',
      analyzedAt: new Date().toISOString()
    }
  },
  {
    id: 'wlog-3',
    leadId: 'lead-8',
    leadName: 'Solaris Energia Fotovoltaica',
    to: '5562991181000',
    channel: 'canal_1_prospeccao',
    direction: 'outbound',
    type: 'encaminhamento_oficial',
    content: OFFICIAL_TRANSFER_MESSAGE,
    status: 'entregue',
    sentAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    approvedBy: 'Automação Comercial FMWS'
  }
];

export const INITIAL_CONVERSATIONS: WhatsAppConversation[] = [
  {
    id: 'conv-1',
    leadId: 'lead-1',
    contactName: 'Dr. Roberto Pinheiro',
    companyName: 'Advocacia Pinheiro & Associados',
    phoneNumber: '5511994508900',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Interessante essa proposta. Conseguem me mandar um exemplo ou agendar 15 minutos na quinta?',
    lastMessageTimestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    unreadCount: 1,
    status: 'aberta',
    aiMode: 'copiloto',
    assignedOperatorId: 'user-sdr',
    assignedOperatorName: 'Carlos Mendes (SDR)',
    priority: 'alta',
    tags: ['Sem Site', 'Jurídico', 'Alta Prioridade', 'Classe B'],
    city: 'São Paulo',
    neighborhood: 'Itaim Bibi',
    segment: 'Jurídico e Compliance',
    site: '',
    opportunityTier: 'B',
    commercialStageId: 'oportunidade_qualificada',
    nextFollowUpAt: new Date(Date.now() + 3600000 * 20).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: 'conv-2',
    leadId: 'lead-2',
    contactName: 'Dra. Mariana Vasconcelos',
    companyName: 'Clínica CardioVida Diagnósticos',
    phoneNumber: '5519981204100',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=120&auto=format&fit=crop&q=80',
    lastMessage: 'Áudio recebido (0:38): "Olá Beatriz, o comitê médico aprovou a estrutura do portal. Só queremos tirar uma dúvida sobre a integração com o laboratório."',
    lastMessageTimestamp: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    unreadCount: 0,
    status: 'aberta',
    aiMode: 'humano',
    assignedOperatorId: 'user-closer',
    assignedOperatorName: 'Beatriz Lima (Closer)',
    priority: 'alta',
    tags: ['Saúde', 'Proposta Enviada', 'Classe C'],
    city: 'Campinas',
    neighborhood: 'Cambuí',
    segment: 'Saúde e Medicina Especializada',
    site: 'https://cardiovida.med.br',
    opportunityTier: 'C',
    commercialStageId: 'atendimento_confirmado',
    nextFollowUpAt: new Date(Date.now() + 3600000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 0.5).toISOString()
  },
  {
    id: 'conv-3',
    leadId: 'lead-8',
    contactName: 'Thiago Nogueira',
    companyName: 'Solaris Energia Fotovoltaica',
    phoneNumber: '5562991181000',
    lastMessage: 'A Fazer Meu Website desenvolve a proposta de design sem custo e você só paga se aprovar. Posso apresentar amanhã?',
    lastMessageTimestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    unreadCount: 0,
    status: 'aberta',
    aiMode: 'automatico',
    assignedOperatorId: 'user-sdr',
    assignedOperatorName: 'Carlos Mendes (SDR)',
    priority: 'media',
    tags: ['Energia Solar', 'IA Ativa', 'Diferencial FMWS'],
    city: 'Goiânia',
    neighborhood: 'Setor Bueno',
    segment: 'Energia Solar e Sustentabilidade',
    site: 'https://solaris-energia-go.com.br',
    opportunityTier: 'C',
    commercialStageId: 'encaminhamento_enviado',
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'conv-4',
    leadId: 'lead-3',
    contactName: 'Eng. Marcelo Toledo',
    companyName: 'Engenharia Estrutural Soluções',
    phoneNumber: '5541999887700',
    lastMessage: 'Perfeito, contrato assinado e primeira parcela agendada. Obrigado equipe FMWS!',
    lastMessageTimestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    unreadCount: 0,
    status: 'encerrada',
    aiMode: 'humano',
    assignedOperatorId: 'user-closer',
    assignedOperatorName: 'Beatriz Lima (Closer)',
    priority: 'alta',
    tags: ['Cliente Fechado', 'Contrato Assinado', 'R$ 8.900'],
    city: 'Curitiba',
    neighborhood: 'Batel',
    segment: 'Engenharia Civil e Projetos',
    site: '',
    opportunityTier: 'B',
    commercialStageId: 'cliente_fechado',
    createdAt: new Date(Date.now() - 3600000 * 180).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'conv-5',
    leadId: 'lead-5',
    contactName: 'Luciana Queiroz',
    companyName: 'Vértice Contabilidade Estratégica',
    phoneNumber: '5531988779000',
    lastMessage: 'Gostaria de ver sim o modelo de design sem custo. Como podemos proceder?',
    lastMessageTimestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    unreadCount: 1,
    status: 'pendente',
    aiMode: 'copiloto',
    assignedOperatorId: 'user-sdr',
    assignedOperatorName: 'Carlos Mendes (SDR)',
    priority: 'media',
    tags: ['Contabilidade', 'Interesse Real'],
    city: 'Belo Horizonte',
    neighborhood: 'Savassi',
    segment: 'Contabilidade e BPO Financeiro',
    site: 'http://verticecontabil-mg.com',
    opportunityTier: 'A',
    commercialStageId: 'interessado',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const INITIAL_CHAT_MESSAGES: WhatsAppChatMessage[] = [
  // CONV 1: Advocacia Pinheiro & Associados
  {
    id: 'msg-101',
    conversationId: 'conv-1',
    sender: 'operator',
    senderName: 'Carlos Mendes (SDR)',
    content: 'Olá Dr. Roberto Pinheiro! Entramos em contato da Fazer Meu Website. Identificamos oportunidades de destaque para o posicionamento corporativo da Advocacia Pinheiro & Associados no Itaim Bibi.',
    type: 'template',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'msg-102',
    conversationId: 'conv-1',
    sender: 'lead',
    senderName: 'Dr. Roberto Pinheiro',
    content: 'Boa tarde Carlos. Hoje atuamos praticamente 100% por indicação de clientes corporativos e não temos website próprio ativo. Como funciona esse projeto de vocês?',
    type: 'text',
    status: 'recebido',
    timestamp: new Date(Date.now() - 3600000 * 20).toISOString()
  },
  {
    id: 'msg-103',
    conversationId: 'conv-1',
    sender: 'operator',
    senderName: 'Carlos Mendes (SDR)',
    content: '🔒 NOTA INTERNA: Dr. Roberto é sócio fundador da banca, 12 advogados associados. Têm foco em direito societário e compliance. O diferencial do design sem custo vai ser decisivo para demonstrar valor sem gerar atrito inicial.',
    type: 'internal_note',
    status: 'lido',
    isInternalNote: true,
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'msg-104',
    conversationId: 'conv-1',
    sender: 'operator',
    senderName: 'Carlos Mendes (SDR)',
    content: 'Compreendo perfeitamente, Dr. Roberto. Inclusive, muitas bancas de prestígio procuram a Fazer Meu Website exatamente para institucionalizar sua marca sem burocracia. Nosso diferencial é exclusivo: *nós desenvolvemos uma proposta inicial de design sob medida sem nenhum custo prévio, e sua banca só contrata se aprovar a qualidade do projeto*.',
    type: 'text',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 10).toISOString()
  },
  {
    id: 'msg-105',
    conversationId: 'conv-1',
    sender: 'lead',
    senderName: 'Dr. Roberto Pinheiro',
    content: 'Interessante essa proposta. Conseguem me mandar um exemplo ou agendar 15 minutos na quinta?',
    type: 'text',
    status: 'recebido',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },

  // CONV 2: Clínica CardioVida Diagnósticos
  {
    id: 'msg-201',
    conversationId: 'conv-2',
    sender: 'operator',
    senderName: 'Beatriz Lima (Closer)',
    content: 'Dra. Mariana, segue a proposta formal PROP-2026-004 com o escopo completo do novo portal médico institucional com agendamento facilitado e certificado SSL de alta segurança.',
    type: 'text',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'msg-202',
    conversationId: 'conv-2',
    sender: 'operator',
    senderName: 'Beatriz Lima (Closer)',
    content: 'Proposta Comercial FMWS — CardioVida Diagnósticos (R$ 7.500,00).pdf',
    type: 'document',
    mediaUrl: '/data/propostas/PROP-2026-004.pdf',
    mediaName: 'Proposta_Comercial_FMWS_CardioVida.pdf',
    mediaSize: '1.4 MB',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 23.9).toISOString()
  },
  {
    id: 'msg-203',
    conversationId: 'conv-2',
    sender: 'lead',
    senderName: 'Dra. Mariana Vasconcelos',
    content: 'Áudio gravado da Dra. Mariana (0:38): "Olá Beatriz, o comitê médico aprovou a estrutura do portal. Só queremos tirar uma dúvida sobre a integração com o laboratório."',
    type: 'audio',
    audioDurationSeconds: 38,
    status: 'recebido',
    timestamp: new Date(Date.now() - 3600000 * 0.5).toISOString()
  },

  // CONV 3: Solaris Energia Fotovoltaica
  {
    id: 'msg-301',
    conversationId: 'conv-3',
    sender: 'operator',
    senderName: 'Carlos Mendes (SDR)',
    content: 'Olá Thiago, identificamos oportunidades de conversão e velocidade no site da Solaris Energia Fotovoltaica em Goiânia.',
    type: 'template',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'msg-302',
    conversationId: 'conv-3',
    sender: 'lead',
    senderName: 'Thiago Nogueira',
    content: 'Bom dia. Como funciona essa proposta inicial de design sem custo que mencionaram?',
    type: 'text',
    status: 'recebido',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'msg-303',
    conversationId: 'conv-3',
    sender: 'ai',
    senderName: 'FMWS IA (Automático)',
    content: 'Olá Thiago! É um prazer conversar com a Solaris Energia Fotovoltaica. Na Fazer Meu Website criamos o design da página inicial sob medida para o seu setor sem nenhum custo prévio. A empresa só realiza qualquer pagamento se aprovar o projeto e quiser prosseguir com a implementação. Posso preparar essa apresentação para amanhã?',
    type: 'text',
    status: 'entregue',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString()
  },

  // CONV 4: Engenharia Estrutural Soluções
  {
    id: 'msg-401',
    conversationId: 'conv-4',
    sender: 'operator',
    senderName: 'Beatriz Lima (Closer)',
    content: 'Eng. Marcelo, confirmamos o recebimento do contrato assinado da proposta PROP-2026-001!',
    type: 'text',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 28).toISOString()
  },
  {
    id: 'msg-402',
    conversationId: 'conv-4',
    sender: 'lead',
    senderName: 'Eng. Marcelo Toledo',
    content: 'Perfeito, contrato assinado e primeira parcela agendada. Obrigado equipe FMWS!',
    type: 'text',
    status: 'recebido',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
  },

  // CONV 5: Vértice Contabilidade Estratégica
  {
    id: 'msg-501',
    conversationId: 'conv-5',
    sender: 'operator',
    senderName: 'Carlos Mendes (SDR)',
    content: 'Olá Luciana, tudo bem? Vimos o trabalho de BPO financeiro da Vértice em Belo Horizonte e gostaríamos de apresentar uma proposta de modernização web com design sem custo prévio.',
    type: 'text',
    status: 'lido',
    timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'msg-502',
    conversationId: 'conv-5',
    sender: 'lead',
    senderName: 'Luciana Queiroz',
    content: 'Gostaria de ver sim o modelo de design sem custo. Como podemos proceder?',
    type: 'text',
    status: 'recebido',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export class StorageService {
  private data: DatabaseSchema;
  private metaTokenSecret: string = '';

  constructor() {
    this.ensureDataDir();
    this.data = this.loadDatabase();

    if (process.env.WHATSAPP_ACCESS_TOKEN) {
      this.metaTokenSecret = process.env.WHATSAPP_ACCESS_TOKEN;
      this.data.whatsappConfig.channel1.hasApiToken = true;
      this.data.whatsappConfig.channel1.status = 'conectado';
    }

    // Persist normalized schema if file was using legacy flat structure
    this.saveDatabase();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Migrate whatsappConfig if old schema
        let waConfig: WhatsAppConfig = INITIAL_WHATSAPP_CONFIG;
        if (parsed.whatsappConfig) {
          if (parsed.whatsappConfig.channel1) {
            waConfig = parsed.whatsappConfig;
          } else {
            waConfig = {
              channel1: {
                phoneNumber: '+55 11 94579-9976',
                phoneNumberId: parsed.whatsappConfig.phoneNumberId || '333767429829080',
                wabaId: parsed.whatsappConfig.wabaId || '419927517859112',
                hasApiToken: Boolean(parsed.whatsappConfig.hasApiToken || process.env.WHATSAPP_ACCESS_TOKEN),
                status: parsed.whatsappConfig.hasApiToken ? 'conectado' : 'aguardando_configuracao'
              },
              channel2: CANAL_2_DEFAULT,
              webhookVerifyToken: parsed.whatsappConfig.webhookVerifyToken || 'fmws_webhook_token_secure_2026',
              lastCheckedAt: new Date().toISOString()
            };
          }
        }

        const sanitizeStoreLeads = (leadsList: Lead[]): Lead[] => {
          return leadsList.map(lead => {
            const hasAntigoDomain = lead.site && lead.site.includes('-antigo');
            const cleanSite = hasAntigoDomain ? '' : (lead.site || '');
            let updatedAiAnalysis = lead.aiAnalysis;
            if (updatedAiAnalysis) {
              const analysisHasAntigo = updatedAiAnalysis.siteUrl && updatedAiAnalysis.siteUrl.includes('-antigo');
              if (analysisHasAntigo || !cleanSite) {
                updatedAiAnalysis = {
                  ...updatedAiAnalysis,
                  siteUrl: cleanSite || 'Site não identificado — verificação pendente',
                  hasInstitutionalSite: Boolean(cleanSite && cleanSite.length > 5),
                  presentationQuality: cleanSite ? updatedAiAnalysis.presentationQuality : 'inexistente',
                  observedProblems: updatedAiAnalysis.observedProblems.filter(p => !p.includes('-antigo') && !p.includes('404 Not Found')),
                  evidenceAndUrls: updatedAiAnalysis.evidenceAndUrls.filter(e => !e.includes('-antigo'))
                };
              }
            }
            return {
              ...lead,
              site: cleanSite,
              aiAnalysis: updatedAiAnalysis
            };
          });
        };

        const sanitizePlaces = (placesList: LocalProspectingPlace[], isProduction: boolean): LocalProspectingPlace[] => {
          return placesList
            .filter(p => !isProduction || !p.isDemoRecord)
            .map(p => {
              let updated = { ...p };
              if (updated.site && updated.site.includes('-antigo')) {
                updated.site = '';
              }

              const hasSite = Boolean(updated.site && updated.site.trim().length > 5);

              // 1. Without website -> Always Classe B (subject to confirmation)
              if (!hasSite) {
                updated.opportunityTier = 'B';
                updated.siteStatusCategory = 'sem_site_no_maps';
                if (!updated.opportunityReason || updated.opportunityReason.includes('não possui site')) {
                  updated.opportunityReason = 'Sem website informado no Google Maps — sujeito à confirmação com o decisor.';
                }
                return updated;
              }

              // 2. Has website, but NO technical audit yet -> Always Pendente (Awaiting Audit)
              if (!updated.auditResult) {
                updated.opportunityTier = 'pendente';
                updated.siteStatusCategory = 'aguardando_auditoria';
                if (!updated.opportunityReason || updated.opportunityReason.includes('identificado e operando')) {
                  updated.opportunityReason = `Possui website no Google Maps (${updated.site}). Aguardando auditoria técnica para qualificação.`;
                }
                return updated;
              }

              // 3. Has technical audit -> Strictly based on verifiable evidence
              if (updated.opportunityTier === 'inconclusivo' || updated.siteStatusCategory === 'auditoria_inconclusiva') {
                updated.opportunityTier = 'inconclusivo';
                updated.siteStatusCategory = 'auditoria_inconclusiva';
              } else if (updated.auditResult.problemsFound && updated.auditResult.problemsFound.length > 0) {
                updated.opportunityTier = 'A';
                updated.siteStatusCategory = 'site_com_problema_comprovado';
              } else {
                updated.opportunityTier = 'C';
                updated.siteStatusCategory = 'site_funcional_sem_problema';
              }

              return updated;
            });
        };

        const isFictitiousLead = (l: Lead): boolean => {
          if (!l || !l.id) return true;
          if (/^lead-[0-9]{1,2}$/.test(l.id)) return true; // lead-1 to lead-14 mock seeds
          if (l.source === 'Test Runner' || l.source === 'Auditoria de Persistencia') return true;
          if (/1793020|202610/.test(l.name)) return true;
          if (l.name === 'Outro Nome de Empresa' || l.name === 'Mecânica SBC Original') return true;
          if (l.verificationStatus === 'demonstrativo' || l.originType === 'demonstrativo') return true;
          return false;
        };

        const demoLeads = sanitizeStoreLeads(parsed.demo?.leads || INITIAL_LEADS).map((l: Lead) => ({
          ...l,
          verificationStatus: 'demonstrativo' as VerificationStatus,
          originType: 'demonstrativo' as LeadOriginType,
          auditEvidence: 'Lead modelo isolado no ambiente de demonstração'
        }));

        const demoStore: EnvironmentStore = {
          leads: demoLeads,
          proposals: parsed.demo?.proposals || parsed.proposals || INITIAL_PROPOSALS,
          whatsappLogs: parsed.demo?.whatsappLogs || parsed.whatsappLogs || INITIAL_DEMO_WHATSAPP_LOGS,
          conversations: (parsed.demo?.conversations && parsed.demo.conversations.length > 0 ? parsed.demo.conversations : INITIAL_CONVERSATIONS).map((c: any) => ({
            ...c,
            verificationStatus: 'demonstrativo' as VerificationStatus,
            originType: 'demonstrativo' as LeadOriginType
          })),
          chatMessages: parsed.demo?.chatMessages && parsed.demo.chatMessages.length > 0 ? parsed.demo.chatMessages : INITIAL_CHAT_MESSAGES,
          auditLogs: parsed.demo?.auditLogs || parsed.auditLogs || INITIAL_AUDIT_LOGS,
          interactions: parsed.demo?.interactions || parsed.interactions || [],
          optOutPhoneNumbers: parsed.demo?.optOutPhoneNumbers || parsed.optOutPhoneNumbers || ['5511977112000'],
          prospectingPlaces: sanitizePlaces(parsed.demo?.prospectingPlaces || [], false),
          contactedPlaces: parsed.demo?.contactedPlaces || []
        };

        // Strict Production Store: ONLY real, non-fictitious records!
        const rawProdLeads: Lead[] = Array.isArray(parsed.production?.leads) ? parsed.production.leads : [];
        const cleanProdLeads = rawProdLeads.filter(l => !isFictitiousLead(l)).map(l => ({
          ...l,
          verificationStatus: (l.verificationStatus === 'demonstrativo' ? 'pendente_verificacao' : (l.verificationStatus || 'verificado')) as VerificationStatus,
          originType: (l.originType === 'demonstrativo' ? 'importacao_externa' : (l.originType || (l.source?.includes('Prospecção') ? 'importacao_externa' : 'cadastro_manual'))) as LeadOriginType,
          auditEvidence: l.auditEvidence || (l.sourceId ? `Google Place ID: ${l.sourceId}` : `Cadastro comercial confirmado para ${l.name}`)
        }));

        const cleanProdLeadIds = new Set(cleanProdLeads.map(l => l.id));

        const rawProdConvs: WhatsAppConversation[] = Array.isArray(parsed.production?.conversations) ? parsed.production.conversations : [];
        const cleanProdConvs = rawProdConvs.filter(c => {
          if (/^conv-[0-9]{1,2}$/.test(c.id)) return false; // demo seed convs
          if (c.id === 'conv-72f2c9cf' || c.id === 'conv-47728208') return false; // test runner convs
          return true;
        }).map(c => ({
          ...c,
          verificationStatus: 'verificado' as VerificationStatus,
          originType: (c.phoneNumber.includes('986342981') ? 'whatsapp_inbound' : 'cadastro_manual') as LeadOriginType
        }));

        const cleanProdConvIds = new Set(cleanProdConvs.map(c => c.id));

        const rawProdProps: CommercialProposal[] = Array.isArray(parsed.production?.proposals) ? parsed.production.proposals : [];
        const cleanProdProps = rawProdProps.filter(p => cleanProdLeadIds.has(p.leadId));

        const rawProdMsgs: WhatsAppChatMessage[] = Array.isArray(parsed.production?.chatMessages) ? parsed.production.chatMessages : [];
        const cleanProdMsgs = rawProdMsgs.filter(m => cleanProdConvIds.has(m.conversationId));

        const prodStore: EnvironmentStore = {
          leads: sanitizeStoreLeads(cleanProdLeads),
          proposals: cleanProdProps,
          whatsappLogs: (parsed.production?.whatsappLogs || []).filter((w: any) => cleanProdLeadIds.has(w.leadId) || w.to?.includes('986342981')),
          conversations: cleanProdConvs,
          chatMessages: cleanProdMsgs,
          auditLogs: parsed.production?.auditLogs || [
            {
              id: 'audit-prod-0',
              timestamp: new Date().toISOString(),
              user: 'Sistema FMWS',
              userRole: 'admin',
              action: 'INIT_PRODUCAO',
              entityType: 'system',
              details: 'Ambiente de Produção FMWS inicializado exclusivamente com registros auditados e reais.'
            }
          ],
          interactions: (parsed.production?.interactions || []).filter((i: any) => cleanProdLeadIds.has(i.leadId)),
          optOutPhoneNumbers: parsed.production?.optOutPhoneNumbers || [],
          prospectingPlaces: sanitizePlaces(parsed.production?.prospectingPlaces || [], true),
          contactedPlaces: parsed.production?.contactedPlaces || []
        };

        const autoConfig: AutomationCentralConfig = {
          ...INITIAL_AUTOMATIONS_CONFIG,
          ...(parsed.automationsConfig || parsed.n8nConfig || {}),
          inboundWebhookUrl: '/api/webhooks/automations/leads'
        };

        return {
          activeEnvironment: parsed.activeEnvironment || 'producao',
          production: prodStore,
          demo: demoStore,
          whatsappConfig: waConfig,
          automationsConfig: autoConfig,
          n8nConfig: autoConfig,
          users: parsed.users || INITIAL_USERS
        };
      }
    } catch (err) {
      console.error('Error reading database file, initializing with defaults', err);
    }

    const initial: DatabaseSchema = {
      activeEnvironment: 'producao',
      production: {
        leads: [], // Clean production: ZERO mock leads
        proposals: [], // Clean production: ZERO mock proposals
        whatsappLogs: [],
        conversations: [],
        chatMessages: [],
        auditLogs: [
          {
            id: 'audit-prod-0',
            timestamp: new Date().toISOString(),
            user: 'Sistema FMWS',
            userRole: 'admin',
            action: 'INIT_PRODUCAO',
            entityType: 'system',
            details: 'Ambiente de Produção FMWS inicializado exclusivamente com registros auditados e reais.'
          }
        ],
        interactions: [],
        optOutPhoneNumbers: []
      },
      demo: {
        leads: INITIAL_LEADS.map(l => ({
          ...l,
          verificationStatus: 'demonstrativo' as const,
          originType: 'demonstrativo' as const,
          auditEvidence: 'Registro demonstrativo isolado da produção'
        })),
        proposals: INITIAL_PROPOSALS,
        whatsappLogs: INITIAL_DEMO_WHATSAPP_LOGS,
        conversations: INITIAL_CONVERSATIONS.map(c => ({
          ...c,
          verificationStatus: 'demonstrativo' as const,
          originType: 'demonstrativo' as const
        })),
        chatMessages: INITIAL_CHAT_MESSAGES,
        auditLogs: INITIAL_AUDIT_LOGS,
        interactions: [],
        optOutPhoneNumbers: ['5511977112000']
      },
      whatsappConfig: INITIAL_WHATSAPP_CONFIG,
      automationsConfig: INITIAL_AUTOMATIONS_CONFIG,
      n8nConfig: INITIAL_AUTOMATIONS_CONFIG,
      users: INITIAL_USERS
    };

    this.saveDatabase(initial);
    return initial;
  }

  private saveDatabase(dataToSave?: DatabaseSchema) {
    try {
      const db = dataToSave || this.data;
      const sanitizedWhatsappConfig: WhatsAppConfig = {
        ...db.whatsappConfig,
        channel1: {
          ...db.whatsappConfig.channel1,
          hasApiToken: Boolean(this.metaTokenSecret || process.env.WHATSAPP_ACCESS_TOKEN)
        }
      };

      const payload = {
        ...db,
        whatsappConfig: sanitizedWhatsappConfig,
        automationsConfig: db.automationsConfig,
        n8nConfig: db.automationsConfig
      };

      // 1. Atomic write to disk to prevent file corruption
      const tempFile = DB_FILE + '.tmp';
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);

      // 2. Continuous Synchronization with Relational SQL Database
      try {
        if (db.production) {
          db.production.leads?.forEach(l => relDb.insertLeadSync(l, 'producao'));
          db.production.conversations?.forEach(c => relDb.insertConversationSync(c, 'producao'));
          db.production.chatMessages?.forEach(m => relDb.insertMessageSync(m));
          db.production.proposals?.forEach(p => relDb.insertProposalSync(p, 'producao'));
        }
        if (db.demo) {
          db.demo.leads?.forEach(l => relDb.insertLeadSync(l, 'demo'));
          db.demo.conversations?.forEach(c => relDb.insertConversationSync(c, 'demo'));
          db.demo.chatMessages?.forEach(m => relDb.insertMessageSync(m));
          db.demo.proposals?.forEach(p => relDb.insertProposalSync(p, 'demo'));
        }
        relDb.setSettingSync('active_environment', db.activeEnvironment || 'producao');
        relDb.purgeFictitiousFromProduction();
      } catch (sqlErr: any) {
        console.warn('[FMWS DB Sync Warning]:', sqlErr.message);
      }
    } catch (err) {
      console.error('Failed to persist database file', err);
    }
  }

  // --- ENVIRONMENT MANAGEMENT ---
  public get activeEnvironment(): CrmEnvironment {
    return this.data.activeEnvironment || 'producao';
  }

  public getActiveStore(): EnvironmentStore {
    if (this.data.activeEnvironment === 'demo') {
      return this.data.demo;
    }
    return this.data.production;
  }

  public getEnvironmentInfo() {
    return {
      activeEnvironment: this.data.activeEnvironment,
      production: {
        totalLeads: this.data.production.leads.length,
        totalProposals: this.data.production.proposals.length,
        clientsWon: this.data.production.leads.filter(l => l.stageId === 'cliente_fechado').length,
        revenue: this.data.production.proposals
          .filter(p => p.status === 'aprovada')
          .reduce((sum, p) => sum + (p.price || 0), 0)
      },
      demo: {
        totalLeads: this.data.demo.leads.length,
        totalProposals: this.data.demo.proposals.length,
        clientsWon: this.data.demo.leads.filter(l => l.stageId === 'cliente_fechado').length,
        revenue: this.data.demo.proposals
          .filter(p => p.status === 'aprovada')
          .reduce((sum, p) => sum + (p.price || 0), 0)
      }
    };
  }

  public setEnvironment(env: CrmEnvironment) {
    if (env !== 'producao' && env !== 'demo') {
      throw new Error('Ambiente inválido. Use "producao" ou "demo".');
    }
    this.data.activeEnvironment = env;
    this.addAuditLog({
      user: 'Operador Comercial',
      userRole: 'admin',
      action: 'SWITCH_ENVIRONMENT',
      entityType: 'system',
      details: `Ambiente alternado para: ${env === 'producao' ? 'Produção (Dados Reais)' : 'Demonstração (Dados Fictícios)'}.`
    });
    this.saveDatabase();
    return this.getEnvironmentInfo();
  }

  private get leads(): Lead[] {
    return this.getActiveStore().leads;
  }
  private set leads(val: Lead[]) {
    this.getActiveStore().leads = val;
  }

  private get proposals(): CommercialProposal[] {
    return this.getActiveStore().proposals;
  }
  private set proposals(val: CommercialProposal[]) {
    this.getActiveStore().proposals = val;
  }

  private get whatsappLogs(): WhatsAppMessageLog[] {
    return this.getActiveStore().whatsappLogs;
  }
  private set whatsappLogs(val: WhatsAppMessageLog[]) {
    this.getActiveStore().whatsappLogs = val;
  }

  private get auditLogs(): AuditLog[] {
    return this.getActiveStore().auditLogs;
  }
  private set auditLogs(val: AuditLog[]) {
    this.getActiveStore().auditLogs = val;
  }

  private get optOutPhoneNumbers(): string[] {
    return this.getActiveStore().optOutPhoneNumbers;
  }
  private set optOutPhoneNumbers(val: string[]) {
    this.getActiveStore().optOutPhoneNumbers = val;
  }

  private get interactions(): CommercialInteraction[] {
    return this.getActiveStore().interactions;
  }
  private set interactions(val: CommercialInteraction[]) {
    this.getActiveStore().interactions = val;
  }

  private get prospectingPlaces(): LocalProspectingPlace[] {
    if (!this.getActiveStore().prospectingPlaces) {
      this.getActiveStore().prospectingPlaces = [];
    }
    return this.getActiveStore().prospectingPlaces!;
  }
  private set prospectingPlaces(val: LocalProspectingPlace[]) {
    this.getActiveStore().prospectingPlaces = val;
  }

  private get contactedPlaces(): string[] {
    if (!this.getActiveStore().contactedPlaces) {
      this.getActiveStore().contactedPlaces = [];
    }
    return this.getActiveStore().contactedPlaces!;
  }
  private set contactedPlaces(val: string[]) {
    this.getActiveStore().contactedPlaces = val;
  }

  private get conversations(): WhatsAppConversation[] {
    if (!this.getActiveStore().conversations) {
      this.getActiveStore().conversations = [];
    }
    return this.getActiveStore().conversations!;
  }
  private set conversations(val: WhatsAppConversation[]) {
    this.getActiveStore().conversations = val;
  }

  private get chatMessages(): WhatsAppChatMessage[] {
    if (!this.getActiveStore().chatMessages) {
      this.getActiveStore().chatMessages = [];
    }
    return this.getActiveStore().chatMessages!;
  }
  private set chatMessages(val: WhatsAppChatMessage[]) {
    this.getActiveStore().chatMessages = val;
  }

  // --- LEADS CRUD ---
  public getLeads(filters?: {
    search?: string;
    stageId?: string;
    priority?: string;
    segment?: string;
    consentStatus?: string;
  }): Lead[] {
    let result = [...this.leads];

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        l =>
          l.name.toLowerCase().includes(q) ||
          (l.cnpj && l.cnpj.includes(q)) ||
          l.contactName.toLowerCase().includes(q) ||
          l.whatsapp.includes(q) ||
          (l.site && l.site.toLowerCase().includes(q)) ||
          l.city.toLowerCase().includes(q)
      );
    }

    if (filters?.stageId) {
      result = result.filter(l => l.stageId === filters.stageId);
    }

    if (filters?.priority) {
      result = result.filter(l => l.priority === filters.priority);
    }

    if (filters?.segment) {
      result = result.filter(l => l.segment === filters.segment);
    }

    if (filters?.consentStatus) {
      result = result.filter(l => l.consentStatus === filters.consentStatus);
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getLeadById(id: string): Lead | undefined {
    return this.leads.find(l => l.id === id);
  }

  public createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, author: string): { lead?: Lead; duplicateError?: string } {
    const cleanPhone = leadData.whatsapp.replace(/\D/g, '');
    const cleanCnpj = leadData.cnpj ? leadData.cnpj.replace(/\D/g, '') : null;

    const duplicate = this.leads.find(l => {
      // 1. External Place ID / sourceId
      if (leadData.sourceId && l.sourceId && leadData.sourceId === l.sourceId) return true;
      if (leadData.prospectingPlaceId && l.prospectingPlaceId && leadData.prospectingPlaceId === l.prospectingPlaceId) return true;

      // 2. CNPJ
      const lPhone = l.whatsapp.replace(/\D/g, '');
      const lCnpj = l.cnpj ? l.cnpj.replace(/\D/g, '') : null;
      if (cleanCnpj && lCnpj && cleanCnpj === lCnpj) return true;

      // 3. Domain
      const siteA = leadData.site?.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '') || '';
      const siteB = l.site?.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '') || '';
      if (siteA && siteB && siteA === siteB) return true;

      // 4. Exact company name and city
      const normNameA = leadData.name.toLowerCase().trim();
      const normNameB = l.name.toLowerCase().trim();
      if (normNameA === normNameB && leadData.city.toLowerCase() === l.city.toLowerCase()) return true;

      // 5. Shared phone protection: do not block different companies that share a general line or placeholder
      const isPlaceholderPhone = cleanPhone === '5511999999999' || cleanPhone.length < 8;
      if (!isPlaceholderPhone && cleanPhone && lPhone && cleanPhone === lPhone) {
        if (normNameA.includes(normNameB) || normNameB.includes(normNameA) || normNameA.slice(0, 10) === normNameB.slice(0, 10)) {
          return true;
        }
      }
      return false;
    });

    if (duplicate) {
      return {
        duplicateError: `Empresa já cadastrada na base com o nome "${duplicate.name}" (Estágio: ${duplicate.stageId}). Evitando duplicidade de registro comercial.`
      };
    }

    // Strict mandate: Fazer Meu Website operates 100% in private commercial B2B. Never prospect government or politics.
    if (
      isGovernmentOrPoliticalEntity({
        name: leadData.name,
        site: leadData.site,
        segment: leadData.segment,
        address: `${leadData.neighborhood || ''} ${leadData.city || ''}`
      })
    ) {
      return {
        duplicateError: `Cadastro bloqueado: A organização "${leadData.name}" foi identificada como entidade pública, governamental ou política. A Fazer Meu Website prospecta exclusivamente empresas do setor privado comercial B2B.`
      };
    }

    const newLead: Lead = {
      ...leadData,
      id: `lead-${crypto.randomUUID().slice(0, 8)}`,
      verificationStatus: leadData.verificationStatus || (this.activeEnvironment === 'demo' ? 'demonstrativo' : 'pendente_verificacao'),
      originType: leadData.originType || (this.activeEnvironment === 'demo' ? 'demonstrativo' : leadData.source?.includes('Prospecção') ? 'importacao_externa' : 'cadastro_manual'),
      auditEvidence: leadData.auditEvidence || (leadData.sourceId ? `Identificador externo: ${leadData.sourceId}` : `Cadastro manual confirmado pelo operador ${author}`),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.leads.unshift(newLead);

    this.addAuditLog({
      user: author,
      userRole: 'comercial',
      action: 'CADASTRO_LEAD',
      entityType: 'lead',
      entityId: newLead.id,
      details: `Nova empresa cadastrada: ${newLead.name} (${newLead.segment} - ${newLead.city}).`
    });

    this.saveDatabase();
    return { lead: newLead };
  }

  public updateLead(id: string, updates: Partial<Lead>, author: string): Lead | undefined {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) return undefined;

    const oldLead = this.leads[index];
    const updatedLead: Lead = {
      ...oldLead,
      ...updates,
      id: oldLead.id,
      updatedAt: new Date().toISOString()
    };

    if (updates.consentStatus === 'opt_out' && oldLead.consentStatus !== 'opt_out') {
      const cleanPhone = updatedLead.whatsapp.replace(/\D/g, '');
      if (cleanPhone && !this.optOutPhoneNumbers.includes(cleanPhone)) {
        this.optOutPhoneNumbers.push(cleanPhone);
      }
    }

    this.leads[index] = updatedLead;

    this.addAuditLog({
      user: author,
      userRole: 'comercial',
      action: 'ATUALIZACAO_LEAD',
      entityType: 'lead',
      entityId: id,
      details: `Dados comerciais atualizados para: ${updatedLead.name}.`
    });

    this.saveDatabase();
    return updatedLead;
  }

  public updateLeadStage(id: string, newStage: CommercialStageId, author: string): Lead | undefined {
    const lead = this.getLeadById(id);
    if (!lead) return undefined;

    const oldStage = lead.stageId;
    lead.stageId = newStage;
    lead.updatedAt = new Date().toISOString();

    this.addAuditLog({
      user: author,
      userRole: 'comercial',
      action: 'MUDANCA_ESTAGIO_KANBAN',
      entityType: 'lead',
      entityId: id,
      details: `Estágio alterado de "${oldStage}" para "${newStage}".`
    });

    this.saveDatabase();
    return lead;
  }

  /**
   * Action: "Encaminhar para WhatsApp Comercial"
   * Dispatches the official transfer message through Channel 1 (+55 11 94579-9976)
   * pointing the prospect to Channel 2 (+55 11 98634-2981).
   */
  public sendOfficialTransfer(leadId: string, author: string): { success: boolean; message: string; log?: WhatsAppMessageLog } {
    const lead = this.getLeadById(leadId);
    if (!lead) return { success: false, message: 'Empresa não encontrada' };

    if (this.isPhoneNumberOptedOut(lead.whatsapp) || lead.consentStatus === 'opt_out') {
      return { success: false, message: 'Envio bloqueado: Este número possui opt-out registrado conforme LGPD.' };
    }

    const log = this.addWhatsAppLog({
      leadId: lead.id,
      leadName: lead.name,
      to: lead.whatsapp,
      channel: 'canal_1_prospeccao',
      direction: 'outbound',
      type: 'encaminhamento_oficial',
      content: OFFICIAL_TRANSFER_MESSAGE,
      status: 'enviado',
      sentAt: new Date().toISOString(),
      approvedBy: author
    });

    lead.stageId = 'encaminhamento_enviado';
    lead.transferDispatchedAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();

    this.addAuditLog({
      user: author,
      userRole: 'comercial',
      action: 'ENCAMINHAMENTO_CANAL_2',
      entityType: 'transferencia',
      entityId: lead.id,
      details: `Convite de transferência para WhatsApp Comercial Humano (+55 11 98634-2981) enviado pelo Canal 1 (+55 11 94579-9976) para ${lead.name}.`
    });

    this.saveDatabase();
    return {
      success: true,
      message: 'Convite para o WhatsApp Comercial enviado com sucesso pelo Canal 1.',
      log
    };
  }

  /**
   * Action: "Confirmar Abertura de Atendimento no WhatsApp Comercial Humano"
   * Executed by the Channel 2 human team (+55 11 98634-2981) to register that
   * the client indeed initiated communication on WhatsApp Web/Celular.
   */
  public confirmHumanChat(leadId: string, author: string): Lead | undefined {
    const lead = this.getLeadById(leadId);
    if (!lead) return undefined;

    lead.stageId = 'atendimento_confirmado';
    lead.humanChatConfirmedAt = new Date().toISOString();
    lead.updatedAt = new Date().toISOString();

    this.addAuditLog({
      user: author,
      userRole: 'closer',
      action: 'CONFIRMACAO_ATENDIMENTO_HUMANO',
      entityType: 'transferencia',
      entityId: lead.id,
      details: `Abertura de atendimento no WhatsApp Comercial (+55 11 98634-2981) confirmada pelo consultor humano para ${lead.name}.`
    });

    this.saveDatabase();
    return lead;
  }

  public deleteLead(id: string, author: string, isLgpdDeletion = false): boolean {
    const index = this.leads.findIndex(l => l.id === id);
    if (index === -1) return false;

    const lead = this.leads[index];
    this.leads.splice(index, 1);

    this.addAuditLog({
      user: author,
      userRole: 'comercial',
      action: isLgpdDeletion ? 'EXCLUSAO_LGPD_TITULAR' : 'EXCLUSAO_LEAD',
      entityType: 'lead',
      entityId: id,
      details: `${isLgpdDeletion ? 'Direito de esquecimento / anonimização LGPD executado' : 'Registro de lead excluído'}: ${lead.name}.`
    });

    this.saveDatabase();
    return true;
  }

  public importLeadsCsv(leadsArray: any[], author: string): { imported: number; duplicates: number; errors: number } {
    let imported = 0;
    let duplicates = 0;
    let errors = 0;

    for (const item of leadsArray) {
      if (!item.name || !item.whatsapp) {
        errors++;
        continue;
      }

      const res = this.createLead(
        {
          name: item.name.trim(),
          cnpj: item.cnpj ? item.cnpj.trim() : undefined,
          segment: item.segment ? item.segment.trim() : 'Geral',
          city: item.city ? item.city.trim() : 'Não informada',
          neighborhood: item.neighborhood ? item.neighborhood.trim() : '',
          site: item.site ? item.site.trim() : '',
          instagram: item.instagram ? item.instagram.trim() : '',
          facebook: item.facebook ? item.facebook.trim() : '',
          commercialPhone: item.commercialPhone || item.whatsapp,
          whatsapp: item.whatsapp.trim(),
          contactName: item.contactName ? item.contactName.trim() : 'Responsável',
          contactRole: item.contactRole ? item.contactRole.trim() : 'Contato Comercial',
          source: item.source ? item.source.trim() : 'Importação CSV',
          lastVerifiedAt: new Date().toISOString(),
          consentStatus: item.consentStatus || 'pendente',
          stageId: 'identificada',
          priority: item.priority || 'media',
          assignedTo: author,
          notes: item.notes || 'Importado via lote CSV.'
        },
        author
      );

      if (res.duplicateError) {
        duplicates++;
      } else if (res.lead) {
        imported++;
      }
    }

    return { imported, duplicates, errors };
  }

  // --- STATS CALCULATION ---
  public getCommercialStats(): CommercialDashboardStats {
    const leads = this.leads;
    const proposals = this.proposals;
    const whatsappLogs = this.whatsappLogs;

    const totalCompanies = leads.length;
    const pendingAnalysis = leads.filter(l => !l.aiAnalysis).length;

    // Required 8 core metrics:
    const authorizedContacts = leads.filter(l => l.consentStatus === 'autorizado').length;
    const messagesSent = whatsappLogs.filter(
      w => w.direction === 'outbound' && w.status !== 'falha' && w.status !== 'pendente_aprovacao'
    ).length;
    const humanRepliesReceived = whatsappLogs.filter(
      w => (w.direction === 'inbound' || w.isHumanReply) && (!w.classification || !w.classification.isAutoReply)
    ).length;
    const interestedIdentified = leads.filter(
      l =>
        l.stageId === 'interessado' ||
        l.stageId === 'encaminhamento_enviado' ||
        l.stageId === 'atendimento_confirmado' ||
        l.stageId === 'reuniao_agendada' ||
        l.stageId === 'proposta_enviada' ||
        l.stageId === 'negociacao' ||
        l.stageId === 'cliente_fechado' ||
        l.lastClassification?.classification === 'interesse_real'
    ).length;
    const transfersSent = leads.filter(
      l =>
        l.stageId === 'encaminhamento_enviado' ||
        Boolean(l.transferDispatchedAt) ||
        l.stageId === 'atendimento_confirmado' ||
        l.stageId === 'reuniao_agendada' ||
        l.stageId === 'proposta_enviada' ||
        l.stageId === 'negociacao' ||
        l.stageId === 'cliente_fechado'
    ).length;
    const confirmedHumanChats = leads.filter(
      l =>
        l.stageId === 'atendimento_confirmado' ||
        Boolean(l.humanChatConfirmedAt) ||
        l.stageId === 'reuniao_agendada' ||
        l.stageId === 'proposta_enviada' ||
        l.stageId === 'negociacao' ||
        l.stageId === 'cliente_fechado'
    ).length;
    const proposalsSent = proposals.filter(p => p.status === 'enviada' || p.status === 'aprovada').length;
    const clientsWon = leads.filter(l => l.stageId === 'cliente_fechado').length;

    const contractedRevenue = proposals
      .filter(p => p.status === 'aprovada')
      .reduce((acc, curr) => acc + (curr.price || 0), 0);

    const conversionRate = totalCompanies > 0 ? Number(((clientsWon / totalCompanies) * 100).toFixed(1)) : 0;

    const stageCounts: Record<CommercialStageId, number> = {
      identificada: 0,
      em_analise: 0,
      oportunidade_qualificada: 0,
      aguardando_autorizacao: 0,
      contato_realizado: 0,
      aguardando_resposta: 0,
      respondeu: 0,
      interessado: 0,
      encaminhamento_enviado: 0,
      atendimento_confirmado: 0,
      reuniao_agendada: 0,
      proposta_enviada: 0,
      negociacao: 0,
      cliente_fechado: 0,
      perdido: 0
    };

    leads.forEach(l => {
      if (stageCounts[l.stageId] !== undefined) {
        stageCounts[l.stageId]++;
      }
    });

    const isDemo = this.data.activeEnvironment === 'demo';

    return {
      authorizedContacts,
      messagesSent,
      humanRepliesReceived,
      interestedIdentified,
      transfersSent,
      confirmedHumanChats,
      proposalsSent,
      clientsWon,

      totalCompanies,
      pendingAnalysis,
      contractedRevenue,
      conversionRate,
      stageCounts,
      annualGoal: {
        targetClients: 100,
        currentClients: clientsWon,
        progressPercentage: Number(((clientsWon / 100) * 100).toFixed(1)),
        projectedMonthsRemaining: 12
      },
      weeklyEvolution: isDemo
        ? [
            { week: 'Semana 1', newLeads: 4, contacts: 3, proposals: 1, won: 0 },
            { week: 'Semana 2', newLeads: 5, contacts: 4, proposals: 1, won: 1 },
            { week: 'Semana 3', newLeads: 6, contacts: 5, proposals: 2, won: 1 },
            { week: 'Semana Atual', newLeads: totalCompanies, contacts: messagesSent, proposals: proposalsSent, won: clientsWon }
          ]
        : [
            { week: 'Semana 1', newLeads: 0, contacts: 0, proposals: 0, won: 0 },
            { week: 'Semana 2', newLeads: 0, contacts: 0, proposals: 0, won: 0 },
            { week: 'Semana 3', newLeads: 0, contacts: 0, proposals: 0, won: 0 },
            { week: 'Semana Atual', newLeads: totalCompanies, contacts: messagesSent, proposals: proposalsSent, won: clientsWon }
          ],
      monthlyEvolution: isDemo
        ? [
            { month: 'Mês -2', leads: 8, proposals: 2, won: 1, revenue: 6400 },
            { month: 'Mês -1', leads: 11, proposals: 3, won: 1, revenue: 7100 },
            { month: 'Mês Atual', leads: totalCompanies, proposals: proposalsSent, won: clientsWon, revenue: contractedRevenue }
          ]
        : [
            { month: 'Mês -2', leads: 0, proposals: 0, won: 0, revenue: 0 },
            { month: 'Mês -1', leads: 0, proposals: 0, won: 0, revenue: 0 },
            { month: 'Mês Atual', leads: totalCompanies, proposals: proposalsSent, won: clientsWon, revenue: contractedRevenue }
          ]
    };
  }

  // --- PROPOSALS ---
  public getProposals(): CommercialProposal[] {
    return [...this.proposals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getProposalById(id: string): CommercialProposal | undefined {
    return this.proposals.find(p => p.id === id);
  }

  public createProposal(propData: Omit<CommercialProposal, 'id' | 'proposalCode' | 'createdAt' | 'updatedAt' | 'version'>, author: string): CommercialProposal {
    const code = `PROP-${new Date().getFullYear()}-${String(this.proposals.length + 1).padStart(3, '0')}`;
    const newProposal: CommercialProposal = {
      ...propData,
      id: `prop-${crypto.randomUUID().slice(0, 8)}`,
      proposalCode: code,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.proposals.unshift(newProposal);

    const lead = this.getLeadById(newProposal.leadId);
    if (lead) {
      lead.dealValue = newProposal.price;
      if (newProposal.status === 'enviada' && lead.stageId !== 'proposta_enviada' && lead.stageId !== 'negociacao' && lead.stageId !== 'cliente_fechado') {
        lead.stageId = 'proposta_enviada';
      }
      lead.updatedAt = new Date().toISOString();
    }

    this.addAuditLog({
      user: author,
      userRole: 'closer',
      action: 'CRIACAO_PROPOSTA',
      entityType: 'proposal',
      entityId: newProposal.id,
      details: `Proposta comercial criada: ${newProposal.proposalCode} para ${newProposal.companyName} (R$ ${newProposal.price.toLocaleString('pt-BR')}).`
    });

    this.saveDatabase();
    return newProposal;
  }

  public updateProposal(id: string, updates: Partial<CommercialProposal>, author: string): CommercialProposal | undefined {
    const index = this.proposals.findIndex(p => p.id === id);
    if (index === -1) return undefined;

    const old = this.proposals[index];
    const newVersion = old.version + 1;
    const history = old.versionHistory || [];
    history.push({
      version: old.version,
      updatedAt: old.updatedAt,
      updatedBy: author,
      price: old.price,
      notes: updates.notes || 'Atualização de termos e escopo da proposta'
    });

    const updated: CommercialProposal = {
      ...old,
      ...updates,
      version: newVersion,
      versionHistory: history,
      updatedAt: new Date().toISOString()
    };

    this.proposals[index] = updated;

    if (updates.status === 'aprovada' && old.status !== 'aprovada') {
      const lead = this.getLeadById(updated.leadId);
      if (lead) {
        lead.stageId = 'cliente_fechado';
        lead.dealValue = updated.price;
        lead.updatedAt = new Date().toISOString();
      }
    }

    this.addAuditLog({
      user: author,
      userRole: 'closer',
      action: 'ATUALIZACAO_PROPOSTA',
      entityType: 'proposal',
      entityId: id,
      details: `Proposta ${updated.proposalCode} atualizada para versão v${newVersion} com status ${updated.status}.`
    });

    this.saveDatabase();
    return updated;
  }

  // --- WHATSAPP CONFIG & DISPATCH ---
  public getWhatsAppConfig(): WhatsAppConfig {
    return {
      ...this.data.whatsappConfig,
      channel1: {
        ...this.data.whatsappConfig.channel1,
        hasApiToken: Boolean(this.metaTokenSecret || process.env.WHATSAPP_ACCESS_TOKEN)
      }
    };
  }

  public getMetaTokenSecret(): string {
    return this.metaTokenSecret || process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  public updateWhatsAppConfig(updates: { phoneNumberId?: string; wabaId?: string; apiToken?: string; webhookVerifyToken?: string }): WhatsAppConfig {
    if (updates.phoneNumberId !== undefined) this.data.whatsappConfig.channel1.phoneNumberId = updates.phoneNumberId.trim();
    if (updates.wabaId !== undefined) this.data.whatsappConfig.channel1.wabaId = updates.wabaId.trim();
    if (updates.webhookVerifyToken !== undefined) this.data.whatsappConfig.webhookVerifyToken = updates.webhookVerifyToken.trim();
    if (updates.apiToken) {
      this.metaTokenSecret = updates.apiToken.trim();
      this.data.whatsappConfig.channel1.hasApiToken = true;
    }

    const isFullyConfigured = Boolean(this.data.whatsappConfig.channel1.phoneNumberId && (this.metaTokenSecret || process.env.WHATSAPP_ACCESS_TOKEN));
    this.data.whatsappConfig.channel1.status = isFullyConfigured ? 'conectado' : 'aguardando_configuracao';
    this.data.whatsappConfig.lastCheckedAt = new Date().toISOString();

    this.saveDatabase();
    return this.getWhatsAppConfig();
  }

  public getWhatsAppLogs(): WhatsAppMessageLog[] {
    return [...this.whatsappLogs].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
  }

  public addWhatsAppLog(log: Omit<WhatsAppMessageLog, 'id'>): WhatsAppMessageLog {
    const newLog: WhatsAppMessageLog = {
      ...log,
      id: `wlog-${crypto.randomUUID().slice(0, 8)}`
    };
    this.whatsappLogs.unshift(newLog);
    this.saveDatabase();
    return newLog;
  }

  public updateWhatsAppLogStatus(idOrWamid: string, status: WhatsAppMessageLog['status'], failureReason?: string) {
    const item = this.whatsappLogs.find(l => l.id === idOrWamid || l.whatsappMessageId === idOrWamid);
    if (item) {
      item.status = status;
      if (failureReason) item.failureReason = failureReason;
      this.saveDatabase();
    }
  }

  public isPhoneNumberOptedOut(phone: string): boolean {
    const clean = phone.replace(/\D/g, '');
    return this.optOutPhoneNumbers.includes(clean);
  }

  public addOptOut(phone: string) {
    const clean = phone.replace(/\D/g, '');
    if (!this.optOutPhoneNumbers.includes(clean)) {
      this.optOutPhoneNumbers.push(clean);
    }
    this.leads.forEach(l => {
      if (l.whatsapp.replace(/\D/g, '') === clean) {
        l.consentStatus = 'opt_out';
        l.stageId = 'perdido';
        l.notes += ` [OPT-OUT LGPD registrado em ${new Date().toLocaleDateString('pt-BR')}]`;
      }
    });
    this.conversations.forEach(c => {
      if (c.phoneNumber.replace(/\D/g, '') === clean) {
        c.status = 'encerrada';
        c.aiMode = 'humano';
        if (!c.tags.includes('Opt-out LGPD')) c.tags.push('Opt-out LGPD');
      }
    });
    this.saveDatabase();
  }

  // --- OMNICHANNEL CENTRAL WHATSAPP ---
  public getWhatsAppConversations(filter?: {
    status?: WhatsAppConversationStatus | 'todas';
    operatorId?: string;
    aiMode?: WhatsAppAiMode | 'todas';
    search?: string;
  }): WhatsAppConversation[] {
    let list = [...this.conversations];

    if (filter?.status && filter.status !== 'todas') {
      list = list.filter(c => c.status === filter.status);
    }
    if (filter?.operatorId && filter.operatorId !== 'todos') {
      list = list.filter(c => c.assignedOperatorId === filter.operatorId);
    }
    if (filter?.aiMode && filter.aiMode !== 'todas') {
      list = list.filter(c => c.aiMode === filter.aiMode);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(c =>
        c.contactName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());
  }

  public getWhatsAppConversationById(id: string): WhatsAppConversation | undefined {
    return this.conversations.find(c => c.id === id);
  }

  public getWhatsAppConversationByPhone(phone: string): WhatsAppConversation | undefined {
    const clean = phone.replace(/\D/g, '');
    return this.conversations.find(c => {
      const convClean = c.phoneNumber.replace(/\D/g, '');
      return convClean === clean || (clean.length >= 8 && convClean.endsWith(clean)) || (convClean.length >= 8 && clean.endsWith(convClean));
    });
  }

  public createWhatsAppConversation(data: Partial<WhatsAppConversation>, author = 'Sistema'): WhatsAppConversation {
    const id = data.id || `conv-${crypto.randomUUID().slice(0, 8)}`;
    const newConv: WhatsAppConversation = {
      id,
      leadId: data.leadId,
      contactName: data.contactName || 'Contato WhatsApp',
      companyName: data.companyName || 'Empresa em Atendimento',
      phoneNumber: data.phoneNumber || '',
      avatar: data.avatar,
      lastMessage: data.lastMessage || 'Conversa iniciada',
      lastMessageTimestamp: new Date().toISOString(),
      unreadCount: data.unreadCount ?? 0,
      status: data.status || 'aberta',
      aiMode: data.aiMode || 'copiloto',
      assignedOperatorId: data.assignedOperatorId || 'user-sdr',
      assignedOperatorName: data.assignedOperatorName || 'Carlos Mendes (SDR)',
      priority: data.priority || 'alta',
      tags: data.tags || ['Novo Lead'],
      city: data.city,
      neighborhood: data.neighborhood,
      segment: data.segment,
      site: data.site,
      opportunityTier: data.opportunityTier || 'B',
      commercialStageId: data.commercialStageId || 'contato_realizado',
      nextFollowUpAt: data.nextFollowUpAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.conversations.unshift(newConv);
    this.addAuditLog({
      user: author,
      userRole: 'sdr',
      action: 'NOVA_CONVERSA_WHATSAPP',
      entityType: 'whatsapp',
      entityId: id,
      details: `Nova conversa aberta com ${newConv.contactName} (${newConv.companyName}) no WhatsApp.`
    });
    this.saveDatabase();
    return newConv;
  }

  public updateWhatsAppConversation(id: string, updates: Partial<WhatsAppConversation>, author = 'Equipe Comercial'): WhatsAppConversation | undefined {
    const index = this.conversations.findIndex(c => c.id === id);
    if (index === -1) return undefined;

    const old = this.conversations[index];
    const updated: WhatsAppConversation = {
      ...old,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.conversations[index] = updated;

    // Sync with corresponding lead if stage or assigned changed
    if (updated.leadId) {
      const lead = this.getLeadById(updated.leadId);
      if (lead) {
        if (updates.commercialStageId && updates.commercialStageId !== lead.stageId) {
          this.updateLeadStage(lead.id, updates.commercialStageId, author);
        }
        if (updates.assignedOperatorName && updates.assignedOperatorName !== lead.assignedTo) {
          lead.assignedTo = updates.assignedOperatorName;
          lead.updatedAt = new Date().toISOString();
        }
      }
    }

    this.saveDatabase();
    return updated;
  }

  public getWhatsAppChatMessages(conversationId: string): WhatsAppChatMessage[] {
    return this.chatMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public addWhatsAppChatMessage(msg: Omit<WhatsAppChatMessage, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): WhatsAppChatMessage {
    const id = msg.id || `msg-${crypto.randomUUID().slice(0, 8)}`;
    const timestamp = msg.timestamp || new Date().toISOString();
    const newMsg: WhatsAppChatMessage = {
      ...msg,
      id,
      timestamp
    };
    this.chatMessages.push(newMsg);

    // Update parent conversation's lastMessage and lastMessageTimestamp
    const conv = this.conversations.find(c => c.id === msg.conversationId);
    if (conv) {
      if (!msg.isInternalNote) {
        conv.lastMessage = msg.type === 'audio'
          ? 'Mensagem de voz gravada'
          : msg.type === 'image'
          ? 'Imagem compartilhada'
          : msg.type === 'document'
          ? `Documento: ${msg.mediaName || 'arquivo'}`
          : msg.content;
        conv.lastMessageTimestamp = timestamp;
        if (msg.sender === 'lead') {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }
      }
      conv.updatedAt = timestamp;
    }

    this.saveDatabase();
    return newMsg;
  }

  public updateWhatsAppChatMessage(id: string, updates: Partial<WhatsAppChatMessage>): WhatsAppChatMessage | undefined {
    const index = this.chatMessages.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    this.chatMessages[index] = {
      ...this.chatMessages[index],
      ...updates
    };
    this.saveDatabase();
    return this.chatMessages[index];
  }

  public getWhatsAppDashboardMetrics(): WhatsAppDashboardMetrics {
    const convs = this.conversations;
    const msgs = this.chatMessages;

    const totalConversations = convs.length;
    const openConversations = convs.filter(c => c.status === 'aberta').length;
    const pendingConversations = convs.filter(c => c.status === 'pendente').length;
    const closedConversations = convs.filter(c => c.status === 'encerrada').length;

    const aiHandledCount = convs.filter(c => c.aiMode === 'copiloto' || c.aiMode === 'automatico').length;
    const humanHandledCount = convs.filter(c => c.aiMode === 'humano').length;

    const sentMsgs = msgs.filter(m => m.sender === 'operator' || m.sender === 'ai');
    const totalMessagesSent = sentMsgs.length;
    const totalMessagesDelivered = sentMsgs.filter(m => m.status === 'entregue' || m.status === 'lido').length;
    const totalMessagesRead = sentMsgs.filter(m => m.status === 'lido').length;

    const deliveryRatePercentage = totalMessagesSent > 0 ? Number(((totalMessagesDelivered / totalMessagesSent) * 100).toFixed(1)) : 0;
    const readRatePercentage = totalMessagesDelivered > 0 ? Number(((totalMessagesRead / totalMessagesDelivered) * 100).toFixed(1)) : 0;

    const wonCount = convs.filter(c => c.commercialStageId === 'cliente_fechado').length;
    const proposalCount = convs.filter(c => c.commercialStageId === 'proposta_enviada' || c.commercialStageId === 'negociacao' || c.commercialStageId === 'cliente_fechado').length;

    const conversionToProposalPercentage = totalConversations > 0 ? Number(((proposalCount / totalConversations) * 100).toFixed(1)) : 0;
    const conversionToWonPercentage = totalConversations > 0 ? Number(((wonCount / totalConversations) * 100).toFixed(1)) : 0;

    return {
      totalConversations,
      openConversations,
      pendingConversations,
      closedConversations,
      aiHandledCount,
      humanHandledCount,
      averageResponseTimeMinutes: 0,
      totalMessagesSent,
      totalMessagesDelivered,
      totalMessagesRead,
      deliveryRatePercentage,
      readRatePercentage,
      conversionToProposalPercentage,
      conversionToWonPercentage,
      slaBreachCount: 0
    };
  }

  // --- AUTOMATIONS CENTRAL (GOOGLE CLOUD TASKS & WEBHOOKS) ---
  public getAutomationsConfig(): AutomationCentralConfig {
    return { ...this.data.automationsConfig };
  }

  public updateAutomationsConfig(updates: Partial<AutomationCentralConfig>): AutomationCentralConfig {
    this.data.automationsConfig = {
      ...this.data.automationsConfig,
      ...updates
    };
    if (this.data.n8nConfig) {
      this.data.n8nConfig = { ...this.data.automationsConfig };
    }
    this.saveDatabase();
    return this.data.automationsConfig;
  }

  public recordAutomationEvent() {
    this.data.automationsConfig.totalReceivedEvents += 1;
    this.data.automationsConfig.lastEventAt = new Date().toISOString();
    this.saveDatabase();
  }

  public runScheduledMaintenance(): { checkedLeads: number; expiredWindows: number; actionsTaken: string[] } {
    const leads = this.leads;
    let expiredWindows = 0;
    const actionsTaken: string[] = [];

    const now = Date.now();
    leads.forEach(l => {
      if (l.stageId === 'respondeu' && l.updatedAt) {
        const hoursSinceUpdate = (now - new Date(l.updatedAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceUpdate > (this.data.automationsConfig.metaWindowSlaHours || 24)) {
          expiredWindows++;
          actionsTaken.push(`Alerta SLA Meta: Empresa "${l.name}" respondeu há mais de 24h sem encerramento de janela.`);
        }
      }
    });

    this.data.automationsConfig.lastScheduledExecutionAt = new Date().toISOString();
    this.saveDatabase();

    return {
      checkedLeads: leads.length,
      expiredWindows,
      actionsTaken
    };
  }

  // Backward compatibility alias for n8n
  public getN8nConfig(): AutomationCentralConfig {
    return this.getAutomationsConfig();
  }

  public updateN8nConfig(updates: Partial<AutomationCentralConfig>): AutomationCentralConfig {
    return this.updateAutomationsConfig(updates);
  }

  public recordN8nEvent() {
    this.recordAutomationEvent();
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `audit-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    this.saveDatabase();
  }

  // --- LOCAL PROSPECTING (TABOÃO SBC & GRANDE ABC) ---
  // --- LOCAL PROSPECTING (TABOÃO SBC & GRANDE ABC) ---
  public getProspectingPlaces(filter?: Partial<LocalProspectingFilter>): LocalProspectingPlace[] {
    let result = [...this.prospectingPlaces];

    // 1. Geographic filtering (City)
    if (filter?.city && filter.city !== 'Todas as Cidades de SP' && filter.city !== 'Todas') {
      const c = filter.city.toLowerCase().trim();
      result = result.filter(
        p =>
          (p.city && p.city.toLowerCase().includes(c)) ||
          (p.address && p.address.toLowerCase().includes(c)) ||
          (p.searchCity && p.searchCity.toLowerCase().includes(c))
      );
    }

    // 2. Neighborhood filter & geoScope
    // geoScope: 'search_neighborhood' (apenas no bairro), 'radius' (no raio km), 'city'/'all' (toda a cidade)
    if (filter?.neighborhood && filter.neighborhood !== 'Todos') {
      const n = filter.neighborhood.toLowerCase().trim();
      if (filter.geoScope === 'city') {
        // Toda a cidade: do not restrict to specific neighborhood
      } else if (filter.geoScope === 'search_neighborhood') {
        result = result.filter(p => {
          const matchReal = p.realNeighborhood && p.realNeighborhood.toLowerCase().includes(n);
          const matchNeigh = p.neighborhood && p.neighborhood.toLowerCase().includes(n);
          const matchSearch = p.searchNeighborhood && p.searchNeighborhood.toLowerCase().includes(n);
          const matchAddr = p.address && p.address.toLowerCase().includes(n);
          return matchReal || matchNeigh || matchSearch || matchAddr;
        });
      } else if (filter.geoScope === 'radius' && filter.radiusKm !== undefined) {
        const maxDist = filter.radiusKm;
        result = result.filter(p => {
          if (p.distanceFromSearchPointKm !== undefined) {
            return p.distanceFromSearchPointKm <= maxDist;
          }
          return (p.neighborhood && p.neighborhood.toLowerCase().includes(n)) || (p.address && p.address.toLowerCase().includes(n));
        });
      } else {
        // Default standard match
        result = result.filter(p =>
          (p.realNeighborhood && p.realNeighborhood.toLowerCase().includes(n)) ||
          (p.neighborhood && p.neighborhood.toLowerCase().includes(n)) ||
          (p.searchNeighborhood && p.searchNeighborhood.toLowerCase().includes(n)) ||
          (p.address && p.address.toLowerCase().includes(n))
        );
      }
    }

    // 3. Segment filter
    if (filter?.segment && filter.segment !== 'Todos' && filter.segment !== '') {
      const s = filter.segment.toLowerCase().trim();
      result = result.filter(p => (p.segment && p.segment.toLowerCase().includes(s)) || p.name.toLowerCase().includes(s));
    }

    // 4. Tier filter
    if (filter?.tierFilter) {
      if (filter.tierFilter === 'all') {
        // Return all without tier exclusion
      } else if (filter.tierFilter === 'opportunities_ab') {
        result = result.filter(p => p.opportunityTier === 'A' || p.opportunityTier === 'B');
      } else if (filter.tierFilter === 'tier_a') {
        result = result.filter(p => p.opportunityTier === 'A');
      } else if (filter.tierFilter === 'tier_b') {
        result = result.filter(p => p.opportunityTier === 'B');
      } else if (filter.tierFilter === 'tier_c') {
        result = result.filter(p => p.opportunityTier === 'C');
      } else if (filter.tierFilter === 'pending') {
        result = result.filter(p => p.opportunityTier === 'pendente');
      } else if (filter.tierFilter === 'inconclusive') {
        result = result.filter(p => p.opportunityTier === 'inconclusivo');
      } else if (filter.tierFilter === 'in_crm') {
        result = result.filter(p => Boolean(p.crmLeadId));
      }
    } else if (filter?.onlyOpportunitiesAB === true) {
      result = result.filter(p => p.opportunityTier === 'A' || p.opportunityTier === 'B');
    }

    // 5. Search query text
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase().trim();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.site && p.site.toLowerCase().includes(q)) ||
          (p.segment && p.segment.toLowerCase().includes(q)) ||
          (p.neighborhood && p.neighborhood.toLowerCase().includes(q)) ||
          (p.realNeighborhood && p.realNeighborhood.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getProspectingDatabaseStats(): ProspectingDatabaseStats {
    const list = this.prospectingPlaces;
    const totalInDb = list.length;
    let totalClassA = 0;
    let totalClassB = 0;
    let totalClassC = 0;
    let totalPending = 0;
    let totalInconclusive = 0;
    let totalInCrm = 0;
    let totalContacted = 0;

    for (const p of list) {
      if (p.opportunityTier === 'A') totalClassA++;
      else if (p.opportunityTier === 'B') totalClassB++;
      else if (p.opportunityTier === 'C') totalClassC++;
      else if (p.opportunityTier === 'pendente') totalPending++;
      else if (p.opportunityTier === 'inconclusivo') totalInconclusive++;
      else {
        // Fallback safety
        if (!p.site) totalClassB++;
        else totalPending++;
      }

      if (p.crmLeadId) totalInCrm++;
      if (p.isContacted) totalContacted++;
    }

    return {
      totalInDb,
      totalOpportunitiesAB: totalClassA + totalClassB,
      totalClassA,
      totalClassB,
      totalClassC,
      totalPending,
      totalInconclusive,
      totalInCrm,
      totalContacted
    };
  }

  public saveProspectingPlaces(places: LocalProspectingPlace[]): void {
    const current = [...this.prospectingPlaces];
    let addedCount = 0;

    for (const rawP of places) {
      const p = { ...rawP };
      const hasSite = Boolean(p.site && p.site.trim().length > 5);

      if (!hasSite) {
        p.opportunityTier = 'B';
        p.siteStatusCategory = 'sem_site_no_maps';
        if (!p.opportunityReason || p.opportunityReason.includes('não possui site')) {
          p.opportunityReason = 'Sem website informado no Google Maps — sujeito à confirmação com o decisor.';
        }
      } else if (!p.auditResult) {
        p.opportunityTier = 'pendente';
        p.siteStatusCategory = 'aguardando_auditoria';
        if (!p.opportunityReason || p.opportunityReason.includes('identificado e operando')) {
          p.opportunityReason = `Possui website no Google Maps (${p.site}). Aguardando auditoria técnica para qualificação.`;
        }
      } else if (p.opportunityTier === 'inconclusivo' || p.siteStatusCategory === 'auditoria_inconclusiva') {
        p.opportunityTier = 'inconclusivo';
        p.siteStatusCategory = 'auditoria_inconclusiva';
      } else if (p.auditResult.problemsFound && p.auditResult.problemsFound.length > 0) {
        p.opportunityTier = 'A';
        p.siteStatusCategory = 'site_com_problema_comprovado';
      } else {
        p.opportunityTier = 'C';
        p.siteStatusCategory = 'site_funcional_sem_problema';
      }

      const cleanPhone = p.phone ? p.phone.replace(/\D/g, '') : '';
      const cleanSite = p.site ? p.site.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '') : '';

      const existsIndex = current.findIndex(existing => {
        if (p.sourceId && existing.sourceId && p.sourceId === existing.sourceId) return true;
        const exPhone = existing.phone ? existing.phone.replace(/\D/g, '') : '';
        if (cleanPhone && cleanPhone.length >= 8 && exPhone && cleanPhone === exPhone) return true;
        const exSite = existing.site ? existing.site.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '') : '';
        if (cleanSite && exSite && cleanSite === exSite) return true;
        return false;
      });

      if (existsIndex >= 0) {
        const existing = current[existsIndex];
        const preservedAudit = existing.auditResult || p.auditResult;
        const preservedTier = existing.auditResult ? existing.opportunityTier : p.opportunityTier;
        const preservedCategory = existing.auditResult ? existing.siteStatusCategory : p.siteStatusCategory;
        const preservedReason = existing.auditResult ? existing.opportunityReason : p.opportunityReason;

        current[existsIndex] = {
          ...existing,
          ...p,
          auditResult: preservedAudit,
          opportunityTier: preservedTier,
          siteStatusCategory: preservedCategory,
          opportunityReason: preservedReason,
          isContacted: existing.isContacted || p.isContacted,
          contactedAt: existing.contactedAt || p.contactedAt,
          contactedBy: existing.contactedBy || p.contactedBy,
          crmLeadId: existing.crmLeadId || p.crmLeadId,
          importedToCrmAt: existing.importedToCrmAt || p.importedToCrmAt,
          importedToCrmBy: existing.importedToCrmBy || p.importedToCrmBy
        };
      } else {
        current.push(p);
        addedCount++;
      }
    }

    this.prospectingPlaces = current;
    this.addAuditLog({
      user: 'Prospecção Local',
      userRole: 'sdr',
      action: 'PESQUISA_PROSPECCAO_LOCAL',
      entityType: 'lead',
      details: `Pesquisa de estabelecimentos locais salva. ${addedCount} novos registros adicionados à base regional de Taboão / SBC.`
    });
    this.saveDatabase();
  }

  public updatePlaceAudit(placeId: string, audit: TechnicalAuditEvidence, tier: OpportunityTier): LocalProspectingPlace | undefined {
    const list = [...this.prospectingPlaces];
    const item = list.find(p => p.id === placeId);
    if (!item) return undefined;

    item.auditResult = audit;
    item.opportunityTier = tier;

    if (tier === 'A') {
      item.siteStatusCategory = 'site_com_problema_comprovado';
      item.opportunityReason = audit.problemsFound?.[0] || 'Site com problema técnico comprovado via auditoria HTTP.';
      item.priority = 'alta';
    } else if (tier === 'B') {
      item.siteStatusCategory = 'sem_site_no_maps';
      item.opportunityReason = 'Sem website informado no Google Maps — sujeito à confirmação com o decisor.';
      item.priority = 'alta';
    } else if (tier === 'pendente') {
      item.siteStatusCategory = 'aguardando_auditoria';
      item.opportunityReason = 'Possui website no Google Maps. Aguardando auditoria técnica para qualificação.';
      item.priority = 'media';
    } else if (tier === 'inconclusivo') {
      item.siteStatusCategory = 'auditoria_inconclusiva';
      item.opportunityReason = audit.classificationReason || 'Auditoria técnica inconclusiva: bloqueio de acesso/WAF ou resposta ambígua.';
      item.priority = 'media';
    } else {
      item.siteStatusCategory = 'site_funcional_sem_problema';
      item.opportunityReason = 'Website auditado com sucesso: HTTP 200, certificado SSL seguro e sem falhas comprovadas.';
      item.priority = 'baixa';
    }

    this.prospectingPlaces = list;
    this.addAuditLog({
      user: 'Auditor Técnico Web',
      userRole: 'sdr',
      action: 'AUDITORIA_SITE_LOCAL',
      entityType: 'lead',
      entityId: placeId,
      details: `Auditoria técnica do site da empresa ${item.name} concluída: Classe ${tier.toUpperCase()} (${item.opportunityReason}).`
    });
    this.saveDatabase();
    return item;
  }

  public markPlaceContacted(placeId: string, author: string): LocalProspectingPlace | undefined {
    const list = [...this.prospectingPlaces];
    const item = list.find(p => p.id === placeId);
    if (!item) return undefined;

    item.isContacted = true;
    item.contactedAt = new Date().toISOString();
    item.contactedBy = author;

    const contacted = this.contactedPlaces;
    if (!contacted.includes(placeId)) {
      contacted.push(placeId);
      this.contactedPlaces = contacted;
    }

    this.prospectingPlaces = list;
    this.addAuditLog({
      user: author,
      userRole: 'sdr',
      action: 'MARCADO_CONTATADO',
      entityType: 'lead',
      entityId: placeId,
      details: `Empresa ${item.name} marcada como já contatada no histórico comercial.`
    });
    this.saveDatabase();
    return item;
  }

  public deduplicateProspectingPlaces(): { totalRemoved: number; remainingCount: number } {
    const current = [...this.prospectingPlaces];
    const seenSourceIds = new Set<string>();
    const seenPhones = new Set<string>();
    const seenDomains = new Set<string>();
    const unique: LocalProspectingPlace[] = [];
    let removed = 0;

    for (const item of current) {
      const cleanPhone = item.phone ? item.phone.replace(/\D/g, '') : '';
      const cleanDomain = item.site ? item.site.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '') : '';

      let isDup = false;
      if (item.sourceId && seenSourceIds.has(item.sourceId)) isDup = true;
      if (cleanPhone && cleanPhone.length >= 8 && seenPhones.has(cleanPhone)) isDup = true;
      if (cleanDomain && cleanDomain.length > 3 && seenDomains.has(cleanDomain)) isDup = true;

      if (isDup) {
        removed++;
      } else {
        if (item.sourceId) seenSourceIds.add(item.sourceId);
        if (cleanPhone && cleanPhone.length >= 8) seenPhones.add(cleanPhone);
        if (cleanDomain && cleanDomain.length > 3) seenDomains.add(cleanDomain);
        unique.push(item);
      }
    }

    this.prospectingPlaces = unique;
    this.saveDatabase();
    return { totalRemoved: removed, remainingCount: unique.length };
  }

  public updatePlacePitch(placeId: string, pitch: CommercialPitchResult): LocalProspectingPlace | undefined {
    const list = [...this.prospectingPlaces];
    const item = list.find(p => p.id === placeId);
    if (!item) return undefined;

    item.commercialPitch = pitch;
    this.prospectingPlaces = list;
    this.addAuditLog({
      user: 'Gerador de Abordagens IA',
      userRole: 'sdr',
      action: 'ABORDAGEM_COMERCIAL_GERADA',
      entityType: 'lead',
      entityId: placeId,
      details: `Abordagem B2B gerada para ${item.name} (${pitch.scenarioType || 'geral'}). Origem verificada: ${(pitch.sourceEvidenceUsed || 'Registro público / Auditoria').slice(0, 150)}...`
    });
    this.saveDatabase();
    return item;
  }

  public getInteractions(leadId?: string): CommercialInteraction[] {
    if (leadId) {
      return this.interactions
        .filter(i => i.leadId === leadId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return [...this.interactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public addInteraction(entry: Omit<CommercialInteraction, 'id' | 'timestamp'>): CommercialInteraction {
    const inter: CommercialInteraction = {
      ...entry,
      id: `inter-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString()
    };
    this.interactions.unshift(inter);
    if (this.interactions.length > 500) {
      this.interactions = this.interactions.slice(0, 500);
    }
    const lead = this.getLeadById(entry.leadId);
    if (lead) {
      lead.interactionsCount = (lead.interactionsCount || 0) + 1;
      lead.updatedAt = new Date().toISOString();
    }
    this.saveDatabase();
    return inter;
  }

  public convertPlaceToLead(placeId: string, author: string): { success: boolean; lead?: Lead; duplicateError?: string } {
    const item = this.prospectingPlaces.find(p => p.id === placeId);
    if (!item) return { success: false, duplicateError: 'Empresa não encontrada na base de prospecção.' };

    // 1. Prevent duplicate imports if already mapped to a CRM lead
    if (item.crmLeadId) {
      const existing = this.getLeadById(item.crmLeadId);
      if (existing) {
        return {
          success: false,
          duplicateError: `A empresa "${item.name}" já foi importada para o CRM (Lead: ${existing.name}, ID: ${existing.id}, Estágio: ${existing.stageId}). Evitando importação duplicada.`
        };
      }
    }

    if (isGovernmentOrPoliticalEntity(item)) {
      return { success: false, duplicateError: `Conversão bloqueada: A organização "${item.name}" é uma entidade governamental ou política. A Fazer Meu Website opera 100% no setor privado B2B.` };
    }

    const cleanPhone = item.phone ? item.phone.replace(/\D/g, '') : '';
    const cleanWhatsapp = cleanPhone.startsWith('55') ? cleanPhone : cleanPhone.length >= 10 ? `55${cleanPhone}` : cleanPhone;

    const pitchDetails = item.commercialPitch
      ? `\n\n--- ORIGEM VERIFICADA DOS DADOS & ABORDAGEM ---\nOrigem das informações: ${item.commercialPitch.sourceEvidenceUsed}\nCenário Estratégico: ${item.commercialPitch.scenarioType}\nRevisão Humana: Obrigatória antes de qualquer envio\nAbordagem WhatsApp Sugerida:\n"${item.commercialPitch.whatsappVersion}"\n\nAbordagem E-mail (Assunto: ${item.commercialPitch.emailVersion?.subject || 'Proposta de Design sem Custo'}):\n"${item.commercialPitch.emailVersion?.body || ''}"\n----------------------------------------------`
      : '';

    const campaignLabel = `${item.searchCity || item.city} / ${item.searchNeighborhood || item.neighborhood}`;

    const leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> = {
      name: item.name,
      segment: item.segment,
      city: item.city,
      neighborhood: item.realNeighborhood || item.neighborhood,
      site: item.site,
      commercialPhone: item.phone,
      whatsapp: cleanWhatsapp || '5511999999999',
      contactName: 'Responsável Comercial',
      contactRole: 'Diretor / Sócio',
      source: `Prospecção Local (${item.neighborhood} - ${item.city})`,
      sourceId: item.sourceId,
      prospectingPlaceId: item.id,
      importCampaign: campaignLabel,
      importedAt: new Date().toISOString(),
      importedBy: author || 'Carlos Mendes (SDR)',
      verificationStatus: 'verificado',
      originType: 'importacao_externa',
      auditEvidence: `Google Place ID: ${item.sourceId} | Fonte: ${item.source} (${item.neighborhood} - ${item.city})`,
      lastVerifiedAt: new Date().toISOString(),
      consentStatus: 'pendente',
      stageId: item.opportunityTier === 'A' ? 'oportunidade_qualificada' : 'identificada',
      priority: item.priority || 'alta',
      assignedTo: author || 'Carlos Mendes (SDR)',
      notes: `Lead importado da Prospecção Local (${item.source}).\nClassificação: Classe ${item.opportunityTier} (${item.opportunityReason}).\n${item.auditResult?.evidenceText ? `Evidência Técnica: ${item.auditResult.evidenceText}` : ''}${pitchDetails}`
    };

    const res = this.createLead(leadData, author);
    if (res.duplicateError) {
      return { success: false, duplicateError: res.duplicateError };
    }

    item.crmLeadId = res.lead?.id;
    item.importedToCrmAt = new Date().toISOString();
    item.importedToCrmBy = author;

    if (res.lead?.id) {
      this.addInteraction({
        leadId: res.lead.id,
        type: 'nota',
        title: 'Importação da Prospecção Local',
        description: `Lead importado com sucesso para o Funil Comercial (ID Origem: ${item.sourceId}). Classificação: Classe ${item.opportunityTier}. Campanha: ${campaignLabel}. Operador atribuído: ${author}.`,
        author
      });
    }

    this.addAuditLog({
      user: author,
      userRole: 'sdr',
      action: 'CONVERSAO_LEAD_PROSPECCAO',
      entityType: 'lead',
      entityId: res.lead?.id,
      details: `Empresa ${item.name} convertida para Lead no CRM. Origem das informações: ${item.commercialPitch?.sourceEvidenceUsed || item.source}.`
    });
    this.saveDatabase();
    return { success: true, lead: res.lead };
  }

  public batchConvertPlacesToLeads(placeIds: string[], author: string): {
    convertedCount: number;
    duplicatesCount: number;
    leads: Lead[];
  } {
    const leads: Lead[] = [];
    let convertedCount = 0;
    let duplicatesCount = 0;

    for (const placeId of placeIds) {
      const res = this.convertPlaceToLead(placeId, author);
      if (res.success && res.lead) {
        convertedCount++;
        leads.push(res.lead);
      } else if (res.duplicateError) {
        duplicatesCount++;
      }
    }

    if (convertedCount > 0) {
      this.addAuditLog({
        user: author,
        userRole: 'sdr',
        action: 'CONVERSAO_LOTE_PROSPECCAO',
        entityType: 'lead',
        details: `Importação em lote concluída: ${convertedCount} empresas adicionadas ao funil comercial. (${duplicatesCount} duplicadas ignoradas).`
      });
      this.saveDatabase();
    }

    return { convertedCount, duplicatesCount, leads };
  }

  // --- USERS & AUTH ---
  public getUsers(): UserProfile[] {
    return this.data.users;
  }
}

export const storage = new StorageService();
