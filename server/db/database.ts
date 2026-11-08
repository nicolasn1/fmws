import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import {
  Lead,
  CommercialProposal,
  WhatsAppConfig,
  WhatsAppMessageLog,
  AutomationCentralConfig,
  CrmEnvironment,
  AuditLog,
  CommercialDashboardStats,
  UserProfile,
  CommercialStageId,
  CommercialInteraction,
  LocalProspectingPlace,
  OpportunityTier,
  WhatsAppConversation,
  WhatsAppChatMessage,
  WhatsAppDashboardMetrics
} from '../../src/types/crm';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const SQLITE_FILE = path.join(DATA_DIR, 'fmws_sales.sqlite');
const LEGACY_JSON_FILE = path.join(DATA_DIR, 'fmws_crm.json');

export interface DatabaseStatus {
  engine: 'sqlite' | 'postgresql';
  isConnected: boolean;
  databasePath?: string;
  databaseUrlConfigured: boolean;
  journalMode?: string;
  appliedMigrations: string[];
  counts: {
    leads: number;
    conversations: number;
    messages: number;
    proposals: number;
    prospectingPlaces: number;
    auditLogs: number;
    whatsappLogs: number;
  };
  lastBackupAt?: string;
  lastWriteAt?: string;
}

export class RelationalDatabaseService {
  private sqliteDb: DatabaseSync | null = null;
  private pgPool: pg.Pool | null = null;
  private engine: 'sqlite' | 'postgresql' = 'sqlite';
  private appliedMigrations: string[] = [];
  private lastBackupAt?: string;
  private lastWriteAt?: string;

  constructor() {
    this.ensureDirectories();
    this.initializeConnection();
    this.runMigrations();
    this.migrateLegacyDataIfEmpty();
    this.createBackupSnapshot('startup');
  }

