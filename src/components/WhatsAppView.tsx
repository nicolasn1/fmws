import React, { useState, useEffect } from 'react';
import {
  MessageSquareShare,
  Send,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Key,
  Smartphone,
  FileCode,
  RefreshCw,
  ExternalLink,
  UserCheck,
  Check,
  Bot,
  Share2,
  Sparkles,
  ArrowRight,
  Radio,
  Copy,
  Wifi,
  Terminal
} from 'lucide-react';
import { Lead, WhatsAppConfig, WhatsAppMessageLog } from '../types/crm';
import { ApiService } from '../services/api';

interface WhatsAppViewProps {
  config: WhatsAppConfig;
  logs: WhatsAppMessageLog[];
  leads: Lead[];
  onRefreshConfig: () => void;
  onRefreshLogs: () => void;
  initialLead?: Lead | null;
  initialMessage?: string;
}

export const WhatsAppView: React.FC<WhatsAppViewProps> = ({
  config,
  logs,
  leads,
  onRefreshConfig,
  onRefreshLogs,
  initialLead,
  initialMessage
}) => {
  const [activeTab, setActiveTab] = useState<'dois_canais' | 'envio' | 'historico' | 'templates' | 'configuracao'>('dois_canais');

  // Simulator state
  const [simLeadId, setSimLeadId] = useState<string>(initialLead?.id || leads[0]?.id || '');
  const [simText, setSimText] = useState<string>(
    'Olá! Vimos o contato de vocês e temos muito interesse em reformular o site da nossa empresa. Como podemos agendar?'
  );
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Send state
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLead?.id || leads[0]?.id || '');
  const [sendType, setSendType] = useState<'template' | 'custom_text'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('fmws_apresentacao_institucional');
  const [customText, setCustomText] = useState<string>(initialMessage || '');
  const [humanApproved, setHumanApproved] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendFeedback, setSendFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  // Config form state
  const isConfigured = Boolean(config.isConfigured || (config.channel1 && config.channel1.status === 'conectado'));
  const hasToken = Boolean(config.hasApiToken || config.channel1?.hasApiToken);
  const statusMsg = config.statusMessage || (isConfigured ? 'Canal 1 conectado à Meta Cloud API.' : 'Aguardando configuração de credenciais no Canal 1.');

  const [phoneNumberId, setPhoneNumberId] = useState(config.channel1?.phoneNumberId || config.phoneNumberId || '');
  const [wabaId, setWabaId] = useState(config.channel1?.wabaId || config.wabaId || '');
  const [apiToken, setApiToken] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Webhook & Tunnel live state
  const [webhookInfo, setWebhookInfo] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRestartingTunnel, setIsRestartingTunnel] = useState<boolean>(false);
  const [isTestingHandshake, setIsTestingHandshake] = useState<boolean>(false);
  const [handshakeTestResult, setHandshakeTestResult] = useState<any>(null);

  const fetchWebhookInfo = async () => {
    try {
      const data = await ApiService.getWhatsAppWebhookInfo();
      setWebhookInfo(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchWebhookInfo();
    const interval = setInterval(fetchWebhookInfo, 4000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleRestartTunnel = async () => {
    setIsRestartingTunnel(true);
    setHandshakeTestResult(null);
    try {
      await ApiService.restartTunnel();
      await fetchWebhookInfo();
    } catch (err: any) {
      alert('Erro ao reiniciar túnel: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsRestartingTunnel(false);
    }
  };

  const handleTestHandshake = async () => {
    setIsTestingHandshake(true);
    setHandshakeTestResult(null);
    try {
      const result = await ApiService.testWebhookHandshake();
      setHandshakeTestResult(result);
      await fetchWebhookInfo();
    } catch (err: any) {
      setHandshakeTestResult({
        success: false,
        error: err.message || 'Falha ao executar teste de handshake'
      });
    } finally {
      setIsTestingHandshake(false);
    }
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const approvedTemplates = [
    {
      name: 'fmws_apresentacao_institucional',
      category: 'MARKETING / UTILITY',
      description: 'Apresentação corporativa da Fazer Meu Website e proposta de diagnóstico digital.',
      sampleText:
        'Olá {{1}}, identificamos oportunidades de melhoria na experiência web da {{2}}. A Fazer Meu Website desenvolve uma proposta inicial de design sem custo, e a empresa só paga se aprovar. Gostaria de receber uma prévia?'
    },
    {
      name: 'fmws_proposta_design_sem_custo',
      category: 'MARKETING / UTILITY',
      description: 'Oferta do diferencial de protótipo gratuito sem risco financeiro.',
      sampleText:
        'Prezado(a) {{1}}, nossa equipe de tecnologia finalizou o estudo prévio da presença digital da {{2}}. Podemos enviar o layout inicial de demonstração sem qualquer compromisso de contratação?'
    },
    {
      name: 'fmws_reuniao_alinhamento',
      category: 'UTILITY',
      description: 'Confirmação e agendamento de alinhamento com a diretoria.',
      sampleText:
        'Olá {{1}}, confirmamos o interesse da {{2}} em avaliar o projeto. Qual o melhor horário nesta semana para um breve alinhamento de 15 minutos com o nosso especialista?'
    }
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) return;

    if (!humanApproved) {
      alert('Aprovação humana mandatória: marque a confirmação antes de disparar a mensagem.');
      return;
    }

    try {
      setIsSending(true);
      setSendFeedback(null);

      const res = await ApiService.sendWhatsApp({
        leadId: selectedLead.id,
        templateName: sendType === 'template' ? selectedTemplate : undefined,
        messageText: sendType === 'custom_text' ? customText : undefined,
        userApproved: humanApproved
      });

      setSendFeedback({
        success: true,
        message: 'Mensagem enviada com sucesso através da Meta Graph API.'
      });
      onRefreshLogs();
    } catch (err: any) {
      setSendFeedback({
        success: false,
        message: err.message || 'Falha no envio da mensagem'
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingConfig(true);
      setConfigSuccess(false);
      await ApiService.saveWhatsAppConfig({
        phoneNumberId,
        wabaId,
        apiToken: apiToken.trim() || undefined
      });
      setConfigSuccess(true);
      onRefreshConfig();
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar credenciais Meta');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSimulate = async () => {
    if (!simLeadId || !simText.trim()) return;
    try {
      setIsSimulating(true);
      setSimResult(null);
      const selected = leads.find(l => l.id === simLeadId);
      const fromVal = selected ? selected.whatsapp : simLeadId;
      const res = await ApiService.simulateIncomingMessage(fromVal, simText.trim());
      setSimResult(res);
      onRefreshLogs();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar simulação de webhook');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration Status Banner */}
      <div
        className={`card-corporate p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isConfigured
            ? 'border-emerald-900/50 bg-gradient-to-r from-emerald-950/20 to-[#121419]'
            : 'border-amber-900/50 bg-gradient-to-r from-amber-950/20 to-[#121419]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              isConfigured
                ? 'bg-emerald-950 border border-emerald-800 text-emerald-400'
                : 'bg-amber-950 border border-amber-800 text-amber-400'
            }`}
          >
            <MessageSquareShare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Integração Oficial Meta WhatsApp Cloud API</h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isConfigured
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}
              >
                {isConfigured ? 'Conectado / Produção' : 'Aguardando Configuração'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {statusMsg}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('dois_canais')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-lg transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Arquitetura dos 2 Canais</span>
          </button>
          <button
            onClick={() => setActiveTab('configuracao')}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#181b22] hover:bg-[#222732] border border-[#272d38] text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configurar Meta API</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#202530] text-xs font-semibold space-x-1 overflow-x-auto">
        {[
          { id: 'dois_canais', label: 'Arquitetura 2 Canais & IA' },
          { id: 'envio', label: 'Disparo Autorizado (Humano)' },
          { id: 'templates', label: 'Modelos Aprovados Meta' },
          { id: 'historico', label: 'Histórico & Webhooks Recebidos' },
          { id: 'configuracao', label: 'Credenciais & Graph API' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2.5 px-4 rounded-t-lg transition border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-amber-400 text-amber-300 bg-[#161922]'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#12141a]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 0: 2 Channels Architecture & Webhook IA Simulator */}
      {activeTab === 'dois_canais' && (
        <div className="space-y-6">
          {/* Dual Channel Architecture Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Canal 1 */}
            <div className="card-corporate p-5 rounded-xl border border-amber-500/30 bg-gradient-to-b from-[#141822] to-[#0f1219] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                    C1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Canal 1 — Prospecção Automatizada</h4>
                    <span className="text-[11px] text-amber-400 font-mono">+55 11 94579-9976</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold uppercase">
                  Meta Cloud API
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#1e2433] space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Phone Number ID:</span>
                  <span className="font-mono text-white select-all">333767429829080</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>WABA Account ID:</span>
                  <span className="font-mono text-white select-all">419927517859112</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Função Primária:</span>
                  <span className="text-slate-200 font-medium">Abordagem inicial & Webhook receptor</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Único canal conectado à Meta WhatsApp Cloud API
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Dispara templates aprovados com consentimento LGPD
                </div>
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Recebe respostas e envia convite de encaminhamento
                </div>
              </div>
            </div>

            {/* Canal 2 */}
            <div className="card-corporate p-5 rounded-xl border border-sky-500/30 bg-gradient-to-b from-[#141822] to-[#0f1219] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold text-xs">
                    C2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Canal 2 — Atendimento Comercial Humano</h4>
                    <span className="text-[11px] text-sky-400 font-mono">+55 11 98634-2981</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold uppercase">
                  Celular / Web (Sem API)
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#0c0e14] border border-[#1e2433] space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Link de Contato Direto:</span>
                  <a
                    href="https://wa.me/5511986342981"
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sky-400 hover:underline flex items-center gap-1"
                  >
                    https://wa.me/5511986342981 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Modo de Operação:</span>
                  <span className="text-slate-200 font-medium">Manual por operador humano</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Entrada de Clientes:</span>
                  <span className="text-slate-200 font-medium">Voluntária após encaminhamento</span>
                </div>
              </div>

              {/* Critical Rule Banner */}
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-900/60 text-xs space-y-1">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> DIRETRIZ ESTRUTURAL MANDATÓRIA:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  O segundo WhatsApp <strong>NÃO UTILIZA API E NÃO DEVE SER MIGRADO</strong>. Não possui Token, Phone Number ID
                  ou Webhook. Sua função é receber voluntariamente os clientes interessados encaminhados pelo Canal 1.
                </p>
              </div>
            </div>
          </div>

          {/* Official Transfer Message Verbatim Display */}
          <div className="card-corporate p-5 rounded-xl border border-[#262c3a] bg-[#12151d] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Mensagem Oficial de Encaminhamento Comercial</h4>
              </div>
              <span className="text-[11px] text-slate-400">Enviada pelo Canal 1 (+55 11 94579-9976)</span>
            </div>

            <div className="p-4 rounded-xl bg-[#090b10] border border-[#1e2330] text-xs text-slate-200 font-sans whitespace-pre-line leading-relaxed border-l-4 border-l-[#d4af37]">
              {`Obrigado pelo interesse!

Para dar continuidade ao seu atendimento, nossa equipe comercial da Fazer Meu Website está disponível em nosso canal oficial.

Clique no link abaixo para conversar diretamente com o setor comercial:

https://wa.me/5511986342981

Nossa equipe poderá apresentar as soluções mais adequadas à sua empresa.`}
            </div>
          </div>

          {/* Inbound Simulator with Gemini AI Intent Classification */}
          <div className="card-corporate p-5 rounded-xl border border-[#273042] bg-[#131722] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Simulador de Respostas Recebidas (Webhook & Classificador Gemini)
                  </h4>
                  <p className="text-xs text-slate-400">
                    Teste em tempo real como o Gemini avalia a intenção, ignora auto-respostas e engatilha o encaminhamento ao Canal 2.
                  </p>
                </div>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-[#1e2433] text-amber-300 font-mono">
                gemini-3.8-flash
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Empresa / Lead para Teste:</label>
                <select
                  aria-label="Selecionar lead para simular resposta"
                  value={simLeadId}
                  onChange={e => setSimLeadId(e.target.value)}
                  className="w-full bg-[#181b22] border border-[#272d38] text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.contactName}) — Estágio atual: {l.stageId}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-300">Mensagem Recebida do Cliente:</label>
                <textarea
                  rows={2}
                  value={simText}
                  onChange={e => setSimText(e.target.value)}
                  placeholder="Digite a mensagem simulada do lead..."
                  className="w-full bg-[#181b22] border border-[#272d38] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Cenários Prontos para Teste:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSimText(
                      'Olá! Temos interesse em reformular o site da nossa empresa. Poderiam nos apresentar a proposta?'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded bg-[#1a2130] hover:bg-[#222b40] border border-[#2f3b52] text-emerald-300 transition"
                >
                  🟢 1. Interesse Real (Gatilha Encaminhamento)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimText(
                      'Resposta automática: Obrigado por entrar em contato. Nosso horário de atendimento é de 8h às 18h.'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded bg-[#1a2130] hover:bg-[#222b40] border border-[#2f3b52] text-amber-300 transition"
                >
                  🟡 2. Resposta Automática (Ignora Gatilho)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimText(
                      'Não temos nenhum interesse em serviços de website. Favor remover nosso número da lista de contatos.'
                    )
                  }
                  className="text-[11px] px-2.5 py-1 rounded bg-[#1a2130] hover:bg-[#222b40] border border-[#2f3b52] text-rose-300 transition"
                >
                  🔴 3. Recusa / Opt-out LGPD (Descadastro)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSimText('Qual a faixa média de preço para criação de uma landing page corporativa?')
                  }
                  className="text-[11px] px-2.5 py-1 rounded bg-[#1a2130] hover:bg-[#222b40] border border-[#2f3b52] text-sky-300 transition"
                >
                  🔵 4. Dúvida Geral
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                disabled={isSimulating || !simLeadId}
                onClick={handleSimulate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-md"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Processando com Gemini...
                  </>
                ) : (
                  <>
                    <Bot className="w-3.5 h-3.5" />
                    Simular Resposta via Webhook & Classificar
                  </>
                )}
              </button>
            </div>

            {/* Simulation Result Breakdown */}
            {simResult && (
              <div className="p-4 rounded-xl bg-[#0d1017] border border-[#273042] space-y-3 text-xs mt-3">
                <div className="flex items-center justify-between border-b border-[#1f2533] pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resultado da Análise de Intenção
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase ${
                      simResult.classification?.categoria === 'interesse_real'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : simResult.classification?.categoria === 'resposta_automatica'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : simResult.classification?.categoria === 'recusa_optout'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-blue-950 text-blue-300 border border-blue-800'
                    }`}
                  >
                    {simResult.classification?.categoria}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#141822] border border-[#1e2433] space-y-1">
                    <span className="text-slate-400 font-medium">Justificativa da IA:</span>
                    <p className="text-slate-200 italic">{simResult.classification?.explicacao}</p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Grau de Confiança: {Math.round((simResult.classification?.confianca || 0.9) * 100)}%
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141822] border border-[#1e2433] space-y-1">
                    <span className="text-slate-400 font-medium">Ação do Sistema:</span>
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      {simResult.transferTriggered ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Encaminhamento Automático Disparado via Canal 1</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400" />
                          <span>Encaminhamento Não Disparado (sem interesse real)</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 pt-1">
                      Novo estágio do lead: <strong className="text-amber-400">{simResult.lead?.stageId}</strong>
                    </div>
                  </div>
                </div>

                {simResult.transferTriggered && (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/60 text-emerald-200 text-[11px]">
                    ✓ Mensagem oficial com link <strong>wa.me/5511986342981</strong> enviada pelo Canal 1 dentro da janela de atendimento Meta.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: Outbound Message Sender */}
      {activeTab === 'envio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sender Form */}
          <div className="lg:col-span-2 card-corporate p-5 rounded-xl border border-[#202530] space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              Disparar Mensagem para Destinatário Elegível
            </h4>

            {sendFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                  sendFeedback.success
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/50 border-amber-800 text-amber-300'
                }`}
              >
                {sendFeedback.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{sendFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa Destinatária</label>
                  <select
                    aria-label="Selecionar empresa destinatária"
                    value={selectedLeadId}
                    onChange={e => setSelectedLeadId(e.target.value)}
                    className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
                  >
                    {leads.map(lead => (
                      <option key={lead.id} value={lead.id}>
                        {lead.name} • {lead.whatsapp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Mensagem</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSendType('template')}
                      className={`p-2 rounded-lg border text-center font-medium transition ${
                        sendType === 'template'
                          ? 'bg-amber-950/40 border-amber-600 text-[#f5e7a9]'
                          : 'bg-[#181b22] border-[#282f3c] text-slate-400'
                      }`}
                    >
                      Template Aprovado
                    </button>
                    <button
                      type="button"
                      onClick={() => setSendType('custom_text')}
                      className={`p-2 rounded-lg border text-center font-medium transition ${
                        sendType === 'custom_text'
                          ? 'bg-amber-950/40 border-amber-600 text-[#f5e7a9]'
                          : 'bg-[#181b22] border-[#282f3c] text-slate-400'
                      }`}
                    >
                      Texto Livre (Janela 24h)
                    </button>
                  </div>
                </div>
              </div>

              {sendType === 'template' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Modelo Pré-Aprovado na Meta</label>
                  <select
                    aria-label="Selecionar modelo pré-aprovado"
                    value={selectedTemplate}
                    onChange={e => setSelectedTemplate(e.target.value)}
                    className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
                  >
                    {approvedTemplates.map(tpl => (
                      <option key={tpl.name} value={tpl.name}>
                        {tpl.name} ({tpl.category})
                      </option>
                    ))}
                  </select>

                  <div className="p-3 rounded-lg bg-[#14171e] border border-[#222733] mt-2 text-slate-300 italic text-[11px] leading-relaxed">
                    Prévia do modelo:{' '}
                    {approvedTemplates
                      .find(t => t.name === selectedTemplate)
                      ?.sampleText.replace('{{1}}', selectedLead?.contactName || 'Contato')
                      .replace('{{2}}', selectedLead?.name || 'sua empresa')}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mensagem Personalizada (Disponível após resposta humana)
                  </label>
                  <textarea
                    rows={4}
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    placeholder="Digite a mensagem personalizada..."
                    className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>
              )}

              {/* Mandatory Human Review Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/50 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={humanApproved}
                    onChange={e => setHumanApproved(e.target.checked)}
                    className="mt-0.5 rounded border-amber-600 text-amber-500 focus:ring-0"
                  />
                  <div className="text-xs text-slate-200">
                    <strong className="text-[#f5e7a9] block">Aprovação Humana Mandatória (Regra de Compliance)</strong>
                    Confirmo que verifiquei os dados da empresa, a conformidade de abordagem comercial e autorizo o
                    disparo individual desta mensagem.
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Destinatário: <strong className="text-white">{selectedLead?.whatsapp}</strong>
                </span>

                <button
                  type="submit"
                  disabled={isSending || !humanApproved}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs rounded-lg transition disabled:opacity-50 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Enviando...' : 'Autorizar e Enviar via Meta'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Guidelines & 24h Window info */}
          <div className="space-y-4">
            <div className="card-corporate p-5 rounded-xl border border-[#202530] space-y-3 text-xs">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Janela de Atendimento de 24 Horas
              </h4>
              <p className="text-slate-400 leading-relaxed">
                Conforme as regras oficiais da Meta WhatsApp Cloud API:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px]">
                <li>O primeiro contato deve sempre utilizar um modelo (template) pré-aprovado pela Meta.</li>
                <li>Mensagens de texto livre só podem ser enviadas se o cliente responder dentro de 24 horas.</li>
                <li>Disparos em massa não autorizados são estritamente bloqueados.</li>
              </ul>
            </div>

            <div className="card-corporate p-5 rounded-xl border border-rose-900/30 bg-rose-950/10 space-y-2 text-xs">
              <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" /> Política de Opt-Out & LGPD
              </h4>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Se o contato responder "SAIR", "CANCELAR" ou "PARAR", o sistema bloqueia instantaneamente qualquer novo
                envio para o número e registra o opt-out na auditoria.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Approved Templates Showcase */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {approvedTemplates.map(tpl => (
            <div key={tpl.name} className="card-corporate p-5 rounded-xl border border-[#202530] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  APROVADO PELA META
                </span>
                <span className="text-[11px] text-slate-400 font-mono">pt_BR</span>
              </div>
              <h4 className="text-sm font-bold text-white font-mono">{tpl.name}</h4>
              <p className="text-xs text-slate-400">{tpl.description}</p>
              <div className="p-3 rounded-lg bg-[#0c0d10] border border-[#222733] text-xs text-slate-300 font-sans leading-relaxed">
                "{tpl.sampleText}"
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Outbox/Inbox Logs */}
      {activeTab === 'historico' && (
        <div className="card-corporate rounded-xl border border-[#202530] overflow-hidden">
          <div className="p-4 border-b border-[#202530] flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Histórico de Mensagens e Respostas Humanas
            </h4>
            <button
              onClick={onRefreshLogs}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Atualizar Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#14171e] border-b border-[#202530] text-slate-400 font-semibold text-[11px]">
                  <th className="py-2.5 px-4">Data/Hora</th>
                  <th className="py-2.5 px-3">Sentido</th>
                  <th className="py-2.5 px-3">Empresa / Número</th>
                  <th className="py-2.5 px-3">Conteúdo / Template</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c202a]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Nenhuma mensagem registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-[#151822]">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">
                        {new Date(log.sentAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-2.5 px-3">
                        {log.direction === 'inbound' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800 font-bold">
                            RECEBIDA (CLIENTE)
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-bold">
                            ENVIADA (OUTBOUND)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{log.leadName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{log.to}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-300" title={log.content}>
                        {log.templateName && (
                          <span className="text-[10px] font-mono text-amber-400 block">[{log.templateName}]</span>
                        )}
                        {log.content}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            log.status === 'entregue' || log.status === 'lido' || log.status === 'recebido'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : log.status === 'falha'
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {log.status}
                        </span>
                        {log.failureReason && (
                          <div className="text-[10px] text-rose-400 mt-0.5 line-clamp-1" title={log.failureReason}>
                            {log.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 text-[11px]">{log.approvedBy || 'Sistema'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Configuration & Graph API Settings */}
      {activeTab === 'configuracao' && (
        <div className="card-corporate p-6 rounded-xl border border-[#202530] max-w-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#202530]">
            <div>
              <h4 className="text-base font-bold text-white">Configuração da Meta WhatsApp Cloud API</h4>
              <p className="text-xs text-slate-400">
                Os segredos são mantidos estritamente no backend e nunca expostos ao navegador.
              </p>
            </div>
            <Key className="w-5 h-5 text-amber-400" />
          </div>

          {configSuccess && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Configurações salvas e validadas com sucesso no servidor!</span>
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number ID da Meta</label>
              <input
                type="text"
                placeholder="Ex: 104928374920192"
                value={phoneNumberId}
                onChange={e => setPhoneNumberId(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500/60"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Disponível no Meta App Dashboard &gt; WhatsApp &gt; Configuração da API.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                WhatsApp Business Account ID (WABA ID - Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: 394820193847291"
                value={wabaId}
                onChange={e => setWabaId(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Permanent Access Token (System User Meta Token)
              </label>
              <input
                type="password"
                placeholder={hasToken ? '•••••••••••••••••••• (Token já configurado no backend)' : 'EAABw...'}
                value={apiToken}
                onChange={e => setApiToken(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500/60"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Gere um token permanente em Usuários do Sistema no Meta Business Manager com permissões `whatsapp_business_messaging`.
              </p>
            </div>

            {/* Webhook & Tunnel Card */}
            <div className="p-4 rounded-xl bg-[#12151c] border border-amber-500/30 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="font-bold text-white text-xs">
                    URL Pública do Webhook (Pronta para o Painel da Meta)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      webhookInfo?.isTunnelActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {webhookInfo?.isTunnelActive ? 'TÚNEL HTTPS ATIVO' : 'CONECTANDO TÚNEL...'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRestartTunnel}
                    disabled={isRestartingTunnel}
                    className="text-[10px] px-2 py-0.5 bg-[#1a202c] hover:bg-[#252d3d] text-slate-300 rounded border border-[#2d3748] flex items-center gap-1 transition"
                    title="Reiniciar conexão do túnel público"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRestartingTunnel ? 'animate-spin text-amber-400' : ''}`} />
                    {isRestartingTunnel ? 'Reiniciando...' : 'Reiniciar Túnel'}
                  </button>
                </div>
              </div>

              {/* Critical Alert Explaining Meta Error #N/A:WBxP-530691600 */}
              <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/60 text-[11px] text-amber-200/90 space-y-2 shadow-md">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  COMO RESOLVER O ERRO DA META (#N/A:WBxP-530691600):
                </div>
                <p className="leading-relaxed">
                  A Meta rejeita a URL <code className="bg-black/60 px-1.5 py-0.5 rounded text-rose-300 border border-rose-900/50">ais-dev-*.run.app</code> porque o ambiente de desenvolvimento do Google AI Studio exige autenticação interna do Google (redirecionando a Meta para tela de login HTTP 302).
                </p>
                <p className="leading-relaxed text-slate-200">
                  👉 <strong>Passo a Passo Obrigatório:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                  <li>Copie a <strong>Callback URL do Túnel HTTPS</strong> abaixo (ou a URL de Produção).</li>
                  <li>Copie o <strong>Verify Token</strong> (<code className="text-amber-300 font-mono">fmws_webhook_token_secure_2026</code>).</li>
                  <li>Cole nos campos correspondentes no painel da Meta Developers e clique em <strong>"Verify and save"</strong>.</li>
                </ol>
              </div>

              {/* Option A: Public Tunnel URL (for dev/preview) */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1117] border border-[#222a3a]">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold">1</span>
                    Callback URL (Ambiente de Testes / Túnel HTTPS):
                  </span>
                  {copiedField === 'url' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> URL Copiada com Sucesso!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#07090d] border border-amber-500/40 rounded-lg px-3 py-2 font-mono text-[11px] text-amber-400 break-all select-all font-semibold">
                    {webhookInfo?.publicWebhookUrl || 'Inicializando túnel público seguro...'}
                  </div>
                  <button
                    type="button"
                    disabled={!webhookInfo?.publicWebhookUrl}
                    onClick={() =>
                      handleCopy(
                        webhookInfo?.publicWebhookUrl || '',
                        'url'
                      )
                    }
                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-40 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0 shadow-sm"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar URL
                  </button>
                </div>
              </div>

              {/* Verify Token Box */}
              <div className="space-y-1.5 p-3 rounded-lg bg-[#0e1117] border border-[#222a3a]">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold">2</span>
                    Verify Token (Token de Verificação):
                  </span>
                  {copiedField === 'token' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Token Copiado!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#07090d] border border-[#222938] rounded-lg px-3 py-2 font-mono text-[11px] text-slate-200 select-all font-semibold">
                    {webhookInfo?.verifyToken || config.webhookVerifyToken || 'fmws_webhook_token_secure_2026'}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        webhookInfo?.verifyToken || config.webhookVerifyToken || 'fmws_webhook_token_secure_2026',
                        'token'
                      )
                    }
                    className="px-3 py-2 bg-[#202736] hover:bg-[#2b3548] text-slate-200 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition shrink-0 border border-[#343e52]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Token
                  </button>
                </div>
              </div>

              {/* Handshake Diagnostic Self-Test Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1 pb-1">
                <button
                  type="button"
                  disabled={isTestingHandshake || !webhookInfo?.publicWebhookUrl}
                  onClick={handleTestHandshake}
                  className="px-4 py-2 bg-[#1b2230] hover:bg-[#232c3f] border border-[#34425e] text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingHandshake ? 'animate-spin' : ''}`} />
                  {isTestingHandshake ? 'Testando Handshake...' : '⚡ Testar Validação do Webhook Antes de Salvar'}
                </button>
                <span className="text-[10px] text-slate-400 text-right">
                  Verifica se a Meta receberá HTTP 200 text/plain com sucesso
                </span>
              </div>

              {/* Self-Test Feedback Display */}
              {handshakeTestResult && (
                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                    handshakeTestResult.success
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-800 text-rose-200'
                  }`}
                >
                  {handshakeTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-bold text-white">
                      {handshakeTestResult.success
                        ? '✅ Teste Concluído: Webhook 100% Pronto para Validação na Meta!'
                        : '❌ Falha no Teste de Handshake'}
                    </div>
                    <p className="text-[11px]">
                      {handshakeTestResult.message || handshakeTestResult.error}
                    </p>
                    {handshakeTestResult.latencyMs && (
                      <div className="text-[10px] opacity-75 font-mono">
                        Tempo de resposta: {handshakeTestResult.latencyMs}ms • Desafio retornado: {handshakeTestResult.challengeReturned}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option B: Production Domain */}
              <div className="p-3 rounded-lg bg-[#0e1117] border border-[#222a3a] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-semibold text-slate-300">
                    URL Definitiva do Domínio de Produção (Deploy FMWS):
                  </span>
                  {copiedField === 'prod_url' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copiado!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[#07090d] border border-[#1e2433] rounded-lg px-3 py-1.5 font-mono text-[11px] text-slate-300 select-all truncate">
                    https://crm.fazermeuwebsite.com.br/api/webhooks/whatsapp
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'https://crm.fazermeuwebsite.com.br/api/webhooks/whatsapp',
                        'prod_url'
                      )
                    }
                    className="px-2.5 py-1.5 bg-[#1a2130] hover:bg-[#242e42] text-slate-200 text-xs rounded border border-[#2e3b54] flex items-center gap-1 transition"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </button>
                </div>
              </div>

              {/* Live Meta Handshake Telemetry */}
              <div className="p-3 rounded-lg bg-[#0b0e14] border border-[#1d2331] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-amber-400" />
                    Monitor de Validação em Tempo Real (Meta Handshake)
                  </span>
                  <span className="text-[10px] text-slate-500">Auto-refresh a cada 4s</span>
                </div>

                {webhookInfo?.lastVerification ? (
                  <div
                    className={`p-2.5 rounded-lg border text-[11px] flex items-start gap-2 ${
                      webhookInfo.lastVerification.success
                        ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                        : 'bg-rose-950/40 border-rose-800 text-rose-200'
                    }`}
                  >
                    {webhookInfo.lastVerification.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-0.5">
                      <div className="font-semibold text-white">
                        {webhookInfo.lastVerification.success
                          ? '✅ Handshake Meta Validado com Sucesso!'
                          : '⚠️ Tentativa de Verificação Rejeitada'}
                      </div>
                      <div className="text-[10px] opacity-80">
                        {webhookInfo.lastVerification.details} • Horário:{' '}
                        {new Date(webhookInfo.lastVerification.timestamp).toLocaleTimeString('pt-BR')}
                      </div>
                      {webhookInfo.lastVerification.challenge && (
                        <div className="text-[10px] font-mono text-amber-300">
                          Desafio Meta respondido: {webhookInfo.lastVerification.challenge} (HTTP 200 text/plain)
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic py-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-ping"></span>
                    Aguardando primeiro clique em "Verify and save" no painel da Meta...
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-md"
              >
                {isSavingConfig ? 'Salvando...' : 'Salvar e Validar Credenciais'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
