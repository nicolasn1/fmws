import React, { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  Plus,
  UploadCloud,
  Download,
  ExternalLink,
  Phone,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  DollarSign,
  ChevronRight,
  Share2,
  UserCheck,
  Bot
} from 'lucide-react';
import { Lead, CommercialStageId } from '../types/crm';
import { COMMERCIAL_STAGES } from '../data/stages';

interface LeadsViewProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenNewLead: () => void;
  onOpenImportCsv: () => void;
  onOpenWhatsApp: (lead: Lead) => void;
  onAnalyzeAi: (lead: Lead) => void;
  onDeleteLead: (leadId: string, isLgpd: boolean) => void;
  onUpdateStage: (leadId: string, stageId: CommercialStageId) => void;
  onTransferToCommercial?: (lead: Lead) => void;
  onConfirmHumanChat?: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onSelectLead,
  onOpenNewLead,
  onOpenImportCsv,
  onOpenWhatsApp,
  onAnalyzeAi,
  onDeleteLead,
  onUpdateStage,
  onTransferToCommercial,
  onConfirmHumanChat
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedConsent, setSelectedConsent] = useState<string>('all');

  const filtered = leads.filter(l => {
    if (selectedStage !== 'all' && l.stageId !== selectedStage) return false;
    if (selectedPriority !== 'all' && l.priority !== selectedPriority) return false;
    if (selectedConsent !== 'all' && l.consentStatus !== selectedConsent) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        (l.cnpj && l.cnpj.includes(q)) ||
        l.contactName.toLowerCase().includes(q) ||
        l.whatsapp.includes(q) ||
        l.segment.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportCsv = () => {
    const stageMap: Record<string, string> = {};
    COMMERCIAL_STAGES.forEach(s => {
      stageMap[s.id] = s.label;
    });

    const headers = [
      'Nome da Empresa',
      'CNPJ',
      'Segmento',
      'Cidade',
      'Bairro',
      'Site',
      'Telefone Comercial',
      'WhatsApp',
      'Nome do Decisor',
      'Cargo',
      'Consentimento LGPD',
      'Estágio no Funil',
      'Prioridade',
      'Valor Estimado (R$)',
      'Origem do Lead'
    ];

    const rows = filtered.map(l => [
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${(l.cnpj || '').replace(/"/g, '""')}"`,
      `"${(l.segment || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.neighborhood || '').replace(/"/g, '""')}"`,
      `"${(l.site || 'Não identificado').replace(/"/g, '""')}"`,
      `"${(l.commercialPhone || '').replace(/"/g, '""')}"`,
      `"${(l.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(l.contactName || '').replace(/"/g, '""')}"`,
      `"${(l.contactRole || '').replace(/"/g, '""')}"`,
      `"${l.consentStatus === 'autorizado' ? 'Autorizado' : l.consentStatus === 'opt_out' ? 'Opt-Out (Bloqueado)' : 'Pendente'}"`,
      `"${stageMap[l.stageId] || l.stageId}"`,
      `"${l.priority.toUpperCase()}"`,
      `"${(l.dealValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}"`,
      `"${(l.source || '').replace(/"/g, '""')}"`
    ]);

    // Use semicolon for Brazilian Excel locale + UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FMWS_Leads_Comercial_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top filter bar */}
      <div className="card-corporate p-4 rounded-xl border border-[#202530] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por empresa, CNPJ, responsável, telefone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* Stage Filter */}
          <select
            aria-label="Filtrar por estágio comercial"
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">Todas as Etapas (12)</option>
            {COMMERCIAL_STAGES.map(s => (
              <option key={s.id} value={s.id}>
                #{s.order} {s.label}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            aria-label="Filtrar por prioridade"
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">Prioridade: Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Média</option>
            <option value="baixa">Baixa</option>
          </select>

          {/* Consent */}
          <select
            aria-label="Filtrar por consentimento LGPD"
            value={selectedConsent}
            onChange={e => setSelectedConsent(e.target.value)}
            className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">LGPD: Todos</option>
            <option value="autorizado">Autorizado</option>
            <option value="pendente">Pendente</option>
            <option value="opt_out">Opt-out</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#181b22] hover:bg-[#202530] text-slate-300 hover:text-white border border-[#272d38] rounded-lg text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>

          <button
            onClick={onOpenNewLead}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-semibold text-xs rounded-lg transition hover:brightness-110 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cadastrar Empresa</span>
          </button>
        </div>
      </div>

      {/* Table of Leads */}
      <div className="card-corporate rounded-xl border border-[#202530] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#14171e] border-b border-[#202530] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Empresa / CNPJ</th>
                <th className="py-3 px-3">Segmento & Cidade</th>
                <th className="py-3 px-3">Decisor Comercial</th>
                <th className="py-3 px-3">Presença Digital</th>
                <th className="py-3 px-3">LGPD</th>
                <th className="py-3 px-3">Etapa Funil</th>
                <th className="py-3 px-3">Valor Est.</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1f28]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 text-xs">
                    Nenhuma empresa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(lead => {
                  const stage = COMMERCIAL_STAGES.find(s => s.id === lead.stageId);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-[#151822] cursor-pointer transition group"
                    >
                      {/* Company Name & CNPJ */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#1a1e27] border border-[#28303f] flex items-center justify-center font-bold text-amber-400 text-xs shrink-0">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white group-hover:text-amber-300 transition">
                                {lead.name}
                              </span>
                              {lead.verificationStatus && (
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                                    lead.verificationStatus === 'verificado'
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      : lead.verificationStatus === 'demonstrativo'
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                      : lead.verificationStatus === 'suspeito_duplicidade'
                                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                      : 'bg-amber-950 text-amber-300 border border-amber-800'
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
                              {lead.originType && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-[#1c222e] text-slate-300 border border-[#2b3548]">
                                  {lead.originType === 'importacao_externa'
                                    ? 'Google Places'
                                    : lead.originType === 'whatsapp_inbound'
                                    ? 'WhatsApp Inbound'
                                    : lead.originType === 'cadastro_manual'
                                    ? 'Manual'
                                    : lead.originType === 'csv_import'
                                    ? 'CSV'
                                    : lead.originType}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {lead.cnpj || 'CNPJ não informado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Segment & City */}
                      <td className="py-3 px-3 text-slate-300">
                        <div>{lead.segment}</div>
                        <div className="text-[11px] text-slate-400">{lead.city}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-200">{lead.contactName}</div>
                        <div className="text-[11px] text-slate-400">{lead.contactRole}</div>
                        <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">{lead.whatsapp}</div>
                      </td>

                      {/* Digital Presence */}
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        {lead.site ? (
                          <a
                            href={lead.site.startsWith('http') ? lead.site : `http://${lead.site}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d4af37] hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <span className="truncate max-w-[140px]">{lead.site.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Sem site registrado</span>
                        )}

                        {lead.aiAnalysis && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/50 w-fit">
                            <Sparkles className="w-2.5 h-2.5" />
                            Score Mobile: {lead.aiAnalysis.mobileExperienceScore}/100
                          </div>
                        )}
                      </td>

                      {/* LGPD Consent */}
                      <td className="py-3 px-3">
                        {lead.consentStatus === 'autorizado' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <ShieldCheck className="w-3 h-3" /> Autorizado
                          </span>
                        ) : lead.consentStatus === 'opt_out' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-300 border border-rose-800">
                            <ShieldAlert className="w-3 h-3" /> Opt-out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800">
                            <AlertCircle className="w-3 h-3" /> Pendente
                          </span>
                        )}
                      </td>

                      {/* Stage Dropdown & Action */}
                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <div className="space-y-1">
                          <select
                            aria-label={`Alterar estágio da empresa ${lead.name}`}
                            value={lead.stageId}
                            onChange={e => onUpdateStage(lead.id, e.target.value as CommercialStageId)}
                            className="bg-[#181b22] border border-[#272d38] text-[11px] text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-amber-500/60 max-w-[145px]"
                          >
                            {COMMERCIAL_STAGES.map(s => (
                              <option key={s.id} value={s.id}>
                                #{s.order} {s.label}
                              </option>
                            ))}
                          </select>

                          {/* Quick Transfer Triggers based on stage */}
                          {lead.stageId === 'interessado' && onTransferToCommercial && (
                            <button
                              type="button"
                              onClick={() => onTransferToCommercial(lead)}
                              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 border border-amber-500/40 hover:brightness-110 font-semibold"
                              title="Enviar convite Canal 1 -> Canal 2"
                            >
                              <Share2 className="w-2.5 h-2.5" /> Encaminhar Comercial
                            </button>
                          )}

                          {lead.stageId === 'encaminhamento_enviado' && onConfirmHumanChat && (
                            <button
                              type="button"
                              onClick={() => onConfirmHumanChat(lead)}
                              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60 font-semibold"
                              title="Confirmar contato no WhatsApp Comercial (+55 11 98634-2981)"
                            >
                              <UserCheck className="w-2.5 h-2.5" /> Confirmar Atendimento
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Deal Value */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-200">
                        {lead.dealValue ? (
                          <span className="text-[#d4af37]">R$ {lead.dealValue.toLocaleString('pt-BR')}</span>
                        ) : (
                          <span className="text-slate-400 font-normal text-[11px]">—</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {onTransferToCommercial && (
                            <button
                              onClick={() => onTransferToCommercial(lead)}
                              title="Encaminhar para WhatsApp Comercial (wa.me/5511986342981)"
                              className="p-1.5 rounded-lg bg-[#181b22] hover:bg-amber-950/60 text-amber-400 border border-[#272d38] hover:border-amber-600 transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onAnalyzeAi(lead)}
                            title="Auditar com IA"
                            className="p-1.5 rounded-lg bg-[#181b22] hover:bg-amber-950/60 text-amber-400 border border-[#272d38] hover:border-amber-600 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onOpenWhatsApp(lead)}
                            title="Disparo WhatsApp Oficial"
                            className="p-1.5 rounded-lg bg-[#181b22] hover:bg-emerald-950/60 text-emerald-400 border border-[#272d38] hover:border-emerald-600 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteLead(lead.id, false)}
                            title="Excluir Registro"
                            className="p-1.5 rounded-lg bg-[#181b22] hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-[#272d38] hover:border-rose-800 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
