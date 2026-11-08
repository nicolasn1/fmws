import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Globe,
  Phone,
  User,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  Sparkles,
  Save,
  Trash2,
  MessageSquare,
  FileText,
  DollarSign,
  Tag,
  CheckCircle2,
  ExternalLink,
  Share2,
  UserCheck,
  Bot,
  Search,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Lead, CommercialStageId, ConsentStatus, LeadPriority } from '../types/crm';
import { COMMERCIAL_STAGES } from '../data/stages';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: Lead | null;
  onSave: (leadData: Partial<Lead>) => Promise<void>;
  onDelete?: (leadId: string, isLgpd: boolean) => void;
  onOpenWhatsApp?: (lead: Lead) => void;
  onAnalyzeAi?: (lead: Lead) => void;
  onCreateProposal?: (lead: Lead) => void;
  onTransferToCommercial?: (lead: Lead) => void;
  onConfirmHumanChat?: (lead: Lead) => void;
  availableUsers: string[];
}

export const LeadModal: React.FC<LeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  onSave,
  onDelete,
  onOpenWhatsApp,
  onAnalyzeAi,
  onCreateProposal,
  onTransferToCommercial,
  onConfirmHumanChat,
  availableUsers
}) => {
  const isEditing = Boolean(lead);

  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    cnpj: '',
    segment: 'Serviços Corporativos',
    city: 'São Paulo',
    neighborhood: '',
    site: '',
    instagram: '',
    facebook: '',
    commercialPhone: '',
    whatsapp: '',
    contactName: '',
    contactRole: 'Diretor / Sócio',
    source: 'Prospecção Ativa B2B',
    consentStatus: 'autorizado' as ConsentStatus,
    stageId: 'identificada' as CommercialStageId,
    priority: 'media' as LeadPriority,
    assignedTo: availableUsers[0] || 'Carlos Mendes (SDR)',
    notes: '',
    dealValue: undefined
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'dados' | 'ia_audit' | 'lgpd'>('dados');
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false);
  const [cnpjFeedback, setCnpjFeedback] = useState<{
    success: boolean;
    isGovOrPolitical?: boolean;
    message: string;
    partners?: string[];
  } | null>(null);

  useEffect(() => {
    if (lead) {
      setFormData({ ...lead });
    } else {
      setFormData({
        name: '',
        cnpj: '',
        segment: 'Serviços Corporativos',
        city: 'São Paulo',
        neighborhood: '',
        site: '',
        instagram: '',
        facebook: '',
        commercialPhone: '',
        whatsapp: '',
        contactName: '',
        contactRole: 'Diretor / Sócio',
        source: 'Prospecção Ativa B2B',
        consentStatus: 'autorizado',
        stageId: 'identificada',
        priority: 'media',
        assignedTo: availableUsers[0] || 'Carlos Mendes (SDR)',
        notes: '',
        dealValue: undefined
      });
    }
    setErrorMessage('');
    setCnpjFeedback(null);
    setActiveTab('dados');
  }, [lead, isOpen]);

  const handleLookupCnpj = async () => {
    const clean = (formData.cnpj || '').replace(/\D/g, '');
    if (clean.length !== 14) {
      setErrorMessage('Informe um CNPJ válido com 14 dígitos para consulta na Receita Federal.');
      return;
    }

    try {
      setIsFetchingCnpj(true);
      setErrorMessage('');
      setCnpjFeedback(null);
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) {
        throw new Error('CNPJ não localizado na base pública da Receita Federal.');
      }
      const data = await res.json();
      const partners: string[] = Array.isArray(data.qsa)
        ? data.qsa.map((s: any) => `${s.nome_socio || s.nome} (${s.qualificacao_socio || 'Sócio'})`)
        : [];

      const mainPartner = Array.isArray(data.qsa) && data.qsa[0] ? data.qsa[0] : null;
      const natureza = (data.natureza_juridica || '').toLowerCase();
      const codNatureza = String(data.codigo_natureza_juridica || '');
      const isGovOrPolitica =
        natureza.includes('pública') ||
        natureza.includes('publica') ||
        natureza.includes('órgão público') ||
        natureza.includes('orgao publico') ||
        natureza.includes('autarquia') ||
        natureza.includes('partido') ||
        natureza.includes('fundação pública') ||
        codNatureza.startsWith('1') ||
        codNatureza === '3115';

      setFormData(prev => ({
        ...prev,
        name: prev.name || data.nome_fantasia || data.razao_social || '',
        segment: prev.segment || data.cnae_fiscal_descricao || '',
        city: prev.city || (data.municipio ? `${data.municipio} - ${data.uf}` : ''),
        neighborhood: prev.neighborhood || data.bairro || '',
        contactName: prev.contactName || (mainPartner ? mainPartner.nome_socio : 'Responsável Legal'),
        contactRole: prev.contactRole || (mainPartner ? (mainPartner.qualificacao_socio || 'Sócio Administrador') : 'Diretor / Sócio'),
        commercialPhone: prev.commercialPhone || (data.ddd_telefone_1 ? `(${data.ddd_telefone_1.slice(0, 2)}) ${data.ddd_telefone_1.slice(2)}` : '')
      }));

      if (isGovOrPolitica) {
        setCnpjFeedback({
          success: false,
          isGovOrPolitical: true,
          message: `⚠️ ENTIDADE PÚBLICA / POLÍTICA DETECTADA: "${data.natureza_juridica || 'Administração Pública'}". A Fazer Meu Website opera exclusivamente no setor privado B2B. Prospecção desaconselhada.`,
          partners
        });
      } else {
        setCnpjFeedback({
          success: true,
          message: `Dados oficiais carregados (${data.descricao_situacao_cadastral || 'Ativa'}) — Setor Privado B2B.`,
          partners
        });
      }
    } catch (err: any) {
      setCnpjFeedback({
        success: false,
        message: err.message || 'Falha ao consultar CNPJ'
      });
    } finally {
      setIsFetchingCnpj(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) {
      setErrorMessage('Nome da Empresa e WhatsApp são campos obrigatórios.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="card-corporate w-full max-w-3xl rounded-2xl border border-[#262c3a] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-[#202530] bg-[#14171f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d222d] border border-[#2d3545] flex items-center justify-center text-amber-400 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isEditing ? formData.name || 'Dossiê da Empresa' : 'Cadastrar Nova Empresa (Lead B2B)'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? `ID: ${lead?.id} • Criado em ${new Date(lead?.createdAt || '').toLocaleDateString('pt-BR')}`
                  : 'Preencha as informações para qualificação comercial e conformidade LGPD'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-[#1f242d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Subtabs if editing */}
        {isEditing && (
          <div className="flex border-b border-[#202530] px-5 bg-[#101217] text-xs">
            <button
              onClick={() => setActiveTab('dados')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition ${
                activeTab === 'dados'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Ficha Cadastral & Contato
            </button>
            <button
              onClick={() => setActiveTab('ia_audit')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'ia_audit'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Auditoria de IA & Oportunidades
              {lead?.aiAnalysis && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
            </button>
            <button
              onClick={() => setActiveTab('lgpd')}
              className={`py-2.5 px-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'lgpd'
                  ? 'border-amber-400 text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Conformidade LGPD & Exclusão
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="m-5 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        {activeTab === 'dados' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Grid 1: Basic Corporate Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Empresa / Razão Social *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Pinheiro Advocacia & Associados"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">CNPJ (Opcional)</label>
                  <button
                    type="button"
                    onClick={handleLookupCnpj}
                    disabled={isFetchingCnpj || !formData.cnpj}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition disabled:opacity-40"
                  >
                    {isFetchingCnpj ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                    <span>{isFetchingCnpj ? 'Consultando...' : 'Buscar na Receita Federal'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={formData.cnpj || ''}
                    onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                    className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
                  />
                </div>

                {cnpjFeedback && (
                  <div
                    className={`mt-1.5 p-2 rounded-lg text-[11px] space-y-1 border ${
                      cnpjFeedback.isGovOrPolitical
                        ? 'bg-amber-950/70 border-amber-600/70 text-amber-200'
                        : cnpjFeedback.success
                        ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/50 border-rose-800 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-semibold">
                      {cnpjFeedback.isGovOrPolitical ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : cnpjFeedback.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}
                      <span>{cnpjFeedback.message}</span>
                    </div>

                    {cnpjFeedback.partners && cnpjFeedback.partners.length > 0 && (
                      <div className="text-[10px] text-slate-300 pt-0.5 border-t border-white/10">
                        <span className="text-slate-400 font-medium">Sócios Identificados (QSA): </span>
                        {cnpjFeedback.partners.slice(0, 3).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Segmento de Atuação</label>
                <input
                  type="text"
                  placeholder="Ex: Jurídico, Clínica Médica, Engenharia, Logística"
                  value={formData.segment || ''}
                  onChange={e => setFormData({ ...formData, segment: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Cidade / UF</label>
                  <input
                    type="text"
                    placeholder="São Paulo - SP"
                    value={formData.city || ''}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    placeholder="Itaim Bibi"
                    value={formData.neighborhood || ''}
                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                    className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              </div>
            </div>

            {/* Grid 2: Digital Presence */}
            <div className="pt-2 border-t border-[#202530] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Site Atual (se houver)</label>
                <input
                  type="text"
                  placeholder="https://empresa.com.br"
                  value={formData.site || ''}
                  onChange={e => setFormData({ ...formData, site: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Instagram (@)</label>
                <input
                  type="text"
                  placeholder="@empresa_oficial"
                  value={formData.instagram || ''}
                  onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Facebook ou LinkedIn</label>
                <input
                  type="text"
                  placeholder="linkedin.com/company/..."
                  value={formData.facebook || ''}
                  onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Grid 3: Decision Maker & Contact */}
            <div className="pt-2 border-t border-[#202530] grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Tomador de Decisão *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dr. Roberto Pinheiro"
                  value={formData.contactName || ''}
                  onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Função</label>
                <input
                  type="text"
                  placeholder="Ex: Sócio Fundador, Diretor Médico, Head Comercial"
                  value={formData.contactRole || ''}
                  onChange={e => setFormData({ ...formData, contactRole: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Comercial *</label>
                <input
                  type="text"
                  required
                  placeholder="5511999998888 (com DDI e DDD)"
                  value={formData.whatsapp || ''}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone Fixo Comercial</label>
                <input
                  type="text"
                  placeholder="(11) 3450-8900"
                  value={formData.commercialPhone || ''}
                  onChange={e => setFormData({ ...formData, commercialPhone: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Grid 4: Pipeline, Priority & Consent */}
            <div className="pt-2 border-t border-[#202530] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estágio Comercial (Kanban)</label>
                <select
                  value={formData.stageId}
                  onChange={e => setFormData({ ...formData, stageId: e.target.value as CommercialStageId })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                >
                  {COMMERCIAL_STAGES.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.order} {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData({ ...formData, priority: e.target.value as LeadPriority })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                >
                  <option value="alta">Alta Prioridade</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consentimento LGPD</label>
                <select
                  value={formData.consentStatus}
                  onChange={e => setFormData({ ...formData, consentStatus: e.target.value as ConsentStatus })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                >
                  <option value="autorizado">Autorizado para abordagem comercial</option>
                  <option value="pendente">Pendente de consentimento</option>
                  <option value="opt_out">Opt-out / Recusou contato</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fonte da Informação</label>
                <input
                  type="text"
                  placeholder="Ex: Prospecção Ativa, Indicação, Outbound"
                  value={formData.source || ''}
                  onChange={e => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Responsável Interno</label>
                <input
                  type="text"
                  value={formData.assignedTo || ''}
                  onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Valor Estimado do Negócio (R$)</label>
                <input
                  type="number"
                  placeholder="Ex: 7500"
                  value={formData.dealValue || ''}
                  onChange={e => setFormData({ ...formData, dealValue: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observações Comerciais & Histórico
              </label>
              <textarea
                rows={3}
                placeholder="Detalhes técnicos observados, necessidades do decisor, contexto do contato..."
                value={formData.notes || ''}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Classification and Transfer Card if editing */}
            {isEditing && lead && (
              <div className="p-3.5 rounded-xl bg-[#141822] border border-[#273042] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <Share2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-white">Modelo de Prospecção & Transferência Comercial</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">2 Canais Fazer Meu Website</span>
                </div>

                {/* Classification info if available */}
                {lead.lastClassification && (() => {
                  const category = lead.lastClassification.classification || lead.lastClassification.categoria;
                  const explanation = lead.lastClassification.summary || lead.lastClassification.explicacao;
                  return (
                    <div className="p-2.5 rounded-lg bg-[#0d0f14] border border-[#1f2533] text-[11px] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                          <Bot className="w-3.5 h-3.5 text-amber-400" />
                          Classificação IA (Gemini):
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            category === 'interesse_real'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : category === 'resposta_automatica'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : category === 'recusa_optout'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-blue-950 text-blue-300 border border-blue-800'
                          }`}
                        >
                          {category === 'interesse_real'
                            ? 'Interesse Real'
                            : category === 'resposta_automatica'
                            ? 'Resposta Automática'
                            : category === 'recusa_optout'
                            ? 'Opt-out / Recusa'
                            : 'Dúvida Geral'}
                        </span>
                      </div>
                      <p className="text-slate-300 italic">"{explanation}"</p>
                    </div>
                  );
                })()}

                {/* Transfer Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onTransferToCommercial && (
                    <button
                      type="button"
                      onClick={() => onTransferToCommercial(lead)}
                      title="Envia convite pelo Canal 1 (API Meta: +55 11 94579-9976) para o Canal 2 (wa.me/5511986342981)"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-semibold transition shadow-sm"
                    >
                      <Share2 className="w-3.5 h-3.5 text-amber-400" />
                      Encaminhar para WhatsApp Comercial
                    </button>
                  )}

                  {onConfirmHumanChat && (
                    <button
                      type="button"
                      onClick={() => onConfirmHumanChat(lead)}
                      title="Registra que o cliente fez contato com o WhatsApp Comercial Humano (+55 11 98634-2981)"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/50 hover:bg-emerald-900/70 border border-emerald-700/60 text-emerald-300 rounded-lg text-xs font-semibold transition"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      Confirmar Abertura de Atendimento (Canal 2)
                    </button>
                  )}
                </div>

                <div className="text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Canal 1: Meta Cloud API (+55 11 94579-9976)</span>
                  <span className="text-amber-400/80">Canal 2: Humano / Sem API (+55 11 98634-2981)</span>
                </div>
              </div>
            )}

            {/* Quick Actions if editing */}
            {isEditing && lead && (
              <div className="pt-2 border-t border-[#202530] flex flex-wrap items-center gap-2">
                {onAnalyzeAi && (
                  <button
                    type="button"
                    onClick={() => onAnalyzeAi(lead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800 text-amber-300 rounded-lg text-xs font-medium transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Auditar Presença Digital com IA
                  </button>
                )}

                {onOpenWhatsApp && (
                  <button
                    type="button"
                    onClick={() => onOpenWhatsApp(lead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-medium transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    Mensagem WhatsApp Cloud
                  </button>
                )}

                {onCreateProposal && (
                  <button
                    type="button"
                    onClick={() => onCreateProposal(lead)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#202633] hover:bg-[#283244] border border-[#354257] text-[#f5e7a9] rounded-lg text-xs font-medium transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                    Gerar Proposta Comercial
                  </button>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-[#202530] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#181b22] hover:bg-[#222732] text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg transition hover:brightness-110 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Salvando...' : isEditing ? 'Atualizar Empresa' : 'Cadastrar Empresa'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: AI Site Audit Details */}
        {activeTab === 'ia_audit' && lead && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {lead.aiAnalysis ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[#14171e] border border-[#232936] flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">Score de Experiência Mobile:</span>
                    <div className="text-2xl font-extrabold text-amber-400 font-mono mt-0.5">
                      {lead.aiAnalysis.mobileExperienceScore} / 100
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400">Qualidade Apresentação:</span>
                    <div className="text-sm font-bold uppercase text-white mt-0.5">
                      {lead.aiAnalysis.presentationQuality}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#14171e] border border-[#232936] space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400" /> Problemas Observados
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {lead.aiAnalysis.observedProblems.map((prob, i) => (
                      <li key={i}>{prob}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#14171e] border border-[#232936] space-y-3">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Melhorias Recomendadas
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {lead.aiAnalysis.recommendedImprovements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/50 space-y-2">
                  <h4 className="font-bold text-[#f5e7a9] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d4af37]" /> Solução Comercial FMWS & Diferencial
                  </h4>
                  <p className="text-white font-medium">{lead.aiAnalysis.suggestedCommercialSolution}</p>
                  <p className="text-slate-400 italic mt-1 leading-relaxed">
                    "{lead.aiAnalysis.fmwsDifferentiatorPitch}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Nenhuma auditoria de IA executada ainda</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  A inteligência artificial analisa a presença web pública, experiência mobile e organização para formular a
                  solução da Fazer Meu Website.
                </p>
                {onAnalyzeAi && (
                  <button
                    onClick={() => onAnalyzeAi(lead)}
                    className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg transition hover:brightness-110"
                  >
                    Executar Auditoria Agora
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: LGPD & Deletion */}
        {activeTab === 'lgpd' && lead && (
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
            <div className="p-4 rounded-xl bg-[#14171e] border border-[#232936] space-y-2">
              <h4 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Gestão de Consentimento Comercial
              </h4>
              <p className="text-slate-300 leading-relaxed">
                A plataforma opera em estrita conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018).
                Toda abordagem inicial deve possuir consentimento prévio ou base legítima de prospecção B2B com possibilidade
                imediata de descadastro (opt-out).
              </p>
              <div className="pt-2 text-slate-400">
                Situação Atual: <strong className="text-white uppercase">{lead.consentStatus}</strong>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/50 space-y-3">
              <h4 className="font-bold text-rose-300 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" /> Direito do Titular: Exclusão e Anonimização
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Caso o titular ou a empresa solicite a remoção definitiva dos seus dados dos registros comerciais da Fazer Meu Website,
                utilize a exclusão definitiva abaixo.
              </p>
              {onDelete && (
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Confirmar exclusão definitiva do registro de "${lead.name}"?`)) {
                        onDelete(lead.id, true);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg text-xs font-semibold transition"
                  >
                    Excluir e Anonimizar (Direito LGPD)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
