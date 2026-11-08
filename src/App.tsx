import React, { useState, useEffect } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { KanbanView } from './components/KanbanView';
import { LeadsView } from './components/LeadsView';
import { LeadModal } from './components/LeadModal';
import { CsvImportModal } from './components/CsvImportModal';
import { AiAnalysisView } from './components/AiAnalysisView';
import { AiAssistantView } from './components/AiAssistantView';
import { CentralWhatsAppView } from './components/CentralWhatsAppView';
import { WhatsAppView } from './components/WhatsAppView';
import { AutomationsView } from './components/AutomationsView';
import { ProposalsView } from './components/ProposalsView';
import { ProposalModal } from './components/ProposalModal';
import { AuditLgpdView } from './components/AuditLgpdView';
import { LocalProspectingView } from './components/LocalProspectingView';
import { ApiService } from './services/api';
import {
  Lead,
  CommercialProposal,
  WhatsAppConfig,
  WhatsAppMessageLog,
  AutomationCentralConfig,
  CrmEnvironment,
  AuditLog,
  CommercialDashboardStats,
  UserProfile,
  CommercialStageId
} from './types/crm';

const DEFAULT_USERS: UserProfile[] = [
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

const VALID_TABS: ActiveTab[] = [
  'dashboard',
  'central_whatsapp',
  'prospecting',
  'kanban',
  'leads',
  'ai_analysis',
  'ai_assistant',
  'whatsapp',
  'automations',
  'n8n',
  'proposals',
  'audit'
];

const getInitialTab = (): ActiveTab => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '') as ActiveTab;
    if (VALID_TABS.includes(hash)) return hash;
    try {
      const saved = localStorage.getItem('fmws_active_tab') as ActiveTab;
      if (VALID_TABS.includes(saved)) return saved;
    } catch {
      // ignore
    }
  }
  return 'dashboard';
};

const getInitialEnv = (): CrmEnvironment => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('fmws_active_env') as CrmEnvironment;
      if (saved === 'producao' || saved === 'demo') return saved;
    } catch {
      // ignore
    }
  }
  return 'producao';
};

