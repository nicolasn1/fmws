import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Eye,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Target,
  ListFilter,
  MapPin,
  Building2,
  Phone,
  Globe,
  Trash2,
  SlidersHorizontal,
  Layers,
  ArrowRight,
  Info,
  Key,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Share2,
  Shield,
  Zap,
  AlertOctagon,
  Clock,
  Gauge,
  Mail,
  Send,
  CheckSquare,
  Square,
  Smartphone,
  FileText,
  AlertCircle,
  Database,
  CreditCard,
  WifiOff,
  Terminal,
  Lock,
  StopCircle,
  History,
  BarChart3,
  Activity,
  CheckCheck,
  Wrench,
  Cog,
  Hammer,
  Utensils,
  Scissors,
  Stethoscope,
  Store,
  Home,
  Factory,
  Settings
} from 'lucide-react';
import {
  LocalProspectingPlace,
  LocalProspectingFilter,
  TechnicalAuditEvidence,
  OpportunityTier,
  SiteStatusCategory,
  ProspectingApiConfig,
  ProspectingApiStatus,
  CrmEnvironment,
  CommercialPitchResult,
  PitchScenarioType,
  ProspectingDiagnostics,
  ProspectingCampaignHistory,
  ProspectingDatabaseStats
} from '../types/crm';
import {
  COMMERCIAL_SEGMENTS_CATALOG,
  SBC_NEIGHBORHOODS_GRID
} from '../data/prospectingCatalog';
import { ApiService } from '../services/api';

export const SP_CITIES_CATALOG = [
  {
    group: 'Destaques & Pesquisa Ampla',
    cities: [
      'São Bernardo do Campo',
      'Todas as Cidades de SP'
    ]
  },
  {
    group: 'ABC Paulista',
    cities: [
      'São Bernardo do Campo',
      'Santo André',
      'São Caetano do Sul',
      'Diadema',
      'Mauá',
      'Ribeirão Pires',
      'Rio Grande da Serra'
    ]
  },
  {
    group: 'Grande São Paulo & Capital',
    cities: [
      'São Paulo',
      'Guarulhos',
      'Osasco',
      'Barueri',
      'Santana de Parnaíba',
      'Cotia',
      'Taboão da Serra',
      'Embu das Artes',
      'Itapecerica da Serra',
      'Mogi das Cruzes',
      'Suzano',
      'Itaquaquecetuba',
      'Ferraz de Vasconcelos',
      'Poá',
      'Arujá',
      'Franco da Rocha',
      'Francisco Morato',
      'Caieiras',
      'Cajamar'
    ]
  },
  {
    group: 'Região Metropolitana de Campinas',
    cities: [
      'Campinas',
      'Americana',
      'Indaiatuba',
      'Hortolândia',
      'Sumaré',
      'Santa Bárbara d\'Oeste',
      'Valinhos',
      'Vinhedo',
      'Paulínia',
      'Jaguariúna',
      'Itatiba'
    ]
  },
  {
    group: 'Sorocaba & Jundiaí',
    cities: [
      'Sorocaba',
      'Jundiaí',
      'Itu',
      'Salto',
      'Votorantim',
      'São Roque',
      'Tatuí',
      'Itapetininga',
      'Várzea Paulista'
    ]
  },
  {
    group: 'Baixada Santista & Litoral',
    cities: [
      'Santos',
      'São Vicente',
      'Praia Grande',
      'Guarujá',
      'Cubatão',
      'Bertioga',
      'Itanhaém',
      'Caraguatatuba',
      'São Sebastião',
      'Ubatuba'
    ]
  },
  {
    group: 'Vale do Paraíba',
    cities: [
      'São José dos Campos',
      'Taubaté',
      'Jacareí',
      'Pindamonhangaba',
      'Guaratinguetá'
    ]
  },
  {
    group: 'Ribeirão Preto & Franca',
    cities: [
      'Ribeirão Preto',
      'Franca',
      'Sertãozinho',
      'Araraquara',
      'São Carlos',
      'Jaboticabal',
      'Barretos'
    ]
  },
  {
    group: 'Central & Bauru',
    cities: [
      'Bauru',
      'Jaú',
      'Botucatu',
      'Marília',
      'Piracicaba',
      'Limeira',
      'Rio Claro'
    ]
  },
  {
    group: 'Noroeste & Oeste Paulista',
    cities: [
      'São José do Rio Preto',
      'Araçatuba',
      'Catanduva',
      'Votuporanga',
      'Presidente Prudente'
    ]
  }
];

export const renderSegmentIcon = (iconName: string, className = "w-4 h-4") => {
  switch (iconName) {
    case 'Wrench': return <Wrench className={className} />;
    case 'Cog': return <Cog className={className} />;
    case 'Hammer': return <Hammer className={className} />;
    case 'Settings': return <Settings className={className} />;
    case 'Utensils': return <Utensils className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Stethoscope': return <Stethoscope className={className} />;
    case 'Store': return <Store className={className} />;
    case 'Home': return <Home className={className} />;
    case 'Factory': return <Factory className={className} />;
    default: return <Building2 className={className} />;
  }
};

interface LocalProspectingViewProps {
  environment?: CrmEnvironment;
  onToggleEnvironment?: (env: CrmEnvironment) => void;
  onRefreshCrmData?: () => void;
  onNavigateToTab?: (tab: any) => void;
  onOpenWhatsApp?: (lead: any, message?: string) => void;
}

