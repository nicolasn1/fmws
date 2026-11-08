import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Filter,
  Bot,
  User,
  Shield,
  Send,
  Paperclip,
  Mic,
  Smile,
  Check,
  CheckCheck,
  AlertTriangle,
  Lock,
  ExternalLink,
  Phone,
  FileText,
  Clock,
  Sparkles,
  RefreshCw,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Tag,
  Building,
  MapPin,
  Globe,
  Layers,
  ChevronRight,
  Plus,
  Play,
  Pause,
  Download,
  AlertCircle,
  BarChart3,
  X
} from 'lucide-react';
import {
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppDashboardMetrics,
  WhatsAppAiMode,
  WhatsAppConversationStatus,
  Lead,
  CommercialProposal,
  CommercialStageId,
  UserProfile,
  OpportunityTier
} from '../types/crm';
import { COMMERCIAL_STAGES, OFFICIAL_TRANSFER_MESSAGE } from '../data/stages';
import { ApiService } from '../services/api';

interface CentralWhatsAppViewProps {
  leads: Lead[];
  proposals: CommercialProposal[];
  users: UserProfile[];
  currentUser: UserProfile;
  onOpenProposalModal: (prop?: CommercialProposal, lead?: Lead) => void;
  onNavigateToTab: (tab: any) => void;
  onRefreshData: () => void;
  initialLeadId?: string;
}

