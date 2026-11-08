import { CommercialSegmentDefinition } from '../types/crm';

/**
 * Catálogo Oficial das 10 Categorias Comerciais Inteligentes para Prospecção FMWS SALES.
 * Cada vertical contém termos refinados de busca para garantir a máxima densidade de
 * estabelecimentos comerciais reais indexados no Google Maps / Places API (New).
 */
export const COMMERCIAL_SEGMENTS_CATALOG: CommercialSegmentDefinition[] = [
  {
    id: 'oficinas_auto',
    name: 'Oficinas Mecânicas e Autopeças',
    iconName: 'Wrench',
    description: 'Oficinas mecânicas, centros automotivos, autopeças, auto elétrica e funilaria',
    searchTerms: [
      'oficina mecanica',
      'auto pecas',
      'centro automotivo',
      'auto eletrico',
      'funilaria e pintura automotiva',
      'retifica de motores',
      'troca de oleo e lubrificantes'
    ]
  },
  {
    id: 'serralherias_metal',
    name: 'Serralherias e Metalúrgicas',
    iconName: 'Cog',
    description: 'Serralherias, metalúrgicas, estruturas metálicas, esquadrias e calhas',
    searchTerms: [
      'serralheria',
      'metalurgica',
      'estruturas metalicas',
      'calhas e rufos',
      'esquadrias de aluminio',
      'corte e dobra de chapas'
    ]
  },
  {
    id: 'marcenarias_moveis',
    name: 'Marcenarias e Móveis Planejados',
    iconName: 'Hammer',
    description: 'Marcenarias sob medida, marcenaria fina e lojas de móveis planejados',
    searchTerms: [
      'marcenaria',
      'moveis planejados',
      'marcenaria sob medida',
      'marceneiro',
      'loja de moveis planejados',
      'marcenaria fina e decorativa'
    ]
  },
  {
    id: 'manutencao_servicos',
    name: 'Empresas de Manutenção',
    iconName: 'Settings',
    description: 'Manutenção predial, climatização, ar condicionado, desentupidoras e refrigeração',
    searchTerms: [
      'manutencao predial',
      'instalacao de ar condicionado',
      'empresa desentupidora',
      'refrigeracao comercial',
      'eletricista comercial e predial',
      'reformas e manutencao civil'
    ]
  },
  {
    id: 'restaurantes_lanchonetes',
    name: 'Restaurantes e Lanchonetes',
    iconName: 'Utensils',
    description: 'Restaurantes, pizzarias, hamburguerias, lanchonetes e buffets',
    searchTerms: [
      'restaurante',
      'pizzaria delivery',
      'hamburgueria artesanal',
      'lanchonete',
      'churrascaria',
      'buffet e espaco para eventos'
    ]
  },
  {
    id: 'beleza_estetica',
    name: 'Salões de Beleza e Barbearias',
    iconName: 'Scissors',
    description: 'Salões de beleza, barbearias, clínicas de estética e esmalterias',
    searchTerms: [
      'salao de beleza',
      'barbearia tradicional e moderna',
      'clinica de estetica facial e corporal',
      'estudio de micropigmentacao e sobrancelhas',
      'esmalteria e manicure'
    ]
  },
  {
    id: 'clinicas_consultorios',
    name: 'Clínicas e Consultórios Particulares',
    iconName: 'Stethoscope',
    description: 'Clínicas odontológicas, consultórios médicos particulares, veterinárias e fisioterapia',
    searchTerms: [
      'clinica odontologica e dentista',
      'consultorio odontologico particular',
      'clinica veterinaria 24 horas',
      'consultorio medico particular',
      'clinica de fisioterapia e reabilitacao',
      'clinica de psicologia e neuropsicologia'
    ]
  },
  {
    id: 'comercio_varejo',
    name: 'Lojas e Comércios Locais',
    iconName: 'Store',
    description: 'Lojas de roupas, óticas, materiais de construção, pet shops e distribuidoras',
    searchTerms: [
      'loja de roupas e moda',
      'otica e relojoaria',
      'loja de material de construcao',
      'pet shop banho e tosa',
      'distribuidora de bebidas e adega',
      'papelaria e presentes'
    ]
  },
  {
    id: 'servicos_residenciais',
    name: 'Prestadores de Serviços Residenciais',
    iconName: 'Home',
    description: 'Pintura residencial, segurança eletrônica, CFTV, portões automáticos e vidraçaria',
    searchTerms: [
      'empresa de pintura residencial',
      'seguranca eletronica e cftv',
      'portoes automaticos instalacao e manutencao',
      'vidracaria e box para banheiro',
      'energia solar fotovoltaica residencial',
      'limpeza pos obra residencial'
    ]
  },
  {
    id: 'industria_distribuicao',
    name: 'Empresas Industriais e Distribuidores',
    iconName: 'Factory',
    description: 'Distribuidoras atacadistas, usinagem, plásticos, embalagens e ferramentarias',
    searchTerms: [
      'distribuidora atacadista',
      'usinagem de precisao e torno',
      'industria de transformacao plastica',
      'embalagens industriais e caixas',
      'ferramentaria e moldes',
      'transportadora de cargas e logistica'
    ]
  }
];

