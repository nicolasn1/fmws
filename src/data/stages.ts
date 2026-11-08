import { CommercialStage, CommercialStageId } from '../types/crm';

export const OFFICIAL_TRANSFER_MESSAGE = `Obrigado pelo interesse!

Para dar continuidade ao seu atendimento, nossa equipe comercial da Fazer Meu Website está disponível em nosso canal oficial.

Clique no link abaixo para conversar diretamente com o setor comercial:

https://wa.me/5511986342981

Nossa equipe poderá apresentar as soluções mais adequadas à sua empresa.`;

export const COMMERCIAL_STAGES: CommercialStage[] = [
  {
    id: 'identificada',
    order: 1,
    label: 'Empresa identificada',
    description: 'Lead recém-cadastrado via prospecção ativa ou indicação',
    color: '#94a3b8',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-700'
  },
  {
    id: 'em_analise',
    order: 2,
    label: 'Em análise',
    description: 'Site e presença digital em verificação técnica/comercial pela IA',
    color: '#38bdf8',
    badgeBg: 'bg-sky-950 text-sky-400 border-sky-800'
  },
  {
    id: 'oportunidade_qualificada',
    order: 3,
    label: 'Oportunidade qualificada',
    description: 'Gargalos identificados com alto fit para os serviços FMWS',
    color: '#eab308',
    badgeBg: 'bg-amber-950 text-amber-400 border-amber-800'
  },
  {
    id: 'aguardando_autorizacao',
    order: 4,
    label: 'Aguardando autorização',
    description: 'Validação prévia de conformidade LGPD e consentimento',
    color: '#f97316',
    badgeBg: 'bg-orange-950 text-orange-400 border-orange-800'
  },
  {
    id: 'contato_realizado',
    order: 5,
    label: 'Contato realizado (Canal 1)',
    description: 'Primeira abordagem executada via template oficial WhatsApp (+55 11 94579-9976)',
    color: '#818cf8',
    badgeBg: 'bg-indigo-950 text-indigo-400 border-indigo-800'
  },
  {
    id: 'aguardando_resposta',
    order: 6,
    label: 'Aguardando resposta',
    description: 'Mensagem entregue dentro da janela de 24 horas',
    color: '#c084fc',
    badgeBg: 'bg-purple-950 text-purple-400 border-purple-800'
  },
  {
    id: 'respondeu',
    order: 7,
    label: 'Respondeu',
    description: 'Resposta recebida no Canal 1 sob classificação do Gemini',
    color: '#2dd4bf',
    badgeBg: 'bg-teal-950 text-teal-400 border-teal-800'
  },
  {
    id: 'interessado',
    order: 8,
    label: 'Interessado (IA)',
    description: 'Interesse comercial real identificado pela IA (respostas automáticas ignoradas)',
    color: '#f59e0b',
    badgeBg: 'bg-amber-900/80 text-amber-300 border-amber-600'
  },
  {
    id: 'encaminhamento_enviado',
    order: 9,
    label: 'Encaminhamento enviado',
    description: 'Convite com link wa.me/5511986342981 enviado pelo Canal 1',
    color: '#3b82f6',
    badgeBg: 'bg-blue-950 text-blue-400 border-blue-800'
  },
  {
    id: 'atendimento_confirmado',
    order: 10,
    label: 'Atendimento confirmado',
    description: 'Abertura de conversa confirmada no WhatsApp comercial humano (+55 11 98634-2981)',
    color: '#10b981',
    badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700'
  },
  {
    id: 'reuniao_agendada',
    order: 11,
    label: 'Reunião agendada',
    description: 'Sessão de diagnóstico comercial marcada com o decisor',
    color: '#06b6d4',
    badgeBg: 'bg-cyan-950 text-cyan-400 border-cyan-800'
  },
  {
    id: 'proposta_enviada',
    order: 12,
    label: 'Proposta enviada',
    description: 'Escopo detalhado com modelo de design sem custo inicial',
    color: '#d4af37',
    badgeBg: 'bg-yellow-950/80 text-yellow-300 border-yellow-700'
  },
  {
    id: 'negociacao',
    order: 13,
    label: 'Negociação',
    description: 'Alinhamento final de prazos, entregáveis e formas de pagamento',
    color: '#eab308',
    badgeBg: 'bg-amber-900/60 text-amber-300 border-amber-600'
  },
  {
    id: 'cliente_fechado',
    order: 14,
    label: 'Cliente fechado',
    description: 'Contrato assinado e projeto encaminhado para desenvolvimento',
    color: '#22c55e',
    badgeBg: 'bg-emerald-950 text-emerald-400 border-emerald-800'
  },
  {
    id: 'perdido',
    order: 15,
    label: 'Perdido / Opt-out',
    description: 'Lead sem interesse no momento ou opt-out registrado conforme a LGPD',
    color: '#ef4444',
    badgeBg: 'bg-rose-950 text-rose-400 border-rose-800'
  }
];