export const CentralWhatsAppView: React.FC<CentralWhatsAppViewProps> = ({
  leads,
  proposals,
  users,
  currentUser,
  onOpenProposalModal,
  onNavigateToTab,
  onRefreshData,
  initialLeadId
}) => {
  // State with localStorage persistence on F5
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversationId, setSelectedConversationIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('fmws_active_conv_id') || '';
      } catch {
        return '';
      }
    }
    return '';
  });

  const setSelectedConversationId = (id: string) => {
    setSelectedConversationIdState(id);
    if (typeof window !== 'undefined' && id) {
      try {
        localStorage.setItem('fmws_active_conv_id', id);
      } catch {
        // ignore
      }
    }
  };

  const [messages, setMessages] = useState<WhatsAppChatMessage[]>([]);
  const [metrics, setMetrics] = useState<WhatsAppDashboardMetrics | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<WhatsAppConversationStatus | 'todas'>('todas');
  const [aiModeFilter, setAiModeFilter] = useState<WhatsAppAiMode | 'todas'>('todas');
  const [operatorFilter, setOperatorFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Composer
  const [inputText, setInputText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<WhatsAppChatMessage | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // AI Copilot Suggestion Box
  const [copilotSuggestion, setCopilotSuggestion] = useState<{
    suggestedResponse: string;
    confidence: number;
    detectedIntent: string;
    reasoning: string;
    recommendedAction: string;
    followUpSuggestion?: string;
  } | null>(null);

  // Right column sidebar visibility on mobile
  const [showRightColumn, setShowRightColumn] = useState(true);
  const [showMetricsModal, setShowMetricsModal] = useState(false);

  // Auto-scroll ref
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Selected conversation
  const activeConversation = conversations.find(c => c.id === selectedConversationId);
  const linkedLead = activeConversation?.leadId ? leads.find(l => l.id === activeConversation.leadId) : null;
  const linkedProposals = linkedLead ? proposals.filter(p => p.leadId === linkedLead.id) : [];

  // Fetch conversations
  const loadConversations = async (selectId?: string) => {
    try {
      setIsLoadingConversations(true);
      const data = await ApiService.getWhatsAppConversations({
        status: statusFilter,
        aiMode: aiModeFilter,
        operatorId: operatorFilter,
        search: searchQuery
      });
      setConversations(data);

      const preferredId = selectId || selectedConversationId || (typeof window !== 'undefined' ? localStorage.getItem('fmws_active_conv_id') : '');
      if (preferredId && data.some(c => c.id === preferredId)) {
        setSelectedConversationId(preferredId);
      } else if (data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch messages
  const loadMessages = async (convId: string) => {
    if (!convId) return;
    try {
      setIsLoadingMessages(true);
      const data = await ApiService.getWhatsAppChatMessages(convId);
      setMessages(data);
      // Auto-trigger copilot suggestion if in copilot mode and last message was from lead
      const active = conversations.find(c => c.id === convId);
      if (active?.aiMode === 'copiloto' && data.length > 0 && data[data.length - 1].sender === 'lead') {
        handleGenerateAiSuggestion(convId);
      } else {
        setCopilotSuggestion(null);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch metrics
  const loadMetrics = async () => {
    try {
      const data = await ApiService.getWhatsAppDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  // Initial load
  useEffect(() => {
    loadConversations();
    loadMetrics();
  }, [statusFilter, aiModeFilter, operatorFilter, searchQuery]);

  // Load messages when selected conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  // Handle initialLeadId prop if passed
  useEffect(() => {
    if (initialLeadId && leads.length > 0) {
      const targetLead = leads.find(l => l.id === initialLeadId);
      if (targetLead) {
        handleOpenConversationForLead(targetLead);
      }
    }
  }, [initialLeadId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, copilotSuggestion]);

  // Send message
  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedConversationId) return;
    try {
      setIsSending(true);
      const newMsg = await ApiService.sendWhatsAppChatMessage(selectedConversationId, {
        content: inputText.trim(),
        type: isInternalNote ? 'internal_note' : 'text',
        isInternalNote,
        replyToMessageId: replyingTo?.id,
        replyToContent: replyingTo ? `${replyingTo.senderName}: ${replyingTo.content.slice(0, 80)}` : undefined
      });

      setMessages(prev => [...prev, newMsg]);
      setInputText('');
      setReplyingTo(null);
      setIsInternalNote(false);
      setCopilotSuggestion(null);

      // Refresh list to update snippet
      loadConversations(selectedConversationId);
    } catch (err: any) {
      alert(`Falha ao enviar mensagem: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsSending(false);
    }
  };

  // AI Copilot suggestion
  const handleGenerateAiSuggestion = async (convId = selectedConversationId) => {
    if (!convId) return;
    try {
      setIsGeneratingSuggestion(true);
      const res = await ApiService.suggestWhatsAppCopilotReply(convId);
      setCopilotSuggestion(res);
    } catch (err: any) {
      console.error('Failed to generate copilot suggestion:', err);
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Approve and send copilot suggestion with 1 click
  const handleApproveCopilotSuggestion = async () => {
    if (!copilotSuggestion || !selectedConversationId) return;
    try {
      setIsSending(true);
      const newMsg = await ApiService.sendWhatsAppChatMessage(selectedConversationId, {
        content: copilotSuggestion.suggestedResponse,
        type: 'text',
        isInternalNote: false
      });
      setMessages(prev => [...prev, newMsg]);
      setCopilotSuggestion(null);
      loadConversations(selectedConversationId);
    } catch (err: any) {
      alert(`Falha ao enviar sugestão: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Switch AI mode
  const handleSwitchAiMode = async (mode: WhatsAppAiMode) => {
    if (!selectedConversationId) return;
    try {
      const updated = await ApiService.updateWhatsAppConversation(selectedConversationId, { aiMode: mode });
      setConversations(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      if (mode === 'copiloto') {
        handleGenerateAiSuggestion(selectedConversationId);
      } else {
        setCopilotSuggestion(null);
      }
    } catch (err: any) {
      alert(`Falha ao alterar modo da IA: ${err.message}`);
    }
  };

  // Transfer conversation to operator or human channel
  const handleTransfer = async (targetOperatorName: string, transferToCanal2 = false) => {
    if (!selectedConversationId) return;
    try {
      const targetUser = users.find(u => u.name === targetOperatorName);
      await ApiService.transferWhatsAppConversation(selectedConversationId, {
        targetOperatorId: targetUser?.id,
        targetOperatorName,
        transferToCanal2
      });
      await loadConversations(selectedConversationId);
      await loadMessages(selectedConversationId);
      if (transferToCanal2) {
        alert('Encaminhamento oficial enviado ao cliente! Conversa transferida para o Canal 2 comercial.');
      }
    } catch (err: any) {
      alert(`Erro na transferência: ${err.message}`);
    }
  };

  // Change stage directly from WhatsApp
  const handleUpdateStage = async (stageId: CommercialStageId) => {
    if (!selectedConversationId) return;
    try {
      const updated = await ApiService.updateWhatsAppConversation(selectedConversationId, { commercialStageId: stageId });
      setConversations(prev => prev.map(c => (c.id === updated.id ? updated : c)));
      if (activeConversation?.leadId) {
        await ApiService.updateLeadStage(activeConversation.leadId, stageId);
        onRefreshData();
      }
    } catch (err: any) {
      alert(`Erro ao atualizar estágio do CRM: ${err.message}`);
    }
  };

  // Open or create conversation from a lead
  const handleOpenConversationForLead = async (lead: Lead) => {
    try {
      const conv = await ApiService.createOrOpenWhatsAppConversation({
        leadId: lead.id,
        phoneNumber: lead.whatsapp,
        contactName: lead.contactName,
        companyName: lead.name
      });
      await loadConversations(conv.id);
      setSelectedConversationId(conv.id);
    } catch (err: any) {
      console.error('Error opening conversation:', err);
    }
  };

  // Canned response insertion
  const handleInsertCannedResponse = (text: string) => {
    setInputText(prev => (prev ? `${prev}\n\n${text}` : text));
    setShowTemplatePicker(false);
  };

  // Common quick templates with the mandatory FMWS pitch
  const QUICK_TEMPLATES = [
    {
      title: 'Diferencial Design Sem Custo (Mandatório FMWS)',
      category: 'Diferencial',
      text: 'Na Fazer Meu Website nós desenvolvemos uma proposta inicial de design exclusiva sem custo para sua empresa avaliar, e você só paga se aprovar o projeto.'
    },
    {
      title: 'Apresentação Institucional B2B',
      category: 'Abertura',
      text: 'Olá! Identificamos oportunidades para fortalecer a presença digital da sua empresa com alta disponibilidade e e-mails corporativos. Podemos elaborar uma proposta conceitual de design sem custo?'
    },
    {
      title: 'Reunião de Alinhamento 15 min',
      category: 'Agendamento',
      text: 'Podemos agendar uma rápida conversa online de 15 minutos para entender suas preferências visuais e iniciarmos a prévia sem compromisso financeiro. Quinta às 10h ou às 15h seria melhor?'
    },
    {
      title: 'Encaminhamento Oficial Canal 2',
      category: 'Transferência',
      text: OFFICIAL_TRANSFER_MESSAGE
    },
    {
      title: 'Objeção: Já possuímos website',
      category: 'Objeção',
      text: 'Compreendo perfeitamente! Atendemos muitas empresas que já possuem site para acelerar o carregamento mobile e modernizar a identidade corporativa. Podemos preparar um comparativo visual sem nenhum compromisso?'
    }
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-[#090a0d] border border-[#1f242d] rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Bar: Central WhatsApp Header & Metrics Toggle */}
      <header className="px-5 py-3 bg-[#0d0f14] border-b border-[#1f242d] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4af37] to-[#8c6b1a] p-[1.5px] flex items-center justify-center shadow-lg shadow-amber-950/20">
            <div className="w-full h-full bg-[#0a0b0d] rounded-[10px] flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[#f5e7a9]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Central WhatsApp <span className="text-[#d4af37]">Profissional</span>
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Meta Cloud API +55 11 94579-9976
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Atendimento Omnichannel Integrado • IA Comercial • Funil 12 Etapas • Hand-off Humano (+55 11 98634-2981)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigateToTab('whatsapp')}
            className="px-3 py-1.5 rounded-xl bg-[#161922] hover:bg-[#1e232e] text-xs font-medium text-slate-200 hover:text-white border border-[#2b3342] flex items-center gap-1.5 transition"
            title="Acessar credenciais da Meta Cloud API e URL do Webhook"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Webhook & Meta API</span>
          </button>

          <button
            onClick={() => setShowMetricsModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#161922] hover:bg-[#1e232e] text-xs font-medium text-amber-300 border border-[#2b3342] flex items-center gap-1.5 transition"
          >
            <BarChart3 className="w-4 h-4 text-[#d4af37]" />
            <span className="hidden sm:inline">Métricas & SLA</span>
          </button>

          <button
            onClick={() => loadConversations(selectedConversationId)}
            title="Atualizar conversas"
            className="p-2 rounded-xl bg-[#161922] hover:bg-[#1e232e] text-slate-400 hover:text-white border border-[#2b3342] transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingConversations ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* 3 Columns Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* ========================================================= */}
        {/* COLUNA 1: CAIXA DE ENTRADA (INBOX) */}
        {/* ========================================================= */}
        <section className="w-80 md:w-88 border-r border-[#1f242d] bg-[#0c0e12] flex flex-col shrink-0">
          {/* Search & New Chat */}
          <div className="p-3 border-b border-[#1f242d] space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por contato, empresa, telefone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#14171f] border border-[#262c37] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition"
              />
            </div>

            {/* Status Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#12141a] rounded-xl border border-[#202530] text-[11px] font-medium text-center">
              {(['todas', 'aberta', 'pendente', 'encerrada'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`py-1 rounded-lg capitalize transition ${
                    statusFilter === st
                      ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st === 'todas' ? 'Todas' : st === 'aberta' ? 'Abertas' : st === 'pendente' ? 'Pend.' : 'Fim'}
                </button>
              ))}
            </div>

            {/* Filter by AI Mode & Operator */}
            <div className="flex items-center gap-2 pt-1 text-[11px]">
              <select
                value={aiModeFilter}
                onChange={e => setAiModeFilter(e.target.value as any)}
                className="flex-1 bg-[#14171f] border border-[#262c37] rounded-lg py-1 px-2 text-slate-300 focus:outline-none"
              >
                <option value="todas">Todos os Modos</option>
                <option value="copiloto">🤖 Copiloto</option>
                <option value="automatico">⚡ Automático</option>
                <option value="humano">👤 Humano</option>
              </select>

              <select
                value={operatorFilter}
                onChange={e => setOperatorFilter(e.target.value)}
                className="flex-1 bg-[#14171f] border border-[#262c37] rounded-lg py-1 px-2 text-slate-300 focus:outline-none"
              >
                <option value="todos">Todos Atendentes</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#181b23]">
            {isLoadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 text-amber-400 animate-spin mx-auto mb-2" />
                Carregando conversas do WhatsApp...
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                Nenhuma conversa encontrada com os filtros aplicados.
              </div>
            ) : (
              conversations.map(conv => {
                const isSelected = conv.id === selectedConversationId;
                const formattedTime = new Date(conv.lastMessageTimestamp).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors ${
                      isSelected
                        ? 'bg-[#181c24] border-l-3 border-[#d4af37]'
                        : 'hover:bg-[#12151c] text-slate-300'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {conv.avatar ? (
                        <img
                          src={conv.avatar}
                          alt={conv.contactName}
                          className="w-11 h-11 rounded-full object-cover border border-[#2b3342]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2a303c] to-[#1a1d24] border border-[#3b4352] flex items-center justify-center text-amber-400 font-bold text-sm">
                          {conv.contactName.charAt(0)}
                        </div>
                      )}
                      {/* Status dot */}
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0c0e12] ${
                          conv.status === 'aberta'
                            ? 'bg-emerald-500'
                            : conv.status === 'pendente'
                            ? 'bg-amber-500'
                            : 'bg-slate-500'
                        }`}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-semibold text-white truncate">{conv.contactName}</h4>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">{formattedTime}</span>
                      </div>

                      <p className="text-[11px] text-amber-400/90 truncate font-medium mb-1">{conv.companyName}</p>

                      <p className="text-xs text-slate-400 truncate mb-1.5">{conv.lastMessage}</p>

                      {/* Badges */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 overflow-hidden">
                          {/* AI Mode badge */}
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                              conv.aiMode === 'copiloto'
                                ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/40'
                                : conv.aiMode === 'automatico'
                                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {conv.aiMode === 'copiloto' ? '🤖 Copiloto' : conv.aiMode === 'automatico' ? '⚡ Auto' : '👤 Humano'}
                          </span>

                          {/* Stage or Tier badge */}
                          {conv.opportunityTier && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                                conv.opportunityTier === 'A'
                                  ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                                  : conv.opportunityTier === 'B'
                                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800/40'
                                  : 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                              }`}
                            >
                              Classe {conv.opportunityTier}
                            </span>
                          )}
                        </div>

                        {/* Unread Pill */}
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-[#d4af37] text-black font-bold text-[10px] rounded-full shrink-0 shadow">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* COLUNA 2: CHAT COMPLETO */}
        {/* ========================================================= */}
        <section className="flex-1 flex flex-col bg-[#0a0c10] min-w-0">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="px-5 py-3 border-b border-[#1f242d] bg-[#0d0f14] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2a303c] to-[#1a1d24] border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    {activeConversation.contactName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white truncate">{activeConversation.contactName}</h3>
                      <span className="text-xs text-slate-400 truncate">• {activeConversation.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-300">{activeConversation.phoneNumber}</span>
                      <a
                        href={`https://wa.me/${activeConversation.phoneNumber.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-amber-400 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        Abrir wa.me <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* AI Mode Selector & Quick Actions */}
                <div className="flex items-center gap-2">
                  {/* AI Mode Selector */}
                  <div className="flex items-center bg-[#13161e] border border-[#262c37] rounded-xl p-1 text-xs">
                    {(['copiloto', 'automatico', 'humano'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleSwitchAiMode(mode)}
                        className={`px-2.5 py-1 rounded-lg font-medium transition ${
                          activeConversation.aiMode === mode
                            ? mode === 'copiloto'
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow-sm'
                              : mode === 'automatico'
                              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                              : 'bg-slate-700 text-white font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {mode === 'copiloto' ? '🤖 Copiloto' : mode === 'automatico' ? '⚡ Automático' : '👤 Humano'}
                      </button>
                    ))}
                  </div>

                  {/* Assumir Atendimento Quick Button */}
                  {activeConversation.aiMode !== 'humano' && (
                    <button
                      onClick={() => handleSwitchAiMode('humano')}
                      title="Desativar IA e assumir o atendimento manualmente"
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Assumir Atendimento</span>
                    </button>
                  )}

                  {/* Toggle commercial profile */}
                  <button
                    onClick={() => setShowRightColumn(!showRightColumn)}
                    className="p-2 rounded-xl bg-[#14171f] hover:bg-[#1c212b] text-slate-400 hover:text-amber-400 border border-[#272d38] transition"
                    title={showRightColumn ? 'Ocultar detalhes do CRM' : 'Exibir detalhes do CRM'}
                  >
                    <Building className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Message Thread */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center items-center h-full text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 text-amber-400 animate-spin mr-2" />
                    Carregando histórico cronológico...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col justify-center items-center h-full text-slate-400 text-xs">
                    <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
                    Nenhuma mensagem registrada nesta conversa.
                  </div>
                ) : (
                  messages.map(msg => {
                    const isFromLead = msg.sender === 'lead';
                    const isAi = msg.sender === 'ai';
                    const isNote = msg.isInternalNote || msg.type === 'internal_note';
                    const formattedMsgTime = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    // 1. Internal Note rendering
                    if (isNote) {
                      return (
                        <div key={msg.id} className="mx-auto max-w-xl my-2">
                          <div className="p-3.5 rounded-xl bg-[#2a220e]/90 border border-amber-500/40 text-amber-200 text-xs shadow-md">
                            <div className="flex items-center justify-between mb-1.5 font-semibold text-[11px] text-amber-400">
                              <span className="flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5" />
                                NOTA INTERNA ({msg.senderName})
                              </span>
                              <span className="text-[10px] font-mono text-amber-400/70">{formattedMsgTime}</span>
                            </div>
                            <p className="whitespace-pre-line leading-relaxed text-amber-100">{msg.content}</p>
                          </div>
                        </div>
                      );
                    }

                    // 2. Regular customer & operator messages
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isFromLead ? 'items-start' : 'items-end'} group`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md relative ${
                            isFromLead
                              ? 'bg-[#181d26] border border-[#28303f] text-slate-100 rounded-tl-sm'
                              : isAi
                              ? 'bg-[#17140b] border-2 border-amber-500/70 text-amber-50 rounded-tr-sm shadow-amber-950/20'
                              : 'bg-gradient-to-br from-[#1e2533] to-[#181e2b] border border-[#2f394c] text-white rounded-tr-sm'
                          }`}
                        >
                          {/* Sender name badge */}
                          <div className="flex items-center justify-between gap-3 mb-1 text-[11px]">
                            <span
                              className={`font-semibold flex items-center gap-1 ${
                                isFromLead
                                  ? 'text-slate-300'
                                  : isAi
                                  ? 'text-amber-400 font-bold'
                                  : 'text-amber-300'
                              }`}
                            >
                              {isAi ? <Bot className="w-3.5 h-3.5" /> : null}
                              {msg.senderName}
                            </span>

                            {msg.type === 'template' && (
                              <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                                Template Meta
                              </span>
                            )}
                          </div>

                          {/* Quoted message if reply */}
                          {msg.replyToContent && (
                            <div className="mb-2 p-2 rounded-lg bg-black/40 border-l-2 border-amber-400 text-[11px] text-slate-300 truncate">
                              {msg.replyToContent}
                            </div>
                          )}

                          {/* Content by Type */}
                          {msg.type === 'audio' ? (
                            <div className="flex items-center gap-3 py-1 min-w-[200px]">
                              <button
                                onClick={() =>
                                  setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                                }
                                className="w-9 h-9 rounded-full bg-amber-500 text-black flex items-center justify-center hover:bg-amber-400 transition"
                              >
                                {playingAudioId === msg.id ? (
                                  <Pause className="w-4 h-4 fill-black" />
                                ) : (
                                  <Play className="w-4 h-4 fill-black ml-0.5" />
                                )}
                              </button>
                              <div className="flex-1">
                                <div className="h-1.5 bg-[#2a303c] rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-amber-400 ${
                                      playingAudioId === msg.id ? 'w-2/3 animate-pulse' : 'w-1/4'
                                    }`}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                                  <span>{msg.audioDurationSeconds ? `0:${msg.audioDurationSeconds}` : '0:38'}</span>
                                  <span>Áudio de voz</span>
                                </div>
                              </div>
                            </div>
                          ) : msg.type === 'document' ? (
                            <div className="flex items-center gap-3 p-2 rounded-xl bg-black/30 border border-[#2b3342] my-1">
                              <FileText className="w-7 h-7 text-amber-400 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-100 truncate">
                                  {msg.mediaName || 'Documento Comercial.pdf'}
                                </p>
                                <p className="text-[10px] text-slate-400">{msg.mediaSize || '1.2 MB'}</p>
                              </div>
                              <button
                                onClick={() => alert(`Download / Prévia do documento: ${msg.mediaName || 'Proposta.pdf'}`)}
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          ) : msg.type === 'image' ? (
                            <div className="my-1 rounded-xl overflow-hidden border border-[#2b3342]">
                              <img
                                src={msg.mediaUrl || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80'}
                                alt="Mídia compartilhada"
                                className="max-w-full h-auto object-cover max-h-64"
                              />
                              {msg.content && <p className="p-2 text-xs text-slate-200">{msg.content}</p>}
                            </div>
                          ) : (
                            <p className="text-xs whitespace-pre-line leading-relaxed text-slate-100">{msg.content}</p>
                          )}

                          {/* Footer with timestamp and delivery checks */}
                          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] text-slate-400 font-mono">
                            <span>{formattedMsgTime}</span>
                            {!isFromLead && (
                              <span>
                                {msg.status === 'lido' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-amber-400" />
                                ) : msg.status === 'entregue' ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                ) : msg.status === 'falha' ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-slate-400" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quick reply action on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition px-2 py-0.5 text-[10px] text-slate-500 flex gap-2">
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="hover:text-amber-400 transition"
                          >
                            Responder
                          </button>
                          {msg.status === 'falha' && (
                            <button
                              onClick={() => handleSendMessage()}
                              className="text-rose-400 hover:underline"
                            >
                              Tentar novamente
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* AI Copilot Suggestion Box */}
              {activeConversation.aiMode === 'copiloto' && copilotSuggestion && (
                <div className="mx-4 mb-2 p-3.5 rounded-2xl bg-[#141208] border-2 border-[#d4af37]/80 shadow-xl shadow-amber-950/30 text-xs animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                      </span>
                      <span className="font-bold text-amber-300">Sugestão Comercial da IA FMWS</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 font-mono">
                        Intenção: {copilotSuggestion.detectedIntent.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleGenerateAiSuggestion()}
                        className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1"
                        title="Regerar sugestão"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingSuggestion ? 'animate-spin' : ''}`} />
                        Regerar
                      </button>
                      <button
                        onClick={() => setCopilotSuggestion(null)}
                        className="text-slate-500 hover:text-slate-300 p-1"
                        title="Fechar sugestão"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-slate-200 bg-black/40 p-2.5 rounded-xl border border-amber-500/20 whitespace-pre-line leading-relaxed mb-2.5">
                    {copilotSuggestion.suggestedResponse}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <p className="text-[11px] text-slate-400 italic truncate flex-1">
                      💡 {copilotSuggestion.reasoning}
                    </p>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setInputText(copilotSuggestion.suggestedResponse);
                          setCopilotSuggestion(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#1e232e] hover:bg-[#282f3d] text-slate-200 font-medium text-xs transition border border-[#343d4d]"
                      >
                        Editar no campo
                      </button>
                      <button
                        onClick={handleApproveCopilotSuggestion}
                        disabled={isSending}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shadow-md transition flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar e Enviar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Replying banner */}
              {replyingTo && (
                <div className="mx-4 mb-2 p-2 rounded-xl bg-[#161a22] border-l-3 border-amber-400 flex items-center justify-between text-xs text-slate-300">
                  <div className="truncate">
                    <span className="font-semibold text-amber-400">Respondendo a {replyingTo.senderName}:</span>{' '}
                    <span className="text-slate-400">{replyingTo.content.slice(0, 70)}</span>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="text-slate-500 hover:text-white p-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 md:p-4 border-t border-[#1f242d] bg-[#0d0f14] space-y-2">
                {/* Mode Selector & Quick Tools Bar */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {/* Toggle: Cliente vs Nota Interna */}
                    <div className="flex items-center bg-[#13161e] border border-[#262c37] rounded-xl p-0.5">
                      <button
                        onClick={() => setIsInternalNote(false)}
                        className={`px-3 py-1 rounded-lg font-medium transition ${
                          !isInternalNote
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Mensagem Cliente
                      </button>
                      <button
                        onClick={() => setIsInternalNote(true)}
                        className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1 transition ${
                          isInternalNote
                            ? 'bg-amber-600/30 text-amber-200 border border-amber-500/50 font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        Nota Interna
                      </button>
                    </div>

                    {/* Quick Canned Responses */}
                    <div className="relative">
                      <button
                        onClick={() => setShowTemplatePicker(!showTemplatePicker)}
                        className="px-2.5 py-1 rounded-xl bg-[#161922] hover:bg-[#1e232e] text-slate-300 border border-[#2b3342] text-xs flex items-center gap-1.5 transition"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>Respostas Rápidas</span>
                      </button>

                      {showTemplatePicker && (
                        <div className="absolute left-0 bottom-full mb-2 w-80 md:w-96 bg-[#12151c] border border-[#2b3342] rounded-2xl p-2 shadow-2xl z-40 max-h-80 overflow-y-auto">
                          <div className="px-2 py-1 text-[11px] font-bold text-amber-400 uppercase tracking-wider border-b border-[#202530] mb-1">
                            Templates FMWS Comerciais
                          </div>
                          {QUICK_TEMPLATES.map((tmpl, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleInsertCannedResponse(tmpl.text)}
                              className="w-full text-left p-2 hover:bg-[#1c212b] rounded-xl transition text-xs mb-1"
                            >
                              <div className="font-semibold text-white mb-0.5">{tmpl.title}</div>
                              <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.text}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Ask Copilot */}
                    {activeConversation.aiMode === 'copiloto' && !copilotSuggestion && (
                      <button
                        onClick={() => handleGenerateAiSuggestion()}
                        disabled={isGeneratingSuggestion}
                        className="px-2.5 py-1 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/40 text-xs flex items-center gap-1 transition"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{isGeneratingSuggestion ? 'Gerando...' : 'Sugerir com IA'}</span>
                      </button>
                    )}
                  </div>

                  {/* Attachment simulation */}
                  <div className="flex items-center gap-1 text-slate-400">
                    <button
                      onClick={() => {
                        const fileUrl = prompt('Informe a URL do arquivo ou imagem:');
                        if (fileUrl) {
                          ApiService.sendWhatsAppChatMessage(activeConversation.id, {
                            content: 'Arquivo compartilhado',
                            type: fileUrl.endsWith('.pdf') ? 'document' : 'image',
                            mediaUrl: fileUrl,
                            mediaName: 'documento_anexo'
                          }).then(msg => setMessages(prev => [...prev, msg]));
                        }
                      }}
                      className="p-1.5 hover:text-white rounded-lg hover:bg-[#181c24] transition"
                      title="Anexar arquivo / imagem"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        const voiceConfirm = confirm('Gravar e enviar mensagem de voz simulada da equipe comercial FMWS?');
                        if (voiceConfirm) {
                          ApiService.sendWhatsAppChatMessage(activeConversation.id, {
                            content: 'Mensagem de voz gravada',
                            type: 'audio',
                            audioDurationSeconds: 24
                          }).then(msg => setMessages(prev => [...prev, msg]));
                        }
                      }}
                      className="p-1.5 hover:text-white rounded-lg hover:bg-[#181c24] transition"
                      title="Gravar áudio"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Textarea & Send button */}
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <textarea
                      rows={2}
                      value={inputText}
                      onChange={e => setInputText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        isInternalNote
                          ? 'Escreva uma nota interna (visível apenas para a equipe comercial)...'
                          : 'Digite sua mensagem... (Pressione Enter para enviar, Shift+Enter para quebra de linha)'
                      }
                      className={`w-full p-3 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition resize-none ${
                        isInternalNote
                          ? 'bg-[#1e190c] border border-amber-500/50 focus:border-amber-400'
                          : 'bg-[#14171f] border border-[#262c37] focus:border-amber-500/60'
                      }`}
                    />
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !inputText.trim()}
                    className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-center transition shadow-lg ${
                      isSending || !inputText.trim()
                        ? 'bg-[#1c212b] text-slate-500 cursor-not-allowed'
                        : isInternalNote
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
                    }`}
                  >
                    {isSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
              <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
              Selecione uma conversa ao lado para iniciar o atendimento integrado.
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* COLUNA 3: INFORMAÇÕES COMERCIAIS & SINCRONIZAÇÃO CRM */}
        {/* ========================================================= */}
        {showRightColumn && activeConversation && (
          <aside className="w-80 md:w-84 border-l border-[#1f242d] bg-[#0c0e12] flex flex-col shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-[#1f242d] bg-[#0e1017]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-400" />
                  Perfil Comercial CRM
                </span>
                {activeConversation.opportunityTier && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                      activeConversation.opportunityTier === 'A'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : activeConversation.opportunityTier === 'B'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}
                  >
                    Classe {activeConversation.opportunityTier}
                  </span>
                )}
              </div>

              <h3 className="text-sm font-bold text-white mb-0.5">{activeConversation.companyName}</h3>
              <p className="text-xs text-amber-400/90 font-medium">{activeConversation.contactName}</p>
            </div>

            {/* Commercial Details */}
            <div className="p-4 space-y-4 text-xs">
              {/* Phone & wa.me */}
              <div className="p-3 bg-[#13161f] border border-[#232936] rounded-xl space-y-1.5">
                <div className="text-[11px] text-slate-400 font-medium">WhatsApp Principal</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-200 font-semibold">{activeConversation.phoneNumber}</span>
                  <a
                    href={`https://wa.me/${activeConversation.phoneNumber.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition"
                    title="Conversar direto no WhatsApp"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Location & Segment */}
              <div className="space-y-2 text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{activeConversation.segment || 'Segmento não informado'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">
                    {activeConversation.neighborhood
                      ? `${activeConversation.neighborhood}, ${activeConversation.city || 'SP'}`
                      : activeConversation.city || 'Localização não informada'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {activeConversation.site ? (
                    <a
                      href={activeConversation.site.startsWith('http') ? activeConversation.site : `https://${activeConversation.site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline truncate"
                    >
                      {activeConversation.site}
                    </a>
                  ) : (
                    <span className="text-amber-300/80 italic text-[11px]">
                      Sem website informado no Maps (Classe B)
                    </span>
                  )}
                </div>
              </div>

              {/* FUNIL COMERCIAL: 12 STAGES DROPDOWN */}
              <div className="pt-2 border-t border-[#1f242d] space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  Etapa do Funil (12 Etapas)
                </label>
                <select
                  value={activeConversation.commercialStageId}
                  onChange={e => handleUpdateStage(e.target.value as CommercialStageId)}
                  className="w-full bg-[#14171f] border border-[#2a303d] rounded-xl p-2.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500/70 cursor-pointer"
                >
                  {COMMERCIAL_STAGES.map(stage => (
                    <option key={stage.id} value={stage.id} className="bg-[#12141a] text-slate-200">
                      {stage.order}. {stage.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ATENDENTE RESPONSÁVEL */}
              <div className="pt-2 border-t border-[#1f242d] space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  Atendente Responsável
                </label>
                <select
                  value={activeConversation.assignedOperatorName}
                  onChange={e => handleTransfer(e.target.value)}
                  className="w-full bg-[#14171f] border border-[#2a303d] rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/70 cursor-pointer"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.name} className="bg-[#12141a] text-slate-200">
                      {u.name} ({u.roleLabel.split('/')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {/* PRÓXIMO FOLLOW-UP */}
              <div className="pt-2 border-t border-[#1f242d] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Próximo Follow-up
                  </label>
                  {activeConversation.nextFollowUpAt && (
                    <span className="text-[10px] text-amber-400 font-mono">Agendado</span>
                  )}
                </div>
                <input
                  type="datetime-local"
                  value={
                    activeConversation.nextFollowUpAt
                      ? new Date(activeConversation.nextFollowUpAt).toISOString().slice(0, 16)
                      : ''
                  }
                  onChange={e => {
                    const val = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                    ApiService.updateWhatsAppConversation(activeConversation.id, { nextFollowUpAt: val });
                    setConversations(prev =>
                      prev.map(c => (c.id === activeConversation.id ? { ...c, nextFollowUpAt: val } : c))
                    );
                  }}
                  className="w-full bg-[#14171f] border border-[#2a303d] rounded-xl p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              {/* HISTÓRICO DE PROPOSTAS */}
              <div className="pt-2 border-t border-[#1f242d] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Propostas Comerciais ({linkedProposals.length})
                  </label>
                  <button
                    onClick={() => onOpenProposalModal(undefined, linkedLead || undefined)}
                    className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" /> Nova
                  </button>
                </div>

                {linkedProposals.length === 0 ? (
                  <p className="text-[11px] text-slate-500 italic">Nenhuma proposta gerada ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {linkedProposals.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onOpenProposalModal(p, linkedLead || undefined)}
                        className="p-2.5 rounded-xl bg-[#13161f] border border-[#232936] hover:border-amber-500/50 cursor-pointer transition flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-slate-200">{p.proposalCode}</div>
                          <div className="text-[10px] text-slate-400">R$ {p.price?.toLocaleString('pt-BR')}</div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold capitalize ${
                            p.status === 'aprovada'
                              ? 'bg-emerald-950 text-emerald-300'
                              : p.status === 'enviada'
                              ? 'bg-amber-950 text-amber-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BOTÕES DE AÇÃO RÁPIDA */}
              <div className="pt-3 border-t border-[#1f242d] space-y-2">
                <button
                  onClick={() => onOpenProposalModal(undefined, linkedLead || undefined)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <FileText className="w-4 h-4" />
                  Gerar Proposta Comercial
                </button>

                <button
                  onClick={() => handleTransfer(activeConversation.assignedOperatorName, true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#161a24] hover:bg-[#1e2332] text-slate-200 border border-[#2d3545] text-xs font-medium flex items-center justify-center gap-2 transition"
                >
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  Transferir p/ WhatsApp Humano (+55 11 98634-2981)
                </button>

                {linkedLead && (
                  <button
                    onClick={() => onNavigateToTab('ai_analysis')}
                    className="w-full py-2 px-3 rounded-xl bg-[#14171f] hover:bg-[#1a1e28] text-slate-400 hover:text-amber-400 text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Auditar Site com IA
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* MODAL: MÉTRICAS E DASHBOARD DA CENTRAL WHATSAPP */}
      {showMetricsModal && metrics && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1117] border border-[#262c37] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#202530] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Métricas & SLA da Central WhatsApp</h3>
                  <p className="text-xs text-slate-400">Performance operacional, entrega Meta e taxas de conversão</p>
                </div>
              </div>
              <button onClick={() => setShowMetricsModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-[#141720] rounded-2xl border border-[#232936]">
                <div className="text-2xl font-extrabold text-white">{metrics.totalConversations}</div>
                <div className="text-[11px] text-slate-400 mt-1">Conversas Ativas</div>
              </div>

              <div className="p-3 bg-[#141720] rounded-2xl border border-[#232936]">
                <div className="text-2xl font-extrabold text-emerald-400">{metrics.deliveryRatePercentage}%</div>
                <div className="text-[11px] text-slate-400 mt-1">Taxa de Entrega</div>
              </div>

              <div className="p-3 bg-[#141720] rounded-2xl border border-[#232936]">
                <div className="text-2xl font-extrabold text-amber-400">{metrics.readRatePercentage}%</div>
                <div className="text-[11px] text-slate-400 mt-1">Taxa de Leitura</div>
              </div>

              <div className="p-3 bg-[#141720] rounded-2xl border border-[#232936]">
                <div className="text-2xl font-extrabold text-indigo-400">{metrics.averageResponseTimeMinutes} min</div>
                <div className="text-[11px] text-slate-400 mt-1">Tempo Médio Resp.</div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-4 bg-[#141720] rounded-2xl border border-[#232936] space-y-2">
                <div className="font-semibold text-slate-200">Distribuição Operacional</div>
                <div className="flex justify-between text-slate-400">
                  <span>Atendimento por IA (Auto + Copiloto):</span>
                  <span className="text-amber-400 font-bold">{metrics.aiHandledCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Atendimento Humano:</span>
                  <span className="text-slate-200 font-bold">{metrics.humanHandledCount}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Conversas Encerradas:</span>
                  <span className="text-slate-200 font-bold">{metrics.closedConversations}</span>
                </div>
              </div>

              <div className="p-4 bg-[#141720] rounded-2xl border border-[#232936] space-y-2">
                <div className="font-semibold text-slate-200">Conversão Comercial</div>
                <div className="flex justify-between text-slate-400">
                  <span>Conversão em Propostas:</span>
                  <span className="text-amber-400 font-bold">{metrics.conversionToProposalPercentage}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Vendas Fechadas (Won):</span>
                  <span className="text-emerald-400 font-bold">{metrics.conversionToWonPercentage}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Alertas de SLA (&gt;2h):</span>
                  <span className="text-rose-400 font-bold">{metrics.slaBreachCount}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMetricsModal(false)}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