/**
 * Grade de Coordenadas Geográficas de Bairros de São Bernardo do Campo.
 * Permite varreduras localizadas de alta precisão em múltiplos pontos comerciais do município.
 */
export const SBC_NEIGHBORHOODS_GRID: Record<string, { lat: number; lng: number; label: string }> = {
  Taboão: { lat: -23.6558, lng: -46.5768, label: '★ Taboão (Prioritário FMWS)' },
  Paulicéia: { lat: -23.6705, lng: -46.5815, label: 'Paulicéia' },
  Planalto: { lat: -23.6881, lng: -46.5621, label: 'Planalto' },
  'Rudge Ramos': { lat: -23.6601, lng: -46.5645, label: 'Rudge Ramos' },
  Centro: { lat: -23.6914, lng: -46.5654, label: 'Centro (SBC)' },
  'Baeta Neves': { lat: -23.6932, lng: -46.5412, label: 'Baeta Neves' },
  Assunção: { lat: -23.7121, lng: -46.5742, label: 'Assunção' },
  Demarchi: { lat: -23.7314, lng: -46.5541, label: 'Demarchi' },
  Ferrazópolis: { lat: -23.7125, lng: -46.5385, label: 'Ferrazópolis' },
  Alvarenga: { lat: -23.7380, lng: -46.5820, label: 'Alvarenga' },
  Cooperativa: { lat: -23.7190, lng: -46.5980, label: 'Cooperativa' },
  'Nova Petrópolis': { lat: -23.7020, lng: -46.5510, label: 'Nova Petrópolis' },
  'Riacho Grande': { lat: -23.7710, lng: -46.5310, label: 'Riacho Grande' },
  'Bairro dos Casa': { lat: -23.7220, lng: -46.5680, label: 'Bairro dos Casa' },
  Independência: { lat: -23.7010, lng: -46.5850, label: 'Independência' }
};

/**
 * Coordenadas Geográficas Principais para Municípios do Estado de SP.
 */
