/**
 * Types for FMWS SALES — Central Comercial Inteligente
 * Fazer Meu Website (https://fazermeuwebsite.com.br/)
 *
 * Modelo Definitivo de Prospecção e Transferência Comercial:
 * - CANAL 1: Prospecção Automatizada (+55 11 94579-9976) — Integrado à Meta WhatsApp Cloud API
 * - CANAL 2: Atendimento Comercial Humano (+55 11 98634-2981) — Sem API (WhatsApp Celular/PC)
 */

export type CommercialStageId =
  | 'identificada'
  | 'em_analise'
  | 'oportunidade_qualificada'
  | 'aguardando_autorizacao'
  | 'contato_realizado'
  | 'aguardando_resposta'
  | 'respondeu'
  | 'interessado'
  | 'encaminhamento_enviado'
  | 'atendimento_confirmado'
  | 'reuniao_agendada'
  | 'proposta_enviada'
  | 'negociacao'
  | 'cliente_fechado'
  | 'perdido';

export interface CommercialStage {
  id: CommercialStageId;
  order: number;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
}

export type ConsentStatus = 'autorizado' | 'pendente' | 'opt_out' | 'revogado';

export type LeadPriority = 'alta' | 'media' | 'baixa';

export type ServiceType =
  | 'criacao_site_profissional'
  | 'desenvolvimento_aplicacao_web'
  | 'hospedagem_linux'
  | 'hospedagem_wordpress'
  | 'revenda_hospedagem'
  | 'registro_transferencia_dominio';

export type ResponseClassification =
  | 'interesse_real'
  | 'recusa_optout'
  | 'resposta_automatica'
  | 'duvida_geral'
  | 'indefinido';

export interface ClassifiedResponse {
  classification: ResponseClassification;
  confidence: number;
  summary: string;
  isAutoReply: boolean;
  isOptOut: boolean;
  recommendedAction: string;
  analyzedAt: string;
  categoria?: ResponseClassification;
  explicacao?: string;
}

export interface AIAnalysisReport {
  analyzedAt: string;
  siteUrl: string;
  hasInstitutionalSite: boolean;
  presentationQuality: 'excelente' | 'boa' | 'regular' | 'critica' | 'inexistente';
  mobileExperienceScore: number; // 0 to 100
  servicesOrganization: string;
  contactChannelsClarity: string;
  institutionalInfoPresence: string;
  observedProblems: string[];
  evidenceAndUrls: string[];
  recommendedImprovements: string[];
  priorityLevel: LeadPriority;
  suggestedCommercialSolution: string;
  fmwsDifferentiatorPitch: string;
}

export interface CommercialInteraction {
  id: string;
  leadId: string;
  timestamp: string;
  type:
    | 'nota'
    | 'whatsapp'
    | 'email'
    | 'reuniao'
    | 'proposta'
    | 'mudanca_estagio'
    | 'analise_ia'
    | 'encaminhamento_comercial'
    | 'confirmacao_atendimento';
  title: string;
  description: string;
  author: string;
  metadata?: Record<string, any>;
}

