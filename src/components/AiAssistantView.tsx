import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  Copy,
  Check,
  Building2,
  Shield,
  MessageSquare,
  HelpCircle,
  FileCheck,
  ArrowRight,
  RefreshCw,
  Award,
  Mail,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Layers,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Square
} from 'lucide-react';
import { Lead } from '../types/crm';
import { FMWS_SERVICES_CATALOG } from '../data/stages';
import { ApiService } from '../services/api';

interface AiAssistantViewProps {
  leads: Lead[];
  onOpenWhatsAppWithMessage: (lead: Lead, message: string) => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  leads,
  onOpenWhatsAppWithMessage
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [mode, setMode] = useState<
    'generate_pitch' | 'handle_objection' | 'draft_proposal_scope' | 'summarize_conversation' | 'next_steps'
  >('generate_pitch');

  const [objectionType, setObjectionType] = useState<string>('Já temos um sobrinho/conhecido que cuida disso');
  const [selectedService, setSelectedService] = useState<string>(FMWS_SERVICES_CATALOG[0].name);
  const [contextText, setContextText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<{
    suggestionTitle: string;
    output: string;
    metadata?: any;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [channelTab, setChannelTab] = useState<'whatsapp' | 'email' | 'geral'>('whatsapp');
  const [humanReviewed, setHumanReviewed] = useState<boolean>(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const commonObjections = [
    'Já temos um conhecido/sobrinho que cuida do site',
    'Achamos o orçamento alto / Sem verba agora',
    'Não precisamos de site, usamos apenas Instagram e WhatsApp',
    'Já temos um site antigo e funciona para o que precisamos',
    'Queremos focar em outras prioridades no semestre'
  ];

  const handleGenerate = async () => {
    if (!selectedLead) return;
    try {
      setIsGenerating(true);
      setHumanReviewed(false);
      setCopied(false);
      setCopiedEmail(false);
      setChannelTab('whatsapp');
      const res = await ApiService.runAssistant({
        mode,
        leadId: selectedLead.id,
        contextText,
        objectionType: mode === 'handle_objection' ? objectionType : undefined,
        selectedService: mode === 'draft_proposal_scope' ? selectedService : undefined
      });
      setGeneratedResult(res);
    } catch (err: any) {
      alert(err.message || 'Falha ao consultar assistente');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedResult?.output) {
      navigator.clipboard.writeText(generatedResult.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-corporate p-5 rounded-xl border border-amber-900/40 bg-gradient-to-r from-[#14120b] to-[#121419]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[#f5e7a9] text-xs font-semibold mb-2">
              <Bot className="w-3.5 h-3.5 text-[#d4af37]" />
              COPILOTO COMERCIAL EXCLUSIVO FMWS
            </div>
            <h3 className="text-lg font-bold text-white">Assistente Comercial Especializado</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Especialista no portfólio da <strong className="text-[#f5e7a9]">Fazer Meu Website</strong> com domínio de
              técnicas de contorno de objeções, pitches consultivos B2B e escopos técnicos.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#0c0d10] border border-amber-900/30 text-[11px] text-slate-300 max-w-sm">
            <span className="font-bold text-[#f5e7a9] block mb-0.5">Diferencial Nativo:</span>
            "Proposta inicial de design sem custo; o cliente só paga se aprovar."
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Command Center */}
        <div className="space-y-4">
          <div className="card-corporate p-5 rounded-xl border border-[#202530] space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa Alvo (Lead)</label>
              <select
                aria-label="Selecionar empresa para o assistente comercial"
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
              >
                {leads.map(lead => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name} ({lead.segment})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Modo de Ação da IA</label>
              <div className="space-y-1.5">
                {[
                  {
                    id: 'generate_pitch',
                    label: 'Criar Abordagem Personalizada',
                    desc: 'Pitch consultivo inicial por WhatsApp/E-mail'
                  },
                  {
                    id: 'handle_objection',
                    label: 'Contorno de Objeções',
                    desc: 'Respostas elegantes para resistências corporativas'
                  },
                  {
                    id: 'draft_proposal_scope',
                    label: 'Preparar Escopo de Proposta',
                    desc: 'Estruturação técnica para formalização comercial'
                  },
                  {
                    id: 'summarize_conversation',
                    label: 'Resumir Histórico / Reunião',
                    desc: 'Extrai dores, tomador de decisão e sinalizadores'
                  },
                  {
                    id: 'next_steps',
                    label: 'Sugerir Próximos Passos',
                    desc: 'Recomendação tática baseada no estágio atual'
                  }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as any)}
                    className={`w-full text-left p-2.5 rounded-lg border transition text-xs ${
                      mode === item.id
                        ? 'bg-amber-950/30 border-amber-600/70 text-[#f5e7a9]'
                        : 'bg-[#151820] border-[#202530] text-slate-400 hover:text-white hover:bg-[#1a1f29]'
                    }`}
                  >
                    <div className="font-semibold text-white">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode specific parameters */}
            {mode === 'handle_objection' && (
              <div className="space-y-2 pt-2 border-t border-[#202530]">
                <label className="block text-xs font-semibold text-slate-300">Selecione a Objeção Típica</label>
                <select
                  aria-label="Selecionar objeção comum"
                  value={objectionType}
                  onChange={e => setObjectionType(e.target.value)}
                  className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/60"
                >
                  {commonObjections.map((obj, i) => (
                    <option key={i} value={obj}>
                      {obj}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'draft_proposal_scope' && (
              <div className="space-y-2 pt-2 border-t border-[#202530]">
                <label className="block text-xs font-semibold text-slate-300">Serviço do Catálogo FMWS</label>
                <select
                  aria-label="Selecionar serviço do catálogo"
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-2.5 py-2 focus:outline-none focus:border-amber-500/60"
                >
                  {FMWS_SERVICES_CATALOG.map(svc => (
                    <option key={svc.id} value={svc.name}>
                      {svc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contexto Adicional / Notas da Conversa (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Insira detalhes que o cliente mencionou, dúvidas ou particularidades..."
                value={contextText}
                onChange={e => setContextText(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedLead}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-md"
            >
              <Sparkles className={`w-4 h-4 stroke-[2.5] ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Consultando IA Comercial...' : 'Gerar Resposta com IA'}</span>
            </button>
          </div>
        </div>

        {/* Right 2 Columns: Output Workspace & Review */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-corporate p-5 rounded-xl border border-[#202530] flex flex-col h-full min-h-[500px]">
            {/* Output Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#202530]">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">
                  {selectedLead.name} • {selectedLead.contactName} ({selectedLead.segment})
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {generatedResult?.suggestionTitle || 'Pronto para Gerar Conteúdo Comercial'}
                </h4>
              </div>

              {generatedResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const textToCopy =
                        mode === 'generate_pitch' && generatedResult.metadata
                          ? channelTab === 'whatsapp'
                            ? generatedResult.metadata.whatsappVersion
                            : channelTab === 'email'
                            ? `Assunto: ${generatedResult.metadata.emailVersion.subject}\n\n${generatedResult.metadata.emailVersion.body}`
                            : generatedResult.output
                          : generatedResult.output;
                      navigator.clipboard.writeText(textToCopy);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181b22] hover:bg-[#222732] border border-[#282f3c] text-slate-200 rounded-lg text-xs font-medium transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    disabled={mode === 'generate_pitch' && !humanReviewed}
                    onClick={() => {
                      if (mode === 'generate_pitch' && !humanReviewed) {
                        alert('Por favor, confirme a revisão humana da mensagem antes de enviar.');
                        return;
                      }
                      const messageToSend =
                        mode === 'generate_pitch' && generatedResult.metadata?.whatsappVersion
                          ? generatedResult.metadata.whatsappVersion
                          : generatedResult.output;
                      onOpenWhatsAppWithMessage(selectedLead, messageToSend);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      mode === 'generate_pitch' && !humanReviewed
                        ? 'bg-emerald-950/30 text-emerald-700 cursor-not-allowed border border-emerald-900/40'
                        : 'bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Usar no WhatsApp</span>
                  </button>
                </div>
              )}
            </div>

            {/* Output Content Area */}
            <div className="flex-1 py-3 space-y-4">
              {generatedResult ? (
                <div className="space-y-4">
                  {/* If mode is generate_pitch and metadata is available: show compliance elements */}
                  {mode === 'generate_pitch' && generatedResult.metadata && (
                    <>
                      {/* Scenario Classification Badge */}
                      {(() => {
                        const sc = generatedResult.metadata.scenarioType;
                        if (sc === 'site_com_problema_comprovado') {
                          return (
                            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-2.5">
                              <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-rose-300 font-bold text-xs uppercase block">
                                  Cenário 3: Inconformidades Técnicas Comprovadas com Evidência
                                </span>
                                <p className="text-slate-300 text-[11px] mt-0.5">
                                  Abordagem baseada exclusivamente nas falhas registradas na presença digital. Nenhuma falha inexistente foi alegada.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        if (sc === 'site_funcional_modernizacao') {
                          return (
                            <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-800/50 flex items-start gap-2.5">
                              <ShieldCheck className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                              <div>
                                <span className="text-sky-300 font-bold text-xs uppercase block">
                                  Cenário 2: Modernização Visual e Novas Funcionalidades (Site Ativo)
                                </span>
                                <p className="text-slate-300 text-[11px] mt-0.5">
                                  A empresa já possui site ativo sem problemas comprovados. A abordagem propõe modernização estética e novas ferramentas, sem alegar falhas técnicas.
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-2.5">
                            <ShieldCheck className="w-4 h-4 text-[#d4af37] mt-0.5 shrink-0" />
                            <div>
                              <span className="text-amber-300 font-bold text-xs uppercase block">
                                Cenário 1: Oportunidade de Presença Digital Institucional
                              </span>
                              <p className="text-slate-300 text-[11px] mt-0.5">
                                Site não localizado nos registros públicos. A criação é apresentada como oportunidade estratégica, sem afirmar categoricamente que a empresa não possui site.
                              </p>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Data Provenance (Rule 11) */}
                      <div className="p-2.5 rounded-lg bg-[#0a0c10] border border-[#1e2433] space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-[#d4af37]" /> Origem Verificada das Informações (CRM):
                        </span>
                        <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
                          {generatedResult.metadata.sourceEvidenceUsed}
                        </p>
                      </div>

                      {/* Channel Switcher */}
                      <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0e1118] border border-[#1f2636]">
                        <button
                          onClick={() => setChannelTab('whatsapp')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            channelTab === 'whatsapp'
                              ? 'bg-emerald-600 text-black shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>WhatsApp (Curto)</span>
                        </button>
                        <button
                          onClick={() => setChannelTab('email')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            channelTab === 'email'
                              ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>E-mail Executivo</span>
                        </button>
                        <button
                          onClick={() => setChannelTab('geral')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            channelTab === 'geral' ? 'bg-[#242b3b] text-white shadow-md' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>Texto Geral</span>
                        </button>
                      </div>
                    </>
                  )}

                  {/* Render content depending on tab */}
                  {mode === 'generate_pitch' && generatedResult.metadata && channelTab === 'whatsapp' ? (
                    <div className="space-y-2">
                      <div className="p-4 rounded-xl bg-[#090b10] border border-[#1b2230] text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                        {generatedResult.metadata.whatsappVersion}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                        <span>Canal de envio: WhatsApp (+{selectedLead.whatsapp})</span>
                        <span className="text-emerald-400">Objetivo: ~{generatedResult.metadata.whatsappVersion.split(/\s+/).length} palavras</span>
                      </div>
                    </div>
                  ) : mode === 'generate_pitch' && generatedResult.metadata && channelTab === 'email' ? (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-[#090b10] border border-[#1b2230]">
                        <span className="text-[10px] text-slate-400 block mb-0.5">Assunto:</span>
                        <span className="text-white text-xs font-bold font-mono">
                          {generatedResult.metadata.emailVersion.subject}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-[#090b10] border border-[#1b2230] text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
                        {generatedResult.metadata.emailVersion.body}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => {
                            const mailto = `mailto:?subject=${encodeURIComponent(
                              generatedResult.metadata.emailVersion.subject
                            )}&body=${encodeURIComponent(generatedResult.metadata.emailVersion.body)}`;
                            window.open(mailto, '_blank');
                          }}
                          className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 bg-[#141822] px-2.5 py-1.5 rounded-lg border border-[#273042]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Abrir no Cliente de E-mail</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#0e1015] border border-[#222834] text-xs text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {generatedResult.output}
                    </div>
                  )}

                  {/* Mandatory Human Review Checkbox for Pitch (Rule 9) */}
                  {mode === 'generate_pitch' ? (
                    <div className="p-3 rounded-xl bg-[#0f121a] border border-[#273042] flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => setHumanReviewed(!humanReviewed)}
                        className="mt-0.5 text-amber-400 hover:text-amber-300"
                      >
                        {humanReviewed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                      <label
                        onClick={() => setHumanReviewed(!humanReviewed)}
                        className="cursor-pointer text-[11px] text-slate-300 select-none leading-relaxed"
                      >
                        <strong className="text-white font-semibold block">
                          Revisão Humana Obrigatória (Diretriz Comercial FMWS):
                        </strong>
                        Confirmo que verifiquei as informações da empresa ({selectedLead.name}), conferi a ausência de dados fictícios e autorizo a abordagem comercial.
                      </label>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/40 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>* Diretriz de conformidade: Todas as mensagens devem ser revisadas pelo operador antes de qualquer envio.</span>
                      <span className="text-emerald-400 font-medium">Revisão Humana Ativa</span>
                    </div>
                  )}

                  {/* WhatsApp Cloud API Template Notice (Rule 10) */}
                  {mode === 'generate_pitch' && generatedResult.metadata && (
                    <div className="p-2.5 rounded-lg bg-[#0a0c12] border border-[#1b2230] text-[10px] text-slate-400 flex items-start gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Conformidade WhatsApp Cloud API (Meta):</strong> Disparos ativos via Canal 1 (+55 11 94579-9976) são restritos aos templates homologados na Meta (<em>{generatedResult.metadata.suggestedMetaTemplate}</em>) e exigem consentimento prévio válido. Abordagens personalizadas livres devem ser enviadas manualmente pelo SDR.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
                  <Bot className="w-12 h-12 text-slate-600" />
                  <p className="text-xs max-w-md">
                    Selecione a empresa e a função desejada à esquerda para gerar uma abordagem comercial personalizada,
                    contorno de objeção corporativa ou escopo técnico detalhado.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