export const LocalProspectingView: React.FC<LocalProspectingViewProps> = ({
  environment = 'producao',
  onToggleEnvironment,
  onRefreshCrmData,
  onNavigateToTab,
  onOpenWhatsApp
}) => {
  // Filter state
  const [city, setCity] = useState('São Bernardo do Campo');
  const [neighborhood, setNeighborhood] = useState('Taboão');
  const [segment, setSegment] = useState('Todos');
  const [radiusKm, setRadiusKm] = useState<2 | 5 | 10 | 15 | 20 | 25>(5);
  const [tierFilter, setTierFilter] = useState<'all' | 'opportunities_ab' | 'tier_a' | 'tier_b' | 'pending' | 'tier_c' | 'inconclusive' | 'in_crm'>('all');
  const [geoScope, setGeoScope] = useState<'city' | 'search_neighborhood' | 'radius'>('city');
  const [searchQuery, setSearchQuery] = useState('');

  // Persisted Database Stats (Single source of truth from backend /api/prospecting/stats)
  const [dbStats, setDbStats] = useState<ProspectingDatabaseStats>({
    totalInDb: 0,
    totalOpportunitiesAB: 0,
    totalClassA: 0,
    totalClassB: 0,
    totalClassC: 0,
    totalPending: 0,
    totalInconclusive: 0,
    totalInCrm: 0,
    totalContacted: 0
  });

  // Operational Goal & Intelligent Segments (Requirements 1, 2, 3, 5, 7)
  const [targetGoal, setTargetGoal] = useState<number>(100);
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>(
    COMMERCIAL_SEGMENTS_CATALOG.map(s => s.id)
  );
  const [isExpandedSearching, setIsExpandedSearching] = useState(false);
  const [isStoppingSearch, setIsStoppingSearch] = useState(false);
  const [isAuditingPending, setIsAuditingPending] = useState(false);
  const [searchProgressText, setSearchProgressText] = useState('');
  const [latestDiagnostics, setLatestDiagnostics] = useState<ProspectingDiagnostics | null>(null);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);
  const [campaignHistory, setCampaignHistory] = useState<ProspectingCampaignHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Pagination & Display quantity state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Data state
  const [places, setPlaces] = useState<LocalProspectingPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sourceUsed, setSourceUsed] = useState<string>('');
  const [apiConfig, setApiConfig] = useState<ProspectingApiConfig>({
    hasGooglePlacesKey: false,
    status: 'not_configured',
    statusLabel: 'Não configurado',
    statusMessage: 'Google Places API (New) não configurada.',
    dailyRequestsCount: 0,
    dailyRequestsLimit: 50,
    costControlActive: true,
    totalSearchesCount: 0,
    testedWithOfficialEndpoint: true
  });

  // Action states
  const [auditingPlaceId, setAuditingPlaceId] = useState<string | null>(null);
  const [activeEvidencePlace, setActiveEvidencePlace] = useState<LocalProspectingPlace | null>(null);
  const [activePitchPlace, setActivePitchPlace] = useState<LocalProspectingPlace | null>(null);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [copiedApproach, setCopiedApproach] = useState(false);
  const [pitchChannelTab, setPitchChannelTab] = useState<'whatsapp' | 'email' | 'completo'>('whatsapp');
  const [humanReviewConfirmed, setHumanReviewConfirmed] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedEmailSubject, setCopiedEmailSubject] = useState(false);

  // Real Search Test (Requirement 12)
  const [isTestingRealSearch, setIsTestingRealSearch] = useState(false);
  const [realSearchTestResult, setRealSearchTestResult] = useState<{
    success: boolean;
    places: LocalProspectingPlace[];
    message: string;
    testedAt: string;
    sourceUsed: string;
  } | null>(null);
  const [realSearchError, setRealSearchError] = useState<string | null>(null);

  // Batch selection state
  const [selectedPlaceIds, setSelectedPlaceIds] = useState<Set<string>>(new Set());
  const [isBatchImporting, setIsBatchImporting] = useState(false);

  // Feedback banner
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  const fetchPlaces = async () => {
    try {
      setIsLoading(true);
      const [placesData, statsData, configData, diagnosticsData] = await Promise.all([
        ApiService.getProspectingPlaces({
          neighborhood,
          city,
          segment: segment === 'Todos' ? undefined : segment,
          tierFilter,
          geoScope,
          radiusKm,
          onlyOpportunitiesAB: tierFilter === 'opportunities_ab',
          searchQuery,
          environment
        }),
        ApiService.getProspectingDatabaseStats().catch(() => ({
          totalInDb: 0,
          totalOpportunitiesAB: 0,
          totalClassA: 0,
          totalClassB: 0,
          totalClassC: 0,
          totalPending: 0,
          totalInconclusive: 0,
          totalInCrm: 0,
          totalContacted: 0
        })),
        ApiService.getProspectingApiConfig().catch(() => ({
          hasGooglePlacesKey: false,
          status: 'not_configured' as ProspectingApiStatus,
          statusLabel: 'Não configurado',
          statusMessage: 'Aguardando inicialização da API',
          dailyRequestsCount: 0,
          dailyRequestsLimit: 50,
          costControlActive: true,
          totalSearchesCount: 0,
          testedWithOfficialEndpoint: true
        })),
        ApiService.getProspectingDiagnostics().catch(() => null)
      ]);

      setPlaces(placesData);
      setDbStats(statsData);
      setApiConfig(configData);
      if (diagnosticsData && !latestDiagnostics) {
        setLatestDiagnostics(diagnosticsData);
      }
    } catch (err: any) {
      console.error('Falha ao carregar prospecção:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [environment, tierFilter, geoScope, neighborhood, city]);

  // Execute Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSearching(true);
      setActionNotice(null);
      setApiErrorMessage(null);

      const filter: LocalProspectingFilter = {
        city,
        neighborhood,
        segment: segment === 'Todos' ? '' : segment,
        radiusKm,
        onlyOpportunitiesAB: tierFilter === 'opportunities_ab',
        tierFilter,
        geoScope,
        searchQuery: searchQuery.trim() || undefined,
        environment
      };

      const result = await ApiService.searchProspectingPlaces(filter);
      setPlaces(result.places);
      setSourceUsed(result.sourceUsed);

      // Refresh config for daily counter and status
      const updatedConfig = await ApiService.getProspectingApiConfig().catch(() => null);
      if (updatedConfig) setApiConfig(updatedConfig);

      if (result.status === 'not_configured') {
        setApiErrorMessage(
          'Google Places API (New) não configurada. Em ambiente de Produção, nenhuma empresa fictícia é apresentada. Configure sua chave no painel abaixo.'
        );
      } else if (result.status === 'auth_error') {
        setApiErrorMessage(
          result.statusMessage || 'Erro de autenticação no Google Cloud. Verifique se a Places API (New) está habilitada no projeto.'
        );
      } else if (result.status === 'quota_exceeded') {
        setApiErrorMessage(
          result.statusMessage || 'Controle de custos ativo: limite de requisições atingido. Aguarde antes de realizar nova busca.'
        );
      } else {
        setActionNotice(
          `Pesquisa concluída: ${result.totalFound} estabelecimentos encontrados em ${neighborhood} (${city}). Fonte: ${result.sourceUsed}.`
        );
        setTimeout(() => setActionNotice(null), 6000);
      }
    } catch (err: any) {
      setApiErrorMessage(`Falha na pesquisa: ${err.message || 'Erro ao consultar estabelecimentos'}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Run High-Volume Intelligent Prospecting Campaign (Requirements 1, 2, 3, 5, 6, 7)
  const handleRunExpandedCampaign = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsExpandedSearching(true);
      setActionNotice(null);
      setApiErrorMessage(null);
      setSearchProgressText(`Iniciando varredura comercial em grande escala (Meta: ${targetGoal} empresas)...`);

      const filter: LocalProspectingFilter = {
        city,
        neighborhood,
        segment: segment === 'Todos' ? '' : segment,
        radiusKm,
        onlyOpportunitiesAB: tierFilter === 'opportunities_ab',
        tierFilter,
        geoScope,
        selectedSegments: selectedSegmentIds.length > 0 ? selectedSegmentIds : undefined,
        targetGoal,
        searchQuery: searchQuery.trim() || undefined,
        environment
      };

      const result = await ApiService.searchProspectingPlacesExpanded(filter);
      setLatestDiagnostics(result.diagnostics);
      setShowDiagnosticsPanel(true);
      setActionNotice(
        `Campanha concluída: ${result.places.length} novas empresas reais adicionadas à base de prospecção. ${result.message}`
      );

      // Refresh places from storage
      await fetchPlaces();

      // Refresh config & history
      const [updatedConfig, campaigns] = await Promise.all([
        ApiService.getProspectingApiConfig().catch(() => null),
        ApiService.getProspectingCampaigns().catch(() => [])
      ]);
      if (updatedConfig) setApiConfig(updatedConfig);
      if (campaigns) setCampaignHistory(campaigns);

      setTimeout(() => setActionNotice(null), 10000);
    } catch (err: any) {
      setApiErrorMessage(err.message || 'Falha na execução da campanha de prospecção');
    } finally {
      setIsExpandedSearching(false);
      setSearchProgressText('');
    }
  };

  const handleStopCampaign = async () => {
    try {
      setIsStoppingSearch(true);
      await ApiService.stopProspectingSearch();
      setActionNotice('Solicitação de parada enviada. Finalizando o lote de empresas em processamento...');
    } catch (err: any) {
      alert(`Falha ao interromper pesquisa: ${err.message}`);
    } finally {
      setIsStoppingSearch(false);
    }
  };

  const toggleSegmentSelection = (segId: string) => {
    setSelectedSegmentIds(prev => {
      if (prev.includes(segId)) {
        return prev.filter(id => id !== segId);
      } else {
        return [...prev, segId];
      }
    });
  };

  const selectAllSegments = () => {
    setSelectedSegmentIds(COMMERCIAL_SEGMENTS_CATALOG.map(s => s.id));
  };

  const clearAllSegments = () => {
    setSelectedSegmentIds([]);
  };

  // Run live Technical HTTP Audit
  const handleAuditSite = async (place: LocalProspectingPlace) => {
    if (!place.site) {
      alert('Esta empresa não possui endereço de website informado no cadastro do Google Maps.');
      return;
    }

    try {
      setAuditingPlaceId(place.id);
      const res = await ApiService.auditProspectingSite(place.id, place.site);

      // Determine updated siteStatusCategory based on verifiable audit
      let updatedCategory: SiteStatusCategory = 'site_funcional_sem_problema';
      if (res.tier === 'A') {
        updatedCategory = 'site_com_problema_comprovado';
      } else if (res.tier === 'inconclusivo') {
        updatedCategory = 'auditoria_inconclusiva';
      }

      const updatedPlace: LocalProspectingPlace = {
        ...place,
        auditResult: res.audit,
        opportunityTier: res.tier,
        siteStatusCategory: updatedCategory,
        opportunityReason: res.audit.problemsFound[0] || (res.tier === 'inconclusivo' ? 'Auditoria inconclusiva por WAF/bloqueio.' : 'Site auditado e operacional com SSL e responsividade.')
      };

      setPlaces(prev => prev.map(p => (p.id === place.id ? updatedPlace : p)));
      setActiveEvidencePlace(updatedPlace);

      // Refresh database stats
      const freshStats = await ApiService.getProspectingDatabaseStats().catch(() => null);
      if (freshStats) setDbStats(freshStats);
    } catch (err: any) {
      alert(`Falha na auditoria técnica: ${err.message || 'Erro durante requisição técnica'}`);
    } finally {
      setAuditingPlaceId(null);
    }
  };

  // Run Batch Audit on Pending Sites
  const handleBatchAuditPending = async () => {
    try {
      setIsAuditingPending(true);
      setActionNotice('Iniciando auditoria técnica real (DNS, HTTPS, SSL, HTTP Status) para empresas pendentes...');
      const res = await ApiService.batchAuditProspectingSites(undefined, true, 20);
      setDbStats(res.stats);
      setActionNotice(`Auditoria em lote finalizada: ${res.auditedCount} websites inspecionados via requisições técnicas.`);
      await fetchPlaces();
      setTimeout(() => setActionNotice(null), 8000);
    } catch (err: any) {
      alert(`Falha na auditoria em lote: ${err.message}`);
    } finally {
      setIsAuditingPending(false);
    }
  };

  // Generate Consultative Pitch
  const handleGeneratePitch = async (place: LocalProspectingPlace) => {
    try {
      setActivePitchPlace(place);
      setGeneratingPitch(true);
      setHumanReviewConfirmed(false);
      setPitchChannelTab('whatsapp');
      const pitch = await ApiService.generateProspectingPitch(place.id, place);
      const updatedPlace: LocalProspectingPlace = {
        ...place,
        commercialPitch: pitch
      };
      setActivePitchPlace(updatedPlace);
      setPlaces(prev => prev.map(p => (p.id === place.id ? updatedPlace : p)));
    } catch (err: any) {
      alert(`Erro ao gerar abordagem: ${err.message || 'Falha na IA'}`);
    } finally {
      setGeneratingPitch(false);
    }
  };

  // Convert to CRM Lead
  const handleConvertToLead = async (place: LocalProspectingPlace) => {
    try {
      setIsLoading(true);
      const result = await ApiService.convertProspectingPlaceToLead(place.id);
      if (result.success) {
        setPlaces(prev => prev.map(p => (p.id === place.id ? { ...p, crmLeadId: result.lead.id } : p)));
        alert(
          `Empresa "${place.name}" adicionada com sucesso ao Funil Comercial (CRM)!\n\nEstágio: ${
            result.lead.stageId === 'oportunidade_qualificada'
              ? 'Oportunidade Qualificada (Classe A)'
              : 'Empresa Identificada'
          }\nOrigem registrada: ${result.lead.source}`
        );
        if (onRefreshCrmData) onRefreshCrmData();
      }
    } catch (err: any) {
      alert(`Não foi possível adicionar ao CRM:\n${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark as Contacted
  const handleMarkContacted = async (place: LocalProspectingPlace) => {
    try {
      const updated = await ApiService.markProspectingPlaceContacted(place.id);
      setPlaces(prev => prev.map(p => (p.id === place.id ? updated : p)));
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  // Deduplicate
  const handleDeduplicate = async () => {
    try {
      setIsLoading(true);
      const res = await ApiService.deduplicateProspectingPlaces();
      alert(`Deduplicação concluída: ${res.totalRemoved} registros duplicados removidos. Total restante: ${res.remainingCount}.`);
      fetchPlaces();
    } catch (err: any) {
      alert(`Erro na deduplicação: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectPlace = (id: string) => {
    setSelectedPlaceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginatedPlaces.map(p => p.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedPlaceIds.has(id));

    setSelectedPlaceIds(prev => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach(id => next.delete(id));
      } else {
        pageIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedPlaceIds(new Set(filteredPlaces.map(p => p.id)));
  };

  const handleBatchImportToFunnel = async () => {
    if (selectedPlaceIds.size === 0) return;
    try {
      setIsBatchImporting(true);
      const res = await ApiService.batchConvertProspectingPlaces(Array.from(selectedPlaceIds));
      alert(res.message);
      setSelectedPlaceIds(new Set());
      if (onRefreshCrmData) onRefreshCrmData();
      fetchPlaces();
    } catch (err: any) {
      alert(`Falha na importação em lote: ${err.message}`);
    } finally {
      setIsBatchImporting(false);
    }
  };


  // Execute Real Search Test (Requirement 12: até 3 estabelecimentos em SBC)
  const handleTestRealSearch = async () => {
    try {
      setIsTestingRealSearch(true);
      setRealSearchError(null);
      setRealSearchTestResult(null);
      const res = await ApiService.testProspectingRealSearch();
      setRealSearchTestResult(res);
      if (res.places && res.places.length > 0) {
        setPlaces(res.places);
        setSourceUsed(res.sourceUsed);
      }
    } catch (err: any) {
      setRealSearchError(err.message || 'Falha ao executar teste de pesquisa na Places API (New)');
    } finally {
      setIsTestingRealSearch(false);
    }
  };

  // Filtered places according to tierFilter and searchQuery
  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      // 1. Opportunity tier filter
      if (tierFilter === 'opportunities_ab') {
        if (place.opportunityTier !== 'A' && place.opportunityTier !== 'B') return false;
      } else if (tierFilter === 'tier_a') {
        if (place.opportunityTier !== 'A') return false;
      } else if (tierFilter === 'tier_b') {
        if (place.opportunityTier !== 'B') return false;
      } else if (tierFilter === 'pending') {
        if (place.opportunityTier !== 'pendente') return false;
      } else if (tierFilter === 'tier_c') {
        if (place.opportunityTier !== 'C') return false;
      } else if (tierFilter === 'inconclusive') {
        if (place.opportunityTier !== 'inconclusivo') return false;
      } else if (tierFilter === 'in_crm') {
        if (!place.crmLeadId) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = place.name.toLowerCase().includes(q);
        const matchAddress = place.address.toLowerCase().includes(q);
        const matchPhone = place.phone.includes(q);
        const matchSite = (place.site || '').toLowerCase().includes(q);
        const matchSegment = place.segment.toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchPhone && !matchSite && !matchSegment) return false;
      }

      return true;
    });
  }, [places, tierFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPlaces.length / pageSize));
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedPlaces = filteredPlaces.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.min(Math.max(newPage, 1), totalPages));
  };

  return (
    <div className="space-y-6">
      {/* Demonstration Banner vs Production Alert */}
      {environment === 'demo' ? (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/60 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span>Modo Demonstração Ativo</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/30 text-amber-300 border border-amber-500/40">
                  Homologação
                </span>
              </div>
              <p className="text-xs text-amber-300/90 mt-0.5">
                Exibindo 4 empresas de exemplo para teste e validação dos fluxos de interface. Nenhuma dessas empresas deve ser tratada como resultado real.
              </p>
            </div>
          </div>
          {onToggleEnvironment && (
            <button
              onClick={() => onToggleEnvironment('producao')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold transition shrink-0"
            >
              Mudar para Produção
            </button>
          )}
        </div>
      ) : (
        /* Simplified Status Bar: Active or Inactive */
        <div className="p-4 rounded-2xl bg-[#0f1219] border border-[#21293a] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                apiConfig.status === 'connected'
                  ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-400'
                  : 'bg-rose-950/60 border-rose-600/60 text-rose-400'
              }`}
            >
              <Shield className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-400">Google Places API (New):</span>

                {apiConfig.status === 'connected' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-600 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Conectada e Ativa
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-700 flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    Inativa
                  </span>
                )}

                {apiConfig.placesApiKeyMasked && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#151a24] text-amber-300 border border-[#2b3548]">
                    {apiConfig.placesApiKeyMasked}
                  </span>
                )}

                <span className="text-[11px] text-slate-500">|</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  Cota Diária: <strong>{apiConfig.dailyRequestsCount}</strong> / {apiConfig.dailyRequestsLimit}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {apiConfig.status === 'connected'
                  ? 'Integração pronta para mapeamento de estabelecimentos em São Bernardo do Campo.'
                  : 'API não está ativa no backend. Verifique a chave configurada.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleTestRealSearch}
              disabled={isTestingRealSearch || apiConfig.status !== 'connected'}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-950/80 to-[#14231b] hover:from-emerald-900 hover:to-[#1a3325] border border-emerald-700/80 text-emerald-300 text-xs font-semibold transition disabled:opacity-50"
            >
              {isTestingRealSearch ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Testar Busca Real (3 SBC)</span>
            </button>
          </div>
        </div>
      )}

      {/* Taboão São Bernardo do Campo Priority Location Banner */}
      <div className="card-corporate p-5 rounded-2xl border border-amber-900/50 bg-gradient-to-r from-[#17140b] via-[#14151b] to-[#0c0e12]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/70 border border-amber-600/50 text-[#f5e7a9] text-xs font-semibold">
              <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
              LOCALIZAÇÃO PRIORITÁRIA: TABOÃO, SÃO BERNARDO DO CAMPO (SP)
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Prospecção Local Inteligente & Auditoria Web B2B
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mapeamento de empresas reais próximas à Fazer Meu Website que <strong className="text-white">não possuam site institucional identificado</strong> ou que <strong className="text-amber-300">apresentem problemas técnicos comprováveis</strong> (erros HTTP, sem SSL, quebra mobile).
            </p>
            {/* Anti-confusion note & Private B2B sector filter */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium bg-black/40 px-2.5 py-1 rounded border border-amber-800/30">
                <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  <strong>Atenção Geográfica:</strong> Bairro Taboão em São Bernardo do Campo (ABC Paulista, adjacente à Paulicéia e Diadema). Não confundir com o município de Taboão da Serra.
                </span>
              </div>
              <div className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300 font-medium bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-800/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Filtro Ativo:</strong> 100% Setor Privado Comercial (Governo, Autarquias e Política bloqueados).
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 shrink-0">
            <button
              onClick={handleDeduplicate}
              title="Exclui registros duplicados por Place ID, telefone ou domínio"
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#141720] hover:bg-[#1a202c] border border-[#262f3f] text-slate-300 text-xs font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Excluir Duplicados</span>
            </button>
          </div>
        </div>

        {/* Real Search Test Result Card */}
        {realSearchTestResult && (
          <div className="mt-4 pt-4 border-t border-[#232938] space-y-3">
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{realSearchTestResult.message}</span>
              </div>
              <button
                onClick={() => setRealSearchTestResult(null)}
                className="text-slate-400 hover:text-white text-xs underline font-medium"
              >
                Fechar Teste
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {realSearchTestResult.places.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="p-3 rounded-xl bg-[#121622] border border-[#232c3d] text-[11px] space-y-1.5 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center justify-between gap-1">
                      <span className="truncate">{p.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono shrink-0">
                        Places API (New)
                      </span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{p.address}</span>
                    </div>
                    {p.phone && (
                      <div className="text-slate-300 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{p.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-1.5 border-t border-[#1f2636] flex items-center justify-between">
                    <span className="text-[10px] text-amber-300">
                      {p.site ? 'Possui site no perfil' : 'Sem site no perfil do Maps'}
                    </span>
                    {p.mapsUrl && (
                      <a
                        href={p.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-amber-400 hover:text-amber-300 text-[10px] flex items-center gap-1 font-semibold"
                      >
                        <span>Ver no Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {realSearchError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Falha no Teste Real:</div>
                <p className="text-[11px] mt-0.5">{realSearchError}</p>
              </div>
            </div>
            <button
              onClick={() => setRealSearchError(null)}
              className="text-slate-400 hover:text-white text-xs underline font-medium"
            >
              Fechar
            </button>
          </div>
        )}
      </div>



      {/* Action Notice feedback */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* API Error Message / Guidance */}
      {apiErrorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-white">Aviso da Google Places API (New):</div>
            <p className="leading-relaxed">{apiErrorMessage}</p>
          </div>
        </div>
      )}

      {/* Engine Campaign & Search Control Panel */}
      <div className="card-corporate p-5 rounded-2xl border border-[#212735] space-y-5">
        {/* Top Header: Meta Operacional & Controles de Campanha */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#212735]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                Motor de Prospecção em Grande Escala — FMWS SALES
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Varredura comercial multi-ponto e multi-termo para identificação de empresas privadas sem site (Classe B) ou com falha técnica comprovada (Classe A).
            </p>
          </div>

          {/* Meta Operacional de Pesquisa (Requirement 7) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 bg-[#121622] p-2 rounded-xl border border-[#252f40]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 px-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Meta Alvo:</span>
            </span>
            <div className="flex items-center gap-1">
              {[50, 100, 250, 500, 1000].map(goal => (
                <button
                  type="button"
                  key={goal}
                  onClick={() => setTargetGoal(goal)}
                  disabled={isExpandedSearching}
                  className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${
                    targetGoal === goal
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#b89428] text-black shadow-sm font-black'
                      : 'bg-[#171b26] border border-[#262f40] text-slate-300 hover:text-white hover:border-[#d4af37]/40'
                  }`}
                >
                  {goal >= 1000 ? '1.000' : goal}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1. Cobertura Geográfica: Cidade, Bairro/Grade, Escopo Geográfico, Raio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Cidade */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" /> Cidade (Estado de SP)
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Todas Cidades SP</span>
            </label>
            <select
              value={city}
              disabled={isExpandedSearching}
              onChange={e => {
                const newCity = e.target.value;
                setCity(newCity);
                if (newCity !== 'São Bernardo do Campo') {
                  setNeighborhood('Todos');
                } else {
                  setNeighborhood('Taboão');
                }
                setCurrentPage(1);
              }}
              className="w-full bg-[#13161d] border border-[#252c3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/70"
            >
              {SP_CITIES_CATALOG.map(group => (
                <optgroup key={group.group} label={group.group} className="bg-[#10131a] text-amber-300 font-semibold">
                  {group.cities.map(c => (
                    <option key={c} value={c} className="bg-[#181c26] text-white font-normal">
                      {c === 'São Bernardo do Campo' ? '★ São Bernardo do Campo (SBC)' : c}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Bairro / Grade de Coordenadas */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span>Bairro de Referência</span>
              {city === 'São Bernardo do Campo' && <span className="text-[#d4af37] font-mono text-[10px]">15 Bairros</span>}
            </label>
            <select
              value={neighborhood}
              disabled={isExpandedSearching}
              onChange={e => {
                setNeighborhood(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#13161d] border border-[#252c3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/70 font-semibold text-amber-300"
            >
              {city === 'São Bernardo do Campo' ? (
                <>
                  <option value="Todos" className="font-bold text-amber-400">★ Grade Completa: Todos os 15 Bairros de SBC (Multi-Ponto)</option>
                  <option value="Taboão">★ Taboão (Prioritário FMWS)</option>
                  <option value="Paulicéia">Paulicéia</option>
                  <option value="Planalto">Planalto</option>
                  <option value="Rudge Ramos">Rudge Ramos</option>
                  <option value="Centro">Centro (SBC)</option>
                  <option value="Baeta Neves">Baeta Neves</option>
                  <option value="Assunção">Assunção</option>
                  <option value="Demarchi">Demarchi</option>
                  <option value="Ferrazópolis">Ferrazópolis</option>
                  <option value="Alvarenga">Alvarenga</option>
                  <option value="Cooperativa">Cooperativa</option>
                  <option value="Nova Petrópolis">Nova Petrópolis</option>
                  <option value="Riacho Grande">Riacho Grande</option>
                  <option value="Bairro dos Casa">Bairro dos Casa</option>
                  <option value="Independência">Independência</option>
                </>
              ) : (
                <>
                  <option value="Todos">★ Grade Completa: Toda a Cidade ({city})</option>
                  <option value="Centro">Centro / Região Comercial Central</option>
                  <option value="Distrito Industrial">Distrito Industrial & Comercial</option>
                </>
              )}
            </select>
          </div>

          {/* Escopo Geográfico (Requirement 6) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Compass className="w-3 h-3 text-amber-400" /> Escopo Geográfico
              </span>
            </label>
            <select
              value={geoScope}
              disabled={isExpandedSearching}
              onChange={e => {
                setGeoScope(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-[#13161d] border border-[#252c3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/70 text-emerald-300 font-semibold"
            >
              <option value="city">Toda a Cidade ({city})</option>
              <option value="search_neighborhood">Apenas o Bairro Selecionado ({neighborhood})</option>
              <option value="radius">Raio Geográfico ({radiusKm}km do centro)</option>
            </select>
          </div>

          {/* Raio Geográfico Configurável */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Raio por Ponto de Busca
            </label>
            <div className="flex items-center gap-1 bg-[#13161d] border border-[#252c3b] rounded-lg p-1">
              {([2, 5, 10, 15, 20, 25] as const).map(r => (
                <button
                  type="button"
                  key={r}
                  disabled={isExpandedSearching}
                  onClick={() => setRadiusKm(r)}
                  className={`flex-1 py-1 text-[11px] rounded font-semibold transition ${
                    radiusKm === r ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* Busca Rápida / Palavra-Chave Opcional */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Palavra-chave Adicional
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: tornearia, calhas, estética..."
                value={searchQuery}
                disabled={isExpandedSearching}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#13161d] border border-[#252c3b] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-amber-500/70 placeholder-slate-600"
              />
            </div>
          </div>
        </div>

        {/* 2. Seleção Inteligente de Segmentos Comerciais (Requirement 2) */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>10 Verticais Comerciais Inteligentes (Pesquisa com Sub-Termos Especializados):</span>
            </span>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllSegments}
                disabled={isExpandedSearching}
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                Selecionar Todas (10)
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={clearAllSegments}
                disabled={isExpandedSearching}
                className="text-[11px] text-slate-400 hover:text-white"
              >
                Limpar Seleção
              </button>
            </div>
          </div>

          {/* Grid de 10 Categorias Comerciais */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
            {COMMERCIAL_SEGMENTS_CATALOG.map(segDef => {
              const isSelected = selectedSegmentIds.includes(segDef.id);
              return (
                <button
                  type="button"
                  key={segDef.id}
                  onClick={() => toggleSegmentSelection(segDef.id)}
                  disabled={isExpandedSearching}
                  title={segDef.description}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-[#1c1912] border-amber-500/60 text-white shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-[#12151c] border-[#222938] text-slate-400 hover:bg-[#181d28] hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={isSelected ? 'text-amber-400' : 'text-slate-500'}>
                      {renderSegmentIcon(segDef.iconName, 'w-4 h-4')}
                    </span>
                    <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-amber-500 text-black' : 'border border-[#2f394c] text-transparent'
                    }`}>
                      ✓
                    </span>
                  </div>
                  <span className="font-semibold text-[11px] leading-tight line-clamp-2">
                    {segDef.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Barra de Ação da Campanha & Botões Operacionais */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-[#212735]">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Principal: Iniciar Varredura em Grande Escala */}
            {!isExpandedSearching ? (
              <button
                type="button"
                onClick={handleRunExpandedCampaign}
                disabled={apiConfig.status !== 'connected' || selectedSegmentIds.length === 0}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#c5a059] to-[#aa8214] hover:brightness-110 text-black font-extrabold text-xs transition shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>Iniciar Prospecção em Grande Escala (Meta: {targetGoal >= 1000 ? '1.000' : targetGoal} Empresas)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStopCampaign}
                  disabled={isStoppingSearch}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-md animate-pulse"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>{isStoppingSearch ? 'Parando...' : 'Interromper Pesquisa'}</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-800/40">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="font-medium">{searchProgressText || 'Processando consultas...'}</span>
                </div>
              </div>
            )}

            {/* Pesquisa Simples de Ponto Único */}
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || isExpandedSearching}
              className="px-3.5 py-2.5 rounded-xl bg-[#141822] hover:bg-[#1c2230] border border-[#273142] text-slate-300 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              title="Executa apenas 1 consulta padrão para checagem rápida"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
              <span>Consulta Rápida (1 Ponto)</span>
            </button>
          </div>

          {/* Botões de Diagnóstico, Auditoria em Lote e Histórico */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchAuditPending}
              disabled={isAuditingPending || dbStats.totalPending === 0}
              className="px-3 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-700/80 text-purple-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
              title="Dispara auditoria técnica direta (DNS/SSL/HTTP) para estabelecimentos com site pendente de laudo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditingPending ? 'animate-spin text-purple-400' : 'text-purple-400'}`} />
              <span>Auditar Pendentes em Lote ({dbStats.totalPending})</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDiagnosticsPanel(prev => !prev)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 ${
                showDiagnosticsPanel
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-[#121622] border-[#252f40] text-slate-300 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Diagnóstico da Campanha</span>
              {latestDiagnostics && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-2 rounded-xl bg-[#121622] border border-[#252f40] text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Histórico de Campanhas</span>
            </button>
          </div>
        </div>

        {/* 4. Painel de Diagnóstico da Última Campanha (Distinto do Total da Base) */}
        {(showDiagnosticsPanel || latestDiagnostics) && latestDiagnostics && (
          <div className="p-4 rounded-xl bg-[#0f121a] border border-[#232c3f] space-y-3 pt-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1f2638] pb-2 gap-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Resultado da Última Campanha de Varredura ({new Date(latestDiagnostics.lastRunAt).toLocaleDateString('pt-BR')})
                  </h4>
                  <span className="text-[10px] text-amber-300/80 block">
                    Balanço da execução recente do motor de busca — não confundir com os totais acumulados na base persistida abaixo.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span>Tempo: {(latestDiagnostics.executionTimeMs / 1000).toFixed(1)}s</span>
                <span>•</span>
                <span>{latestDiagnostics.queriesExecuted} consultas</span>
                <span>•</span>
                <span>{latestDiagnostics.pagesFetched} páginas</span>
              </div>
            </div>

            {/* Diagnostic Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
              {/* Recebidas */}
              <div className="p-3 rounded-xl bg-[#141824] border border-[#222a3d] space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Recebidas da API:</span>
                <span className="text-lg font-bold font-mono text-white">{latestDiagnostics.totalRawReceived}</span>
                <span className="text-[10px] text-slate-500 block">Total bruto retornado</span>
              </div>

              {/* Descartadas: Governo / Política */}
              <div className="p-3 rounded-xl bg-[#18141c] border border-rose-900/40 space-y-1">
                <span className="text-[10px] text-rose-300 font-semibold block uppercase">Bloqueio Governamental:</span>
                <span className="text-lg font-bold font-mono text-rose-400">{latestDiagnostics.discardedGovernment}</span>
                <span className="text-[10px] text-rose-300/70 block">Órgãos públicos/políticos</span>
              </div>

              {/* Descartadas: Duplicadas */}
              <div className="p-3 rounded-xl bg-[#171720] border border-amber-900/30 space-y-1">
                <span className="text-[10px] text-amber-300 font-semibold block uppercase">Descarte Duplicidade:</span>
                <span className="text-lg font-bold font-mono text-amber-400">{latestDiagnostics.discardedDuplicates}</span>
                <span className="text-[10px] text-amber-300/70 block">Place ID / Telefone / Nome</span>
              </div>

              {/* Descartadas: Já no CRM */}
              <div className="p-3 rounded-xl bg-[#141b22] border border-sky-900/40 space-y-1">
                <span className="text-[10px] text-sky-300 font-semibold block uppercase">Já no CRM Comercial:</span>
                <span className="text-lg font-bold font-mono text-sky-400">{latestDiagnostics.discardedAlreadyInCrm}</span>
                <span className="text-[10px] text-sky-300/70 block">Ignoradas p/ não duplicar</span>
              </div>

              {/* Aproveitadas & Salvas */}
              <div className="p-3 rounded-xl bg-[#132019] border border-emerald-800/50 space-y-1">
                <span className="text-[10px] text-emerald-300 font-semibold block uppercase">Novas Salvas nesta Campanha:</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{latestDiagnostics.totalAdded}</span>
                <span className="text-[10px] text-emerald-300/70 block">Adicionadas à base</span>
              </div>
            </div>

            {/* Classification breakdown & Stop reason */}
            <div className="p-3 rounded-xl bg-[#121622] border border-[#212b3e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-semibold">Distribuição desta Campanha:</span>
                <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold text-[11px]">
                  🔴 Classe A: {latestDiagnostics.classACount}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold text-[11px]">
                  🟡 Classe B: {latestDiagnostics.classBCount}
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold text-[11px]">
                  ⏳ Pendente: {latestDiagnostics.pendingCount ?? (latestDiagnostics.totalAdded - latestDiagnostics.classACount - latestDiagnostics.classBCount - latestDiagnostics.classCCount)}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold text-[11px]">
                  🟢 Classe C: {latestDiagnostics.classCCount}
                </span>
              </div>

              <div className="text-[11px] text-slate-300">
                <strong className="text-amber-400">Motivo de Parada:</strong> {latestDiagnostics.stopReason}
              </div>
            </div>
          </div>
        )}

        {/* Sub-bar with Quick Opportunity Filter and Text Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-[#1f2634] text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>Filtro de Qualificação:</span>
            </span>

            <button
              type="button"
              onClick={() => {
                setTierFilter('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'all'
                  ? 'bg-slate-200 text-black font-bold border-white'
                  : 'bg-[#151822] border-[#293245] text-slate-300 hover:text-white hover:bg-[#1c2230]'
              }`}
            >
              <span>Todas ({dbStats.totalInDb})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('opportunities_ab');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-bold text-xs transition ${
                tierFilter === 'opportunities_ab'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-amber-300 hover:bg-[#1c2230]'
              }`}
            >
              <span>🎯 Oportunidades A+B</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'opportunities_ab' ? 'bg-black/40 text-white' : 'bg-amber-950 text-amber-300 border border-amber-700'
              }`}>
                {dbStats.totalOpportunitiesAB}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('tier_a');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'tier_a'
                  ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-rose-300 hover:bg-[#1c2230]'
              }`}
            >
              <span>🔴 Classe A</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'tier_a' ? 'bg-black/40 text-white' : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {dbStats.totalClassA}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('tier_b');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'tier_b'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-amber-300 hover:bg-[#1c2230]'
              }`}
            >
              <span>🟡 Classe B</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'tier_b' ? 'bg-black/40 text-white' : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {dbStats.totalClassB}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('pending');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'pending'
                  ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-purple-300 hover:bg-[#1c2230]'
              }`}
            >
              <span>⏳ Pendentes</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'pending' ? 'bg-black/40 text-white' : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}>
                {dbStats.totalPending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('tier_c');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'tier_c'
                  ? 'bg-emerald-600 text-black border-emerald-500 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-emerald-300 hover:bg-[#1c2230]'
              }`}
            >
              <span>🟢 Classe C</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'tier_c' ? 'bg-black/40 text-white' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}>
                {dbStats.totalClassC}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('inconclusive');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'inconclusive'
                  ? 'bg-slate-700 text-white border-slate-500 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-slate-400 hover:bg-[#1c2230]'
              }`}
            >
              <span>⚠️ Inconclusivos</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'inconclusive' ? 'bg-black/40 text-white' : 'bg-slate-900 text-slate-300 border border-slate-700'
              }`}>
                {dbStats.totalInconclusive}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTierFilter('in_crm');
                setCurrentPage(1);
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition ${
                tierFilter === 'in_crm'
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md'
                  : 'bg-[#151822] border-[#293245] text-sky-300 hover:bg-[#1c2230]'
              }`}
            >
              <span>💼 No CRM</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                tierFilter === 'in_crm' ? 'bg-black/40 text-white' : 'bg-sky-950 text-sky-300 border border-sky-800'
              }`}>
                {dbStats.totalInCrm}
              </span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, rua ou telefone..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full bg-[#12151c] border border-[#232a38] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
            />
          </div>
        </div>
      </div>

      {/* Persisted Database Counters — Single Source of Truth from backend */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Totais Acumulados na Base Persistida (Única Fonte da Verdade):
          </span>
          <span className="font-mono text-[11px] text-amber-300/80">
            Total na Base ({dbStats.totalInDb}) = A ({dbStats.totalClassA}) + B ({dbStats.totalClassB}) + Pendente ({dbStats.totalPending}) + C ({dbStats.totalClassC}) + Inconclusivo ({dbStats.totalInconclusive})
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* 1. Oportunidades A+B */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('opportunities_ab');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'opportunities_ab'
                ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50 shadow-md'
                : 'border-[#222836] hover:border-amber-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-tight">Oportunidades A+B</div>
            <div className="text-xl font-black text-amber-200 mt-1 font-mono">{dbStats.totalOpportunitiesAB}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Sem site + c/ defeito</div>
          </button>

          {/* 2. Classe A */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('tier_a');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'tier_a'
                ? 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500/50 shadow-md'
                : 'border-rose-950/60 bg-rose-950/10 hover:border-rose-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-rose-300 uppercase tracking-tight">🔴 Classe A</div>
            <div className="text-xl font-black text-rose-200 mt-1 font-mono">{dbStats.totalClassA}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Problema técnico real</div>
          </button>

          {/* 3. Classe B */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('tier_b');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'tier_b'
                ? 'border-amber-500 bg-amber-950/40 ring-1 ring-amber-500/50 shadow-md'
                : 'border-amber-950/60 bg-amber-950/10 hover:border-amber-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-amber-300 uppercase tracking-tight">🟡 Classe B</div>
            <div className="text-xl font-black text-amber-200 mt-1 font-mono">{dbStats.totalClassB}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Sem site no Maps</div>
          </button>

          {/* 4. Pendente */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('pending');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'pending'
                ? 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500/50 shadow-md'
                : 'border-purple-950/60 bg-purple-950/10 hover:border-purple-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-tight">⏳ Pendente</div>
            <div className="text-xl font-black text-purple-200 mt-1 font-mono">{dbStats.totalPending}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Aguarda auditoria</div>
          </button>

          {/* 5. Classe C */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('tier_c');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'tier_c'
                ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50 shadow-md'
                : 'border-emerald-950/60 bg-emerald-950/10 hover:border-emerald-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-tight">🟢 Classe C</div>
            <div className="text-xl font-black text-emerald-200 mt-1 font-mono">{dbStats.totalClassC}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Auditado saudável</div>
          </button>

          {/* 6. Inconclusivo */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('inconclusive');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'inconclusive'
                ? 'border-slate-500 bg-slate-900/60 ring-1 ring-slate-400/50 shadow-md'
                : 'border-slate-800 bg-[#12151c] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">⚠️ Inconclusivo</div>
            <div className="text-xl font-black text-slate-200 mt-1 font-mono">{dbStats.totalInconclusive}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">WAF / Bloqueio</div>
          </button>

          {/* 7. Total na Base */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('all');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'all'
                ? 'border-white bg-slate-800/60 ring-1 ring-white/50 shadow-md'
                : 'border-[#222836] bg-[#141822] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Total Base</div>
            <div className="text-xl font-black text-white mt-1 font-mono">{dbStats.totalInDb}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Acumulado histórico</div>
          </button>

          {/* 8. No CRM */}
          <button
            type="button"
            onClick={() => {
              setTierFilter('in_crm');
              setCurrentPage(1);
            }}
            className={`card-corporate p-3 rounded-xl border text-left transition ${
              tierFilter === 'in_crm'
                ? 'border-sky-500 bg-sky-950/40 ring-1 ring-sky-500/50 shadow-md'
                : 'border-sky-950/60 bg-sky-950/10 hover:border-sky-700/60'
            }`}
          >
            <div className="text-[10px] font-bold text-sky-300 uppercase tracking-tight">💼 No CRM</div>
            <div className="text-xl font-black text-sky-200 mt-1 font-mono">{dbStats.totalInCrm}</div>
            <div className="text-[9px] text-slate-400 mt-0.5">Leads ativos</div>
          </button>
        </div>
      </div>

      {/* Empty State in Production when API is not configured */}
      {environment === 'producao' && !apiConfig.hasGooglePlacesKey && places.length === 0 && (
        <div className="card-corporate p-8 rounded-2xl border border-amber-900/40 text-center space-y-4 max-w-2xl mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400 mx-auto">
            <Key className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-white">Google Places API (New) Não Configurada em Produção</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O FMWS SALES adota integridade estrita de dados: <strong>não gera empresas, telefones ou sites fictícios</strong>. Para pesquisar estabelecimentos reais no bairro Taboão e SBC com identificadores oficiais da Google Maps Platform, conecte sua chave de API segura.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={fetchPlaces}
              className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black text-xs font-bold rounded-xl hover:brightness-110 transition shadow flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar Conexão Novamente</span>
            </button>
            {onToggleEnvironment && (
              <button
                onClick={() => onToggleEnvironment('demo')}
                className="px-4 py-2 bg-[#161a24] hover:bg-[#1f2533] border border-[#2a3447] text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Alternar para Modo Demonstração
              </button>
            )}
          </div>
        </div>
      )}

      {/* Batch Import Action Banner */}
      {selectedPlaceIds.size > 0 && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/90 via-[#181d28] to-[#121620] border border-amber-600/70 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-[#f5e7a9] border border-amber-500/40 flex items-center justify-center font-bold text-xs">
              {selectedPlaceIds.size}
            </div>
            <div>
              <div className="font-bold text-white text-xs flex items-center gap-2">
                <span>{selectedPlaceIds.size === 1 ? '1 empresa selecionada' : `${selectedPlaceIds.size} empresas selecionadas`}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  Prontas para o Funil
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Importação em lote com classificação automática para o pipeline do SDR.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setSelectedPlaceIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-[#141720] hover:bg-[#1a202c] border border-[#262f3f] text-slate-300 text-xs font-medium transition"
            >
              Desmarcar Todas
            </button>

            <button
              onClick={handleBatchImportToFunnel}
              disabled={isBatchImporting}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black text-xs font-bold hover:brightness-110 transition shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              {isBatchImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Importando para o Funil...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Importar Selecionadas para o CRM</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Prospecting List Table */}
      {(environment === 'demo' || apiConfig.hasGooglePlacesKey || places.length > 0) && (
        <div className="card-corporate rounded-2xl border border-[#202635] overflow-hidden">
          <div className="p-4 border-b border-[#202635] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Compass className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Lista de Prospecção — {city} {neighborhood !== 'Todos' ? `(${neighborhood})` : ''}
              </h4>
              <span className="text-[11px] text-amber-400/90 font-mono font-medium">
                ({paginatedPlaces.length} exibidas na página | {filteredPlaces.length} qualificadas após filtros | {dbStats.totalInDb} total acumulado na base)
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Seletor de quantidade de empresas por página */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span className="text-[11px] text-slate-400 font-medium">Exibir:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  aria-label="Quantidade de empresas por página"
                  className="bg-[#12151c] text-white border border-[#262f40] rounded-lg px-2.5 py-1 text-xs focus:border-[#d4af37] focus:outline-none cursor-pointer"
                  title="Selecionar quantidade de empresas a exibir por página"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>

              {filteredPlaces.length > paginatedPlaces.length && (
                <button
                  onClick={selectAllFiltered}
                  className="text-[11px] text-amber-300/80 hover:text-amber-300 underline font-medium transition"
                  title="Selecionar todas as empresas filtradas de todas as páginas"
                >
                  Selecionar todas ({filteredPlaces.length})
                </button>
              )}

              <button
                onClick={fetchPlaces}
                disabled={isLoading}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#12151d] border-b border-[#1f2636] text-slate-400 font-semibold text-[11px]">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todas as empresas da página atual"
                      checked={paginatedPlaces.length > 0 && paginatedPlaces.every(p => selectedPlaceIds.has(p.id))}
                      onChange={toggleSelectAll}
                      className="rounded border-[#2c3546] text-amber-500 focus:ring-0 focus:outline-none cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4">Empresa / Endereço</th>
                  <th className="py-3 px-3">Bairro / Cidade</th>
                  <th className="py-3 px-3">Segmento</th>
                  <th className="py-3 px-3">Presença Web / Google Maps</th>
                  <th className="py-3 px-3">Classificação</th>
                  <th className="py-3 px-3 max-w-xs">Diagnóstico & Evidência</th>
                  <th className="py-3 px-3">Status CRM</th>
                  <th className="py-3 px-4 text-right">Ações Comerciais</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a202c]">
                {filteredPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <Compass className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                      <p className="font-medium text-slate-300">Nenhum estabelecimento localizado com os filtros selecionados.</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Tente alterar o filtro de qualificação ou selecionar outra cidade/bairro.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedPlaces.map(place => (
                    <tr
                      key={place.id}
                      className={`hover:bg-[#141822] transition ${
                        selectedPlaceIds.has(place.id) ? 'bg-[#181d28]/70' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar empresa ${place.name}`}
                          checked={selectedPlaceIds.has(place.id)}
                          onChange={() => toggleSelectPlace(place.id)}
                          className="rounded border-[#2c3546] text-amber-500 focus:ring-0 focus:outline-none cursor-pointer"
                        />
                      </td>

                      {/* Empresa / Endereço */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white text-xs">{place.name}</span>
                          {place.isDemoRecord && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/70 text-amber-400 border border-amber-800 uppercase font-mono">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-xs" title={place.address}>
                            {place.address}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {place.phone && (
                            <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5 text-slate-500" /> {place.phone}
                            </span>
                          )}
                          {place.mapsUrl && (
                            <a
                              href={place.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-amber-400 hover:underline flex items-center gap-0.5 font-medium"
                            >
                              Google Maps <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <span className="text-[9px] text-slate-500 font-mono truncate max-w-[100px]" title={`Place ID: ${place.sourceId}`}>
                            ID: {place.sourceId.slice(0, 10)}...
                          </span>
                        </div>
                      </td>

                      {/* Bairro / Cidade */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#171b25] border border-[#242b3a] text-slate-300 font-medium text-[11px]">
                          {place.realNeighborhood || place.neighborhood}
                        </span>
                        {place.realNeighborhood && place.searchNeighborhood && place.realNeighborhood !== place.searchNeighborhood && (
                          <span className="text-[9px] text-slate-500 block mt-0.5">
                            Ref: {place.searchNeighborhood}
                          </span>
                        )}
                      </td>

                      {/* Segmento */}
                      <td className="py-3 px-3 text-slate-300 text-[11px]">
                        {place.segment}
                      </td>

                      {/* Presença Web: Strict Differentiation (Requirements 2, 4, 7) */}
                      <td className="py-3 px-3">
                        {place.site ? (
                          <div className="space-y-1">
                            <a
                              href={place.site}
                              target="_blank"
                              rel="noreferrer"
                              className="text-amber-400 hover:underline flex items-center gap-1 font-mono text-[11px] truncate max-w-[140px]"
                              title={place.site}
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{place.site.replace(/^(https?:\/\/)?(www\.)?/, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              {place.auditResult ? (
                                place.opportunityTier === 'A' ? (
                                  <span className="text-rose-400 font-semibold">Falha técnica comprovada</span>
                                ) : place.opportunityTier === 'C' ? (
                                  <span className="text-emerald-400 font-semibold">Auditado: Saudável (SSL + Viewport)</span>
                                ) : (
                                  <span className="text-amber-400 font-semibold">Inconclusivo (WAF/Bloqueio)</span>
                                )
                              ) : (
                                <span className="text-purple-300 font-medium">Aguardando Auditoria</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          /* Requirement 7: Never automatically state "sem site" as definitive truth */
                          <div className="space-y-0.5">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/60 font-medium flex items-center gap-1 w-max">
                              <HelpCircle className="w-3 h-3 text-amber-400" />
                              Sem website informado no Google Maps
                            </span>
                            <span className="text-[9px] text-slate-400 block italic">
                              Sujeito à confirmação com o decisor
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Classificação Tier (Requirements 2: A, B, C, Pendente, Inconclusivo) */}
                      <td className="py-3 px-3">
                        {place.opportunityTier === 'A' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 w-max">
                            <ShieldAlert className="w-3 h-3 text-rose-400" /> Classe A (Problema)
                          </span>
                        )}
                        {place.opportunityTier === 'B' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 w-max">
                            <HelpCircle className="w-3 h-3 text-amber-400" /> Classe B (Sem Site)
                          </span>
                        )}
                        {place.opportunityTier === 'pendente' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3 text-purple-400" /> Pendente
                          </span>
                        )}
                        {place.opportunityTier === 'C' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 w-max">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Classe C (Saudável)
                          </span>
                        )}
                        {place.opportunityTier === 'inconclusivo' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-700 flex items-center gap-1 w-max">
                            <AlertCircle className="w-3 h-3 text-amber-400" /> Inconclusivo
                          </span>
                        )}
                      </td>

                      {/* Diagnóstico & Evidência Verificável */}
                      <td className="py-3 px-3 max-w-xs">
                        <p className="text-[11px] text-slate-300 line-clamp-2" title={place.opportunityReason}>
                          {place.opportunityReason}
                        </p>
                        {place.auditResult && (
                          <button
                            onClick={() => setActiveEvidencePlace(place)}
                            className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 mt-1 font-semibold"
                          >
                            <Eye className="w-3 h-3" /> Ver laudo técnico comprovado
                          </button>
                        )}
                      </td>

                      {/* Status CRM */}
                      <td className="py-3 px-3">
                        {place.crmLeadId ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-bold uppercase">
                            No CRM
                          </span>
                        ) : place.isContacted ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 font-bold uppercase">
                            Contatada
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#171b26] text-slate-400 border border-[#273042] font-semibold uppercase">
                            Nova
                          </span>
                        )}
                      </td>

                      {/* Ações Comerciais */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {place.site && (
                            <button
                              onClick={() => handleAuditSite(place)}
                              disabled={auditingPlaceId === place.id}
                              title="Auditar com IA / Validação Técnica Real (DNS, SSL, HTTP Status)"
                              className="px-2 py-1 rounded-lg bg-[#181c26] hover:bg-[#222838] border border-[#293245] text-slate-300 hover:text-white transition disabled:opacity-50 text-[11px] flex items-center gap-1"
                            >
                              <RefreshCw className={`w-3 h-3 ${auditingPlaceId === place.id ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
                              <span>{place.auditResult ? 'Reauditar' : 'Auditar Site'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleGeneratePitch(place)}
                            title="Gerar Proposta de Melhoria / Abordagem Consultiva com diferencial de design sem custo"
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1 transition"
                          >
                            <Sparkles className="w-3 h-3 text-[#d4af37]" />
                            <span>Abordagem IA</span>
                          </button>

                          {!place.crmLeadId ? (
                            <button
                              onClick={() => handleConvertToLead(place)}
                              title="Adicionar ao CRM comercial como Lead (com validação prévia de duplicidade)"
                              className="p-1.5 rounded-lg bg-[#141e17] hover:bg-emerald-950/70 border border-emerald-700/50 text-emerald-300 hover:text-emerald-200 transition"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span
                              title="Já cadastrado no funil comercial"
                              className="p-1.5 text-emerald-400 opacity-60"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredPlaces.length > 0 && (
            <div className="p-3.5 bg-[#0f1218] border-t border-[#1f2636] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-400 text-[11px]">
                Exibindo <span className="font-semibold text-white">{startIndex + 1}</span> a{' '}
                <span className="font-semibold text-white">{Math.min(endIndex, filteredPlaces.length)}</span> de{' '}
                <span className="font-semibold text-amber-400">{filteredPlaces.length}</span> empresas qualificadas
                {totalPages > 1 && (
                  <span className="ml-2 text-slate-500 font-mono">
                    (Página {validCurrentPage} de {totalPages})
                  </span>
                )}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={validCurrentPage === 1}
                    title="Primeira Página"
                    className="p-1.5 rounded-lg bg-[#141822] border border-[#232b3b] text-slate-400 hover:text-white hover:border-[#d4af37]/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(validCurrentPage - 1)}
                    disabled={validCurrentPage === 1}
                    title="Página Anterior"
                    className="p-1.5 rounded-lg bg-[#141822] border border-[#232b3b] text-slate-400 hover:text-white hover:border-[#d4af37]/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Numeric Page Buttons */}
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => {
                        if (totalPages <= 7) return true;
                        if (p === 1 || p === totalPages) return true;
                        if (Math.abs(p - validCurrentPage) <= 1) return true;
                        return false;
                      })
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsisBefore = prev && p - prev > 1;

                        return (
                          <React.Fragment key={p}>
                            {showEllipsisBefore && (
                              <span className="text-slate-600 px-1 font-mono text-[11px]">...</span>
                            )}
                            <button
                              onClick={() => handlePageChange(p)}
                              className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${
                                validCurrentPage === p
                                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b89428] text-black shadow font-bold'
                                  : 'bg-[#141822] border border-[#232b3b] text-slate-300 hover:text-white hover:border-[#d4af37]/40'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(validCurrentPage + 1)}
                    disabled={validCurrentPage === totalPages}
                    title="Próxima Página"
                    className="p-1.5 rounded-lg bg-[#141822] border border-[#232b3b] text-slate-400 hover:text-white hover:border-[#d4af37]/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={validCurrentPage === totalPages}
                    title="Última Página"
                    className="p-1.5 rounded-lg bg-[#141822] border border-[#232b3b] text-slate-400 hover:text-white hover:border-[#d4af37]/40 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Technical Evidence Viewer (Audit) — Verifiable facts only, NO fake Lighthouse */}
      {activeEvidencePlace && activeEvidencePlace.auditResult && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-corporate max-w-2xl w-full rounded-2xl border border-amber-900/60 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#212735]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Laudo de Auditoria Técnica de Presença Web</h3>
                  <p className="text-xs text-slate-400 font-mono">{activeEvidencePlace.name}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveEvidencePlace(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Evidence details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2636] grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Resposta HTTP:</span>
                  <span className="font-mono font-bold text-white text-xs">
                    {activeEvidencePlace.auditResult.statusCode ? `Código ${activeEvidencePlace.auditResult.statusCode}` : 'Erro / Timeout'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Tempo de Resposta:</span>
                  <span className="font-mono font-bold text-amber-300 text-xs">
                    {activeEvidencePlace.auditResult.responseTimeMs || 0} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Certificado SSL:</span>
                  <span
                    className={`font-semibold text-xs ${
                      activeEvidencePlace.auditResult.hasSsl ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeEvidencePlace.auditResult.hasSsl ? 'HTTPS Ativo' : 'Não Seguro (HTTP)'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">Responsivo Mobile:</span>
                  <span
                    className={`font-semibold text-xs ${
                      activeEvidencePlace.auditResult.hasViewport ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {activeEvidencePlace.auditResult.hasViewport ? 'Meta Viewport Presente' : 'Não Responsivo'}
                  </span>
                </div>
              </div>

              {/* Verified Problems List */}
              <div>
                <h5 className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Inconformidades Técnicas Comprovadas:
                </h5>
                {activeEvidencePlace.auditResult.problemsFound.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                    Nenhum problema grave de acessibilidade, segurança ou responsividade detectado nesta requisição.
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {activeEvidencePlace.auditResult.problemsFound.map((prob, i) => (
                      <li
                        key={i}
                        className="p-2.5 rounded-lg bg-[#141822] border border-[#222a3a] text-slate-300 flex items-start gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                        <span>{prob}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Exact Evidence String */}
              <div>
                <h5 className="font-semibold text-slate-200 mb-1">Evidência Registrada no Laudo Técnico:</h5>
                <div className="p-3 rounded-lg bg-[#0a0c10] border border-[#1e2433] text-[11px] text-slate-300 font-mono leading-relaxed">
                  {activeEvidencePlace.auditResult.evidenceText}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-[#1f2636] gap-1">
                <span>URL Testada: <strong className="text-slate-300">{activeEvidencePlace.auditResult.url}</strong></span>
                <span>Horário: {new Date(activeEvidencePlace.auditResult.checkedAt).toLocaleString('pt-BR')}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                Ferramenta: {activeEvidencePlace.auditResult.toolUsed || 'HTTP/TLS Protocol Verifier (Backend Direct)'}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const place = activeEvidencePlace;
                  setActiveEvidencePlace(null);
                  handleGeneratePitch(place);
                }}
                className="px-3.5 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-xl hover:brightness-110 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Formular Abordagem com IA</span>
              </button>
              <button
                onClick={() => setActiveEvidencePlace(null)}
                className="px-3.5 py-2 rounded-xl bg-[#141720] border border-[#262f3f] text-slate-300 text-xs font-semibold hover:bg-[#1a202c] transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Pitch & Approach Generator Modal — Enhanced with 12 Compliance Rules */}
      {activePitchPlace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-corporate max-w-3xl w-full rounded-2xl border border-amber-900/60 p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#212735]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Abordagem Comercial Consultiva FMWS</h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {activePitchPlace.name} • {activePitchPlace.segment} • {activePitchPlace.neighborhood} ({activePitchPlace.city})
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActivePitchPlace(null);
                  setCopiedApproach(false);
                  setCopiedEmail(false);
                  setCopiedEmailSubject(false);
                }}
                className="text-slate-400 hover:text-white p-1 text-sm rounded-lg hover:bg-[#1a202c]"
                title="Fechar"
              >
                ✕
              </button>
            </div>

            {generatingPitch ? (
              <div className="py-14 text-center space-y-3">
                <RefreshCw className="w-9 h-9 text-[#d4af37] animate-spin mx-auto" />
                <p className="text-xs text-slate-200 font-semibold">
                  Formulando abordagem comercial consultiva personalizada...
                </p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Respeitando rigorosamente as 12 diretrizes: verificação de evidências reais, ausência de alegações infundadas e destaque para o <strong>diferencial de design sem custo</strong>.
                </p>
              </div>
            ) : activePitchPlace.commercialPitch ? (
              <div className="space-y-4 text-xs">
                {/* 1. SCENARIO CLASSIFICATION BADGE (Rules 1, 2, 3) */}
                {(() => {
                  const sc = activePitchPlace.commercialPitch.scenarioType;
                  if (sc === 'site_com_problema_comprovado') {
                    return (
                      <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-rose-300 font-bold text-xs uppercase tracking-wide">
                            Cenário 3: Inconformidades Técnicas Comprovadas com Evidências
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                            A abordagem cita apenas problemas verificados na auditoria HTTP ({activePitchPlace.auditResult?.problemsFound.join(', ') || 'inconformidades verificáveis'}). Nenhuma falha fictícia é alegada.
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
                          <div className="text-sky-300 font-bold text-xs uppercase tracking-wide">
                            Cenário 2: Modernização Visual & Novas Funcionalidades (Site Ativo)
                          </div>
                          <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                            A empresa possui site cadastrado ({activePitchPlace.site}) sem falhas comprovadas. A abordagem oferece modernização estética e novos recursos corporativos, sem alegar defeitos técnicos.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-2.5">
                      <Compass className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-amber-300 font-bold text-xs uppercase tracking-wide">
                          Cenário 1: Oportunidade de Presença Digital Institucional
                        </div>
                        <p className="text-slate-300 text-[11px] mt-0.5 leading-relaxed">
                          Site não identificado nos registros públicos. A criação é apresentada como oportunidade de autoridade, sem afirmar categoricamente que a empresa não possui site.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. VERIFIED DATA PROVENANCE (Rule 11) */}
                <div className="p-3 rounded-xl bg-[#090b10] border border-[#1b2230] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#d4af37]" /> Origem Verificada das Informações (Registrada no CRM):
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#151922] text-amber-400 font-mono border border-amber-500/20">
                      ID: {activePitchPlace.sourceId}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] font-mono leading-relaxed">
                    {activePitchPlace.commercialPitch.sourceEvidenceUsed}
                  </p>
                </div>

                {/* 3. FMWS NATIVE DIFFERENTIATOR (Rule 5) */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 to-[#14120a] border border-[#d4af37]/40 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#f5e7a9] uppercase font-bold tracking-wider block">
                      Diferencial Obrigatório da Fazer Meu Website:
                    </span>
                    <p className="text-amber-100 text-xs mt-0.5 font-medium leading-relaxed">
                      {activePitchPlace.commercialPitch.differentiatorPitch}
                    </p>
                  </div>
                </div>

                {/* 4. CHANNEL TABS: WHATSAPP vs EMAIL vs COMPLETO (Rule 8) */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0e1118] border border-[#1f2636]">
                  <button
                    onClick={() => setPitchChannelTab('whatsapp')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      pitchChannelTab === 'whatsapp'
                        ? 'bg-emerald-600 text-black shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-[#161b26]'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>WhatsApp Comercial (Curto)</span>
                  </button>

                  <button
                    onClick={() => setPitchChannelTab('email')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      pitchChannelTab === 'email'
                        ? 'bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-[#161b26]'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>E-mail Corporativo B2B</span>
                  </button>

                  <button
                    onClick={() => setPitchChannelTab('completo')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition ${
                      pitchChannelTab === 'completo'
                        ? 'bg-[#242b3b] text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-[#161b26]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Diagnóstico Completo</span>
                  </button>
                </div>

                {/* 5. TAB CONTENT */}
                {pitchChannelTab === 'whatsapp' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                        Mensagem Formatada para WhatsApp (Objetiva, máx. 100 palavras):
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activePitchPlace.commercialPitch?.whatsappVersion || '');
                          setCopiedApproach(true);
                          setTimeout(() => setCopiedApproach(false), 2000);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/60 transition"
                      >
                        {copiedApproach ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedApproach ? 'Copiado!' : 'Copiar para WhatsApp'}</span>
                      </button>
                    </div>

                    <div className="p-4 rounded-xl bg-[#090b10] border border-[#1b2230] text-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-inner">
                      {activePitchPlace.commercialPitch.whatsappVersion || activePitchPlace.commercialPitch.approachText}
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                      <span>Destinatário: <strong>{activePitchPlace.phone || 'Telefone não informado'}</strong></span>
                      <span className="text-emerald-400 font-mono text-[10px]">
                        Tamanho: ~{(activePitchPlace.commercialPitch.whatsappVersion || activePitchPlace.commercialPitch.approachText || '').split(/\s+/).length} palavras
                      </span>
                    </div>
                  </div>
                )}

                {pitchChannelTab === 'email' && (
                  <div className="space-y-3">
                    {/* Subject */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] font-semibold">Assunto do E-mail:</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activePitchPlace.commercialPitch?.emailVersion?.subject || '');
                            setCopiedEmailSubject(true);
                            setTimeout(() => setCopiedEmailSubject(false), 2000);
                          }}
                          className="text-[#d4af37] hover:text-amber-300 text-[10px] font-semibold flex items-center gap-1"
                        >
                          {copiedEmailSubject ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                          <span>{copiedEmailSubject ? 'Assunto Copiado' : 'Copiar Assunto'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#090b10] border border-[#1b2230] text-white font-mono text-xs font-semibold">
                        {activePitchPlace.commercialPitch.emailVersion?.subject || `Proposta de Design | ${activePitchPlace.name} & Fazer Meu Website`}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 text-[11px] font-semibold">Corpo do E-mail Corporativo:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const mailtoUrl = `mailto:?subject=${encodeURIComponent(
                                activePitchPlace.commercialPitch?.emailVersion?.subject || ''
                              )}&body=${encodeURIComponent(activePitchPlace.commercialPitch?.emailVersion?.body || activePitchPlace.commercialPitch?.approachText || '')}`;
                              window.open(mailtoUrl, '_blank');
                            }}
                            className="text-slate-300 hover:text-white text-[10px] font-semibold flex items-center gap-1 bg-[#141822] px-2 py-1 rounded border border-[#273042]"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span>Abrir no E-mail</span>
                          </button>
                          <button
                            onClick={() => {
                              const full = `Assunto: ${activePitchPlace.commercialPitch?.emailVersion?.subject || 'Proposta de Design'}\n\n${activePitchPlace.commercialPitch?.emailVersion?.body || activePitchPlace.commercialPitch?.approachText}`;
                              navigator.clipboard.writeText(full);
                              setCopiedEmail(true);
                              setTimeout(() => setCopiedEmail(false), 2000);
                            }}
                            className="text-[#d4af37] hover:text-amber-300 text-[10px] font-semibold flex items-center gap-1 bg-amber-950/40 px-2 py-1 rounded border border-amber-800/60"
                          >
                            {copiedEmail ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>{copiedEmail ? 'E-mail Copiado!' : 'Copiar E-mail Completo'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-[#090b10] border border-[#1b2230] text-slate-200 text-xs font-sans whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                        {activePitchPlace.commercialPitch.emailVersion?.body || activePitchPlace.commercialPitch.approachText}
                      </div>
                    </div>
                  </div>
                )}

                {pitchChannelTab === 'completo' && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-[#0c0e14] border border-[#1f2636]">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Diagnóstico Executivo:</span>
                      <p className="text-slate-200 mt-1 font-medium">{activePitchPlace.commercialPitch.summary}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0f121a] border border-[#222a3a] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Solução Recomendada do Portfólio FMWS:</span>
                        <span className="text-xs font-bold text-white">{activePitchPlace.commercialPitch.suggestedService}</span>
                      </div>
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                        B2B Corporativo
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] font-semibold">Texto Base de Abordagem Consultiva:</span>
                      <div className="p-3.5 rounded-xl bg-[#08090c] border border-[#1b212d] text-slate-200 leading-relaxed whitespace-pre-line text-xs font-sans">
                        {activePitchPlace.commercialPitch.approachText}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. MANDATORY HUMAN REVIEW CHECKBOX (Rule 9) */}
                <div className="p-3 rounded-xl bg-[#0f121a] border border-[#273042] flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => setHumanReviewConfirmed(!humanReviewConfirmed)}
                    className="mt-0.5 text-amber-400 hover:text-amber-300"
                  >
                    {humanReviewConfirmed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                  <label
                    onClick={() => setHumanReviewConfirmed(!humanReviewConfirmed)}
                    className="cursor-pointer text-[11px] text-slate-300 select-none leading-relaxed"
                  >
                    <strong className="text-white block font-semibold">
                      Revisão Humana Obrigatória (Diretriz Comercial FMWS):
                    </strong>
                    Confirmo que verifiquei as informações da empresa ({activePitchPlace.name}), validei que não há dados fictícios e autorizo o uso desta abordagem personalizada no contato comercial.
                  </label>
                </div>

                {/* 7. WHATSAPP CLOUD API COMPLIANCE NOTICE (Rule 10) */}
                <div className="p-2.5 rounded-lg bg-[#0a0c12] border border-[#1b2230] text-[10px] text-slate-400 flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    <strong>Conformidade WhatsApp Cloud API:</strong> Textos gerados por IA são minutas para revisão e envio individual (Canal 2 wa.me/5511986342981 ou e-mail). Para disparos no Canal 1 (+55 11 94579-9976), utilize templates homologados na Meta (<em>{activePitchPlace.commercialPitch.suggestedMetaTemplate}</em>) e consentimento LGPD documentado.
                  </span>
                </div>
              </div>
            ) : null}

            {/* Footer Actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1f2636]">
              <div className="text-[11px] text-slate-400">
                {humanReviewConfirmed ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Revisão confirmada pelo operador
                  </span>
                ) : (
                  <span className="text-amber-400/90 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Marque a revisão antes de enviar
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 self-end">
                {activePitchPlace.phone && onOpenWhatsApp && (
                  <button
                    disabled={!humanReviewConfirmed}
                    onClick={() => {
                      if (!humanReviewConfirmed) {
                        alert('Por favor, confirme a revisão humana da mensagem antes de preparar o envio.');
                        return;
                      }
                      const place = activePitchPlace;
                      const msg =
                        pitchChannelTab === 'email'
                          ? `Assunto: ${place.commercialPitch?.emailVersion?.subject || 'Proposta de Design'}\n\n${place.commercialPitch?.emailVersion?.body || place.commercialPitch?.approachText || ''}`
                          : place.commercialPitch?.whatsappVersion || place.commercialPitch?.approachText || '';
                      setActivePitchPlace(null);
                      onOpenWhatsApp(
                        {
                          name: place.name,
                          whatsapp: place.phone.replace(/\D/g, ''),
                          commercialPhone: place.phone,
                          city: place.city,
                          neighborhood: place.neighborhood,
                          site: place.site
                        },
                        msg
                      );
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      humanReviewConfirmed
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-md'
                        : 'bg-emerald-950/40 text-emerald-700 cursor-not-allowed border border-emerald-900/50'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Preparar no WhatsApp</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleConvertToLead(activePitchPlace);
                    setActivePitchPlace(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#aa8214] text-black font-bold text-xs rounded-xl hover:brightness-110 transition flex items-center gap-1.5 shadow-md"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Adicionar ao Funil (CRM)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Campaign History Modal (Requirement 5) */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-corporate max-w-2xl w-full rounded-2xl border border-amber-900/60 p-6 space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#212735]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <History className="w-4 h-4 text-[#d4af37]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Histórico de Campanhas de Prospecção</h3>
                  <p className="text-xs text-slate-400">Registro auditável de varreduras comerciais e rendimento de empresas reais</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a202c]"
              >
                ✕
              </button>
            </div>

            {campaignHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Compass className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
                <p className="font-semibold text-slate-300">Nenhuma campanha registrada nesta sessão.</p>
                <p className="text-xs text-slate-500">
                  Clique em "Iniciar Prospecção em Grande Escala" para executar a primeira varredura multi-termo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaignHistory.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl bg-[#121622] border border-[#212b3e] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{item.city}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#181d28] border border-[#263145] text-amber-300 font-mono">
                          {item.neighborhood}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleString('pt-BR')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-[#1a2233]">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Meta Alvo:</span>
                        <span className="font-bold text-white">{item.targetGoal} empresas</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Recebidas API:</span>
                        <span className="font-bold text-slate-300">{item.diagnostics.totalRawReceived}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Descarte Duplicidade:</span>
                        <span className="font-bold text-amber-400">{item.diagnostics.discardedDuplicates}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">Novas no Funil:</span>
                        <span className="font-bold text-emerald-400">+{item.totalFound}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#1a2233]">
                      <div className="flex items-center gap-2">
                        <span className="text-rose-400 font-mono">Classe A: {item.diagnostics.classACount}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-mono">Classe B: {item.diagnostics.classBCount}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono">Classe C: {item.diagnostics.classCCount}</span>
                      </div>
                      <span className="text-slate-400 italic truncate max-w-xs">{item.diagnostics.stopReason}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 rounded-xl bg-[#141720] border border-[#262f3f] text-slate-300 text-xs font-semibold hover:bg-[#1a202c] transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