export interface Lead {
  id: string;
  name: string;
  cnpj?: string;
  segment: string;
  city: string;
  neighborhood: string;
  site?: string;
  instagram?: string;
  facebook?: string;
  commercialPhone: string;
  whatsapp: string;
  contactName: string;
  contactRole: string;
  source: string; // Ex: Google Maps, Indicação, Prospecção Ativa, Outbound
  sourceId?: string; // ID externo confiável (Place ID ou ID cadastral da origem)
  prospectingPlaceId?: string; // Vínculo com registro da base de prospecção
  importCampaign?: string; // Nome ou identificação da campanha de importação
  importedAt?: string; // Data e hora da importação para o CRM
  importedBy?: string; // Operador comercial (SDR/Closer) que realizou a importação
  verificationStatus?: VerificationStatus; // 'verificado' | 'pendente_verificacao' | 'demonstrativo' | 'suspeito_duplicidade'
  originType?: LeadOriginType; // 'importacao_externa' | 'cadastro_manual' | 'whatsapp_inbound' | 'csv_import' | 'integracao_autenticada' | 'demonstrativo'
  auditEvidence?: string; // Evidência auditável da legitimidade do registro
  lastVerifiedAt: string;
  consentStatus: ConsentStatus;
  consentRecordedAt?: string;
  consentNotes?: string;
  stageId: CommercialStageId;
  priority: LeadPriority;
  assignedTo: string;
  notes: string;
  opportunityTier?: OpportunityTier;
  dealValue?: number; // Estimated or contracted value
  createdAt: string;
  updatedAt: string;
  aiAnalysis?: AIAnalysisReport;
  lastClassification?: ClassifiedResponse;
  transferDispatchedAt?: string;
  humanChatConfirmedAt?: string;
  interactionsCount?: number;
  tags?: string[];
}

export type VerificationStatus =
  | 'verificado'
  | 'pendente_verificacao'
  | 'demonstrativo'
  | 'suspeito_duplicidade';

export type LeadOriginType =
  | 'importacao_externa'
  | 'cadastro_manual'
  | 'whatsapp_inbound'
  | 'csv_import'
  | 'integracao_autenticada'
  | 'demonstrativo';

export interface CommercialProposal {
  id: string;
  proposalCode: string;
  leadId: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  contactWhatsapp: string;
  serviceRequested: ServiceType;
  projectScope: string;
  estimatedTimelineDays: number;
  price: number;
  paymentTerms: string;
  validityDays: number;
  validUntil: string;
  status: 'rascunho' | 'enviada' | 'aprovada' | 'recusada' | 'expirada';
  deliverables: string[];
  fmwsDifferentialIncluded: boolean;
  notes: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  versionHistory?: {
    version: number;
    updatedAt: string;
    updatedBy: string;
    price: number;
    notes: string;
  }[];
}

export interface WhatsAppConfig {
  // CANAL 1: Prospecção Automatizada Meta API
  channel1: {
    phoneNumber: string; // '+55 11 94579-9976'
    phoneNumberId: string; // '333767429829080'
    wabaId: string; // '419927517859112'
    hasApiToken: boolean;
    status: 'conectado' | 'aguardando_configuracao' | 'erro';
  };
  // CANAL 2: Atendimento Comercial Humano (SEM API)
  channel2: {
    phoneNumber: string; // '+55 11 98634-2981'
    waLink: string; // 'https://wa.me/5511986342981'
    channelType: 'manual_human_no_api';
    deviceInfo: string;
  };
  // Meta Webhook
  webhookVerifyToken: string;
  lastCheckedAt?: string;

  // Convenience flat fields for UI compatibility
  phoneNumberId?: string;
  wabaId?: string;
  hasApiToken?: boolean;
  isConfigured?: boolean;
  status?: 'conectado' | 'aguardando_configuracao' | 'erro';
  statusMessage?: string;
}

export interface WhatsAppMessageLog {
  id: string;
  leadId: string;
  leadName: string;
  to: string;
  channel: 'canal_1_prospeccao' | 'canal_2_comercial_humano';
  direction: 'outbound' | 'inbound';
  type: 'template' | 'custom_text' | 'encaminhamento_oficial';
  templateName?: string;
  content: string;
  status: 'pendente_aprovacao' | 'enviado' | 'entregue' | 'lido' | 'falha' | 'recebido';
  failureReason?: string;
  sentAt: string;
  approvedBy?: string;
  whatsappMessageId?: string;
  isHumanReply?: boolean;
  classification?: ClassifiedResponse;
}

export type WhatsAppConversationStatus = 'aberta' | 'pendente' | 'encerrada';
export type WhatsAppAiMode = 'copiloto' | 'automatico' | 'humano';
export type WhatsAppMessageSender = 'lead' | 'operator' | 'ai' | 'system';
export type WhatsAppMessageType = 'text' | 'image' | 'document' | 'audio' | 'internal_note' | 'template';
export type WhatsAppDeliveryStatus = 'pendente' | 'enviado' | 'entregue' | 'lido' | 'falha' | 'recebido';

