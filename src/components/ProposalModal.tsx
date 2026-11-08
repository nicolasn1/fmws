import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Printer,
  Save,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building2,
  ShieldCheck,
  Award,
  Layers,
  Sparkles
} from 'lucide-react';
import { CommercialProposal, Lead, ServiceType } from '../types/crm';
import { FMWS_SERVICES_CATALOG } from '../data/stages';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal?: CommercialProposal | null;
  initialLead?: Lead | null;
  leads: Lead[];
  onSave: (propData: Partial<CommercialProposal>) => Promise<void>;
  initialMode?: 'editor' | 'preview';
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  initialLead,
  leads,
  onSave,
  initialMode
}) => {
  const isEditing = Boolean(proposal);

  const [leadId, setLeadId] = useState(proposal?.leadId || initialLead?.id || leads[0]?.id || '');
  const [serviceRequested, setServiceRequested] = useState<ServiceType>(
    proposal?.serviceRequested || 'criacao_site_profissional'
  );
  const [projectScope, setProjectScope] = useState(
    proposal?.projectScope ||
      'Desenvolvimento de website institucional corporativo de alta performance, arquitetura responsiva, integração segura com WhatsApp e infraestrutura de hospedagem.'
  );
  const [estimatedTimelineDays, setEstimatedTimelineDays] = useState(proposal?.estimatedTimelineDays || 15);
  const [price, setPrice] = useState<number>(proposal?.price || 6500);
  const [paymentTerms, setPaymentTerms] = useState(
    proposal?.paymentTerms || 'Sinal de 30% após aprovação do design inicial sem custo + saldo em 3x mensais'
  );
  const [validityDays, setValidityDays] = useState(proposal?.validityDays || 15);
  const [status, setStatus] = useState<CommercialProposal['status']>(proposal?.status || 'rascunho');
  const [deliverables, setDeliverables] = useState<string[]>(
    proposal?.deliverables || [
      'Proposta inicial de design exclusivo sem custo prévio de desenvolvimento',
      'Layout 100% responsivo para smartphones, tablets e computadores',
      'Painel de controle amigável e intuitivo',
      'Certificado de segurança SSL gratuito',
      'Configuração de e-mails corporativos @suaempresa.com.br'
    ]
  );
  const [notes, setNotes] = useState(proposal?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'preview'>(initialMode || (proposal ? 'preview' : 'editor'));

  const selectedLead = leads.find(l => l.id === leadId) || initialLead || leads[0];

  useEffect(() => {
    if (proposal) {
      setLeadId(proposal.leadId);
      setServiceRequested(proposal.serviceRequested);
      setProjectScope(proposal.projectScope);
      setEstimatedTimelineDays(proposal.estimatedTimelineDays);
      setPrice(proposal.price);
      setPaymentTerms(proposal.paymentTerms);
      setValidityDays(proposal.validityDays);
      setStatus(proposal.status);
      setDeliverables(proposal.deliverables || []);
      setNotes(proposal.notes || '');
      setViewMode(initialMode || 'preview');
    } else {
      setViewMode(initialMode || 'editor');
    }
  }, [proposal, isOpen, initialMode]);

  // When changing service catalog, update deliverables preset if empty
  const handleServiceChange = (svcId: ServiceType) => {
    setServiceRequested(svcId);
    const cat = FMWS_SERVICES_CATALOG.find(c => c.id === svcId);
    if (cat) {
      setDeliverables(cat.deliverables);
      setProjectScope(cat.description);
    }
  };

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || price <= 0) {
      alert('Por favor, informe um valor comercial válido (não fictício) para a proposta.');
      return;
    }

    try {
      setIsSubmitting(true);
      const validUntil = new Date(Date.now() + 3600000 * 24 * validityDays).toISOString();

      await onSave({
        leadId: selectedLead?.id || 'lead-manual',
        companyName: selectedLead?.name || 'Empresa Cliente',
        contactName: selectedLead?.contactName || 'Contato Comercial',
        contactRole: selectedLead?.contactRole || 'Decisor',
        contactWhatsapp: selectedLead?.whatsapp || '',
        serviceRequested,
        projectScope,
        estimatedTimelineDays,
        price,
        paymentTerms,
        validityDays,
        validUntil,
        status,
        deliverables,
        fmwsDifferentialIncluded: true,
        notes
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar proposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="card-corporate w-full max-w-4xl rounded-2xl border border-[#272d3a] shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-[#202530] bg-[#14171f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d222d] border border-[#2d3545] flex items-center justify-center text-[#d4af37]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isEditing ? `Proposta Comercial ${proposal?.proposalCode}` : 'Gerar Nova Proposta Comercial'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800">
                  v{proposal?.version || 1}.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fazer Meu Website • Modelo Oficial com Garantia de Design Inicial Sem Custo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'editor' ? 'preview' : 'editor')}
              className="px-3 py-1.5 bg-[#1a1f29] hover:bg-[#222938] border border-[#2b3548] text-amber-300 text-xs font-semibold rounded-lg transition"
            >
              {viewMode === 'editor' ? 'Visualizar Documento / Imprimir' : 'Voltar ao Editor'}
            </button>

            <button onClick={onClose} aria-label="Fechar proposta" className="p-2 text-slate-400 hover:text-white rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode 1: Editor Form */}
        {viewMode === 'editor' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa Destinatária</label>
                <select
                  aria-label="Selecionar empresa destinatária"
                  value={leadId}
                  onChange={e => setLeadId(e.target.value)}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">Serviço do Catálogo Oficial</label>
                <select
                  aria-label="Selecionar serviço do catálogo"
                  value={serviceRequested}
                  onChange={e => handleServiceChange(e.target.value as ServiceType)}
                  className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60"
                >
                  {FMWS_SERVICES_CATALOG.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scope */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Escopo do Projeto & Especificações
              </label>
              <textarea
                rows={3}
                value={projectScope}
                onChange={e => setProjectScope(e.target.value)}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500/60"
              />
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Entregáveis Inclusos (um por linha)
              </label>
              <textarea
                rows={4}
                value={deliverables.join('\n')}
                onChange={e => setDeliverables(e.target.value.split('\n').filter(Boolean))}
                className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500/60 font-mono text-[11px]"
              />
            </div>

            {/* Pricing and Terms */}
            <div className="pt-2 border-t border-[#202530] grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Valor Comercial Total (R$) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 6800"
                  value={price || ''}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500/60"
                />
                <p className="text-[10px] text-slate-500 mt-1">Definido manualmente pelo consultor.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prazo Estimado (Dias Úteis)</label>
                <input
                  type="number"
                  value={estimatedTimelineDays}
                  onChange={e => setEstimatedTimelineDays(Number(e.target.value))}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Validade da Proposta (Dias)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Condições de Pagamento</label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  className="w-full bg-[#181b22] border border-[#282f3c] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Status da Proposta</label>
                <select
                  aria-label="Selecionar status da proposta"
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full bg-[#181b22] border border-[#282f3c] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500/60 font-semibold"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviada">Enviada ao Cliente</option>
                  <option value="aprovada">Aprovada (Fechamento)</option>
                  <option value="recusada">Recusada</option>
                </select>
              </div>
            </div>

            {/* Differential Highlight */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-slate-300 space-y-1">
              <span className="font-bold text-[#f5e7a9] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" /> Cláusula de Diferencial FMWS Inclusa
              </span>
              <p className="text-[11px] text-slate-400">
                A proposta formal inclui expressamente a cláusula onde o cliente recebe a apresentação inicial do design
                sem custo de desenvolvimento, realizando o pagamento apenas após a aprovação formal do conceito visual.
              </p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-[#202530] flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#181b22] hover:bg-[#222732] text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg hover:brightness-110 disabled:opacity-50 transition shadow-md"
              >
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>{isSubmitting ? 'Gravando...' : isEditing ? 'Atualizar Proposta' : 'Gerar Proposta Oficial'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Mode 2: Executive Print / PDF Document Layout */
          <div className="p-8 max-h-[75vh] overflow-y-auto space-y-6 bg-white text-slate-900 print:p-0">
            {/* Print Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-[#d4af37] font-extrabold text-sm">
                    FM
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-wider">FAZER MEU WEBSITE</h2>
                    <p className="text-xs text-slate-600 font-medium">www.fazermeuwebsite.com.br</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-amber-700 block">
                  {proposal?.proposalCode || 'PROP-2026-OFICIAL'}
                </span>
                <span className="text-xs text-slate-500">
                  Data: {new Date().toLocaleDateString('pt-BR')} • Validade: {validityDays} dias
                </span>
              </div>
            </div>

            {/* Proposal Recipient */}
            <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Cliente / Razão Social:</span>
                <strong className="text-sm text-slate-900">{selectedLead?.name}</strong>
                <p className="text-slate-600 font-mono mt-0.5">{selectedLead?.cnpj || 'CNPJ verificado'}</p>
                <p className="text-slate-600">{selectedLead?.city}</p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Aos cuidados de:</span>
                <strong className="text-sm text-slate-900">
                  {selectedLead?.contactName} ({selectedLead?.contactRole})
                </strong>
                <p className="text-slate-600 font-mono mt-0.5">{selectedLead?.whatsapp}</p>
              </div>
            </div>

            {/* Service & Scope */}
            <div className="space-y-2 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                1. OBJETO E ESCOPO DA PROPOSTA
              </h4>
              <p className="text-sm font-semibold text-slate-800">
                {FMWS_SERVICES_CATALOG.find(s => s.id === serviceRequested)?.name || serviceRequested}
              </p>
              <p className="text-slate-700 leading-relaxed">{projectScope}</p>
            </div>

            {/* Deliverables */}
            <div className="space-y-2 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b pb-1">
                2. ENTREGÁVEIS TÉCNICOS E OPERACIONAIS
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                {deliverables.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Key Differentiator Clause */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
              <h5 className="font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-700" /> 3. CLÁUSULA DE GARANTIA E AVALIAÇÃO VISUAL SEM CUSTO
              </h5>
              <p className="leading-relaxed">
                "A Fazer Meu Website desenvolve a proposta de design e identidade visual inicial sem qualquer custo prévio
                de desenvolvimento para o cliente. A contratante somente confirma o investimento financeiro após homologar
                e aprovar o conceito visual apresentado pela nossa equipe de arquitetura."
              </p>
            </div>

            {/* Investment & Timeline */}
            <div className="grid grid-cols-2 gap-4 border-t-2 border-slate-900 pt-4 text-xs">
              <div>
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Prazo de Execução:</span>
                <strong className="text-base text-slate-900">{estimatedTimelineDays} dias úteis</strong>
                <p className="text-slate-600 mt-1">Forma de Pagamento: {paymentTerms}</p>
              </div>

              <div className="text-right">
                <span className="text-slate-500 font-semibold block uppercase text-[10px]">Investimento Total:</span>
                <strong className="text-2xl font-extrabold text-slate-900 font-mono">
                  R$ {price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <p className="text-slate-600 text-[11px] mt-0.5">Nota Fiscal de Serviços Eletrônica (NFS-e) Inclusa</p>
              </div>
            </div>

            {/* Print & Action Bar */}
            <div className="pt-4 border-t flex items-center justify-between print:hidden">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Voltar ao Editor
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-amber-300 font-bold text-xs rounded-lg shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Salvar como PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
