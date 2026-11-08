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
  Terminal
} from 'lucide-react';
import { N8nConfig } from '../types/crm';
import { ApiService } from '../services/api';

interface N8nViewProps {
  config: N8nConfig;
  onRefreshConfig: () => void;
  onLeadReceived: () => void;
}

export const N8nView: React.FC<N8nViewProps> = ({ config, onRefreshConfig, onLeadReceived }) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Outbound Webhooks Form
  const [outboundStageUrl, setOutboundStageUrl] = useState(config.outboundStageWebhookUrl || '');
  const [outboundLeadUrl, setOutboundLeadUrl] = useState(config.outboundLeadWebhookUrl || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const webhookEndpoint = `${window.location.origin}/api/webhooks/n8n/leads`;

  const curlExample = `curl -X POST "${webhookEndpoint}" \\
  -H "Authorization: Bearer ${config.inboundApiKey}" \\
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
      "source": "Automação n8n / Scraping B2B",
      "priority": "alta",
      "notes": "Lead qualificado automaticamente via fluxo n8n."
    }
  }'`;

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
        source: 'Simulador n8n Webhook',
        priority: 'alta',
        notes: 'Lead injetado pelo simulador de automação n8n para validação de fluxo.'
      };

      const res = await fetch('/api/webhooks/n8n/leads', {
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
      setSimulationResult(`Falha: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSaveOutbound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      await ApiService.saveN8nConfig({
        outboundStageWebhookUrl: outboundStageUrl,
        outboundLeadWebhookUrl: outboundLeadUrl
      });
      setSaveSuccess(true);
      onRefreshConfig();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar webhooks');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-corporate p-5 rounded-xl border border-amber-900/40 bg-gradient-to-r from-[#14120b] to-[#121419]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[#f5e7a9] text-xs font-semibold mb-2">
              <Workflow className="w-3.5 h-3.5 text-[#d4af37]" />
              INTEGRAÇÃO CONTÍNUA & AUTOMAÇÕES
            </div>
            <h3 className="text-lg font-bold text-white">Central de Automações & Webhooks n8n</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Receba leads automatizados de scrapings e formulários externos, dispare eventos para seu fluxo n8n quando um
              lead mudar de estágio e notifique a equipe comercial instantaneamente.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#0c0d10] border border-[#242934] text-center">
              <span className="text-slate-400 text-[10px] block uppercase">Eventos Processados</span>
              <span className="text-amber-400 font-bold text-base">{config.totalReceivedEvents}</span>
            </div>
            <div className="p-3 rounded-lg bg-[#0c0d10] border border-[#242934] text-center">
              <span className="text-slate-400 text-[10px] block uppercase">Status da API</span>
              <span className="text-emerald-400 font-bold text-base">Ativa</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inbound Webhook Details */}
        <div className="card-corporate p-5 rounded-xl border border-[#202530] space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#202530]">
            <div>
              <h4 className="text-sm font-bold text-white">Endpoint para Receber Leads do n8n</h4>
              <p className="text-slate-400 text-[11px]">Requer autenticação via Bearer token e previne duplicatas</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">URL do Webhook Inbound</label>
              <div className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#272d38] font-mono text-amber-300 text-[11px] select-all truncate">
                {webhookEndpoint}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">Chave Secreta da API (Token)</label>
                <button
                  onClick={handleCopyKey}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                >
                  {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedKey ? 'Copiada!' : 'Copiar Chave'}
                </button>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#272d38] font-mono text-slate-300 text-[11px] select-all">
                {config.inboundApiKey}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">Exemplo de Requisição cURL</label>
                <button
                  onClick={handleCopyCurl}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px]"
                >
                  {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedCurl ? 'Copiado!' : 'Copiar cURL'}
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-[#090a0d] border border-[#222733] font-mono text-[10px] text-slate-300 overflow-x-auto">
                {curlExample}
              </pre>
            </div>

            {/* Test Simulator Button */}
            <div className="pt-2 border-t border-[#202530]">
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
                <span className="font-bold text-[#f5e7a9] flex items-center gap-1.5 text-xs">
                  <Zap className="w-3.5 h-3.5 text-[#d4af37]" /> Testador de Ingestão de Leads n8n
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Envie um lead sintético via requisição real à API para testar a captura automática e validação de
                  campos.
                </p>

                <button
                  onClick={handleSimulateInboundLead}
                  disabled={isSimulating}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-sm"
                >
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSimulating ? 'Disparando Teste...' : 'Disparar Lead de Teste via Webhook'}</span>
                </button>

                {simulationResult && (
                  <div className="p-2.5 rounded-lg bg-[#0c0d10] border border-[#262c38] text-[11px] text-slate-200 mt-2">
                    {simulationResult}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Outbound Webhooks for stage transitions */}
        <div className="card-corporate p-5 rounded-xl border border-[#202530] space-y-4 text-xs">
          <div className="pb-3 border-b border-[#202530]">
            <h4 className="text-sm font-bold text-white">Disparos de Saída (Outbound Webhooks)</h4>
            <p className="text-slate-400 text-[11px]">
              O FMWS Sales envia eventos em tempo real para seu workflow n8n quando certas ações ocorrem.
            </p>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Configurações de Webhook salvas com sucesso!</span>
            </div>
          )}

          <form onSubmit={handleSaveOutbound} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Webhook de Mudança de Estágio no Funil
              </label>
              <input
                type="url"
                placeholder="https://seu-n8n.app/webhook/fmws-stage-change"
                value={outboundStageUrl}
                onChange={e => setOutboundStageUrl(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-amber-500/60"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Disparado automaticamente ao arrastar um cartão no Kanban (ex: para notificar no Slack ou Discord da empresa).
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Webhook de Notificação de Novo Lead Qualificado
              </label>
              <input
                type="url"
                placeholder="https://seu-n8n.app/webhook/fmws-new-lead"
                value={outboundLeadUrl}
                onChange={e => setOutboundLeadUrl(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div className="p-3.5 rounded-lg bg-[#14171e] border border-[#222733] space-y-1.5 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-200">Garantias Técnicas:</span>
              <ul className="list-disc list-inside space-y-1">
                <li>Idempotência com identificador único de evento para evitar execuções duplicadas.</li>
                <li>Validação estrita de cabeçalho e chave Bearer.</li>
                <li>Tratamento de timeout e registro em log de auditoria.</li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-md"
              >
                {isSaving ? 'Salvando...' : 'Salvar Webhooks de Saída'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
