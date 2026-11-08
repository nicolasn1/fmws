import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { CommercialProposal, Lead } from '../types/crm';
import { FMWS_SERVICES_CATALOG } from '../data/stages';

interface ProposalsViewProps {
  proposals: CommercialProposal[];
  leads: Lead[];
  onOpenNewProposal: () => void;
  onSelectProposal: (prop: CommercialProposal, mode?: 'editor' | 'preview') => void;
  onUpdateStatus: (propId: string, status: CommercialProposal['status']) => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  leads,
  onOpenNewProposal,
  onSelectProposal,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filtered = proposals.filter(p => {
    if (selectedStatus !== 'all' && p.status !== selectedStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.proposalCode.toLowerCase().includes(q) ||
        p.companyName.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalProposalsValue = proposals.reduce((acc, curr) => acc + (curr.price || 0), 0);
  const approvedProposalsValue = proposals
    .filter(p => p.status === 'aprovada')
    .reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-corporate p-4 rounded-xl border border-[#202530]">
          <span className="text-[11px] text-slate-400">Total em Propostas Geradas</span>
          <div className="text-xl font-extrabold text-white font-mono mt-1">
            R$ {totalProposalsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">{proposals.length} propostas no pipeline</span>
        </div>

        <div className="card-corporate p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/10">
          <span className="text-[11px] text-emerald-400 font-semibold">Receita Contratada (Aprovadas)</span>
          <div className="text-xl font-extrabold text-emerald-300 font-mono mt-1">
            R$ {approvedProposalsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">
            {proposals.filter(p => p.status === 'aprovada').length} clientes fechados
          </span>
        </div>

        <div className="card-corporate p-4 rounded-xl border border-amber-950/80 bg-amber-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-300 font-semibold">Diferencial Comercial Ativo</span>
            <Award className="w-4 h-4 text-[#d4af37]" />
          </div>
          <p className="text-[11px] text-slate-300 italic">
            "Proposta inicial de design sem custo; o cliente só paga se aprovar."
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-corporate p-4 rounded-xl border border-[#202530] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, empresa, decisor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <select
            aria-label="Filtrar por status da proposta"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
          >
            <option value="all">Todos os Status</option>
            <option value="rascunho">Rascunho</option>
            <option value="enviada">Enviada</option>
            <option value="aprovada">Aprovada</option>
            <option value="recusada">Recusada</option>
          </select>
        </div>

        <button
          onClick={onOpenNewProposal}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 transition shadow-md"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Gerar Nova Proposta</span>
        </button>
      </div>

      {/* Proposals Table */}
      <div className="card-corporate rounded-xl border border-[#202530] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#14171e] border-b border-[#202530] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Código / Versão</th>
                <th className="py-3 px-3">Empresa Cliente</th>
                <th className="py-3 px-3">Serviço Contratado</th>
                <th className="py-3 px-3">Prazo Estimado</th>
                <th className="py-3 px-3">Valor (R$)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1f28]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhuma proposta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map(prop => {
                  const serviceName =
                    FMWS_SERVICES_CATALOG.find(s => s.id === prop.serviceRequested)?.name || prop.serviceRequested;
                  return (
                    <tr
                      key={prop.id}
                      onClick={() => onSelectProposal(prop, 'editor')}
                      className="hover:bg-[#151822] cursor-pointer transition group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#f5e7a9] group-hover:underline">
                          {prop.proposalCode}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">v{prop.version}.0</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{prop.companyName}</div>
                        <div className="text-[11px] text-slate-400">{prop.contactName}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-300">
                        <div className="truncate max-w-[200px]">{serviceName}</div>
                      </td>

                      <td className="py-3 px-3 text-slate-300 font-mono">
                        {prop.estimatedTimelineDays} dias úteis
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-amber-300">
                        R$ {prop.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                        <select
                          aria-label={`Alterar status da proposta ${prop.proposalCode}`}
                          value={prop.status}
                          onChange={e => onUpdateStatus(prop.id, e.target.value as any)}
                          className={`text-[11px] font-bold px-2 py-1 rounded border focus:outline-none ${
                            prop.status === 'aprovada'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : prop.status === 'enviada'
                              ? 'bg-amber-950 text-amber-300 border-amber-800'
                              : prop.status === 'recusada'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          <option value="rascunho">Rascunho</option>
                          <option value="enviada">Enviada</option>
                          <option value="aprovada">Aprovada (Fechada)</option>
                          <option value="recusada">Recusada</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectProposal(prop, 'preview')}
                          className="px-3 py-1.5 bg-[#181b22] hover:bg-[#222732] border border-[#272d38] text-amber-300 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 shadow-sm hover:border-amber-400/40"
                          title="Visualizar documento executivo oficial para impressão ou salvar em PDF"
                        >
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                          <span>PDF / Imprimir</span>
                        </button>
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