export default function App() {
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Tab change with URL hash & localStorage persistence
  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
      try {
        localStorage.setItem('fmws_active_tab', tab);
      } catch {
        // ignore
      }
    }
  };

  // Sync tab if browser back/forward or hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActiveTab;
      if (VALID_TABS.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Users
  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[1]); // Default to SDR

  // Data State
  const [stats, setStats] = useState<CommercialDashboardStats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<CommercialProposal[]>([]);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    channel1: {
      phoneNumber: '+55 11 94579-9976',
      phoneNumberId: '333767429829080',
      wabaId: '419927517859112',
      hasApiToken: false,
      status: 'aguardando_configuracao'
    },
    channel2: {
      phoneNumber: '+55 11 98634-2981',
      waLink: 'https://wa.me/5511986342981',
      channelType: 'manual_human_no_api',
      deviceInfo: 'Celular e Computador (WhatsApp Web/App)'
    },
    webhookVerifyToken: '',
    phoneNumberId: '333767429829080',
    wabaId: '419927517859112',
    hasApiToken: false,
    isConfigured: false,
    status: 'aguardando_configuracao'
  });
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppMessageLog[]>([]);
  const [environment, setEnvironment] = useState<CrmEnvironment>(getInitialEnv);
  const [automationsConfig, setAutomationsConfig] = useState<AutomationCentralConfig>({
    inboundWebhookUrl: '/api/webhooks/automations/leads',
    inboundApiKey: 'fmws_live_key_9941a87b_secure',
    outboundLeadWebhookUrl: '',
    outboundStageWebhookUrl: '',
    outboundTaskWebhookUrl: '',
    isActive: true,
    totalReceivedEvents: 0,
    googleCloudTaskSlaEnabled: true,
    scheduledCronIntervalMinutes: 15,
    autoTransferEnabled: true,
    metaWindowSlaHours: 24
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [activeLeadForModal, setActiveLeadForModal] = useState<Lead | null>(null);
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);

  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [proposalModalMode, setProposalModalMode] = useState<'editor' | 'preview'>('editor');
  const [activeProposalForModal, setActiveProposalForModal] = useState<CommercialProposal | null>(null);

  // WhatsApp contextual target
  const [whatsAppTargetLead, setWhatsAppTargetLead] = useState<Lead | null>(null);
  const [whatsAppInitialMessage, setWhatsAppInitialMessage] = useState<string>('');

  // Initial Data Load
  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      const [statsData, leadsData, propsData, waCfg, waLogs, autoCfg, auditData, usersData, envData] = await Promise.all([
        ApiService.getStats(),
        ApiService.getLeads(),
        ApiService.getProposals(),
        ApiService.getWhatsAppConfig(),
        ApiService.getWhatsAppLogs(),
        ApiService.getAutomationsConfig(),
        ApiService.getAuditLogs(),
        ApiService.getUsers().catch(() => DEFAULT_USERS),
        ApiService.getEnvironment().catch(() => ({ activeEnvironment: 'producao' as CrmEnvironment }))
      ]);

      setStats(statsData);
      setLeads(leadsData);
      setProposals(propsData);
      setWhatsappConfig(waCfg);
      setWhatsappLogs(waLogs);
      setAutomationsConfig(autoCfg);
      setAuditLogs(auditData);
      if (envData?.activeEnvironment) setEnvironment(envData.activeEnvironment);
      if (usersData && usersData.length > 0) setUsers(usersData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnvironment = async (newEnv: CrmEnvironment) => {
    try {
      setIsLoading(true);
      await ApiService.setEnvironment(newEnv);
      setEnvironment(newEnv);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('fmws_active_env', newEnv);
        } catch {
          // ignore
        }
      }
      await fetchAllData();
    } catch (err: any) {
      alert(`Falha ao alternar ambiente: ${err.message || 'Erro'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSwitchUser = (user: UserProfile) => {
    setCurrentUser(user);
    ApiService.setCurrentUser(user.name);
  };

  // Lead Operations
  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (activeLeadForModal) {
      await ApiService.updateLead(activeLeadForModal.id, leadData);
    } else {
      await ApiService.createLead(leadData);
    }
    await fetchAllData();
  };

  const handleDeleteLead = async (leadId: string, isLgpd: boolean) => {
    await ApiService.deleteLead(leadId, isLgpd);
    await fetchAllData();
  };

  const handleUpdateStage = async (leadId: string, stageId: CommercialStageId) => {
    // Optimistic UI update
    setLeads(prev => prev.map(l => (l.id === leadId ? { ...l, stageId } : l)));
    try {
      await ApiService.updateLeadStage(leadId, stageId);
      const updatedStats = await ApiService.getStats();
      setStats(updatedStats);
    } catch (err) {
      console.error('Failed to update stage:', err);
      await fetchAllData();
    }
  };

  // Transfer and Human Chat Confirmation Handlers
  const handleTransferToCommercial = async (lead: Lead) => {
    try {
      setIsLoading(true);
      await ApiService.transferToCommercial(lead.id);
      await fetchAllData();
      alert(
        `Encaminhamento comercial enviado com sucesso para ${lead.name}!\n\nMensagem oficial disparada pelo Canal 1 (+55 11 94579-9976) convidando o contato para o Canal 2 comercial (wa.me/5511986342981).\n\nStatus atualizado para: "Encaminhamento enviado".`
      );
    } catch (err: any) {
      alert(`Falha no encaminhamento: ${err.message || 'Erro ao enviar mensagem oficial'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmHumanChat = async (lead: Lead) => {
    try {
      setIsLoading(true);
      await ApiService.confirmHumanChat(lead.id);
      await fetchAllData();
      alert(
        `Atendimento comercial humano confirmado para ${lead.name}!\n\nRegistrado que o cliente abriu conversa com o Canal 2 comercial (+55 11 98634-2981).\n\nStatus atualizado para: "Atendimento comercial confirmado".`
      );
    } catch (err: any) {
      alert(`Falha ao confirmar atendimento: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Proposal Operations
  const handleSaveProposal = async (propData: Partial<CommercialProposal>) => {
    if (activeProposalForModal) {
      await ApiService.updateProposal(activeProposalForModal.id, propData);
    } else {
      await ApiService.createProposal(propData);
    }
    await fetchAllData();
  };

  const handleUpdateProposalStatus = async (propId: string, status: CommercialProposal['status']) => {
    await ApiService.updateProposal(propId, { status });
    await fetchAllData();
  };

  // Navigation and Contextual triggers
  const handleOpenLeadModal = (lead?: Lead) => {
    setActiveLeadForModal(lead || null);
    setIsLeadModalOpen(true);
  };

  const handleOpenProposalModal = (
    prop?: CommercialProposal,
    lead?: Lead,
    mode: 'editor' | 'preview' = 'editor'
  ) => {
    setActiveProposalForModal(prop || null);
    if (lead) {
      setActiveLeadForModal(lead);
    }
    setProposalModalMode(mode);
    setIsProposalModalOpen(true);
  };

  const handleTriggerWhatsApp = (lead: Lead, message?: string) => {
    setWhatsAppTargetLead(lead);
    setWhatsAppInitialMessage(message || '');
    setActiveTab('central_whatsapp');
  };

  const handleTriggerAiAudit = (lead: Lead) => {
    setActiveTab('ai_analysis');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090a0d] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        currentUser={currentUser}
        availableUsers={users}
        onSwitchUser={handleSwitchUser}
        whatsappStatus={whatsappConfig.channel1?.status || whatsappConfig.status || 'aguardando_configuracao'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          activeTab={activeTab}
          onOpenNewLead={() => handleOpenLeadModal()}
          onOpenImportCsv={() => setIsImportCsvOpen(true)}
          onRefreshData={fetchAllData}
          isLoading={isLoading}
          onQuickAiAnalyze={() => setActiveTab('ai_analysis')}
          environment={environment}
          onToggleEnvironment={handleToggleEnvironment}
        />

        {/* View Switcher */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-12">
          {activeTab === 'dashboard' && stats && (
            <DashboardView
              stats={stats}
              leads={leads}
              onNavigateToTab={setActiveTab}
              onSelectLead={handleOpenLeadModal}
              environment={environment}
              onToggleEnvironment={handleToggleEnvironment}
              onOpenNewLead={() => handleOpenLeadModal()}
            />
          )}

          {activeTab === 'central_whatsapp' && (
            <CentralWhatsAppView
              leads={leads}
              proposals={proposals}
              users={users}
              currentUser={currentUser}
              onOpenProposalModal={handleOpenProposalModal}
              onNavigateToTab={setActiveTab}
              onRefreshData={fetchAllData}
              initialLeadId={whatsAppTargetLead?.id}
            />
          )}

          {activeTab === 'prospecting' && (
            <LocalProspectingView
              environment={environment}
              onToggleEnvironment={handleToggleEnvironment}
              onRefreshCrmData={fetchAllData}
              onNavigateToTab={setActiveTab}
              onOpenWhatsApp={handleTriggerWhatsApp}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanView
              leads={leads}
              onMoveStage={handleUpdateStage}
              onSelectLead={handleOpenLeadModal}
              onOpenWhatsApp={handleTriggerWhatsApp}
              onAnalyzeAi={handleTriggerAiAudit}
              onTransferToCommercial={handleTransferToCommercial}
              onConfirmHumanChat={handleConfirmHumanChat}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              onSelectLead={handleOpenLeadModal}
              onOpenNewLead={() => handleOpenLeadModal()}
              onOpenImportCsv={() => setIsImportCsvOpen(true)}
              onOpenWhatsApp={handleTriggerWhatsApp}
              onAnalyzeAi={handleTriggerAiAudit}
              onDeleteLead={handleDeleteLead}
              onUpdateStage={handleUpdateStage}
              onTransferToCommercial={handleTransferToCommercial}
              onConfirmHumanChat={handleConfirmHumanChat}
            />
          )}

          {activeTab === 'ai_analysis' && (
            <AiAnalysisView
              leads={leads}
              onOpenWhatsApp={handleTriggerWhatsApp}
              onRefreshLead={fetchAllData}
            />
          )}

          {activeTab === 'ai_assistant' && (
            <AiAssistantView
              leads={leads}
              onOpenWhatsAppWithMessage={handleTriggerWhatsApp}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppView
              config={whatsappConfig}
              logs={whatsappLogs}
              leads={leads}
              onRefreshConfig={fetchAllData}
              onRefreshLogs={fetchAllData}
              initialLead={whatsAppTargetLead}
              initialMessage={whatsAppInitialMessage}
            />
          )}

          {(activeTab === 'automations' || activeTab === 'n8n') && (
            <AutomationsView
              config={automationsConfig}
              onRefreshConfig={fetchAllData}
              onLeadReceived={fetchAllData}
            />
          )}

          {activeTab === 'proposals' && (
            <ProposalsView
              proposals={proposals}
              leads={leads}
              onOpenNewProposal={() => handleOpenProposalModal()}
              onSelectProposal={(prop, mode) => handleOpenProposalModal(prop, undefined, mode)}
              onUpdateStatus={handleUpdateProposalStatus}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLgpdView logs={auditLogs} onRefreshLogs={fetchAllData} />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={activeLeadForModal}
        onSave={handleSaveLead}
        onDelete={handleDeleteLead}
        onOpenWhatsApp={lead => {
          setIsLeadModalOpen(false);
          handleTriggerWhatsApp(lead);
        }}
        onAnalyzeAi={lead => {
          setIsLeadModalOpen(false);
          setActiveTab('ai_analysis');
        }}
        onCreateProposal={lead => {
          setIsLeadModalOpen(false);
          handleOpenProposalModal(undefined, lead);
        }}
        onTransferToCommercial={async lead => {
          await handleTransferToCommercial(lead);
        }}
        onConfirmHumanChat={async lead => {
          await handleConfirmHumanChat(lead);
        }}
        availableUsers={users.map(u => u.name)}
      />

      <CsvImportModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        onImportSuccess={fetchAllData}
      />

      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        proposal={activeProposalForModal}
        initialLead={activeLeadForModal}
        leads={leads}
        initialMode={proposalModalMode}
        onSave={handleSaveProposal}
      />
    </div>
  );
}
