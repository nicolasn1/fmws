import React, { useState } from 'react';
import {
  Workflow,
  Key,
  Copy,
  Check,
  Send,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Zap,
  ShieldCheck,
  Terminal,
  Clock,
  Play,
  Server,
  CloudLightning,
  BellRing
} from 'lucide-react';
import { AutomationCentralConfig } from '../types/crm';
import { ApiService } from '../services/api';

interface AutomationsViewProps {
  config: AutomationCentralConfig;
  onRefreshConfig: () => void;
  onLeadReceived: () => void;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({ config, onRefreshConfig, onLeadReceived }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Outbound Webhooks Form
  const [outboundStageUrl, setOutboundStageUrl] = useState(config.outboundStageWebhookUrl || '');
  const [outboundLeadUrl, setOutboundLeadUrl] = useState(config.outboundLeadWebhookUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Scheduled tasks state
  const [isRunningScheduled, setIsRunningScheduled] = useState(false);
  const [scheduledResult, setScheduledResult] = useState<{ checkedLeads: number; expiredWindows: number; actionsTaken: string[] } | null>(null);

  const webhookEndpoint = `${window.location.origin}/api/webhooks/automations/leads`;

  const curlExample = `curl -X POST "${webhookEndpoint}" \\
  -H "Authorization: Bearer <SEU_BEARER_TOKEN_CONFIGURADO>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "leadData": {
      "name": "Nova Indústria Paulista Ltda",
      "cnpj": "12.345.678/0001-90",
      "segment": "Indústria e Manufatura",
      "city": "Sorocaba",
      "site": "http://novaindustria-sp.com.br",
      "whatsapp": "5515998811223",
      "contactName": "Dr. Fernando Duarte",
      "contactRole": "Diretor Industrial",
      "source": "Google Cloud Inbound / Prospecção B2B",
      "priority": "alta",
      "notes": "Lead qualificado e injetado via Central de Automações."
    }
  }'`;

  const [showKey, setShowKey] = useState(false);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(config.inboundApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleSimulateInboundLead = async () => {
    try {
      setIsSimulating(true);
      setSimulationResult(null);

      const fakeCompany = {
        name: `InovaCorp Tecnologia ${Math.floor(Math.random() * 900 + 100)}`,
        segment: 'Tecnologia & Softwares',
        city: 'Barueri - Alphaville',
        site: 'https://inovacorp-sp.com.br',
        whatsapp: `551199${Math.floor(Math.random() * 9000000 + 1000000)}`,
        contactName: 'Renato Silveira',
        contactRole: 'CTO / Sócio',
        source: 'Simulador da Central de Automações',
        priority: 'alta',
        notes: 'Lead injetado pelo simulador da Central de Automações para validação de fluxo.'
      };

      const res = await fetch('/api/webhooks/automations/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.inboundApiKey}`
        },
        body: JSON.stringify({ leadData: fakeCompany })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na recepção do webhook');

      setSimulationResult(`Sucesso! Lead "${data.lead.name}" recebido e cadastrado automaticamente no estágio inicial.`);
      onRefreshConfig();
      onLeadReceived();
    } catch (err: any) {
      setSimulationResult(`Erro: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleRunScheduledMaintenance = async () => {
    try {
      setIsRunningScheduled(true);
      setScheduledResult(null);
      const res = await ApiService.runScheduledMaintenance();
      setScheduledResult(res);
      onRefreshConfig();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsRunningScheduled(false);
    }
  };

  const handleSaveOutbounds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await ApiService.saveAutomationsConfig({
        outboundStageWebhookUrl: outboundStageUrl.trim(),
        outboundLeadWebhookUrl: outboundLeadUrl.trim()
      });
      setSaveSuccess(true);
      onRefreshConfig();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="card-corporate p-6 rounded-2xl border border-amber-900/40 bg-gradient-to-r from-[#14120b] via-[#16171d] to-[#121419]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[#f5e7a9] text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5 text-[#d4af37]" />
              ECOSSISTEMA GOOGLE CLOUD & BACKEND SEGURO
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Central de Automações FMWS</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Integrações nativas de backend, agendamentos automáticos, monitoramento da janela de atendimento de 24h
              da Meta e webhooks seguros autenticados via Bearer Token.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#0d0f14] border border-[#232936] text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Eventos Recebidos</span>
              <span className="text-lg font-black text-amber-400">{config.totalReceivedEvents}</span>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[#0d0f14] border border-[#232936] text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status Backend</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Webhook Inbound */}
        <div className="card-corporate p-6 rounded-2xl border border-[#1f242d] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-950/50 border border-amber-800/40 text-amber-400">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Webhook de Entrada (Recepção de Leads)</h3>
                <p className="text-xs text-slate-400">Endpoint seguro para receber leads de ferramentas externas ou Cloud Functions</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800">
              Ativo
            </span>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">URL do Webhook</label>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090a0d] border border-[#1f242d]">
              <code className="text-xs text-slate-300 font-mono flex-1 truncate">{webhookEndpoint}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(webhookEndpoint);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="text-xs px-2.5 py-1 bg-[#1a1f29] hover:bg-[#232936] text-amber-300 rounded border border-[#2a3242] transition"
              >
                Copiar URL
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Compatibilidade legada: o endpoint <code>/api/webhooks/n8n/leads</code> continua ativo.
            </p>
          </div>

          {/* Inbound API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Chave de Autenticação (Bearer Token)</label>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline"
              >
                {showKey ? 'Ocultar segredo' : 'Exibir segredo'}
              </button>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#090a0d] border border-[#1f242d]">
              <code className="text-xs text-amber-400 font-mono flex-1 tracking-wider">
                {showKey ? config.inboundApiKey : '••••••••••••••••••••••••••••••••'}
              </code>
              <button
                onClick={handleCopyKey}
                className="flex items-center gap-1 text-xs px-2.5 py-1 bg-[#1a1f29] hover:bg-[#232936] text-amber-300 rounded border border-[#2a3242] transition"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Inclua no cabeçalho HTTP: <code>Authorization: Bearer &lt;CHAVE&gt;</code> (armazenada de forma segura).
            </p>
          </div>

          {/* Test Simulator */}
          <div className="p-4 rounded-xl bg-[#090a0d] border border-amber-900/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#f5e7a9] flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-[#d4af37]" />
                Testar Webhook Diretamente
              </span>
              <button
                onClick={handleSimulateInboundLead}
                disabled={isSimulating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black text-xs font-bold rounded-lg transition disabled:opacity-50"
              >
                <Zap className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                <span>{isSimulating ? 'Processando...' : 'Disparar Lead Teste'}</span>
              </button>
            </div>
            {simulationResult && (
              <div
                className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                  simulationResult.startsWith('Sucesso')
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50'
                    : 'bg-red-950/40 text-red-300 border border-red-800/50'
                }`}
              >
                {simulationResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tarefas Programadas & SLA */}
        <div className="card-corporate p-6 rounded-2xl border border-[#1f242d] space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-800/40 text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tarefas Programadas & SLA Meta</h3>
                <p className="text-xs text-slate-400">Rotina automática do backend para verificação de SLAs e contatos</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-950 text-blue-400 border border-blue-800">
              15 min
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#090a0d] border border-[#1f242d] space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200">SLA de Janela de Atendimento (24h Meta)</span>
                <p className="text-[11px] text-slate-400">
                  Notifica o time caso um cliente tenha respondido e esteja próximo do vencimento da janela gratuita de 24h.
                </p>
              </div>
              <span className="px-2 py-1 rounded text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-800/50">
                24 Horas
              </span>
            </div>

            <div className="pt-2 border-t border-[#1f242d] flex items-center justify-between text-xs text-slate-400">
              <span>Última execução da rotina:</span>
              <span className="text-slate-300 font-mono">
                {config.lastScheduledExecutionAt ? new Date(config.lastScheduledExecutionAt).toLocaleTimeString('pt-BR') : 'Pendente'}
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleRunScheduledMaintenance}
                disabled={isRunningScheduled}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#14171e] hover:bg-[#1c212c] border border-[#232936] hover:border-blue-500/50 text-blue-300 text-xs font-semibold rounded-lg transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningScheduled ? 'animate-spin' : ''}`} />
                <span>{isRunningScheduled ? 'Executando verificação...' : 'Executar Verificação de SLA Agora'}</span>
              </button>
            </div>

            {scheduledResult && (
              <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs space-y-1.5">
                <div className="text-blue-300 font-semibold">
                  Resultado: {scheduledResult.checkedLeads} empresas verificadas.
                </div>
                {scheduledResult.actionsTaken.length > 0 ? (
                  <ul className="list-disc list-inside text-amber-300 text-[11px] space-y-0.5">
                    {scheduledResult.actionsTaken.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-slate-400 text-[11px]">Nenhum alerta de expiração de janela identificado.</div>
                )}
              </div>
            )}
          </div>

          {/* Outbound Webhooks Form */}
          <form onSubmit={handleSaveOutbounds} className="space-y-3 pt-2 border-t border-[#1f242d]">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <CloudLightning className="w-3.5 h-3.5 text-amber-400" />
              Webhooks de Saída (Disparo de Eventos)
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Quando lead muda de estágio:</label>
              <input
                type="url"
                value={outboundStageUrl}
                onChange={e => setOutboundStageUrl(e.target.value)}
                placeholder="https://sua-cloud-function.run.app/events/stage"
                className="w-full px-3 py-2 rounded-lg bg-[#090a0d] border border-[#232936] text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400">Quando novo lead é criado:</label>
              <input
                type="url"
                value={outboundLeadUrl}
                onChange={e => setOutboundLeadUrl(e.target.value)}
                placeholder="https://sua-cloud-function.run.app/events/new-lead"
                className="w-full px-3 py-2 rounded-lg bg-[#090a0d] border border-[#232936] text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">Deixe em branco para desativar</span>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-1.5 bg-[#1a1f29] hover:bg-[#232936] border border-[#2a3242] text-amber-300 text-xs font-bold rounded-lg transition"
              >
                {isSaving ? 'Salvando...' : saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Webhooks'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* cURL Specification Box */}
      <div className="card-corporate p-6 rounded-2xl border border-[#1f242d] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Exemplo de Requisição cURL para Integração B2B
            </span>
          </div>
          <button
            onClick={handleCopyCurl}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 px-3 py-1 bg-[#14171e] hover:bg-[#1a1f29] border border-[#232936] rounded-lg transition"
          >
            {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCurl ? 'cURL Copiado!' : 'Copiar comando cURL'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-[#08090b] border border-[#1a1f29] text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
          {curlExample}
        </pre>
      </div>
    </div>
  );
};
