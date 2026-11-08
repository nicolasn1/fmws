/**
 * Client API Service for FMWS SALES
 */

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
  AIAnalysisReport,
  CommercialStageId,
  LocalProspectingPlace,
  TechnicalAuditEvidence,
  OpportunityTier,
  LocalProspectingFilter,
  ProspectingApiConfig,
  ProspectingApiStatus,
  ProspectingDiagnostics,
  ProspectingCampaignHistory,
  ProspectingDatabaseStats,
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppDashboardMetrics,
  WhatsAppAiMode,
  WhatsAppConversationStatus
} from '../types/crm';

const API_BASE = '/api';

export class ApiService {
  private static currentUser = 'Carlos Mendes (SDR)';

  public static setCurrentUser(userName: string) {
    this.currentUser = userName;
  }

  public static getCurrentUser(): string {
    return this.currentUser;
  }

  private static getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-user-name': this.currentUser
    };
  }

  // Health
  public static async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  }

  // Stats
  public static async getStats(): Promise<CommercialDashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Falha ao carregar métricas');
    return res.json();
  }

  // Users
  public static async getUsers(): Promise<UserProfile[]> {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  }

  // Leads
  public static async getLeads(filters?: {
    search?: string;
    stageId?: string;
    priority?: string;
    segment?: string;
    consentStatus?: string;
  }): Promise<Lead[]> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.stageId) params.append('stageId', filters.stageId);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.segment) params.append('segment', filters.segment);
    if (filters?.consentStatus) params.append('consentStatus', filters.consentStatus);

    const res = await fetch(`${API_BASE}/leads?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao carregar empresas');
    return res.json();
  }

  public static async getLeadById(id: string): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}`);
    if (!res.ok) throw new Error('Empresa não encontrada');
    return res.json();
  }

  public static async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(leadData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao cadastrar empresa');
    return data;
  }

  public static async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao atualizar dados');
    return data;
  }

  public static async updateLeadStage(id: string, stageId: CommercialStageId): Promise<Lead> {
    const res = await fetch(`${API_BASE}/leads/${id}/stage`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ stageId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao mover estágio');
    return data;
  }

  public static async deleteLead(id: string, isLgpd = false): Promise<void> {
    const res = await fetch(`${API_BASE}/leads/${id}?lgpd=${isLgpd}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Falha ao excluir registro');
  }

  public static async importCsv(leads: any[]): Promise<{ imported: number; duplicates: number; errors: number }> {
    const res = await fetch(`${API_BASE}/leads/import-csv`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ leads })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na importação CSV');
    return data;
  }

  // ACTION: "Encaminhar para WhatsApp Comercial" (Canal 1 -> Canal 2)
  public static async transferToCommercial(leadId: string): Promise<{ success: boolean; message: string; log?: any }> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/transfer-to-commercial`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao encaminhar lead');
    return data;
  }

  // ACTION: "Confirmar Abertura de Atendimento Comercial Humano"
  public static async confirmHumanChat(leadId: string): Promise<{ success: boolean; lead: Lead }> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/confirm-human-chat`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao confirmar atendimento');
    return data;
  }

  // Simulate an incoming WhatsApp response for testing
  public static async simulateIncomingMessage(from: string, text: string): Promise<any> {
    const res = await fetch(`${API_BASE}/whatsapp/simulate-incoming`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ from, text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao simular mensagem recebida');
    return data;
  }

  public static async classifyMessage(text: string, leadId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/classify-message`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text, leadId })
    });
    return res.json();
  }

  // AI Site Analysis & Assistant
  public static async analyzeLeadSite(leadId: string): Promise<AIAnalysisReport> {
    const res = await fetch(`${API_BASE}/leads/${leadId}/analyze-site`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na análise por IA');
    return data;
  }

  public static async runAssistant(params: {
    mode: 'generate_pitch' | 'handle_objection' | 'draft_proposal_scope' | 'summarize_conversation' | 'next_steps';
    leadId?: string;
    contextText?: string;
    objectionType?: string;
    selectedService?: string;
  }): Promise<{ output: string; suggestionTitle: string }> {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao consultar assistente');
    return data;
  }

  // WhatsApp Cloud
  public static async getWhatsAppConfig(): Promise<WhatsAppConfig> {
    const res = await fetch(`${API_BASE}/whatsapp/config`);
    return res.json();
  }

  public static async saveWhatsAppConfig(config: {
    phoneNumberId: string;
    wabaId: string;
    apiToken?: string;
    webhookVerifyToken?: string;
  }): Promise<WhatsAppConfig> {
    const res = await fetch(`${API_BASE}/whatsapp/config`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config)
    });
    return res.json();
  }

  // Meta Webhook & Public Tunnel Info
  public static async getWhatsAppWebhookInfo(): Promise<{
    tunnel: {
      url: string | null;
      status: 'offline' | 'starting' | 'online' | 'error';
      lastStartedAt: string | null;
      errorMessage?: string;
      history: Array<{ timestamp: string; event: string }>;
    };
    publicWebhookUrl: string;
    productionDomainUrl: string;
    verifyToken: string;
    recentVerifications: Array<{
      timestamp: string;
      success: boolean;
      mode?: string;
      receivedToken?: string;
      expectedToken?: string;
      challenge?: string;
      ip: string;
      userAgent: string;
      details: string;
    }>;
    lastVerification: any;
    isTunnelActive: boolean;
  }> {
    const res = await fetch(`${API_BASE}/whatsapp/webhook-info`);
    return res.json();
  }

  public static async restartTunnel(): Promise<{
    success: boolean;
    tunnelUrl: string | null;
    publicWebhookUrl: string | null;
    info: any;
  }> {
    const res = await fetch(`${API_BASE}/whatsapp/tunnel/restart`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  }

  public static async testWebhookHandshake(): Promise<{
    success: boolean;
    httpStatus?: number;
    latencyMs?: number;
    challengeReturned?: string;
    message?: string;
    error?: string;
  }> {
    const res = await fetch(`${API_BASE}/whatsapp/test-webhook-handshake`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok && !data.error) throw new Error('Falha na requisição de teste');
    return data;
  }

  public static async getWhatsAppLogs(): Promise<WhatsAppMessageLog[]> {
    const res = await fetch(`${API_BASE}/whatsapp/logs`);
    return res.json();
  }

  public static async sendWhatsApp(payload: {
    leadId: string;
    templateName?: string;
    messageText?: string;
    userApproved: boolean;
  }): Promise<{ success: boolean; messageId?: string; log: WhatsAppMessageLog }> {
    const res = await fetch(`${API_BASE}/whatsapp/send`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Falha ao enviar mensagem');
    }
    return data;
  }

  // Environment Management (Produção vs Demonstração)
  public static async getEnvironment(): Promise<{
    activeEnvironment: CrmEnvironment;
    production: { totalLeads: number; totalProposals: number; clientsWon: number; revenue: number };
    demo: { totalLeads: number; totalProposals: number; clientsWon: number; revenue: number };
  }> {
    const res = await fetch(`${API_BASE}/environment`);
    return res.json();
  }

  public static async setEnvironment(environment: CrmEnvironment) {
    const res = await fetch(`${API_BASE}/environment`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ environment })
    });
    return res.json();
  }

  // Central de Automações (Google Cloud native)
  public static async getAutomationsConfig(): Promise<AutomationCentralConfig> {
    const res = await fetch(`${API_BASE}/automations/config`);
    return res.json();
  }

  public static async saveAutomationsConfig(config: Partial<AutomationCentralConfig>): Promise<AutomationCentralConfig> {
    const res = await fetch(`${API_BASE}/automations/config`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config)
    });
    return res.json();
  }

  public static async runScheduledMaintenance(): Promise<{ checkedLeads: number; expiredWindows: number; actionsTaken: string[] }> {
    const res = await fetch(`${API_BASE}/automations/run-scheduled`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  }

  // n8n backwards compatibility
  public static async getN8nConfig(): Promise<N8nConfig> {
    const res = await fetch(`${API_BASE}/automations/config`);
    return res.json();
  }

  public static async saveN8nConfig(config: Partial<N8nConfig>): Promise<N8nConfig> {
    return this.saveAutomationsConfig(config);
  }

  // Proposals
  public static async getProposals(): Promise<CommercialProposal[]> {
    const res = await fetch(`${API_BASE}/proposals`);
    return res.json();
  }

  public static async createProposal(prop: Partial<CommercialProposal>): Promise<CommercialProposal> {
    const res = await fetch(`${API_BASE}/proposals`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(prop)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao gerar proposta');
    return data;
  }

  public static async updateProposal(id: string, updates: Partial<CommercialProposal>): Promise<CommercialProposal> {
    const res = await fetch(`${API_BASE}/proposals/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao atualizar proposta');
    return data;
  }

  // Audit Logs
  public static async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit`);
    return res.json();
  }

  // --- LOCAL PROSPECTING (TABOÃO SBC & GRANDE ABC) ---
  public static async getProspectingPlaces(filter?: Partial<LocalProspectingFilter>): Promise<LocalProspectingPlace[]> {
    const params = new URLSearchParams();
    if (filter?.neighborhood && filter.neighborhood !== 'Todos') params.append('neighborhood', filter.neighborhood);
    if (filter?.city) params.append('city', filter.city);
    if (filter?.segment && filter.segment !== 'Todos') params.append('segment', filter.segment);
    if (filter?.tierFilter) params.append('tierFilter', filter.tierFilter);
    if (filter?.geoScope) params.append('geoScope', filter.geoScope);
    if (filter?.radiusKm) params.append('radiusKm', String(filter.radiusKm));
    if (filter?.onlyOpportunitiesAB) params.append('onlyOpportunitiesAB', 'true');
    if (filter?.searchQuery) params.append('searchQuery', filter.searchQuery);
    if (filter?.environment) params.append('environment', filter.environment);

    const res = await fetch(`${API_BASE}/prospecting/places?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao carregar estabelecimentos de prospecção');
    return res.json();
  }

  public static async getProspectingDatabaseStats(): Promise<ProspectingDatabaseStats> {
    const res = await fetch(`${API_BASE}/prospecting/stats`);
    if (!res.ok) throw new Error('Falha ao obter estatísticas da base de prospecção');
    return res.json();
  }

  public static async batchAuditProspectingSites(placeIds?: string[], auditAllPending = false, limit?: number): Promise<{
    success: boolean;
    auditedCount: number;
    results: any[];
    stats: ProspectingDatabaseStats;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/batch-audit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ placeIds: placeIds || [], auditAllPending, limit })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na auditoria em lote');
    return data;
  }

  public static async searchProspectingPlaces(filter: LocalProspectingFilter): Promise<{
    places: LocalProspectingPlace[];
    sourceUsed: string;
    totalFound: number;
    status: ProspectingApiStatus;
    statusMessage: string;
    searchCoordinates: { lat: number; lng: number };
    antiConfusionNote: string;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/search`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(filter)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na pesquisa local de empresas');
    return data;
  }

  public static async searchProspectingPlacesExpanded(filter: LocalProspectingFilter): Promise<{
    success: boolean;
    places: LocalProspectingPlace[];
    diagnostics: ProspectingDiagnostics;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/search-expanded`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(filter)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na campanha de prospecção');
    return data;
  }

  public static async stopProspectingSearch(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/prospecting/stop`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    return res.json();
  }

  public static async getProspectingDiagnostics(): Promise<ProspectingDiagnostics | null> {
    const res = await fetch(`${API_BASE}/prospecting/diagnostics`);
    if (!res.ok) return null;
    return res.json();
  }

  public static async getProspectingCampaigns(): Promise<ProspectingCampaignHistory[]> {
    const res = await fetch(`${API_BASE}/prospecting/campaigns`);
    if (!res.ok) return [];
    return res.json();
  }

  public static async auditProspectingSite(placeId: string, siteUrl: string): Promise<{
    audit: TechnicalAuditEvidence;
    tier: OpportunityTier;
    place?: LocalProspectingPlace;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/audit-site`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ placeId, siteUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao executar auditoria técnica');
    return data;
  }

  public static async generateProspectingPitch(placeId: string, placeData?: LocalProspectingPlace): Promise<{
    summary: string;
    approachText: string;
    suggestedService: string;
    differentiatorPitch: string;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/generate-pitch`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ placeId, placeData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao formular proposta consultiva');
    return data;
  }

  public static async markProspectingPlaceContacted(placeId: string): Promise<LocalProspectingPlace> {
    const res = await fetch(`${API_BASE}/prospecting/mark-contacted`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ placeId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao marcar como contatada');
    return data;
  }

  public static async convertProspectingPlaceToLead(placeId: string): Promise<{ success: boolean; lead: Lead }> {
    const res = await fetch(`${API_BASE}/prospecting/to-lead`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ placeId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao converter empresa para lead');
    return data;
  }

  public static async batchConvertProspectingPlaces(placeIds: string[]): Promise<{
    success: boolean;
    convertedCount: number;
    duplicatesCount: number;
    leads: Lead[];
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/batch-to-leads`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ placeIds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha na importação em lote para o funil');
    return data;
  }

  public static async deduplicateProspectingPlaces(): Promise<{ totalRemoved: number; remainingCount: number }> {
    const res = await fetch(`${API_BASE}/prospecting/deduplicate`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao deduplicar empresas');
    return data;
  }

  public static async getProspectingApiConfig(): Promise<ProspectingApiConfig> {
    const res = await fetch(`${API_BASE}/prospecting/config`);
    return res.json();
  }

  public static async saveProspectingApiKey(
    apiKey: string,
    customProjectId?: string
  ): Promise<ProspectingApiConfig & { validationResult?: any }> {
    const res = await fetch(`${API_BASE}/prospecting/config`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ apiKey, customProjectId })
    });
    return res.json();
  }

  public static async testProspectingRealSearch(): Promise<{
    success: boolean;
    places: LocalProspectingPlace[];
    sourceUsed: string;
    totalFound: number;
    testedAt: string;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/prospecting/test-search`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Falha ao executar teste de pesquisa na Places API (New)');
    }
    return data;
  }

  // --- CENTRAL WHATSAPP OMNICHANNEL ---
  public static async getWhatsAppConversations(filters?: {
    status?: WhatsAppConversationStatus | 'todas';
    operatorId?: string;
    aiMode?: WhatsAppAiMode | 'todas';
    search?: string;
  }): Promise<WhatsAppConversation[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.operatorId) params.append('operatorId', filters.operatorId);
    if (filters?.aiMode) params.append('aiMode', filters.aiMode);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE}/whatsapp/conversations?${params.toString()}`);
    if (!res.ok) throw new Error('Falha ao carregar conversas do WhatsApp');
    return res.json();
  }

  public static async getWhatsAppConversationById(id: string): Promise<WhatsAppConversation> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations/${id}`);
    if (!res.ok) throw new Error('Conversa não encontrada');
    return res.json();
  }

  public static async createOrOpenWhatsAppConversation(data: {
    leadId?: string;
    phoneNumber?: string;
    contactName?: string;
    companyName?: string;
    initialMessage?: string;
  }): Promise<WhatsAppConversation> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao abrir conversa');
    return result;
  }

  public static async updateWhatsAppConversation(
    id: string,
    updates: Partial<WhatsAppConversation>
  ): Promise<WhatsAppConversation> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao atualizar conversa');
    return result;
  }

  public static async getWhatsAppChatMessages(conversationId: string): Promise<WhatsAppChatMessage[]> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations/${conversationId}/messages`);
    if (!res.ok) throw new Error('Falha ao carregar mensagens');
    return res.json();
  }

  public static async sendWhatsAppChatMessage(
    conversationId: string,
    message: {
      content: string;
      type?: 'text' | 'image' | 'document' | 'audio' | 'internal_note';
      mediaUrl?: string;
      mediaName?: string;
      mediaSize?: string;
      audioDurationSeconds?: number;
      isInternalNote?: boolean;
      replyToMessageId?: string;
      replyToContent?: string;
    }
  ): Promise<WhatsAppChatMessage> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(message)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao enviar mensagem');
    return result;
  }

  public static async suggestWhatsAppCopilotReply(conversationId: string): Promise<{
    suggestedResponse: string;
    confidence: number;
    detectedIntent: string;
    reasoning: string;
    recommendedAction: string;
    followUpSuggestion?: string;
  }> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations/${conversationId}/suggest-reply`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha ao gerar sugestão de IA');
    return result;
  }

  public static async transferWhatsAppConversation(
    conversationId: string,
    params: {
      targetOperatorId?: string;
      targetOperatorName?: string;
      transferToCanal2?: boolean;
    }
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/whatsapp/conversations/${conversationId}/transfer`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(params)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Falha na transferência de atendimento');
    return result;
  }

  public static async getWhatsAppDashboardMetrics(): Promise<WhatsAppDashboardMetrics> {
    const res = await fetch(`${API_BASE}/whatsapp/dashboard-metrics`);
    if (!res.ok) throw new Error('Falha ao obter métricas da Central WhatsApp');
    return res.json();
  }
}