export const SP_CITIES_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // ABC Paulista
  'São Bernardo do Campo': { lat: -23.6914, lng: -46.5654 },
  'Santo André': { lat: -23.6639, lng: -46.5383 },
  'São Caetano do Sul': { lat: -23.6226, lng: -46.5552 },
  Diadema: { lat: -23.6865, lng: -46.6234 },
  Mauá: { lat: -23.6678, lng: -46.4614 },
  'Ribeirão Pires': { lat: -23.7142, lng: -46.4136 },
  'Rio Grande da Serra': { lat: -23.7436, lng: -46.3881 },

  // Grande SP & Capital
  'São Paulo': { lat: -23.5505, lng: -46.6333 },
  Guarulhos: { lat: -23.4542, lng: -46.5333 },
  Osasco: { lat: -23.5329, lng: -46.7917 },
  Barueri: { lat: -23.5105, lng: -46.8761 },
  'Santana de Parnaíba': { lat: -23.4442, lng: -46.9189 },
  Cotia: { lat: -23.6039, lng: -46.9192 },
  'Taboão da Serra': { lat: -23.6261, lng: -46.7589 },
  'Embu das Artes': { lat: -23.6492, lng: -46.8528 },
  'Itapecerica da Serra': { lat: -23.7172, lng: -46.8492 },
  'Mogi das Cruzes': { lat: -23.5208, lng: -46.1854 },
  Suzano: { lat: -23.5428, lng: -46.3108 },
  Itaquaquecetuba: { lat: -23.4861, lng: -46.3483 },
  'Ferraz de Vasconcelos': { lat: -23.5414, lng: -46.3686 },
  Poá: { lat: -23.5283, lng: -46.3453 },
  Arujá: { lat: -23.3969, lng: -46.3203 },
  'Franco da Rocha': { lat: -23.3283, lng: -46.7269 },
  'Francisco Morato': { lat: -23.2817, lng: -46.7444 },
  Caieiras: { lat: -23.3644, lng: -46.7408 },
  Cajamar: { lat: -23.3556, lng: -46.8781 },

  // Campinas & Região Metropolitana
  Campinas: { lat: -22.9099, lng: -47.0626 },
  Americana: { lat: -22.7375, lng: -47.3331 },
  Indaiatuba: { lat: -23.0903, lng: -47.2181 },
  Hortolândia: { lat: -22.8583, lng: -47.2200 },
  Sumaré: { lat: -22.8208, lng: -47.2667 },
  'Santa Bárbara d\'Oeste': { lat: -22.7553, lng: -47.4144 },
  Valinhos: { lat: -22.9708, lng: -46.9958 },
  Vinhedo: { lat: -23.0297, lng: -46.9744 },
  Paulínia: { lat: -22.7611, lng: -47.1539 },
  Jaguariúna: { lat: -22.7056, lng: -46.9856 },
  Itatiba: { lat: -23.0058, lng: -46.8406 },

  // Sorocaba & Jundiaí
  Sorocaba: { lat: -23.5015, lng: -47.4526 },
  Jundiaí: { lat: -23.1857, lng: -46.8978 },
  Itu: { lat: -23.2642, lng: -47.2992 },
  Salto: { lat: -23.2008, lng: -47.2869 },
  Votorantim: { lat: -23.5414, lng: -47.4378 },
  'São Roque': { lat: -23.5303, lng: -47.1353 },
  Tatuí: { lat: -23.3547, lng: -47.8558 },
  Itapetininga: { lat: -23.5897, lng: -48.0531 },
  'Várzea Paulista': { lat: -23.2125, lng: -46.8286 },

  // Baixada Santista & Litoral
  Santos: { lat: -23.9608, lng: -46.3336 },
  'São Vicente': { lat: -23.9631, lng: -46.3919 },
  'Praia Grande': { lat: -24.0058, lng: -46.4029 },
  Guarujá: { lat: -23.9931, lng: -46.2564 },
  Cubatão: { lat: -23.8953, lng: -46.4253 },
  Bertioga: { lat: -23.8542, lng: -46.1389 },
  Itanhaém: { lat: -24.1831, lng: -46.7889 },
  Caraguatatuba: { lat: -23.6228, lng: -45.4125 },
  'São Sebastião': { lat: -23.7606, lng: -45.4097 },
  Ubatuba: { lat: -23.4339, lng: -45.0839 },

  // Vale do Paraíba
  'São José dos Campos': { lat: -23.2237, lng: -45.9009 },
  Taubaté: { lat: -23.0264, lng: -45.5553 },
  Jacareí: { lat: -23.3053, lng: -45.9658 },
  Pindamonhangaba: { lat: -22.9247, lng: -45.4614 },
  Guaratinguetá: { lat: -22.8164, lng: -45.1931 },

  // Interior Norte, Central e Oeste
  'Ribeirão Preto': { lat: -21.1767, lng: -47.8108 },
  Franca: { lat: -20.5386, lng: -47.4008 },
  Sertãozinho: { lat: -21.1356, lng: -47.9903 },
  Araraquara: { lat: -21.7946, lng: -48.1766 },
  'São Carlos': { lat: -22.0175, lng: -47.8908 },
  Bauru: { lat: -22.3145, lng: -49.0587 },
  Jaú: { lat: -22.2964, lng: -48.5586 },
  Botucatu: { lat: -22.8858, lng: -48.4450 },
  Marília: { lat: -22.2139, lng: -49.9458 },
  'São José do Rio Preto': { lat: -20.8113, lng: -49.3758 },
  Araçatuba: { lat: -21.2089, lng: -50.4328 },
  'Presidente Prudente': { lat: -22.1256, lng: -51.3889 },
  Limeira: { lat: -22.5644, lng: -47.4017 },
  'Rio Claro': { lat: -22.4114, lng: -47.5614 },
  Piracicaba: { lat: -22.7253, lng: -47.6492 }
};

/**
 * Retorna os pontos geográficos a pesquisar dependendo da cidade e bairro selecionados.
 * Para SBC: se 'Todos', retorna a grade completa de 15 bairros.
 * Para outras cidades: se 'Todos', gera cobertura em cruz (Centro + 4 quadrantes cardeais).
 */
export function getGeographicalPoints(city: string, neighborhood: string): { name: string; lat: number; lng: number }[] {
  if (city === 'São Bernardo do Campo') {
    if (neighborhood === 'Todos') {
      return Object.entries(SBC_NEIGHBORHOODS_GRID).map(([name, data]) => ({
        name,
        lat: data.lat,
        lng: data.lng
      }));
    }
    const matched = SBC_NEIGHBORHOODS_GRID[neighborhood] || SBC_NEIGHBORHOODS_GRID['Taboão'];
    return [{ name: neighborhood, lat: matched.lat, lng: matched.lng }];
  }

  // Outra cidade do estado
  const cityCoords = SP_CITIES_COORDINATES[city] || SP_CITIES_COORDINATES['São Bernardo do Campo'];
  if (neighborhood === 'Todos') {
    // Grade multi-ponto para cobertura ampla da cidade
    const offset = 0.035; // ~3.5km de raio de dispersão
    return [
      { name: `${city} (Centro)`, lat: cityCoords.lat, lng: cityCoords.lng },
      { name: `${city} (Norte)`, lat: cityCoords.lat + offset, lng: cityCoords.lng },
      { name: `${city} (Sul)`, lat: cityCoords.lat - offset, lng: cityCoords.lng },
      { name: `${city} (Leste)`, lat: cityCoords.lat, lng: cityCoords.lng + offset },
      { name: `${city} (Oeste)`, lat: cityCoords.lat, lng: cityCoords.lng - offset }
    ];
  }

  return [{ name: `${neighborhood}, ${city}`, lat: cityCoords.lat, lng: cityCoords.lng }];
}
