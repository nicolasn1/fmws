import React from 'react';
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageCircle,
  CheckCheck,
  Award,
  FileCheck2,
  TrendingUp,
  DollarSign,
  PieChart,
  Target,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  ChevronRight,
  Sparkles,
  Share2,
  UserCheck,
  Smartphone,
  ExternalLink,
  Bot,
  Zap,
  Info
} from 'lucide-react';
import { CommercialDashboardStats, Lead, CrmEnvironment } from '../types/crm';
import { COMMERCIAL_STAGES } from '../data/stages';

interface DashboardViewProps {
  stats: CommercialDashboardStats;
  leads: Lead[];
  onNavigateToTab: (tab: any) => void;
  onSelectLead: (lead: Lead) => void;
  environment: CrmEnvironment;
  onToggleEnvironment: (env: CrmEnvironment) => void;
  onOpenNewLead?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  leads,
  onNavigateToTab,
  onSelectLead,
  environment,
  onToggleEnvironment,
  onOpenNewLead
}) => {
  // 8 Specific Indicators requested in the definitive commercial transfer model
  const coreDefinitiveMetrics = [
    {
      id: 'authorized',
      label: '1. Contatos Autorizados',
      value: stats.authorizedContacts,
      sub: 'Consentimento LGPD verificado',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-950/70 bg-emerald-950/10'
    },
    {
      id: 'sent',
      label: '2. Mensagens Enviadas',
      value: stats.messagesSent,
      sub: 'Canal 1 (+55 11 94579-9976)',
      icon: <Send className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-950/70 bg-sky-950/10'
    },
    {
      id: 'replies',
      label: '3. Respostas Recebidas',
      value: stats.humanRepliesReceived,
      sub: 'Excluídas respostas automáticas',
      icon: <MessageCircle className="w-5 h-5 text-teal-400" />,
      color: 'border-teal-950/70 bg-teal-950/10'
    },
    {
      id: 'interested',
      label: '4. Interessados Identificados',
      value: stats.interestedIdentified,
      sub: 'Classificados com interesse pela IA',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-900/70 bg-amber-950/20'
    },
    {
      id: 'transfers',
      label: '5. Encaminhamentos Enviados',
      value: stats.transfersSent,
      sub: 'Link wa.me/5511986342981 disparado',
      icon: <Share2 className="w-5 h-5 text-blue-400" />,
      color: 'border-blue-950/70 bg-blue-950/10'
    },
    {
      id: 'confirmed',
      label: '6. Atendimento Confirmado',
      value: stats.confirmedHumanChats,
      sub: 'Confirmado no WhatsApp Humano',
      icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
      color: 'border-emerald-700/60 bg-emerald-950/25'
    },
    {
      id: 'proposals',
      label: '7. Propostas Comerciais',
      value: stats.proposalsSent,
      sub: 'Com design sem custo',
      icon: <FileCheck2 className="w-5 h-5 text-[#d4af37]" />,
      color: 'border-yellow-900/70 bg-yellow-950/10'
    },
    {
      id: 'won',
      label: '8. Vendas Concluídas',
      value: stats.clientsWon,
      sub: 'Clientes fechados FMWS',
      icon: <Award className="w-5 h-5 text-emerald-300" />,
      color: 'border-emerald-600/70 bg-emerald-950/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Environment Status Banner (Produção vs Demonstração) */}
      {environment === 'producao' ? (
        <div className="p-4 rounded-2xl border border-emerald-800/40 bg-gradient-to-r from-[#0d1612] via-[#0f1418] to-[#0c0e12] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Ambiente de Produção (Dados Reais)
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {leads.length === 0
                  ? 'A base de produção está limpa e vazia (0 empresas, R$ 0,00 de receita demonstrativa). Todos os indicadores refletem consultas reais.'
                  : `Operando em modo real com ${leads.length} empresa(s) cadastrada(s) e R$ ${stats.contractedRevenue.toLocaleString('pt-BR')} em receita real.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {leads.length === 0 && onOpenNewLead && (
              <button
                onClick={onOpenNewLead}
                className="px-3 py-1.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black text-xs font-bold rounded-lg hover:brightness-110 transition shadow"
              >
                Cadastrar 1ª Empresa
              </button>
            )}
            <button
              onClick={() => onToggleEnvironment('demo')}
              className="px-3 py-1.5 bg-[#14171e] hover:bg-[#1a1f29] border border-[#283142] text-amber-300 text-xs font-medium rounded-lg transition"
            >
              Visualizar Dados de Demonstração
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border border-amber-800/50 bg-gradient-to-r from-[#17140b] via-[#141419] to-[#0c0e12] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-600/50 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#f5e7a9]">
                  Ambiente de Demonstração (Guia FMWS)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 border border-amber-700/60 text-amber-300 font-mono">
                  DADOS FICTÍCIOS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Exibindo base demonstrativa com 14 empresas modelo, 3 clientes fechados e R$ 22.400 de receita para treinamento da equipe.
              </p>
            </div>
          </div>
          <button
            onClick={() => onToggleEnvironment('producao')}
            className="px-3.5 py-1.5 bg-emerald-900/60 hover:bg-emerald-800/70 border border-emerald-600 text-emerald-200 text-xs font-bold rounded-lg transition shrink-0"
          >
            Ir para Ambiente de Produção (Limpo)
          </button>
        </div>
      )}

      {/* 2-Channel Official Commercial Architecture Banner */}
      <div className="card-corporate p-5 rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#14120b] via-[#16171d] to-[#121419]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[#f5e7a9] text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
              ARQUITETURA DEFINITIVA DE PROSPECÇÃO & TRANSFERÊNCIA
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Modelo Comercial de Dois Canais — Fazer Meu Website
            </h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              O <strong className="text-white">Canal 1</strong> atua exclusivamente na prospecção autorizada e triagem
              via Meta Cloud API + IA. Quando o cliente demonstra interesse real, recebe o convite oficial para conversar
              com o consultor humano no <strong className="text-white">Canal 2</strong>.
            </p>
          </div>

          {/* Dual Channels Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            {/* Canal 1 */}
            <div className="p-3.5 rounded-xl bg-[#0d0f14] border border-blue-900/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  CANAL 1 • PROSPECÇÃO AUTOMATIZADA
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-800">
                  Cloud API
                </span>
              </div>
              <div className="text-sm font-bold text-white font-mono">+55 11 94579-9976</div>
              <div className="text-[11px] text-slate-400 leading-snug">
                ID: 333767429829080 • WABA: 419927517859112
              </div>
              <p className="text-[10px] text-slate-400 italic">
                Único número integrado à API. Triagem por Gemini e disparos de convites.
              </p>
            </div>

            {/* Canal 2 */}
            <div className="p-3.5 rounded-xl bg-[#0d0f14] border border-amber-900/40 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  CANAL 2 • ATENDIMENTO COMERCIAL HUMANO
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  Sem API (Web/Celular)
                </span>
              </div>
              <div className="text-sm font-bold text-white font-mono">+55 11 98634-2981</div>
              <div className="text-[11px] text-slate-400 leading-snug">
                Link: <span className="font-mono text-amber-300">wa.me/5511986342981</span>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                WhatsApp no PC/Celular do consultor. Não possui API e não deve ser migrado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Specific Indicators of the Transfer Pipeline */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 px-1">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span>Indicadores Definitivos do Ciclo de Prospecção & Transferência</span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Calculados com base estrita nos eventos reais e confirmações humanas no CRM
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-400/90 bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-900/50">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>O envio do link não conta como atendimento até haver confirmação</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {coreDefinitiveMetrics.map(card => (
            <div
              key={card.id}
              className={`card-corporate p-4 rounded-xl border ${card.color} hover:border-amber-500/50 transition relative`}
            >
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-semibold text-slate-400">{card.label}</span>
                <div className="p-1.5 rounded-lg bg-[#181c24] border border-[#242b38]">{card.icon}</div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-extrabold text-white tracking-tight">{card.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={card.sub}>
                  {card.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revenue & Annual Goal Target */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Banner: 100 Clients */}
        <div className="card-corporate p-5 rounded-xl border border-[#222733] lg:col-span-2 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[11px] font-mono text-amber-400 font-bold uppercase">META COMERCIAL ANUAL</span>
              <h4 className="text-base font-bold text-white mt-0.5">100 Clientes Conquistados em 12 Meses</h4>
              <p className="text-xs text-slate-400">
                Avanço real através do modelo de encaminhamento para o WhatsApp Comercial Humano
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-amber-300 font-mono">
                {stats.annualGoal.currentClients} <span className="text-sm font-normal text-slate-400">/ 100</span>
              </span>
              <div className="text-[11px] text-emerald-400 font-semibold">
                Receita Contratada: R$ {stats.contractedRevenue.toLocaleString('pt-BR')}
              </div>
            </div>
          </div>

          <div>
            <div className="w-full bg-[#1e232d] h-3.5 rounded-full overflow-hidden p-0.5 border border-[#2d3342]">
              <div
                className="bg-gradient-to-r from-amber-500 via-[#d4af37] to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(stats.annualGoal.progressPercentage, 4)}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-3 text-xs text-slate-400">
              <span>{stats.annualGoal.progressPercentage}% da meta alcançada</span>
              <span className="text-amber-400 font-medium">
                {100 - stats.annualGoal.currentClients} clientes restantes para o objetivo
              </span>
            </div>
          </div>
        </div>

        {/* Transfer Protocol Summary Card */}
        <div className="card-corporate p-5 rounded-xl border border-amber-900/40 bg-gradient-to-br from-amber-950/20 to-transparent space-y-3">
          <span className="text-xs font-bold text-[#f5e7a9] flex items-center gap-1.5">
            <Smartphone className="w-4 h-4 text-[#d4af37]" /> Mensagem Padrão de Encaminhamento
          </span>
          <div className="p-3 rounded-lg bg-[#0c0d10] border border-amber-900/30 text-[11px] text-slate-300 font-sans leading-relaxed whitespace-pre-line">
            {`"Obrigado pelo interesse!
Para dar continuidade ao seu atendimento, nossa equipe comercial da Fazer Meu Website está disponível em nosso canal oficial.
Clique no link abaixo para conversar diretamente com o setor comercial:
https://wa.me/5511986342981"`}
          </div>
          <p className="text-[10px] text-slate-400 italic">
            Disparada pelo Canal 1 (+55 11 94579-9976) imediatamente após o Gemini detectar interesse real.
          </p>
        </div>
      </div>

      {/* Stage Breakdown (15 stages including Transfer flow) */}
      <div className="card-corporate p-5 rounded-xl border border-[#222733]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Distribuição por Etapas do Funil</h4>
            <p className="text-xs text-slate-400">Volume de empresas em cada fase do ciclo comercial</p>
          </div>
          <button
            onClick={() => onNavigateToTab('kanban')}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
          >
            Abrir Kanban <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {COMMERCIAL_STAGES.map(stage => {
            const count = stats.stageCounts[stage.id] || 0;
            const isSpecialStage =
              stage.id === 'interessado' ||
              stage.id === 'encaminhamento_enviado' ||
              stage.id === 'atendimento_confirmado';

            return (
              <div
                key={stage.id}
                onClick={() => onNavigateToTab('kanban')}
                className={`p-3 rounded-lg border cursor-pointer transition ${
                  isSpecialStage
                    ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-500'
                    : 'bg-[#14171e] border-[#222733] hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono text-amber-400/80">#{stage.order}</span>
                  <span className="font-extrabold text-white text-sm">{count}</span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate" title={stage.label}>
                  {stage.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{stage.description}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
