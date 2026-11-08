import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Globe,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Copy,
  Check,
  MessageSquare
} from 'lucide-react';
import { Lead, AIAnalysisReport } from '../types/crm';
import { ApiService } from '../services/api';

interface AiAnalysisViewProps {
  leads: Lead[];
  onOpenWhatsApp: (lead: Lead) => void;
  onRefreshLead: () => void;
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({
  leads,
  onOpenWhatsApp,
  onRefreshLead
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(leads[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<AIAnalysisReport | null>(
    leads[0]?.aiAnalysis || null
  );
  const [copiedPitch, setCopiedPitch] = useState(false);

  const selectedLead = leads.find(l => l.id === selectedLeadId) || leads[0];

  const handleSelectLead = (id: string) => {
    setSelectedLeadId(id);
    const found = leads.find(l => l.id === id);
    setAnalysisReport(found?.aiAnalysis || null);
  };

  const handleExecuteAnalysis = async () => {
    if (!selectedLead) return;
    try {
      setIsAnalyzing(true);
      const report = await ApiService.analyzeLeadSite(selectedLead.id);
      setAnalysisReport(report);
      onRefreshLead();
    } catch (err: any) {
      alert(err.message || 'Falha ao auditar site');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyPitch = () => {
    if (analysisReport?.fmwsDifferentiatorPitch) {
      navigator.clipboard.writeText(analysisReport.fmwsDifferentiatorPitch);
      setCopiedPitch(true);
      setTimeout(() => setCopiedPitch(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card-corporate p-5 rounded-xl border border-amber-900/40 bg-gradient-to-r from-[#14120b] to-[#121419]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[#f5e7a9] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              DIAGNÓSTICO TÉCNICO & COMERCIAL DE PRESENÇA DIGITAL
            </div>
            <h3 className="text-lg font-bold text-white">Auditoria de Oportunidades com IA</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Avaliação de 8 dimensões estruturais (institucional, responsividade mobile, organização de serviços, canais
              de contato, credenciais, SEO e modernização). Formulação da solução comercial oficial da{' '}
              <strong className="text-[#f5e7a9]">Fazer Meu Website</strong>.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <select
              aria-label="Selecionar empresa para auditoria de IA"
              value={selectedLeadId}
              onChange={e => handleSelectLead(e.target.value)}
              className="bg-[#181b22] border border-[#2e3747] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60 min-w-[240px]"
            >
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} {lead.aiAnalysis ? '✓' : '(Pendente)'}
                </option>
              ))}
            </select>

            <button
              onClick={handleExecuteAnalysis}
              disabled={isAnalyzing || !selectedLead}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-md"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Auditando...' : 'Executar Análise'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis View Grid */}
      {selectedLead && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Company Card & Status */}
          <div className="space-y-4">
            <div className="card-corporate p-5 rounded-xl border border-[#202530] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400/90 font-bold">
                    {selectedLead.segment}
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">{selectedLead.name}</h4>
                  <p className="text-xs text-slate-400">{selectedLead.city} • {selectedLead.neighborhood || 'Centro'}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#181c24] border border-[#252d3a] flex items-center justify-center font-bold text-amber-400">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#14171e] border border-[#222733] text-xs space-y-2">
                <div className="flex flex-col gap-1 text-slate-400">
                  <span className="text-[11px] text-slate-500">Site Institucional:</span>
                  {selectedLead.site && selectedLead.site.length > 5 && !selectedLead.site.includes('não identificado') ? (
                    <a
                      href={selectedLead.site.startsWith('http') ? selectedLead.site : `http://${selectedLead.site}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#d4af37] hover:underline flex items-center gap-1 font-mono truncate max-w-full"
                    >
                      {selectedLead.site.replace(/^https?:\/\//, '')} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-amber-400/90 font-medium italic text-[11px]">
                      Site não identificado — verificação pendente
                    </span>
                  )}
                </div>

                <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-[#1f242f]">
                  <span>Contato Decisor:</span>
                  <span className="text-slate-200 font-medium">
                    {selectedLead.contactName} ({selectedLead.contactRole})
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>WhatsApp:</span>
                  <span className="text-amber-400 font-mono">{selectedLead.whatsapp}</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Origem do Cadastro:</span>
                  <span className="text-slate-300 font-mono text-[10px]">{selectedLead.source}</span>
                </div>
              </div>

              {/* Action shortcuts */}
              <div className="space-y-2 pt-2 border-t border-[#202530]">
                <button
                  onClick={() => onOpenWhatsApp(selectedLead)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800 text-emerald-300 text-xs font-semibold transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Enviar Abordagem via WhatsApp Cloud
                </button>
              </div>
            </div>

            {/* Fazer Meu Website Official Differentiator Box */}
            <div className="card-corporate p-5 rounded-xl border border-amber-900/40 bg-gradient-to-b from-amber-950/20 to-[#121419] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#f5e7a9] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#d4af37]" /> Diferencial Comercial FMWS
                </span>
                <button
                  onClick={handleCopyPitch}
                  className="text-slate-400 hover:text-amber-300 text-[11px] flex items-center gap-1 font-medium transition"
                >
                  {copiedPitch ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copiedPitch ? 'Copiado!' : 'Copiar'}
                </button>
              </div>

              <blockquote className="p-3 rounded-lg bg-[#0c0d10] border border-amber-900/30 text-xs text-slate-200 italic leading-relaxed">
                "A Fazer Meu Website desenvolve uma proposta inicial de design sem custo, e o cliente só paga se aprovar."
              </blockquote>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Este diferencial elimina o risco percebido pelo cliente, garante segurança na decisão e acelera a
                conversão de reuniões para propostas aprovadas.
              </p>
            </div>
          </div>

          {/* Right 2 Columns: Detailed AI Report */}
          <div className="lg:col-span-2 space-y-4">
            {analysisReport ? (
              <div className="space-y-4">
                {/* 4 Score Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="card-corporate p-3.5 rounded-xl border border-[#222733] text-center">
                    <span className="text-[11px] text-slate-400">Presença de Site</span>
                    <div className="text-sm font-bold text-white mt-1">
                      {analysisReport.hasInstitutionalSite ? (
                        <span className="text-emerald-400 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Identificado
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center justify-center gap-1 text-xs">
                          <AlertCircle className="w-3.5 h-3.5" /> Não Identificado
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="card-corporate p-3.5 rounded-xl border border-[#222733] text-center">
                    <span className="text-[11px] text-slate-400">Qualidade Apresentação</span>
                    <div className="text-sm font-bold text-white mt-1 uppercase">
                      {analysisReport.presentationQuality}
                    </div>
                  </div>

                  <div className="card-corporate p-3.5 rounded-xl border border-[#222733] text-center">
                    <span className="text-[11px] text-slate-400">Score Mobile (HTTP Real)</span>
                    {analysisReport.hasInstitutionalSite && analysisReport.mobileExperienceScore && analysisReport.mobileExperienceScore > 0 ? (
                      <div className="text-lg font-extrabold text-amber-400 font-mono mt-0.5">
                        {analysisReport.mobileExperienceScore} <span className="text-xs text-slate-400">/ 100</span>
                      </div>
                    ) : (
                      <div className="text-[11px] font-medium text-slate-400 mt-1.5">
                        Pendente de auditoria técnica
                      </div>
                    )}
                  </div>

                  <div className="card-corporate p-3.5 rounded-xl border border-[#222733] text-center">
                    <span className="text-[11px] text-slate-400">Nível Prioridade</span>
                    <div className="text-sm font-bold text-amber-300 uppercase mt-1">
                      {analysisReport.priorityLevel}
                    </div>
                  </div>
                </div>

                {/* Problems & Evidences */}
                <div className="card-corporate p-5 rounded-xl border border-[#222733] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Problemas Críticos Identificados & Evidências
                  </h4>
                  <div className="space-y-2">
                    {analysisReport.observedProblems.map((prob, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#14171e] border border-[#222834] flex items-start gap-2.5 text-xs text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <div>
                          <div>{prob}</div>
                          {analysisReport.evidenceAndUrls[i] && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Evidência: {analysisReport.evidenceAndUrls[i]}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Improvements */}
                <div className="card-corporate p-5 rounded-xl border border-[#222733] space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Melhorias Estratégicas Recomendadas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {analysisReport.recommendedImprovements.map((imp, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-[#14171e] border border-[#222834] flex items-start gap-2.5 text-xs text-slate-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{imp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested Commercial Solution */}
                <div className="card-corporate p-5 rounded-xl border border-amber-900/50 bg-gradient-to-br from-amber-950/20 to-transparent space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#f5e7a9] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#d4af37]" />
                    Solução Comercial Oficial Fazer Meu Website
                  </h4>
                  <div className="p-4 rounded-xl bg-[#0c0d10] border border-amber-900/40 text-xs text-white font-medium">
                    {analysisReport.suggestedCommercialSolution}
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">Abordagem Personalizada Sugerida: </span>
                    <p className="mt-1 text-slate-400 leading-relaxed italic">
                      "{analysisReport.fmwsDifferentiatorPitch}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card-corporate p-12 rounded-xl border border-[#222733] text-center space-y-3">
                <Sparkles className="w-12 h-12 text-amber-400/80 mx-auto" />
                <h4 className="text-base font-bold text-white">Nenhum relatório de auditoria gerado ainda</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Clique no botão <strong className="text-amber-400">"Executar Análise"</strong> acima para realizar a
                  auditoria de presença digital desta empresa via IA, identificando gargalos reais e preparando a abordagem
                  comercial.
                </p>
                <button
                  onClick={handleExecuteAnalysis}
                  disabled={isAnalyzing}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 transition shadow-md"
                >
                  {isAnalyzing ? 'Processando Auditoria...' : 'Auditar Presença Digital Agora'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