export const FMWS_SERVICES_CATALOG = [
  {
    id: 'criacao_site_profissional',
    name: 'Criação de Sites Profissionais',
    category: 'Presença Digital',
    description: 'Websites institucionais modernos, responsivos, com arquitetura de conversão, alta performance de carregamento e SEO estruturado.',
    deliverables: [
      'Proposta inicial de design exclusivo sem custo prévio',
      'Layout 100% responsivo para smartphones e desktops',
      'Painel de gerenciamento intuitivo',
      'Integração direta com WhatsApp e formulários seguros',
      'Otimização básica para mecanismos de busca (SEO)',
      'Certificado de segurança SSL gratuito'
    ]
  },
  {
    id: 'desenvolvimento_aplicacao_web',
    name: 'Desenvolvimento de Aplicações Web',
    category: 'Software Sob Medida',
    description: 'Sistemas corporativos em nuvem, portais de clientes, integrações via API e painéis operacionais sob medida.',
    deliverables: [
      'Arquitetura modular em React/TypeScript e Node.js',
      'Banco de dados relacional e controle de permissões por perfil',
      'Automações e webhooks integrados',
      'Testes de carga e segurança da informação'
    ]
  },
  {
    id: 'hospedagem_linux',
    name: 'Hospedagem Linux Profissional',
    category: 'Infraestrutura',
    description: 'Servidores dedicados com estabilidade 99.9%, isolamento de recursos e contas de e-mail corporativo ilimitadas.',
    deliverables: [
      'Painel cPanel/DirectAdmin em português',
      'Contas de e-mail @suaempresa.com.br',
      'Backups diários automatizados',
      'Proteção contra ataques DDoS'
    ]
  },
  {
    id: 'hospedagem_wordpress',
    name: 'Hospedagem Gerenciada WordPress',
    category: 'Infraestrutura Otimizada',
    description: 'Ambiente configurado com LiteSpeed Cache, banco de dados otimizado e atualizações automáticas de segurança.',
    deliverables: [
      'Aceleração LiteSpeed para carregamento ultra rápido',
      'Firewall de aplicação (WAF) ativo',
      'Certificados SSL automáticos',
      'Suporte técnico especializado em WordPress'
    ]
  },
  {
    id: 'revenda_hospedagem',
    name: 'Revenda de Hospedagem',
    category: 'Parceiros e Agências',
    description: 'Infraestrutura White-label para agências digitais hospedarem e cobrarem diretamente seus próprios clientes.',
    deliverables: [
      'Painel WHM com criação ilimitada de cPanels independentes',
      'DNS personalizado com a marca da sua agência',
      'Recursos isolados por conta CloudLinux'
    ]
  },
  {
    id: 'registro_transferencia_dominio',
    name: 'Registro e Transferência de Domínios',
    category: 'Identidade Digital',
    description: 'Gestão completa de registros nacionais (.com.br) e internacionais (.com, .net, .org) com renovação assistida.',
    deliverables: [
      'Configuração das entradas de DNS (MX, SPF, DKIM, DMARC)',
      'Proteção de privacidade Whois',
      'Monitoramento de expiração para evitar perda de domínios'
    ]
  }
];