export interface WhatsAppConversation {
  id: string;
  leadId?: string;
  contactName: string;
  companyName: string;
  phoneNumber: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  status: WhatsAppConversationStatus;
  aiMode: WhatsAppAiMode;
  assignedOperatorId: string;
  assignedOperatorName: string;
  priority: LeadPriority;
  tags: string[];
  city?: string;
  neighborhood?: string;
  segment?: string;
  site?: string;
  opportunityTier?: OpportunityTier;
  commercialStageId: CommercialStageId;
  nextFollowUpAt?: string;
  verificationStatus?: VerificationStatus;
  originType?: LeadOriginType;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppChatMessage {
  id: string;
  conversationId: string;
  sender: WhatsAppMessageSender;
  senderName: string;
  content: string;
  type: WhatsAppMessageType;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  audioDurationSeconds?: number;
  status: WhatsAppDeliveryStatus;
  failureReason?: string;
  timestamp: string;
  replyToMessageId?: string;
  replyToContent?: string;
  isInternalNote?: boolean;
  aiSuggested?: boolean;
  aiConfidence?: number;
}

export interface WhatsAppDashboardMetrics {
  totalConversations: number;
  openConversations: number;
  pendingConversations: number;
  closedConversations: number;
  aiHandledCount: number;
  humanHandledCount: number;
  averageResponseTimeMinutes: number;
  totalMessagesSent: number;
  totalMessagesDelivered: number;
  totalMessagesRead: number;
  deliveryRatePercentage: number;
  readRatePercentage: number;
  conversionToProposalPercentage: number;
  conversionToWonPercentage: number;
  slaBreachCount: number;
}

export type CrmEnvironment = 'producao' | 'demo';

export interface AutomationCentralConfig {
  inboundWebhookUrl: string;
  inboundApiKey: string;
  outboundLeadWebhookUrl?: string;
  outboundStageWebhookUrl?: string;
  outboundTaskWebhookUrl?: string;
  isActive: boolean;
  totalReceivedEvents: number;
  lastEventAt?: string;
  // Google Cloud Native Features
  googleCloudTaskSlaEnabled: boolean;
  scheduledCronIntervalMinutes: number;
  lastScheduledExecutionAt?: string;
  autoTransferEnabled: boolean;
  metaWindowSlaHours: number;
}

// Retained for backward compatibility
export type N8nConfig = AutomationCentralConfig;

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  entityType: 'lead' | 'proposal' | 'whatsapp' | 'consent' | 'system' | 'transferencia' | 'automacao';
  entityId?: string;
  details: string;
  ipAddress?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'sdr' | 'closer';
  roleLabel: string;
}

export interface CommercialDashboardStats {
  // Required 8 core metrics:
  authorizedContacts: number; // Contatos autorizados
  messagesSent: number; // Mensagens enviadas
  humanRepliesReceived: number; // Respostas recebidas
  interestedIdentified: number; // Interessados identificados
  transfersSent: number; // Encaminhamentos enviados
  confirmedHumanChats: number; // Clientes que confirmaram a abertura do atendimento comercial
  proposalsSent: number; // Propostas comerciais
  clientsWon: number; // Vendas concluídas

  // Overall totals
  totalCompanies: number;
  pendingAnalysis: number;
  contractedRevenue: number;
  conversionRate: number;
  stageCounts: Record<CommercialStageId, number>;

  // Goal
  annualGoal: {
    targetClients: number;
    currentClients: number;
    progressPercentage: number;
    projectedMonthsRemaining: number;
  };
  weeklyEvolution: {
    week: string;
    newLeads: number;
    contacts: number;
    proposals: number;
    won: number;
  }[];
  monthlyEvolution: {
    month: string;
    leads: number;
    proposals: number;
    won: number;
    revenue: number;
  }[];
}

