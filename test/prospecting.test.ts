import assert from 'node:assert';
import { StorageService } from '../server/storage';
import { ProspectingService } from '../server/prospecting';
import { LocalProspectingPlace, Lead } from '../src/types/crm';

console.log('====================================================');
console.log('FMWS SALES — SUÍTE DE TESTES AUTOMATIZADOS');
console.log('Validação de Classificação, Consistência Matemática e CRM');
console.log('====================================================\n');

async function runTestSuite() {
  let passedCount = 0;
  let totalTests = 0;

  function test(description: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`✅ [PASS] ${description}`);
            passedCount++;
          })
          .catch((err) => {
            console.error(`❌ [FAIL] ${description}`);
            console.error(err);
          });
      } else {
        console.log(`✅ [PASS] ${description}`);
        passedCount++;
      }
    } catch (err) {
      console.error(`❌ [FAIL] ${description}`);
      console.error(err);
    }
  }

  // TEST 1: Consistência matemática dos contadores persistidos
  await test('1. Consistência Matemática: totalInDb === A + B + Pendente + C + Inconclusivo', () => {
    const storage = new StorageService();
    const stats = storage.getProspectingDatabaseStats();

    const sumTiers = stats.totalClassA + stats.totalClassB + stats.totalPending + stats.totalClassC + stats.totalInconclusive;
    assert.strictEqual(
      stats.totalInDb,
      sumTiers,
      `A soma dos tiers (${sumTiers}) deve ser exatamente igual ao total na base (${stats.totalInDb})`
    );

    const sumOpportunities = stats.totalClassA + stats.totalClassB;
    assert.strictEqual(
      stats.totalOpportunitiesAB,
      sumOpportunities,
      `O total de oportunidades A+B (${stats.totalOpportunitiesAB}) deve ser exatamente A (${stats.totalClassA}) + B (${stats.totalClassB})`
    );
  });

  // TEST 2: Classificação correta de empresa sem website no Google Maps (Classe B)
  await test('2. Regra Classe B: Ausência de website no Maps classifica como B (sujeito à confirmação)', () => {
    const rawPlaceWithoutSite: Partial<LocalProspectingPlace> = {
      id: 'test-place-b',
      sourceId: 'ChIJtest_place_b',
      name: 'Oficina Mecânica Taboão',
      address: 'Rua Suécia, 100 - Taboão, São Bernardo do Campo - SP',
      city: 'São Bernardo do Campo',
      neighborhood: 'Taboão',
      site: '',
      phone: '(11) 4361-9999'
    };

    const storage = new StorageService();
    storage.saveProspectingPlaces([rawPlaceWithoutSite as LocalProspectingPlace]);

    const retrieved = storage.getProspectingPlaces({ searchQuery: 'Oficina Mecânica Taboão' })[0];
    assert.ok(retrieved, 'Empresa deve ter sido salva');
    assert.strictEqual(retrieved.opportunityTier, 'B', 'Tier deve ser B');
    assert.strictEqual(retrieved.siteStatusCategory, 'sem_site_no_maps', 'Categoria deve ser sem_site_no_maps');
    assert.ok(
      retrieved.opportunityReason.includes('Sem website informado no Google Maps') ||
      retrieved.opportunityReason.includes('sujeito a confirmação') ||
      retrieved.opportunityReason.includes('Sem site cadastrado'),
      'Motivo deve esclarecer que a ausência no Maps é sujeita a confirmação com o decisor'
    );
  });

  // TEST 3: Empresa com website não auditado deve entrar como "pendente"
  await test('3. Regra Pendente: Empresa com website no Maps entra como "pendente" aguardando auditoria', () => {
    const rawPlaceWithSite: Partial<LocalProspectingPlace> = {
      id: 'test-place-pending',
      sourceId: 'ChIJtest_place_pending',
      name: 'Distribuidora SBC Alimentos',
      address: 'Av. Lions, 500 - Rudge Ramos, São Bernardo do Campo - SP',
      city: 'São Bernardo do Campo',
      neighborhood: 'Rudge Ramos',
      site: 'https://sbcalimentos.com.br',
      phone: '(11) 4368-8888'
    };

    const storage = new StorageService();
    storage.saveProspectingPlaces([rawPlaceWithSite as LocalProspectingPlace]);

    const retrieved = storage.getProspectingPlaces({ searchQuery: 'Distribuidora SBC Alimentos' })[0];
    assert.ok(retrieved, 'Empresa deve ser recuperada');
    assert.strictEqual(retrieved.opportunityTier, 'pendente', 'Tier de empresa com site não auditado deve ser pendente');
    assert.strictEqual(retrieved.siteStatusCategory, 'aguardando_auditoria', 'Categoria deve ser aguardando_auditoria');
  });

  // TEST 4: Deduplicação estrita na importação de empresas no CRM
  await test('4. Integração CRM: Prevenção de duplicidade por Place ID, CNPJ e Nome, com proteção a telefone compartilhado', () => {
    const storage = new StorageService();
    const runId = Date.now();
    const uniquePlaceId = `ChIJ_unique_place_${runId}`;
    const baseName = `Mecânica SBC Original ${runId}`;
    const testPhone = `(11) 9${String(runId).slice(-8)}`;

    // Cria um lead de teste
    const leadRes = storage.createLead({
      name: baseName,
      whatsapp: testPhone,
      commercialPhone: '(11) 4361-0001',
      city: 'São Bernardo do Campo',
      neighborhood: 'Taboão',
      sourceId: uniquePlaceId,
      stageId: 'identificada',
      segment: 'Serviços Automotivos',
      contactName: 'Carlos Teste',
      contactRole: 'Gerente',
      source: 'Test Runner',
      lastVerifiedAt: new Date().toISOString(),
      consentStatus: 'pendente',
      priority: 'alta',
      assignedTo: 'Carlos Mendes (SDR)',
      notes: 'Lead de teste'
    } as any, 'Test Runner');

    assert.ok(leadRes.lead, `Lead deve ser criado com sucesso: ${leadRes.duplicateError}`);

    // Tentativa de duplicar por mesmo Place ID
    const dupPlaceIdRes = storage.createLead({
      name: `Mecânica SBC Filial ${runId}`,
      whatsapp: '(11) 94579-9999',
      commercialPhone: '(11) 4361-0001',
      city: 'São Bernardo do Campo',
      neighborhood: 'Taboão',
      sourceId: uniquePlaceId,
      stageId: 'identificada',
      segment: 'Serviços Automotivos',
      contactName: 'Carlos Teste',
      contactRole: 'Gerente',
      source: 'Test Runner'
    } as any, 'Test Runner');

    assert.ok(dupPlaceIdRes.duplicateError, 'Deve acusar erro de duplicidade por Place ID');

    // Tentativa de duplicar por mesmo nome e mesma cidade
    const dupNameRes = storage.createLead({
      name: baseName,
      whatsapp: '(11) 94579-8888',
      commercialPhone: '(11) 4361-0001',
      city: 'São Bernardo do Campo',
      neighborhood: 'Taboão',
      stageId: 'identificada',
      segment: 'Serviços Automotivos',
      contactName: 'Carlos Teste',
      contactRole: 'Gerente',
      source: 'Test Runner'
    } as any, 'Test Runner');

    assert.ok(dupNameRes.duplicateError, 'Deve acusar erro de duplicidade por mesmo nome e cidade');

    // Tentativa com mesmo nome similar e mesmo telefone
    const dupPhoneNameRes = storage.createLead({
      name: `${baseName} ME`,
      whatsapp: testPhone,
      commercialPhone: '(11) 4361-0001',
      city: 'São Bernardo do Campo',
      neighborhood: 'Taboão',
      stageId: 'identificada',
      segment: 'Serviços Automotivos',
      contactName: 'Carlos Teste',
      contactRole: 'Gerente',
      source: 'Test Runner'
    } as any, 'Test Runner');

    assert.ok(dupPhoneNameRes.duplicateError, 'Deve acusar erro de duplicidade por telefone associado ao mesmo negócio');
  });

  // TEST 5: Auditoria técnica real (Falha de DNS -> Classe A)
  await test('5. Auditoria Técnica: Domínio inexistente resulta comprovadamente em Classe A', async () => {
    // Domínio comprovadamente inexistente na raiz .invalid
    const auditRes = await ProspectingService.auditWebsiteUrl('https://empresa-totalmente-inexistente-12903810238.invalid');

    assert.strictEqual(auditRes.tier, 'A', 'Domínio sem DNS deve ser classificado como Classe A');
    assert.strictEqual(auditRes.category, 'site_com_problema_comprovado');
    assert.ok(
      auditRes.audit.problemsFound.some(p => p.toLowerCase().includes('dns')),
      'Deve conter problema explícito de DNS'
    );
  });

  // TEST 6: Escopo Geográfico (Toda a Cidade vs Apenas o Bairro)
  await test('6. Escopo Geográfico: Filtro por Bairro vs Toda a Cidade', () => {
    const storage = new StorageService();

    // 1. Busca por toda a cidade
    const allCity = storage.getProspectingPlaces({
      city: 'São Bernardo do Campo',
      geoScope: 'city'
    });

    // 2. Busca apenas no bairro Taboão
    const onlyTaboao = storage.getProspectingPlaces({
      city: 'São Bernardo do Campo',
      neighborhood: 'Taboão',
      geoScope: 'search_neighborhood'
    });

    assert.ok(allCity.length >= onlyTaboao.length, 'Total da cidade deve ser maior ou igual ao total de um único bairro');
    for (const p of onlyTaboao) {
      const real = (p.realNeighborhood || p.neighborhood || '').toLowerCase();
      assert.ok(
        real.includes('taboão') || real.includes('tabao'),
        `Empresa filtrada por bairro Taboão deve ter bairro Taboão (encontrado: ${real})`
      );
    }
  });

  // TEST 7: Conversão de Place para Lead com histórico e rastreabilidade
  await test('7. Conversão Place -> Lead: Preservação de Place ID, histórico e data de importação', () => {
    const storage = new StorageService();
    const convRunId = Date.now();
    const placeToConvert: LocalProspectingPlace = {
      id: `plc-conv-${convRunId}`,
      sourceId: `ChIJconv_${convRunId}`,
      source: 'Google Places API (New)',
      name: `Tornearia e Usinagem ABC ${convRunId}`,
      address: 'Rua das Indústrias, 100 - Taboão, São Bernardo do Campo - SP',
      neighborhood: 'Taboão',
      realNeighborhood: 'Taboão',
      searchNeighborhood: 'Taboão',
      searchCity: 'São Bernardo do Campo',
      city: 'São Bernardo do Campo',
      state: 'SP',
      segment: 'Metalurgia & Usinagem',
      phone: `(11) 4361-${String(convRunId).slice(-4)}`,
      site: '',
      siteStatusCategory: 'sem_site_no_maps',
      mapsUrl: 'https://maps.google.com/?q=Tornearia+e+Usinagem+ABC',
      searchedAt: new Date().toISOString(),
      opportunityTier: 'B',
      opportunityReason: 'Sem website informado no Google Maps — sujeito à confirmação com o decisor.',
      priority: 'alta',
      isContacted: false
    };

    storage.saveProspectingPlaces([placeToConvert]);
    const conversionResult = storage.convertPlaceToLead(placeToConvert.id, 'Carlos Mendes (SDR)');

    assert.ok(conversionResult.success, `Conversão deve ser bem-sucedida: ${conversionResult.duplicateError}`);
    assert.ok(conversionResult.lead, 'Lead deve ser retornado');
    assert.strictEqual(conversionResult.lead.sourceId, placeToConvert.sourceId, 'Place ID deve ser preservado');
    assert.strictEqual(conversionResult.lead.prospectingPlaceId, placeToConvert.id, 'prospectingPlaceId deve ser preservado');
    assert.strictEqual(conversionResult.lead.importedBy, 'Carlos Mendes (SDR)', 'importedBy deve ser registrado');

    // Tentativa de converter novamente a mesma empresa
    const repeatConversion = storage.convertPlaceToLead(placeToConvert.id, 'Carlos Mendes (SDR)');
    assert.strictEqual(repeatConversion.success, false, 'Não deve permitir converter duas vezes a mesma empresa');
  });

  console.log(`\n====================================================`);
  console.log(`RESULTADO DOS TESTES: ${passedCount}/${totalTests} PASSARAM`);
  console.log(`====================================================`);

  if (passedCount === totalTests) {
    console.log('🎉 TODOS OS TESTES FORAM APROVADOS COM SUCESSO!\n');
    process.exit(0);
  } else {
    console.error('⚠️ ALGUNS TESTES FALHARAM.\n');
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Erro na execução dos testes:', err);
  process.exit(1);
});
