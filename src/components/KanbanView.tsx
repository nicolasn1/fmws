import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Phone,
  MessageSquare,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  User,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Share2,
  UserCheck,
  ExternalLink
} from 'lucide-react';
import { Lead, CommercialStageId } from '../types/crm';
import { COMMERCIAL_STAGES } from '../data/stages';

interface KanbanViewProps {
  leads: Lead[];
  onMoveStage: (leadId: string, newStage: CommercialStageId) => void;
  onSelectLead: (lead: Lead) => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onAnalyzeAi: (lead: Lead) => void;
  onTransferToCommercial: (lead: Lead) => void;
  onConfirmHumanChat: (lead: Lead) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  leads,
  onMoveStage,
  onSelectLead,
  onOpenWhatsApp,
  onAnalyzeAi,
  onTransferToCommercial,
  onConfirmHumanChat
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const filteredLeads = leads.filter(l => {
    if (filterPriority !== 'all' && l.priority !== filterPriority) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.segment.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (stageId: CommercialStageId) => {
    if (draggedLeadId) {
      onMoveStage(draggedLeadId, stageId);
      setDraggedLeadId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Funnel Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111318] p-3 rounded-xl border border-[#202530]">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Filtrar cartões no funil..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/60 w-full sm:w-64"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              aria-label="Filtrar por prioridade comercial"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="all">Todas Prioridades</option>
              <option value="alta">Alta Prioridade</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-3">
          <span>
            Total exibido: <strong className="text-white">{filteredLeads.length}</strong> empresas
          </span>
          <span className="hidden md:inline text-[11px] text-amber-400/80 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/50">
            Arraste os cartões entre as colunas para atualizar o estágio
          </span>
        </div>
      </div>

      {/* Columns Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[3900px]">
          {COMMERCIAL_STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.stageId === stage.id);
            const stageTotalValue = stageLeads.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);

            const isTransferStage =
              stage.id === 'interessado' ||
              stage.id === 'encaminhamento_enviado' ||
              stage.id === 'atendimento_confirmado';

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
                className={`w-72 shrink-0 rounded-xl border flex flex-col max-h-[calc(100vh-210px)] transition-colors ${
                  isTransferStage
                    ? 'bg-[#101218] border-amber-900/40 hover:border-amber-600/60'
                    : 'bg-[#0f1116] border-[#1f242d] hover:border-[#2d3442]'
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#1f242d] bg-[#13151b] rounded-t-xl sticky top-0 z-10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-amber-400/80 font-bold">
                      Etapa #{stage.order}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-[#1d222c] text-white border border-[#2d3545]">
                      {stageLeads.length}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 truncate" title={stage.label}>
                    {stage.label}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5" title={stage.description}>
                    {stage.description}
                  </p>
                  {stageTotalValue > 0 && (
                    <div className="mt-1.5 text-[11px] font-semibold text-amber-300/90 font-mono">
                      R$ {stageTotalValue.toLocaleString('pt-BR')}
                    </div>
                  )}
                </div>

                {/* Column Cards */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="h-28 border border-dashed border-[#202530] rounded-lg flex items-center justify-center text-slate-500 text-[11px] text-center p-3">
                      Nenhum lead nesta etapa
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                        onClick={() => onSelectLead(lead)}
                        className="p-3 rounded-lg bg-[#151820] hover:bg-[#1a1f29] border border-[#222834] hover:border-amber-500/50 cursor-grab active:cursor-grabbing transition-all shadow-sm group relative"
                      >
                        {/* Card Top: Priority & Badges */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                lead.priority === 'alta'
                                  ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                                  : lead.priority === 'media'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {lead.priority}
                            </span>

                            {lead.verificationStatus && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                  lead.verificationStatus === 'verificado'
                                    ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
                                    : lead.verificationStatus === 'demonstrativo'
                                    ? 'bg-purple-950/90 text-purple-300 border border-purple-800'
                                    : lead.verificationStatus === 'suspeito_duplicidade'
                                    ? 'bg-rose-950/90 text-rose-300 border border-rose-800'
                                    : 'bg-amber-950/90 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {lead.verificationStatus === 'verificado'
                                  ? '✓ Real'
                                  : lead.verificationStatus === 'demonstrativo'
                                  ? 'Demo'
                                  : lead.verificationStatus === 'suspeito_duplicidade'
                                  ? 'Duplicado'
                                  : 'Pendente'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {lead.consentStatus === 'autorizado' ? (
                              <span
                                className="text-[10px] text-emerald-400 flex items-center gap-0.5"
                                title="Consentimento LGPD Autorizado"
                              >
                                <ShieldCheck className="w-3 h-3" />
                              </span>
                            ) : lead.consentStatus === 'opt_out' ? (
                              <span
                                className="text-[10px] text-rose-400 flex items-center gap-0.5"
                                title="Opt-out LGPD Solicitado"
                              >
                                <ShieldAlert className="w-3 h-3" />
                              </span>
                            ) : (
                              <span
                                className="text-[10px] text-amber-400 flex items-center gap-0.5"
                                title="Consentimento LGPD Pendente"
                              >
                                <AlertCircle className="w-3 h-3" />
                              </span>
                            )}

                            {lead.aiAnalysis && (
                              <span
                                className="text-[10px] text-amber-400 bg-amber-950/60 px-1 py-0.2 rounded border border-amber-800"
                                title="Auditado com IA"
                              >
                                <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                                IA
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Company Name */}
                        <h5 className="text-xs font-bold text-white group-hover:text-amber-300 transition line-clamp-1">
                          {lead.name}
                        </h5>

                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {lead.segment} • {lead.city}
                        </div>

                        {/* Contact details */}
                        <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-2 font-medium">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {lead.contactName} ({lead.contactRole})
                          </span>
                        </div>

                        {/* Deal value & 24h SLA Badge */}
                        <div className="mt-2 flex items-center justify-between gap-1 flex-wrap">
                          {lead.dealValue ? (
                            <div className="text-xs font-extrabold text-[#d4af37] font-mono flex items-center gap-0.5">
                              <DollarSign className="w-3 h-3" />
                              R$ {lead.dealValue.toLocaleString('pt-BR')}
                            </div>
                          ) : <div />}

                          {/* 24-Hour Meta Cloud SLA Window Badge */}
                          {lead.lastClassification && lead.lastClassification.analyzedAt && (() => {
                            const hoursLeft = 24 - (Date.now() - new Date(lead.lastClassification.analyzedAt).getTime()) / (1000 * 60 * 60);
                            if (hoursLeft > 0 && hoursLeft <= 24) {
                              return (
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold font-mono flex items-center gap-1 border ${
                                    hoursLeft <= 4
                                      ? 'bg-rose-950/80 text-rose-300 border-rose-700 animate-pulse'
                                      : 'bg-amber-950/70 text-amber-300 border-amber-800'
                                  }`}
                                  title={`Janela de resposta Meta: expira em ${hoursLeft.toFixed(1)} horas`}
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  Meta: {Math.max(1, Math.round(hoursLeft))}h
                                </span>
                              );
                            }
                            return null;
                          })()}
                        </div>

                        {/* TRANSFER BUTTONS DIRECTLY ON CARD */}
                        {(lead.stageId === 'interessado' || lead.stageId === 'respondeu') && (
                          <div className="mt-2.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => onTransferToCommercial(lead)}
                              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-700 text-blue-200 text-[10px] font-bold transition shadow-sm"
                            >
                              <Share2 className="w-3 h-3 text-blue-300" />
                              <span>Encaminhar para WhatsApp Comercial</span>
                            </button>
                          </div>
                        )}

                        {lead.stageId === 'encaminhamento_enviado' && (
                          <div className="mt-2.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => onConfirmHumanChat(lead)}
                              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 text-[10px] font-bold transition shadow-sm"
                            >
                              <UserCheck className="w-3 h-3 text-emerald-300" />
                              <span>Confirmar Atendimento (Canal 2)</span>
                            </button>
                          </div>
                        )}

                        {/* Card Footer Actions */}
                        <div className="mt-2.5 pt-2 border-t border-[#202530] flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 text-[10px] truncate max-w-[90px]">
                            {lead.assignedTo?.split(' ')[0]}
                          </span>

                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            {/* Click to Call */}
                            {(lead.commercialPhone || lead.whatsapp) && (
                              <a
                                href={`tel:${(lead.commercialPhone || lead.whatsapp).replace(/\D/g, '')}`}
                                title={`Ligar para ${lead.name}`}
                                className="p-1 rounded bg-[#1e232d] hover:bg-sky-950/80 text-sky-400 border border-[#2b3342] hover:border-sky-700 transition"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                            )}

                            {/* Direct WhatsApp Web link */}
                            {lead.whatsapp && (
                              <a
                                href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Abrir conversa no WhatsApp Web"
                                className="p-1 rounded bg-[#1e232d] hover:bg-emerald-950/80 text-emerald-400 border border-[#2b3342] hover:border-emerald-700 transition"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}

                            <button
                              onClick={() => onAnalyzeAi(lead)}
                              title="Auditar site com IA"
                              className="p-1 rounded bg-[#1e232d] hover:bg-amber-950/80 text-amber-400 border border-[#2b3342] hover:border-amber-700 transition"
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>

                            <button
                              onClick={() => onOpenWhatsApp(lead)}
                              title="Mensagem WhatsApp Cloud"
                              className="p-1 rounded bg-[#1e232d] hover:bg-emerald-950/80 text-emerald-400 border border-[#2b3342] hover:border-emerald-700 transition"
                            >
                              <MessageSquare className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