// --- LOCAL PROSPECTING MODULE TYPES (TABOÃO SBC & GRANDE ABC) ---
export type OpportunityTier = 'A' | 'B' | 'C' | 'pendente' | 'inconclusivo';

export type SiteStatusCategory =
  | 'sem_site_no_maps' // Campo website vazio no cadastro do Google Maps (Classe B — sujeito a confirmação)
  | 'site_nao_identificado' // Site não localizado após pesquisa complementar
  | 'aguardando_auditoria' // Possui website no Maps mas aguarda auditoria técnica real (Pendente)
  | 'site_com_problema_comprovado' // Site com falha técnica comprovada (Classe A)
  | 'auditoria_inconclusiva' // Auditoria sem resultado confiável (WAF/bloqueio/captcha) (Inconclusivo)
  | 'site_funcional_sem_problema' // Site online, seguro e responsivo comprovado (Classe C)
  | 'site_existente'; // Compatibilidade

export type ProspectingApiStatus =
  | 'connected' // Conectado
  | 'not_configured' // Não configurado
  | 'invalid_key' // Chave inválida
  | 'permission_denied' // Permissão negada
  | 'billing_not_configured' // Faturamento não configurado
  | 'network_error' // Erro de rede
  | 'quota_exceeded' // Limite de uso atingido
  | 'auth_error' // Erro de autenticação geral (compatibilidade)
  | 'completed'
  | 'idle';

export interface TechnicalAuditEvidence {
  url: string;
  statusCode?: number;
  responseTimeMs?: number;
  checkedAt: string;
  toolUsed: string; // Ex: 'HTTP/TLS Protocol Verifier (Backend Direct)'
  hasSsl: boolean;
  hasViewport: boolean;
  isUnderConstruction: boolean;
  hasBrokenLinks: boolean;
  hasIncompleteInfo: boolean;
  problemsFound: string[];
  evidenceText: string;
  analysisMethod: 'http_crawler' | 'ia_diagnosis' | 'manual_check';
  // Enhanced Audit Requirements:
  testsExecuted?: string[];
  testResults?: {
    dnsResolution: { success: boolean; ip?: string; latencyMs?: number; error?: string };
    sslTls: { success: boolean; validCert?: boolean; error?: string };
    httpStatus: { code: number; isOk: boolean; isRedirect?: boolean; finalUrl?: string };
    responseTime: { ms: number; isAcceptable: boolean };
    viewportTag: { present: boolean; rawTag?: string; note?: string };
    responsivenessValidated: { validated: boolean; note?: string };
    inconclusiveReason?: string;
  };
  classificationReason?: string;
  nextAuditRecommendedAt?: string;
}

export type PitchScenarioType =
  | 'sem_site_identificado'
  | 'site_com_problema_comprovado'
  | 'site_funcional_modernizacao';

export interface CommercialPitchResult {
  summary: string;
  approachText: string;
  suggestedService: string;
  differentiatorPitch: string;
  scenarioType?: PitchScenarioType;
  whatsappVersion?: string;
  emailVersion?: {
    subject: string;
    body: string;
  };
  sourceEvidenceUsed?: string;
  humanReviewRequired?: boolean;
  complianceNotice?: string;
  suggestedMetaTemplate?: string;
}