  private ensureDirectories() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
  }

  private initializeConnection() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl && (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://'))) {
      try {
        console.log('[FMWS DB] Conectando ao PostgreSQL externo via DATABASE_URL...');
        this.pgPool = new pg.Pool({
          connectionString: databaseUrl,
          ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000
        });
        this.engine = 'postgresql';
        console.log('[FMWS DB] Conexão PostgreSQL inicializada.');
        return;
      } catch (err: any) {
        console.error('[FMWS DB] Falha ao conectar ao PostgreSQL. Alternando para SQLite durável:', err.message);
      }
    }

    // Default: SQLite durável com WAL (Write-Ahead Logging) em disco
    console.log(`[FMWS DB] Inicializando SQLite com armazenamento em disco em ${SQLITE_FILE}...`);
    this.sqliteDb = new DatabaseSync(SQLITE_FILE);
    this.sqliteDb.exec('PRAGMA journal_mode = WAL;');
    this.sqliteDb.exec('PRAGMA synchronous = NORMAL;');
    this.sqliteDb.exec('PRAGMA foreign_keys = ON;');
    this.sqliteDb.exec('PRAGMA busy_timeout = 5000;');
    this.engine = 'sqlite';
    console.log('[FMWS DB] SQLite persistente inicializado com modo WAL.');
  }

  private runMigrations() {
    if (this.engine === 'sqlite' && this.sqliteDb) {
      // 1. Tabela de controle de migrações
      this.sqliteDb.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at TEXT NOT NULL
        );
      `);

      // 2. Tabelas relacionais do sistema
      const migrations = [
        {
          version: '20261027_001_core_tables',
          description: 'Criação das tabelas centrais do CRM e WhatsApp',
          sql: `
            -- 1. Empresas & Leads
            CREATE TABLE IF NOT EXISTS leads (
              id TEXT PRIMARY KEY,
              environment TEXT NOT NULL DEFAULT 'producao',
              name TEXT NOT NULL,
              cnpj TEXT,
              segment TEXT NOT NULL,
              city TEXT NOT NULL,
              neighborhood TEXT,
              site TEXT,
              instagram TEXT,
              facebook TEXT,
              commercial_phone TEXT NOT NULL,
              whatsapp TEXT NOT NULL,
              contact_name TEXT NOT NULL,
              contact_role TEXT NOT NULL,
              source TEXT NOT NULL,
              source_id TEXT,
              prospecting_place_id TEXT,
              import_campaign TEXT,
              imported_at TEXT,
              imported_by TEXT,
              last_verified_at TEXT NOT NULL,
              consent_status TEXT NOT NULL DEFAULT 'pendente',
              consent_recorded_at TEXT,
              consent_notes TEXT,
              stage_id TEXT NOT NULL DEFAULT 'identificada',
              priority TEXT NOT NULL DEFAULT 'media',
              assigned_to TEXT NOT NULL,
              notes TEXT,
              opportunity_tier TEXT DEFAULT 'B',
              deal_value REAL DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              ai_analysis_json TEXT,
              last_classification_json TEXT,
              transfer_dispatched_at TEXT,
              human_chat_confirmed_at TEXT,
              interactions_count INTEGER DEFAULT 0,
              tags_json TEXT
            );

            -- 2. Conversas WhatsApp (Omnichannel)
            CREATE TABLE IF NOT EXISTS whatsapp_conversations (
              id TEXT PRIMARY KEY,
              environment TEXT NOT NULL DEFAULT 'producao',
              lead_id TEXT,
              contact_name TEXT NOT NULL,
              company_name TEXT NOT NULL,
              phone_number TEXT NOT NULL,
              city TEXT,
              neighborhood TEXT,
              segment TEXT,
              site TEXT,
              avatar_url TEXT,
              last_message TEXT,
              last_message_timestamp TEXT,
              unread_count INTEGER DEFAULT 0,
              status TEXT NOT NULL DEFAULT 'aberta',
              ai_mode TEXT NOT NULL DEFAULT 'copiloto',
              assigned_operator_id TEXT,
              assigned_operator_name TEXT,
              priority TEXT NOT NULL DEFAULT 'alta',
              tags_json TEXT,
              opportunity_tier TEXT DEFAULT 'B',
              commercial_stage_id TEXT NOT NULL DEFAULT 'contato_realizado',
              next_follow_up_at TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            -- 3. Mensagens de Chat WhatsApp
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
              id TEXT PRIMARY KEY,
              conversation_id TEXT NOT NULL,
              sender TEXT NOT NULL,
              sender_name TEXT,
              content TEXT NOT NULL,
              type TEXT NOT NULL DEFAULT 'text',
              media_url TEXT,
              media_name TEXT,
              media_size TEXT,
              audio_duration_seconds INTEGER,
              status TEXT NOT NULL DEFAULT 'enviado',
              is_internal_note INTEGER DEFAULT 0,
              reply_to_message_id TEXT,
              reply_to_content TEXT,
              ai_suggested INTEGER DEFAULT 0,
              ai_confidence REAL,
              timestamp TEXT NOT NULL
            );

            -- 4. Propostas Comerciais
            CREATE TABLE IF NOT EXISTS commercial_proposals (
              id TEXT PRIMARY KEY,
              environment TEXT NOT NULL DEFAULT 'producao',
              proposal_code TEXT NOT NULL UNIQUE,
              lead_id TEXT NOT NULL,
              company_name TEXT NOT NULL,
              contact_name TEXT NOT NULL,
              contact_role TEXT NOT NULL,
              contact_whatsapp TEXT NOT NULL,
              service_requested TEXT NOT NULL,
              project_scope TEXT NOT NULL,
              estimated_timeline_days INTEGER NOT NULL,
              price REAL NOT NULL,
              payment_terms TEXT NOT NULL,
              validity_days INTEGER NOT NULL,
              valid_until TEXT NOT NULL,
              status TEXT NOT NULL DEFAULT 'rascunho',
              deliverables_json TEXT,
              fmws_differential_included INTEGER DEFAULT 1,
              notes TEXT,
              created_by_name TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              version INTEGER DEFAULT 1,
              version_history_json TEXT
            );

            -- 5. Prospecção Local Google Maps
            CREATE TABLE IF NOT EXISTS prospecting_places (
              id TEXT PRIMARY KEY,
              environment TEXT NOT NULL DEFAULT 'producao',
              name TEXT NOT NULL,
              place_id TEXT,
              query_target TEXT,
              address TEXT NOT NULL,
              city TEXT NOT NULL,
              neighborhood TEXT,
              rating REAL,
              user_ratings_total INTEGER,
              phone TEXT,
              site TEXT,
              types_json TEXT,
              primary_type TEXT,
              business_status TEXT,
              opportunity_tier TEXT NOT NULL DEFAULT 'B',
              opportunity_reason TEXT,
              site_status_category TEXT NOT NULL DEFAULT 'sem_site_no_maps',
              audit_result_json TEXT,
              commercial_pitch_json TEXT,
              crm_lead_id TEXT,
              contacted_at TEXT,
              source TEXT,
              is_demo_record INTEGER DEFAULT 0,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            -- 6. Logs de Auditoria & Conformidade LGPD
            CREATE TABLE IF NOT EXISTS audit_logs (
              id TEXT PRIMARY KEY,
              environment TEXT NOT NULL DEFAULT 'producao',
              timestamp TEXT NOT NULL,
              user TEXT NOT NULL,
              user_role TEXT NOT NULL,
              action TEXT NOT NULL,
              entity_type TEXT NOT NULL,
              entity_id TEXT,
              details TEXT NOT NULL
            );

            -- 7. Logs de Mensagens WhatsApp Graph API
            CREATE TABLE IF NOT EXISTS whatsapp_logs (
              id TEXT PRIMARY KEY,
              environment TEXT NOT NULL DEFAULT 'producao',
              lead_id TEXT NOT NULL,
              lead_name TEXT NOT NULL,
              to_number TEXT NOT NULL,
              channel TEXT NOT NULL,
              direction TEXT NOT NULL,
              type TEXT NOT NULL,
              template_name TEXT,
              content TEXT NOT NULL,
              status TEXT NOT NULL,
              sent_at TEXT NOT NULL,
              delivered_at TEXT,
              read_at TEXT,
              failure_reason TEXT,
              approved_by TEXT,
              whatsapp_message_id TEXT,
              is_human_reply INTEGER DEFAULT 0,
              classification_json TEXT
            );

            -- 8. Configurações Globais do Sistema
            CREATE TABLE IF NOT EXISTS system_settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            -- Índices para alta performance em buscas e filtros
            CREATE INDEX IF NOT EXISTS idx_leads_env_stage ON leads (environment, stage_id);
            CREATE INDEX IF NOT EXISTS idx_leads_whatsapp ON leads (whatsapp);
            CREATE INDEX IF NOT EXISTS idx_convs_env_status ON whatsapp_conversations (environment, status);
            CREATE INDEX IF NOT EXISTS idx_messages_conv ON whatsapp_messages (conversation_id, timestamp);
            CREATE INDEX IF NOT EXISTS idx_places_env_tier ON prospecting_places (environment, opportunity_tier);
          `
        },
        {
          version: '20261028_002_traceability_columns',
          description: 'Adiciona colunas de rastreabilidade e estados de verificação',
          sql: `
            ALTER TABLE leads ADD COLUMN verification_status TEXT DEFAULT 'pendente_verificacao';
            ALTER TABLE leads ADD COLUMN origin_type TEXT DEFAULT 'cadastro_manual';
            ALTER TABLE leads ADD COLUMN audit_evidence TEXT;
            ALTER TABLE whatsapp_conversations ADD COLUMN verification_status TEXT DEFAULT 'pendente_verificacao';
            ALTER TABLE whatsapp_conversations ADD COLUMN origin_type TEXT DEFAULT 'whatsapp_inbound';
          `
        },
        {
          version: '20261107_003_whatsapp_events_queue',
          description: 'Tabelas persistentes de deduplicação de eventos e fila de reprocessamento do WhatsApp Cloud API',
          sql: `
            -- Eventos brutos recebidos da Meta para auditoria e deduplicação
            CREATE TABLE IF NOT EXISTS whatsapp_webhook_events (
              id TEXT PRIMARY KEY,
              event_id TEXT UNIQUE,
              event_type TEXT NOT NULL,
              sender_phone TEXT,
              recipient_phone TEXT,
              payload_json TEXT NOT NULL,
              signature_valid INTEGER DEFAULT 1,
              status TEXT NOT NULL DEFAULT 'processado',
              error_message TEXT,
              received_at TEXT NOT NULL
            );

            -- Fila persistente para reprocessar eventos após falhas
            CREATE TABLE IF NOT EXISTS whatsapp_events_queue (
              id TEXT PRIMARY KEY,
              event_id TEXT UNIQUE,
              payload_json TEXT NOT NULL,
              attempts INTEGER DEFAULT 0,
              max_attempts INTEGER DEFAULT 5,
              status TEXT NOT NULL DEFAULT 'pending',
              last_error TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              next_attempt_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_whatsapp_events_status ON whatsapp_webhook_events (status, received_at);
            CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_events_queue (status, next_attempt_at);
          `
        }
      ];

      for (const m of migrations) {
        const stmt = this.sqliteDb.prepare('SELECT version FROM schema_migrations WHERE version = ?');
        const existing = stmt.get(m.version);
        if (!existing) {
          console.log(`[FMWS DB] Executando migração: ${m.version} - ${m.description}...`);
          this.sqliteDb.exec(m.sql);
          const ins = this.sqliteDb.prepare(
            'INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)'
          );
          ins.run(m.version, m.description, new Date().toISOString());
        }
        this.appliedMigrations.push(m.version);
      }
    }
  }

  // Migra com segurança dados existentes do JSON para o banco relacional
  public syncAllFromLegacy(force = false) {
    if (this.engine !== 'sqlite' || !this.sqliteDb) return;

    try {
      const countStmt = this.sqliteDb.prepare('SELECT COUNT(*) as count FROM leads');
      const row = countStmt.get() as { count: number };

      if (!force && row && row.count >= 20) {
        console.log(`[FMWS DB] Banco relacional já contém ${row.count} empresas. Ignorando sincronização forçada.`);
        return;
      }

      if (fs.existsSync(LEGACY_JSON_FILE)) {
        console.log('[FMWS DB] Sincronizando dados de data/fmws_crm.json para tabelas SQL duráveis...');
        const raw = fs.readFileSync(LEGACY_JSON_FILE, 'utf-8');
        const data = JSON.parse(raw);

        // Migrar ambientes de produção e demonstração
        const envs: Array<{ name: CrmEnvironment; store: any }> = [
          { name: 'producao', store: data.production || {} },
          { name: 'demo', store: data.demo || {} }
        ];

        for (const env of envs) {
          const leads = env.store.leads || [];
          for (const l of leads) {
            try { this.insertLeadSync(l, env.name); } catch (e: any) { console.error(`Error inserting lead ${l?.id}:`, e.message); }
          }

          const convs = env.store.conversations || [];
          for (const c of convs) {
            try { this.insertConversationSync(c, env.name); } catch (e: any) { console.error(`Error inserting conv ${c?.id}:`, e.message); }
          }

          const msgs = env.store.chatMessages || [];
          for (const m of msgs) {
            try { this.insertMessageSync(m); } catch (e: any) { console.error(`Error inserting msg ${m?.id}:`, e.message); }
          }

          const props = env.store.proposals || [];
          for (const p of props) {
            try { this.insertProposalSync(p, env.name); } catch (e: any) { console.error(`Error inserting prop ${p?.id}:`, e.message); }
          }

          const places = env.store.prospectingPlaces || [];
          for (const pl of places) {
            try { this.insertPlaceSync(pl, env.name); } catch (e: any) { console.error(`Error inserting place ${pl?.id}:`, e.message); }
          }

          const aLogs = env.store.auditLogs || [];
          for (const a of aLogs) {
            try { this.insertAuditLogSync(a, env.name); } catch (e: any) { console.error(`Error inserting auditLog ${a?.id}:`, e.message); }
          }

          const wLogs = env.store.whatsappLogs || [];
          for (const w of wLogs) {
            try { this.insertWhatsAppLogSync(w, env.name); } catch (e: any) { console.error(`Error inserting wLog ${w?.id}:`, e.message); }
          }
        }

        // Salvar configurações no SQL
        this.setSettingSync('active_environment', data.activeEnvironment || 'producao');
        if (data.whatsappConfig) {
          this.setSettingSync('whatsapp_config', JSON.stringify(data.whatsappConfig));
        }
        if (data.automationsConfig) {
          this.setSettingSync('automations_config', JSON.stringify(data.automationsConfig));
        }

        console.log('[FMWS DB] Sincronização concluída com sucesso para o banco SQL durável!');
      }
    } catch (err: any) {
      console.error('[FMWS DB] Erro durante sincronização de dados:', err.message);
    }
  }

  private migrateLegacyDataIfEmpty() {
    this.syncAllFromLegacy(false);
  }

  public createBackupSnapshot(trigger = 'manual'): string | null {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(BACKUPS_DIR, `backup_${trigger}_${timestamp}.json`);

      const dump = this.exportFullDatabase();
      fs.writeFileSync(backupPath, JSON.stringify(dump, null, 2), 'utf-8');
      this.lastBackupAt = new Date().toISOString();

      // Limpar backups antigos deixando os 10 mais recentes
      const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.startsWith('backup_') && f.endsWith('.json'));
      if (files.length > 10) {
        files.sort().reverse().slice(10).forEach(f => {
          try {
            fs.unlinkSync(path.join(BACKUPS_DIR, f));
          } catch {
            // ignore
          }
        });
      }

      console.log(`[FMWS DB] Backup durável criado em: ${path.basename(backupPath)}`);
      return backupPath;
    } catch (err: any) {
      console.error('[FMWS DB] Falha ao criar snapshot de backup:', err.message);
      return null;
    }
  }

  // --- CRUD SYNCHRONOUS METHODS (SQLITE) ---

  public insertLeadSync(lead: Lead, env: CrmEnvironment = 'producao'): Lead {
    if (!this.sqliteDb) return lead;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO leads (
        id, environment, name, cnpj, segment, city, neighborhood, site, instagram, facebook,
        commercial_phone, whatsapp, contact_name, contact_role, source, source_id,
        prospecting_place_id, import_campaign, imported_at, imported_by, last_verified_at,
        consent_status, consent_recorded_at, consent_notes, stage_id, priority, assigned_to,
        notes, opportunity_tier, deal_value, created_at, updated_at, ai_analysis_json,
        last_classification_json, transfer_dispatched_at, human_chat_confirmed_at,
        interactions_count, tags_json, verification_status, origin_type, audit_evidence
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      lead.id || `lead-${Date.now()}`,
      env || 'producao',
      lead.name || 'Empresa Sem Nome',
      lead.cnpj ?? null,
      lead.segment || 'Geral',
      lead.city || 'Não informada',
      lead.neighborhood ?? null,
      lead.site ?? null,
      lead.instagram ?? null,
      lead.facebook ?? null,
      lead.commercialPhone || '',
      lead.whatsapp || '',
      lead.contactName || 'Contato Principal',
      lead.contactRole || 'Decisor',
      lead.source || 'Manual',
      lead.sourceId ?? null,
      lead.prospectingPlaceId ?? null,
      lead.importCampaign ?? null,
      lead.importedAt ?? null,
      lead.importedBy ?? null,
      lead.lastVerifiedAt || new Date().toISOString(),
      lead.consentStatus || 'pendente',
      lead.consentRecordedAt ?? null,
      lead.consentNotes ?? null,
      lead.stageId || 'identificada',
      lead.priority || 'media',
      lead.assignedTo || 'Carlos Mendes (SDR)',
      lead.notes ?? null,
      lead.opportunityTier ?? 'B',
      lead.dealValue ?? 0,
      lead.createdAt || new Date().toISOString(),
      lead.updatedAt || new Date().toISOString(),
      lead.aiAnalysis ? JSON.stringify(lead.aiAnalysis) : null,
      lead.lastClassification ? JSON.stringify(lead.lastClassification) : null,
      lead.transferDispatchedAt ?? null,
      lead.humanChatConfirmedAt ?? null,
      lead.interactionsCount ?? 0,
      lead.tags ? JSON.stringify(lead.tags) : null,
      lead.verificationStatus ?? (env === 'demo' ? 'demonstrativo' : 'pendente_verificacao'),
      lead.originType ?? (env === 'demo' ? 'demonstrativo' : 'cadastro_manual'),
      lead.auditEvidence ?? null
    );

    this.lastWriteAt = new Date().toISOString();
    return lead;
  }

  public insertConversationSync(conv: WhatsAppConversation, env: CrmEnvironment = 'producao'): WhatsAppConversation {
    if (!this.sqliteDb) return conv;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO whatsapp_conversations (
        id, environment, lead_id, contact_name, company_name, phone_number, city,
        neighborhood, segment, site, avatar_url, last_message, last_message_timestamp,
        unread_count, status, ai_mode, assigned_operator_id, assigned_operator_name,
        priority, tags_json, opportunity_tier, commercial_stage_id, next_follow_up_at,
        created_at, updated_at, verification_status, origin_type
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      conv.id || `conv-${Date.now()}`,
      env || 'producao',
      conv.leadId ?? null,
      conv.contactName || 'Contato',
      conv.companyName || 'Empresa',
      conv.phoneNumber || '',
      conv.city ?? null,
      conv.neighborhood ?? null,
      conv.segment ?? null,
      conv.site ?? null,
      conv.avatar ?? null,
      conv.lastMessage ?? null,
      conv.lastMessageTimestamp ?? null,
      conv.unreadCount ?? 0,
      conv.status || 'aberta',
      conv.aiMode || 'copiloto',
      conv.assignedOperatorId ?? null,
      conv.assignedOperatorName ?? null,
      conv.priority || 'media',
      conv.tags ? JSON.stringify(conv.tags) : null,
      conv.opportunityTier ?? 'B',
      conv.commercialStageId || 'contato_realizado',
      conv.nextFollowUpAt ?? null,
      conv.createdAt || new Date().toISOString(),
      conv.updatedAt || new Date().toISOString(),
      conv.verificationStatus ?? (env === 'demo' ? 'demonstrativo' : 'pendente_verificacao'),
      conv.originType ?? (env === 'demo' ? 'demonstrativo' : 'whatsapp_inbound')
    );

    this.lastWriteAt = new Date().toISOString();
    return conv;
  }

  public insertMessageSync(msg: WhatsAppChatMessage): WhatsAppChatMessage {
    if (!this.sqliteDb) return msg;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO whatsapp_messages (
        id, conversation_id, sender, sender_name, content, type, media_url, media_name,
        media_size, audio_duration_seconds, status, is_internal_note, reply_to_message_id,
        reply_to_content, ai_suggested, ai_confidence, timestamp
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      msg.id || `msg-${Date.now()}`,
      msg.conversationId || '',
      msg.sender || 'lead',
      msg.senderName ?? null,
      msg.content || '',
      msg.type || 'text',
      msg.mediaUrl ?? null,
      msg.mediaName ?? null,
      msg.mediaSize ?? null,
      msg.audioDurationSeconds ?? null,
      msg.status || 'recebido',
      msg.isInternalNote ? 1 : 0,
      msg.replyToMessageId ?? null,
      msg.replyToContent ?? null,
      msg.aiSuggested ? 1 : 0,
      msg.aiConfidence ?? null,
      msg.timestamp || new Date().toISOString()
    );

    this.lastWriteAt = new Date().toISOString();
    return msg;
  }

  public insertProposalSync(prop: CommercialProposal, env: CrmEnvironment = 'producao'): CommercialProposal {
    if (!this.sqliteDb) return prop;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO commercial_proposals (
        id, environment, proposal_code, lead_id, company_name, contact_name, contact_role,
        contact_whatsapp, service_requested, project_scope, estimated_timeline_days, price,
        payment_terms, validity_days, valid_until, status, deliverables_json,
        fmws_differential_included, notes, created_by_name, created_at, updated_at,
        version, version_history_json
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      prop.id || `prop-${Date.now()}`,
      env || 'producao',
      prop.proposalCode || 'PROP-000',
      prop.leadId || '',
      prop.companyName || 'Empresa',
      prop.contactName || 'Contato',
      prop.contactRole || 'Decisor',
      prop.contactWhatsapp || '',
      prop.serviceRequested || 'criacao_site_profissional',
      prop.projectScope || '',
      prop.estimatedTimelineDays ?? 15,
      prop.price ?? 0,
      prop.paymentTerms || '',
      prop.validityDays ?? 15,
      prop.validUntil || new Date().toISOString(),
      prop.status || 'rascunho',
      prop.deliverables ? JSON.stringify(prop.deliverables) : null,
      prop.fmwsDifferentialIncluded ? 1 : 0,
      prop.notes ?? null,
      prop.createdByName || 'Operador Comercial',
      prop.createdAt || new Date().toISOString(),
      prop.updatedAt || new Date().toISOString(),
      prop.version ?? 1,
      prop.versionHistory ? JSON.stringify(prop.versionHistory) : null
    );

    this.lastWriteAt = new Date().toISOString();
    return prop;
  }

  public insertPlaceSync(place: LocalProspectingPlace, env: CrmEnvironment = 'producao'): LocalProspectingPlace {
    if (!this.sqliteDb) return place;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO prospecting_places (
        id, environment, name, place_id, query_target, address, city, neighborhood,
        rating, user_ratings_total, phone, site, types_json, primary_type, business_status,
        opportunity_tier, opportunity_reason, site_status_category, audit_result_json,
        commercial_pitch_json, crm_lead_id, contacted_at, source, is_demo_record,
        created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      place.id || `place-${Date.now()}`,
      env || 'producao',
      place.name || 'Estabelecimento',
      place.sourceId ?? null,
      (place as any).queryTarget ?? null,
      place.address || '',
      place.city || '',
      place.neighborhood ?? null,
      (place as any).rating ?? null,
      (place as any).userRatingsTotal ?? null,
      place.phone ?? null,
      place.site ?? null,
      null,
      null,
      null,
      place.opportunityTier || 'B',
      place.opportunityReason ?? null,
      place.siteStatusCategory || 'sem_site_no_maps',
      place.auditResult ? JSON.stringify(place.auditResult) : null,
      place.commercialPitch ? JSON.stringify(place.commercialPitch) : null,
      place.crmLeadId ?? null,
      place.contactedAt ?? null,
      place.source ?? null,
      place.isDemoRecord ? 1 : 0,
      place.searchedAt || new Date().toISOString(),
      new Date().toISOString()
    );

    this.lastWriteAt = new Date().toISOString();
    return place;
  }

  public insertAuditLogSync(log: AuditLog, env: CrmEnvironment = 'producao'): AuditLog {
    if (!this.sqliteDb) return log;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO audit_logs (
        id, environment, timestamp, user, user_role, action, entity_type, entity_id, details
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      log.id || `audit-${Date.now()}`,
      env || 'producao',
      log.timestamp || new Date().toISOString(),
      log.user || 'Sistema',
      log.userRole || 'admin',
      log.action || 'SISTEMA',
      log.entityType || 'system',
      log.entityId ?? null,
      log.details || ''
    );

    this.lastWriteAt = new Date().toISOString();
    return log;
  }

  public insertWhatsAppLogSync(log: WhatsAppMessageLog, env: CrmEnvironment = 'producao'): WhatsAppMessageLog {
    if (!this.sqliteDb) return log;

    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO whatsapp_logs (
        id, environment, lead_id, lead_name, to_number, channel, direction, type,
        template_name, content, status, sent_at, delivered_at, read_at, failure_reason,
        approved_by, whatsapp_message_id, is_human_reply, classification_json
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?
      )
    `);

    stmt.run(
      log.id || `wlog-${Date.now()}`,
      env || 'producao',
      log.leadId || 'desconhecido',
      log.leadName || 'Contato',
      log.to || '',
      log.channel || 'canal_1_prospeccao',
      log.direction || 'outbound',
      log.type || 'custom_text',
      log.templateName ?? null,
      log.content || '',
      log.status || 'enviado',
      log.sentAt || new Date().toISOString(),
      (log as any).deliveredAt ?? null,
      (log as any).readAt ?? null,
      log.failureReason ?? null,
      log.approvedBy ?? null,
      log.whatsappMessageId ?? null,
      log.isHumanReply ? 1 : 0,
      log.classification ? JSON.stringify(log.classification) : null
    );

    this.lastWriteAt = new Date().toISOString();
    return log;
  }

  public setSettingSync(key: string, value: string) {
    if (!this.sqliteDb) return;
    const stmt = this.sqliteDb.prepare(`
      INSERT OR REPLACE INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(key, value, new Date().toISOString());
  }

  public getSettingSync(key: string): string | null {
    if (!this.sqliteDb) return null;
    const stmt = this.sqliteDb.prepare('SELECT value FROM system_settings WHERE key = ?');
    const row = stmt.get(key) as { value: string } | undefined;
    return row ? row.value : null;
  }

  // --- WHATSAPP CLOUD API WEBHOOK EVENTS & PERSISTENT QUEUE ---

  /**
   * Deduplication check: checks if an event or message ID has already been recorded
   */
  public hasWhatsAppEventSync(eventId: string): boolean {
    if (!this.sqliteDb || !eventId) return false;
    try {
      const stmt = this.sqliteDb.prepare('SELECT 1 FROM whatsapp_webhook_events WHERE event_id = ? LIMIT 1');
      const row = stmt.get(eventId);
      return Boolean(row);
    } catch {
      return false;
    }
  }

  /**
   * Persistently records raw incoming webhook events from Meta
   */
  public recordWhatsAppEventSync(data: {
    eventId: string;
    eventType: string;
    senderPhone?: string;
    recipientPhone?: string;
    payloadJson: string;
    signatureValid?: boolean;
    status?: string;
    errorMessage?: string;
  }): boolean {
    if (!this.sqliteDb) return false;
    try {
      const stmt = this.sqliteDb.prepare(`
        INSERT OR IGNORE INTO whatsapp_webhook_events (
          id, event_id, event_type, sender_phone, recipient_phone, payload_json,
          signature_valid, status, error_message, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const id = `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const res = stmt.run(
        id,
        data.eventId,
        data.eventType,
        data.senderPhone ?? null,
        data.recipientPhone ?? null,
        data.payloadJson,
        data.signatureValid === false ? 0 : 1,
        data.status || 'processado',
        data.errorMessage ?? null,
        new Date().toISOString()
      );
      this.lastWriteAt = new Date().toISOString();
      return (res.changes || 0) > 0;
    } catch (err: any) {
      console.error('[FMWS DB] Falha ao registrar webhook event:', err.message);
      return false;
    }
  }

  /**
   * Enqueue event for reprocessing on failure
   */
  public enqueueWhatsAppEventSync(eventId: string, payloadJson: string, lastError?: string) {
    if (!this.sqliteDb) return;
    try {
      const stmt = this.sqliteDb.prepare(`
        INSERT OR REPLACE INTO whatsapp_events_queue (
          id, event_id, payload_json, attempts, max_attempts, status, last_error, created_at, updated_at, next_attempt_at
        ) VALUES (
          ?, ?, ?, 
          COALESCE((SELECT attempts FROM whatsapp_events_queue WHERE event_id = ?) + 1, 1),
          5, 'pending', ?, 
          COALESCE((SELECT created_at FROM whatsapp_events_queue WHERE event_id = ?), ?),
          ?, ?
        )
      `);
      const id = `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const now = new Date().toISOString();
      stmt.run(id, eventId, payloadJson, eventId, lastError ?? null, eventId, now, now, now);
      this.lastWriteAt = new Date().toISOString();
    } catch (err: any) {
      console.error('[FMWS DB] Falha ao enfileirar evento:', err.message);
    }
  }

  /**
   * Get pending queue items to reprocess
   */
  public getPendingWhatsAppQueueSync(): Array<{ id: string; event_id: string; payload_json: string; attempts: number }> {
    if (!this.sqliteDb) return [];
    try {
      const now = new Date().toISOString();
      const stmt = this.sqliteDb.prepare(`
        SELECT id, event_id, payload_json, attempts 
        FROM whatsapp_events_queue 
        WHERE status = 'pending' AND next_attempt_at <= ? AND attempts < max_attempts
        ORDER BY created_at ASC
        LIMIT 20
      `);
      return stmt.all(now) as any[];
    } catch {
      return [];
    }
  }

  /**
   * Mark queue item as completed or permanently failed
   */
  public resolveWhatsAppQueueItemSync(id: string, success: boolean, errorMsg?: string) {
    if (!this.sqliteDb) return;
    try {
      const now = new Date().toISOString();
      if (success) {
        const stmt = this.sqliteDb.prepare(`
          UPDATE whatsapp_events_queue 
          SET status = 'completed', updated_at = ?
          WHERE id = ?
        `);
        stmt.run(now, id);
      } else {
        const stmt = this.sqliteDb.prepare(`
          UPDATE whatsapp_events_queue 
          SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
              last_error = ?,
              updated_at = ?,
              next_attempt_at = ?
          WHERE id = ?
        `);
        const nextAttempt = new Date(Date.now() + 60000).toISOString(); // 1 min backoff
        stmt.run(errorMsg ?? null, now, nextAttempt, id);
      }
      this.lastWriteAt = new Date().toISOString();
    } catch (err: any) {
      console.error('[FMWS DB] Falha ao atualizar fila:', err.message);
    }
  }

  // --- QUERY METHODS ---

  public getLeadsSync(env: CrmEnvironment = 'producao'): Lead[] {
    if (!this.sqliteDb) return [];
    const stmt = this.sqliteDb.prepare('SELECT * FROM leads WHERE environment = ? ORDER BY updated_at DESC');
    const rows = stmt.all(env) as any[];

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      cnpj: r.cnpj || undefined,
      segment: r.segment,
      city: r.city,
      neighborhood: r.neighborhood || '',
      site: r.site || '',
      instagram: r.instagram || undefined,
      facebook: r.facebook || undefined,
      commercialPhone: r.commercial_phone,
      whatsapp: r.whatsapp,
      contactName: r.contact_name,
      contactRole: r.contact_role,
      source: r.source,
      sourceId: r.source_id || undefined,
      prospectingPlaceId: r.prospecting_place_id || undefined,
      importCampaign: r.import_campaign || undefined,
      importedAt: r.imported_at || undefined,
      importedBy: r.imported_by || undefined,
      lastVerifiedAt: r.last_verified_at,
      consentStatus: r.consent_status,
      consentRecordedAt: r.consent_recorded_at || undefined,
      consentNotes: r.consent_notes || undefined,
      stageId: r.stage_id,
      priority: r.priority,
      assignedTo: r.assigned_to,
      notes: r.notes || '',
      opportunityTier: r.opportunity_tier || 'B',
      dealValue: r.deal_value || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      aiAnalysis: r.ai_analysis_json ? JSON.parse(r.ai_analysis_json) : undefined,
      lastClassification: r.last_classification_json ? JSON.parse(r.last_classification_json) : undefined,
      transferDispatchedAt: r.transfer_dispatched_at || undefined,
      humanChatConfirmedAt: r.human_chat_confirmed_at || undefined,
      interactionsCount: r.interactions_count || 0,
      tags: r.tags_json ? JSON.parse(r.tags_json) : undefined,
      verificationStatus: r.verification_status || (env === 'demo' ? 'demonstrativo' : 'pendente_verificacao'),
      originType: r.origin_type || (env === 'demo' ? 'demonstrativo' : 'cadastro_manual'),
      auditEvidence: r.audit_evidence || undefined
    }));
  }

  public getConversationsSync(env: CrmEnvironment = 'producao'): WhatsAppConversation[] {
    if (!this.sqliteDb) return [];
    const stmt = this.sqliteDb.prepare(
      'SELECT * FROM whatsapp_conversations WHERE environment = ? ORDER BY updated_at DESC'
    );
    const rows = stmt.all(env) as any[];

    return rows.map(r => ({
      id: r.id,
      leadId: r.lead_id || undefined,
      contactName: r.contact_name,
      companyName: r.company_name,
      phoneNumber: r.phone_number,
      city: r.city || undefined,
      neighborhood: r.neighborhood || undefined,
      segment: r.segment || undefined,
      site: r.site || undefined,
      avatar: r.avatar_url || undefined,
      lastMessage: r.last_message || undefined,
      lastMessageTimestamp: r.last_message_timestamp || undefined,
      unreadCount: r.unread_count || 0,
      status: r.status,
      aiMode: r.ai_mode,
      assignedOperatorId: r.assigned_operator_id || undefined,
      assignedOperatorName: r.assigned_operator_name || undefined,
      priority: r.priority,
      tags: r.tags_json ? JSON.parse(r.tags_json) : [],
      opportunityTier: r.opportunity_tier || 'B',
      commercialStageId: r.commercial_stage_id,
      nextFollowUpAt: r.next_follow_up_at || undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      verificationStatus: r.verification_status || (env === 'demo' ? 'demonstrativo' : 'pendente_verificacao'),
      originType: r.origin_type || (env === 'demo' ? 'demonstrativo' : 'whatsapp_inbound')
    }));
  }

  public getMessagesSync(conversationId: string): WhatsAppChatMessage[] {
    if (!this.sqliteDb) return [];
    const stmt = this.sqliteDb.prepare(
      'SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY timestamp ASC'
    );
    const rows = stmt.all(conversationId) as any[];

    return rows.map(r => ({
      id: r.id,
      conversationId: r.conversation_id,
      sender: r.sender,
      senderName: r.sender_name || undefined,
      content: r.content,
      type: r.type,
      mediaUrl: r.media_url || undefined,
      mediaName: r.media_name || undefined,
      mediaSize: r.media_size || undefined,
      audioDurationSeconds: r.audio_duration_seconds || undefined,
      status: r.status,
      isInternalNote: Boolean(r.is_internal_note),
      replyToMessageId: r.reply_to_message_id || undefined,
      replyToContent: r.reply_to_content || undefined,
      aiSuggested: Boolean(r.ai_suggested),
      aiConfidence: r.ai_confidence || undefined,
      timestamp: r.timestamp
    }));
  }

  public getStatus(): DatabaseStatus {
    const leadsCount = this.queryCount('leads');
    const convsCount = this.queryCount('whatsapp_conversations');
    const msgsCount = this.queryCount('whatsapp_messages');
    const propsCount = this.queryCount('commercial_proposals');
    const placesCount = this.queryCount('prospecting_places');
    const aLogsCount = this.queryCount('audit_logs');
    const wLogsCount = this.queryCount('whatsapp_logs');

    return {
      engine: this.engine,
      isConnected: Boolean(this.sqliteDb || this.pgPool),
      databasePath: SQLITE_FILE,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
      journalMode: 'WAL',
      appliedMigrations: this.appliedMigrations,
      counts: {
        leads: leadsCount,
        conversations: convsCount,
        messages: msgsCount,
        proposals: propsCount,
        prospectingPlaces: placesCount,
        auditLogs: aLogsCount,
        whatsappLogs: wLogsCount
      },
      lastBackupAt: this.lastBackupAt,
      lastWriteAt: this.lastWriteAt
    };
  }

  private queryCount(table: string): number {
    if (!this.sqliteDb) return 0;
    try {
      const stmt = this.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`);
      const row = stmt.get() as { count: number };
      return row ? row.count : 0;
    } catch {
      return 0;
    }
  }

  public purgeFictitiousFromProduction(): { deletedLeads: number; deletedConvs: number; deletedProps: number } {
    if (!this.sqliteDb) return { deletedLeads: 0, deletedConvs: 0, deletedProps: 0 };
    try {
      // 1. Delete seed companies (lead-1 to lead-14) and artificial test runner leads from producao
      const deleteLeadsStmt = this.sqliteDb.prepare(`
        DELETE FROM leads 
        WHERE environment = 'producao' 
          AND (
            id IN ('lead-1','lead-2','lead-3','lead-4','lead-5','lead-6','lead-7','lead-8','lead-9','lead-10','lead-11','lead-12','lead-13','lead-14','lead-643ffff2','lead-da9959ca','lead-d9405085','lead-760b2afc','lead-e4b7628c','lead-3e702627','lead-c7e661c1')
            OR source = 'Test Runner'
            OR source = 'Auditoria de Persistencia'
            OR name LIKE '%1793020%'
            OR name LIKE '%202610%'
            OR name = 'Outro Nome de Empresa'
            OR name = 'Mecânica SBC Original'
            OR verification_status = 'demonstrativo'
            OR origin_type = 'demonstrativo'
          )
      `);
      const deletedLeads = deleteLeadsStmt.run();

      // 2. Delete demo conversations from producao (keep conv-aa1f439c which is Nicolas Neves)
      const deleteConvsStmt = this.sqliteDb.prepare(`
        DELETE FROM whatsapp_conversations 
        WHERE environment = 'producao' 
          AND id IN ('conv-1', 'conv-2', 'conv-3', 'conv-4', 'conv-5', 'conv-72f2c9cf', 'conv-47728208')
      `);
      const deletedConvs = deleteConvsStmt.run();

      // 3. Delete demo proposals from producao
      const deletePropsStmt = this.sqliteDb.prepare(`
        DELETE FROM commercial_proposals 
        WHERE environment = 'producao'
      `);
      const deletedProps = deletePropsStmt.run();

      // 4. Update the real company Usinagem & Ferramentaria Taboão Ltda
      const updateRealLeadStmt = this.sqliteDb.prepare(`
        UPDATE leads 
        SET verification_status = 'verificado', 
            origin_type = 'importacao_externa', 
            audit_evidence = 'Empresa cadastrada no diretório comercial de São Bernardo do Campo (Taboão). Inspecionada e confirmada via Prospecção Local.'
        WHERE id = 'lead-227e9c04'
      `);
      updateRealLeadStmt.run();

      // 5. Update real conversation Nicolas Neves
      const updateRealConvStmt = this.sqliteDb.prepare(`
        UPDATE whatsapp_conversations 
        SET verification_status = 'verificado', 
            origin_type = 'whatsapp_inbound'
        WHERE id = 'conv-aa1f439c'
      `);
      updateRealConvStmt.run();

      console.log(`[FMWS DB Audit] Registros fictícios eliminados de produção: ${deletedLeads.changes} empresas, ${deletedConvs.changes} conversas, ${deletedProps.changes} propostas.`);
      return {
        deletedLeads: Number(deletedLeads.changes),
        deletedConvs: Number(deletedConvs.changes),
        deletedProps: Number(deletedProps.changes)
      };
    } catch (err: any) {
      console.error('[FMWS DB Audit Error]:', err.message);
      return { deletedLeads: 0, deletedConvs: 0, deletedProps: 0 };
    }
  }

  public exportFullDatabase(): any {
    const leadsProd = this.getLeadsSync('producao');
    const leadsDemo = this.getLeadsSync('demo');
    const convsProd = this.getConversationsSync('producao');
    const convsDemo = this.getConversationsSync('demo');

    return {
      activeEnvironment: this.getSettingSync('active_environment') || 'producao',
      production: {
        leads: leadsProd,
        conversations: convsProd
      },
      demo: {
        leads: leadsDemo,
        conversations: convsDemo
      },
      exportedAt: new Date().toISOString()
    };
  }
}

export const relDb = new RelationalDatabaseService();
