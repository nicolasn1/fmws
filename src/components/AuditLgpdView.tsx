import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileText,
  Key,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Shield
} from 'lucide-react';
import { AuditLog } from '../types/crm';
import { ApiService } from '../services/api';

interface AuditLgpdViewProps {
  logs: AuditLog[];
  onRefreshLogs: () => void;
}

export const AuditLgpdView: React.FC<AuditLgpdViewProps> = ({ logs, onRefreshLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  const filtered = logs.filter(l => {
    if (entityFilter !== 'all' && l.entityType !== entityFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.user.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-corporate p-5 rounded-xl border border-amber-900/40 bg-gradient-to-r from-[#14120b] to-[#121419]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[#f5e7a9] text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              CONFORMIDADE LGPD (LEI 13.709/2018) & TRILHA DE AUDITORIA
            </div>
            <h3 className="text-lg font-bold text-white">Segurança da Informação & Governança</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Registro imutável de todas as ações comerciais executadas, validação de consentimento, controle de opt-outs e
              isolamento seguro de credenciais exclusivamente no servidor.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0c0d10] border border-[#222733] text-xs space-y-1 font-mono">
            <div className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5" /> Tokens Server-Side Only
            </div>
            <div className="text-slate-400 text-[11px]">Meta API Token, n8n Key & Gemini API</div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Compliance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="card-corporate p-4 rounded-xl border border-[#202530] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Consentimento Ativo</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Abordagens iniciais qualificadas com verificação prévia de conformidade e base legítima para prospecção B2B.
          </p>
        </div>

        <div className="card-corporate p-4 rounded-xl border border-[#202530] space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <ShieldAlert className="w-4 h-4" />
            <span>Descadastro (Opt-out)</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Reconhecimento instantâneo de palavras-chave ("SAIR", "STOP") com bloqueio automático permanente de envios.
          </p>
        </div>

        <div className="card-corporate p-4 rounded-xl border border-[#202530] space-y-2">
          <div className="flex items-center gap-2 text-sky-400 font-bold">
            <FileText className="w-4 h-4" />
            <span>Direito ao Esquecimento</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Exclusão e anonimização definitiva de dados cadastrais a qualquer momento mediante requisição do titular.
          </p>
        </div>

        <div className="card-corporate p-4 rounded-xl border border-[#202530] space-y-2">
          <div className="flex items-center gap-2 text-[#d4af37] font-bold">
            <Lock className="w-4 h-4" />
            <span>Auditoria Permanente</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Trilha cronológica auditável contendo operador responsável, data/hora e detalhamento de cada transação.
          </p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card-corporate rounded-xl border border-[#202530] overflow-hidden">
        <div className="p-4 border-b border-[#202530] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrar por ação, operador, detalhes..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg pl-9 pr-3 py-1.5 focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <select
              aria-label="Filtrar por entidade do log"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-500/60"
            >
              <option value="all">Todas Entidades</option>
              <option value="lead">Empresas / Leads</option>
              <option value="proposal">Propostas</option>
              <option value="consent">Consentimento & Opt-out</option>
              <option value="system">Sistema</option>
            </select>
          </div>

          <button
            onClick={onRefreshLogs}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar Trilha
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#14171e] border-b border-[#202530] text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Data/Hora</th>
                <th className="py-2.5 px-3">Operador / Função</th>
                <th className="py-2.5 px-3">Ação Executada</th>
                <th className="py-2.5 px-3">Entidade</th>
                <th className="py-2.5 px-4">Detalhamento da Operação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1b1f28]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    Nenhum registro de auditoria encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-[#151822] transition">
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{log.user}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[11px] font-bold text-amber-400">{log.action}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1b202a] text-slate-300 border border-[#283140]">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-300 text-[11px] leading-relaxed">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
