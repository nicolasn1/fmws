import { Plus, UploadCloud, RefreshCw, Sparkles, Shield, Bell, Database, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ActiveTab } from './Sidebar';
import { CrmEnvironment } from '../types/crm';

interface HeaderProps {
  activeTab: ActiveTab;
  onOpenNewLead: () => void;
  onOpenImportCsv: () => void;
  onRefreshData: () => void;
  isLoading: boolean;
  onQuickAiAnalyze: () => void;
  environment: CrmEnvironment;
  onToggleEnvironment: (env: CrmEnvironment) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewLead,
  onOpenImportCsv,
  onRefreshData,
  isLoading,
  onQuickAiAnalyze,
  environment,
  onToggleEnvironment
}) => {
  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Dashboard Comercial Executivo',
      subtitle: 'Indicadores em tempo real calculados sobre a base ativa e meta de 100 clientes.'
    },
    central_whatsapp: {
      title: 'Central WhatsApp Profissional',
      subtitle: 'Atendimento Omnichannel, Chat em Tempo Real e Copiloto Comercial com IA.'
    },
    prospecting: {
      title: 'Prospecção Local Inteligente',
      subtitle: 'Mapeamento B2B de empresas reais em Taboão, Paulicéia, Rudge Ramos, Diadema e São Bernardo do Campo.'
    },
    kanban: {
      title: 'Funil Comercial B2B',
      subtitle: '12 etapas oficiais de qualificação, abordagem consultiva e fechamento.'
    },
    leads: {
      title: 'Base Corporativa de Empresas',
      subtitle: 'Gestão de contas, contatos decisores, histórico e conformidade LGPD.'
    },
    ai_analysis: {
      title: 'Auditoria de Oportunidades com IA',
      subtitle: 'Diagnóstico técnico da presença digital e formulação de soluções FMWS.'
    },
    ai_assistant: {
      title: 'Assistente Comercial Especializado',
      subtitle: 'Geração de abordagens B2B, contorno de objeções e propostas com o diferencial FMWS.'
    },
    whatsapp: {
      title: 'Meta WhatsApp Cloud API Oficial',
      subtitle: 'Envio autorizado via Graph API, aprovação humana e janela de 24 horas.'
    },
    automations: {
      title: 'Central de Automações FMWS',
      subtitle: 'Webhooks de entrada/saída, agendamentos automáticos e conformidade de SLA Meta 24h.'
    },
    n8n: {
      title: 'Central de Automações FMWS',
      subtitle: 'Webhooks de entrada/saída, agendamentos automáticos e conformidade de SLA Meta 24h.'
    },
    proposals: {
      title: 'Gerador de Propostas Comerciais',
      subtitle: 'Escopo sob medida, precificação real, diferencial de design inicial sem custo e PDF.'
    },
    audit: {
      title: 'Auditoria de Ações & Conformidade LGPD',
      subtitle: 'Registro imutável de operações, opt-outs e controle de consentimento.'
    }
  };

  const current = titles[activeTab] || {
    title: 'Central Comercial FMWS',
    subtitle: 'Fazer Meu Website — Plataforma de Prospecção'
  };

  return (
    <header className="bg-[#0c0e12] border-b border-[#1f242d] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="text-lg font-bold text-white tracking-tight">{current.title}</h2>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Environment Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#13151b] border border-[#232936]">
          <button
            onClick={() => onToggleEnvironment('producao')}
            title="Ambiente de Produção com dados comerciais reais"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              environment === 'producao'
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${environment === 'producao' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Produção (Real)</span>
          </button>

          <button
            onClick={() => onToggleEnvironment('demo')}
            title="Ambiente de Demonstração com dados fictícios para treinamento"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              environment === 'demo'
                ? 'bg-amber-950/80 text-[#f5e7a9] border border-amber-600/60 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${environment === 'demo' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>Demonstração</span>
          </button>
        </div>

        <button
          onClick={onRefreshData}
          disabled={isLoading}
          title="Recarregar dados reais"
          className="p-2 text-slate-400 hover:text-amber-400 bg-[#14171e] hover:bg-[#1a1f29] border border-[#232936] rounded-lg transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
        </button>

        <button
          onClick={onOpenImportCsv}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#14171e] hover:bg-[#1c212c] border border-[#232936] hover:border-amber-500/40 text-slate-200 hover:text-amber-300 text-xs font-medium rounded-lg transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
          <span>Importar CSV</span>
        </button>

        <button
          onClick={onQuickAiAnalyze}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1c17] hover:bg-[#25281e] border border-amber-900/50 hover:border-amber-600/70 text-amber-300 text-xs font-medium rounded-lg transition shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Auditar com IA</span>
        </button>

        <button
          onClick={onOpenNewLead}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-[#d4af37] via-[#c49f33] to-[#aa8214] hover:brightness-110 text-black font-semibold text-xs rounded-lg transition shadow-md shadow-amber-950/40"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova Empresa</span>
        </button>
      </div>
    </header>
  );
};