export interface LocalProspectingPlace {
  id: string;
  sourceId: string; // Google Place ID or unique source identifier
  source: string; // 'Google Places API (New)' | 'Cadastro Oficial SBC' | 'Demonstração'
  name: string;
  address: string;
  neighborhood: string; // Real or normalized neighborhood
  realNeighborhood?: string; // Bairro real da empresa (extraído do endereço físico oficial)
  searchNeighborhood?: string; // Bairro usado como ponto central da pesquisa
  searchCity?: string; // Cidade usada na busca
  searchRadiusKm?: number; // Raio em km configurado na busca
  city: string; // "São Bernardo do Campo", etc.
  state: string; // "SP"
  latitude?: number; // Coordenada real latitude
  longitude?: number; // Coordenada real longitude
  distanceFromSearchPointKm?: number; // Distância calculada em km do centro da pesquisa
  segment: string;
  phone: string; // Commercial phone
  site: string; // Institutional site or empty
  siteStatusCategory: SiteStatusCategory;
  mapsUrl: string; // Real Google Maps URL
  searchedAt: string;
  opportunityTier: OpportunityTier;
  opportunityReason: string;
  auditResult?: TechnicalAuditEvidence;
  isContacted: boolean;
  contactedAt?: string;
  contactedBy?: string;
  crmLeadId?: string;
  importedToCrmAt?: string;
  importedToCrmBy?: string;
  priority: 'alta' | 'media' | 'baixa';
  isDemoRecord?: boolean;
  commercialPitch?: CommercialPitchResult;
}

export interface LocalProspectingFilter {
  city: string;
  neighborhood: string;
  segment: string;
  radiusKm: 2 | 5 | 10 | 15 | 20 | 25;
  onlyOpportunitiesAB?: boolean;
  tierFilter?: 'all' | 'opportunities_ab' | 'tier_a' | 'tier_b' | 'tier_c' | 'pending' | 'inconclusive' | 'in_crm';
  searchQuery?: string;
  environment?: CrmEnvironment;
  selectedSegments?: string[];
  targetGoal?: number; // 50, 100, 250, 500, 1000
  geoScope?: 'city' | 'search_neighborhood' | 'radius'; // Requirement 6: filtrar apenas no bairro selecionado, dentro do raio, ou toda a cidade
}

export interface ProspectingDiagnostics {
  totalRawReceived: number;
  discardedGovernment: number;
  discardedDuplicates: number;
  discardedAlreadyInCrm: number;
  totalAdded: number;
  classACount: number;
  classBCount: number;
  classCCount: number;
  pendingCount?: number;
  inconclusiveCount?: number;
  queriesExecuted: number;
  pagesFetched: number;
  stopReason: string;
  executionTimeMs: number;
  lastRunAt: string;
  targetGoal: number;
  city: string;
  neighborhood: string;
  segmentsSearched: string[];
}

export interface ProspectingDatabaseStats {
  totalInDb: number;
  totalOpportunitiesAB: number;
  totalClassA: number;
  totalClassB: number;
  totalClassC: number;
  totalPending: number;
  totalInconclusive: number;
  totalInCrm: number;
  totalContacted: number;
}

export interface ProspectingCampaignHistory {
  id: string;
  timestamp: string;
  city: string;
  neighborhood: string;
  segments: string[];
  targetGoal: number;
  totalFound: number;
  diagnostics: ProspectingDiagnostics;
}

export interface CommercialSegmentDefinition {
  id: string;
  name: string;
  iconName: string;
  description: string;
  searchTerms: string[];
}

export interface SecretManagerStatusInfo {
  isConfigured: boolean;
  projectId: string;
  serviceAccount: string;
  apiEnabled: boolean;
  secretExists: boolean;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  missingPermissions?: string[];
  remediationCommands?: string[];
  consoleUrl?: string;
}

export interface PlacesApiValidationDetails {
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  diagnosis?: string;
  checkedEndpoint?: string;
  testedAt?: string;
}

export interface ProspectingApiConfig {
  hasGooglePlacesKey: boolean;
  placesApiKeyMasked?: string;
  status: ProspectingApiStatus;
  statusLabel: string;
  statusMessage: string;
  dailyRequestsCount: number;
  dailyRequestsLimit: number;
  costControlActive: boolean;
  lastSearchAt?: string;
  totalSearchesCount: number;
  secretManager?: SecretManagerStatusInfo;
  validationDetails?: PlacesApiValidationDetails;
  testedWithOfficialEndpoint: boolean;
  latestDiagnostics?: ProspectingDiagnostics;
}



