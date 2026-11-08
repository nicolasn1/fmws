import React, { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { ApiService } from '../services/api';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    duplicates: number;
    errors: number;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const sampleCsv = `Nome da Empresa;CNPJ;Segmento;Cidade;Site;WhatsApp;Contato;Cargo;Prioridade
Hospital e Maternidade São Lucas;12.345.678/0001-90;Saúde e Medicina;Campinas;http://saolucascampinas.med.br;5519998877665;Dr. André Souza;Diretor Geral;alta
Nova Era Consultoria Contábil;98.765.432/0001-10;Contabilidade;São Paulo;http://novaeracontabil.com.br;5511987654321;Mariana Ramos;Sócia Fundadora;media
Sul Cargas Transportes Rodoviários;55.443.221/0001-33;Logística;Curitiba;http://sulcargaslog.com.br;5541977665544;Carlos Alberto;Gerente Operacional;alta`;

  if (!isOpen) return null;

  const handleCopySample = () => {
    navigator.clipboard.writeText(sampleCsv);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setCsvText((event.target?.result as string) || '');
      };
      reader.readAsText(file);
    }
  };

  const parseAndImport = async () => {
    if (!csvText.trim()) {
      setErrorMessage('Por favor, cole ou carregue o conteúdo CSV.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage('');
      setImportResult(null);

      const lines = csvText.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('O CSV deve conter cabeçalho e ao menos uma linha de dados.');
      }

      const delimiter = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

      const leadsToImport = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
        const row: any = {};

        headers.forEach((h, idx) => {
          row[h] = cols[idx] || '';
        });

        // Map column variations
        const name = row['nome da empresa'] || row['nome'] || row['empresa'] || cols[0];
        const cnpj = row['cnpj'] || cols[1];
        const segment = row['segmento'] || row['setor'] || cols[2] || 'Geral';
        const city = row['cidade'] || cols[3] || 'Não informada';
        const site = row['site'] || row['website'] || cols[4] || '';
        const whatsapp = row['whatsapp'] || row['telefone'] || cols[5] || '';
        const contactName = row['contato'] || row['responsável'] || cols[6] || 'Responsável';
        const contactRole = row['cargo'] || cols[7] || 'Contato Comercial';
        const priority = row['prioridade'] || cols[8] || 'media';

        if (name && whatsapp) {
          leadsToImport.push({
            name,
            cnpj,
            segment,
            city,
            site,
            whatsapp,
            contactName,
            contactRole,
            priority,
            source: 'Importação CSV',
            consentStatus: 'pendente'
          });
        }
      }

      if (leadsToImport.length === 0) {
        throw new Error('Nenhum registro válido com Nome e WhatsApp encontrado no CSV.');
      }

      const result = await ApiService.importCsv(leadsToImport);
      setImportResult(result);
      if (result.imported > 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao processar arquivo CSV');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="card-corporate w-full max-w-2xl rounded-2xl border border-[#272d3a] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#202530] bg-[#14171f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d222d] border border-[#2d3545] flex items-center justify-center text-amber-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Importação em Lote via CSV</h3>
              <p className="text-xs text-slate-400">
                Cadastro em massa de empresas com detecção inteligente de duplicidade
              </p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fechar importação" className="p-2 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Instructions & Template */}
          <div className="p-3.5 rounded-xl bg-[#14171e] border border-[#222834] flex items-start justify-between gap-4">
            <div>
              <h5 className="font-bold text-white mb-1">Formato de Colunas Aceito:</h5>
              <p className="text-slate-400 text-[11px] font-mono leading-relaxed">
                Nome da Empresa | CNPJ | Segmento | Cidade | Site | WhatsApp | Contato | Cargo | Prioridade
              </p>
              <p className="text-[11px] text-amber-400/90 mt-1">
                * Delimitadores aceitos: ponto e vírgula (;) ou vírgula (,).
              </p>
              <p className="text-[10px] text-emerald-400/90 mt-1 font-medium">
                🛡️ Filtro Ativo: Apenas empresas privadas comerciais B2B. Registros governamentais, autarquias e partidos políticos são bloqueados automaticamente.
              </p>
            </div>
            <button
              onClick={handleCopySample}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#1b202a] hover:bg-[#232936] text-slate-200 border border-[#293242] rounded-lg text-[11px] font-medium transition"
            >
              {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{copiedTemplate ? 'Copiado!' : 'Copiar Modelo'}</span>
            </button>
          </div>

          {/* File Upload Input */}
          <div className="border-2 border-dashed border-[#2a303e] hover:border-amber-500/50 rounded-xl p-4 text-center bg-[#101217] transition cursor-pointer relative">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileSpreadsheet className="w-8 h-8 text-amber-400 mx-auto mb-1.5" />
            <p className="font-semibold text-white">Clique para selecionar seu arquivo CSV</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ou cole o texto diretamente na área abaixo</p>
          </div>

          {/* Textarea for CSV */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Conteúdo CSV:</label>
            <textarea
              rows={6}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="Cole aqui o texto CSV..."
              className="w-full bg-[#181b22] border border-[#282f3c] rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-xl bg-[#14171e] border border-[#242a38] space-y-2">
              <h5 className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Resumo da Importação:
              </h5>
              <div className="grid grid-cols-3 gap-3 text-center pt-1 font-mono">
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-900/60">
                  <div className="text-emerald-400 font-extrabold text-lg">{importResult.imported}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Importados</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-900/60">
                  <div className="text-amber-400 font-extrabold text-lg">{importResult.duplicates}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Duplicados (Ignorados)</div>
                </div>
                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-900/60">
                  <div className="text-rose-400 font-extrabold text-lg">{importResult.errors}</div>
                  <div className="text-[10px] text-slate-400 uppercase">Erros/Incompletos</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#202530] bg-[#12141a] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#181b22] hover:bg-[#222732] text-slate-300 text-xs font-semibold rounded-lg transition"
          >
            {importResult ? 'Fechar' : 'Cancelar'}
          </button>

          <button
            type="button"
            onClick={parseAndImport}
            disabled={isProcessing || !csvText.trim()}
            className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-lg transition hover:brightness-110 disabled:opacity-50 shadow-md"
          >
            <UploadCloud className="w-4 h-4 stroke-[2.5]" />
            <span>{isProcessing ? 'Validando & Importando...' : 'Iniciar Importação'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
