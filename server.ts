import express, { Request, Response } from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { storage } from './server/storage';
import { relDb } from './server/db/database';
import { analyzeSiteOpportunity, runCommercialAssistant, classifyIncomingMessage, generateWhatsAppCopilotSuggestion } from './server/gemini';
import { ProspectingService } from './server/prospecting';
import { tunnelManager } from './server/tunnel';
import { CommercialStageId, OpportunityTier } from './src/types/crm';
import { OFFICIAL_TRANSFER_MESSAGE } from './src/data/stages';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Capture raw body buffer for Meta HMAC SHA-256 signature validation
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: true }));

// Telemetry for Meta Webhook handshakes
interface WebhookVerificationAttempt {
  timestamp: string;
  success: boolean;
  mode?: string;
  receivedToken?: string;
  expectedToken?: string;
  challenge?: string;
  ip: string;
  userAgent: string;
  details: string;
}

const webhookVerificationHistory: WebhookVerificationAttempt[] = [];

// --- API ROUTES ---

// 1. Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  const waConfig = storage.getWhatsAppConfig();
  const n8nConfig = storage.getN8nConfig();
  res.json({
    status: 'online',
    appName: 'FMWS SALES — Central Comercial Inteligente',
    company: 'Fazer Meu Website (https://fazermeuwebsite.com.br/)',
    channel1: waConfig.channel1,
    channel2: waConfig.channel2,
    n8nActive: n8nConfig.isActive,
    aiModelReady: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// 1.1 Database Health & Relational Persistence Status
app.get('/api/database/status', (req: Request, res: Response) => {
  res.json(relDb.getStatus());
});

app.post('/api/database/backup', (req: Request, res: Response) => {
  const backupPath = relDb.createBackupSnapshot('user_request');
  res.json({
    success: Boolean(backupPath),
    backupPath,
    status: relDb.getStatus()
  });
});

app.post('/api/database/sync', (req: Request, res: Response) => {
  relDb.syncAllFromLegacy(true);
  res.json({
    success: true,
    message: 'Sincronização executada com sucesso',
    status: relDb.getStatus()
  });
});

// 2. Commercial Dashboard Stats
app.get('/api/stats', (req: Request, res: Response) => {
  const stats = storage.getCommercialStats();
  res.json(stats);
});

// 3. Users list
app.get('/api/users', (req: Request, res: Response) => {
  res.json(storage.getUsers());
});

// 4. Leads CRUD
app.get('/api/leads', (req: Request, res: Response) => {
  const { search, stageId, priority, segment, consentStatus } = req.query;
  const leads = storage.getLeads({
    search: search as string,
    stageId: stageId as string,
    priority: priority as string,
    segment: segment as string,
    consentStatus: consentStatus as string
  });
  res.json(leads);
});

app.get('/api/leads/:id', (req: Request, res: Response) => {
  const lead = storage.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Empresa não encontrada' });
  res.json(lead);
});

app.post('/api/leads', (req: Request, res: Response) => {
  const author = req.body.assignedTo || 'Carlos Mendes (SDR)';
  const result = storage.createLead(req.body, author);

  if (result.duplicateError) {
    return res.status(409).json({ error: result.duplicateError });
  }

  res.status(201).json(result.lead);
});

app.put('/api/leads/:id', (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Equipe Comercial';
  const updated = storage.updateLead(req.params.id, req.body, author);
  if (!updated) return res.status(404).json({ error: 'Empresa não encontrada' });
  res.json(updated);
});

app.post('/api/leads/:id/stage', (req: Request, res: Response) => {
  const { stageId } = req.body;
  const author = (req.headers['x-user-name'] as string) || 'Equipe Comercial';
  if (!stageId) return res.status(400).json({ error: 'stageId é obrigatório' });

  const updated = storage.updateLeadStage(req.params.id, stageId as CommercialStageId, author);
  if (!updated) return res.status(404).json({ error: 'Empresa não encontrada' });

  // Optional trigger for n8n outbound stage webhook
  const n8n = storage.getN8nConfig();
  if (n8n.outboundStageWebhookUrl) {
    fetch(n8n.outboundStageWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'stage_changed', leadId: updated.id, leadName: updated.name, newStage: stageId, author })
    }).catch(err => console.error('n8n outbound webhook error:', err));
  }

  res.json(updated);
});

// ACTION: "Encaminhar para WhatsApp Comercial"
app.post('/api/leads/:id/transfer-to-commercial', async (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Operador Comercial';
  const result = storage.sendOfficialTransfer(req.params.id, author);

  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }

  res.json(result);
});

// ACTION: "Confirmar Abertura de Atendimento no WhatsApp Comercial Humano"
app.post('/api/leads/:id/confirm-human-chat', (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Beatriz Lima (Closer - WhatsApp Humano)';
  const updated = storage.confirmHumanChat(req.params.id, author);
  if (!updated) return res.status(404).json({ error: 'Empresa não encontrada' });
  res.json({ success: true, lead: updated });
});

app.delete('/api/leads/:id', (req: Request, res: Response) => {
  const isLgpd = req.query.lgpd === 'true';
  const author = (req.headers['x-user-name'] as string) || 'Administrador Comercial';
  const success = storage.deleteLead(req.params.id, author, isLgpd);
  if (!success) return res.status(404).json({ error: 'Empresa não encontrada' });
  res.json({ success: true, message: isLgpd ? 'Registro anonimizado e excluído em conformidade com a LGPD.' : 'Registro excluído.' });
});

app.post('/api/leads/import-csv', (req: Request, res: Response) => {
  const { leads } = req.body;
  const author = (req.headers['x-user-name'] as string) || 'Carlos Mendes (SDR)';
  if (!Array.isArray(leads) || leads.length === 0) {
    return res.status(400).json({ error: 'Array de leads não informado ou vazio' });
  }

  const result = storage.importLeadsCsv(leads, author);
  res.json(result);
});

// 5. AI Site Analysis, Assistant & Response Classifier
app.post('/api/leads/:id/analyze-site', async (req: Request, res: Response) => {
  const lead = storage.getLeadById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Empresa não encontrada' });

  try {
    const report = await analyzeSiteOpportunity(lead);
    lead.aiAnalysis = report;
    lead.updatedAt = new Date().toISOString();
    if (lead.stageId === 'identificada' || lead.stageId === 'em_analise') {
      lead.stageId = 'oportunidade_qualificada';
    }
    storage.updateLead(lead.id, lead, 'IA Diagnóstico FMWS');
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao executar auditoria por IA', details: err?.message });
  }
});

app.post('/api/ai/classify-message', async (req: Request, res: Response) => {
  const { text, leadId } = req.body;
  const lead = (leadId ? storage.getLeadById(leadId) : null) || {
    id: 'sim',
    name: 'Empresa Prospect',
    segment: 'Serviços Corporativos',
    city: 'São Paulo',
    neighborhood: '',
    commercialPhone: '',
    whatsapp: '',
    contactName: 'Decisor',
    contactRole: 'Diretor',
    source: 'Ativa',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'contato_realizado',
    priority: 'alta',
    assignedTo: 'Carlos Mendes (SDR)',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const classification = await classifyIncomingMessage(text || '', lead);
    res.json(classification);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha na classificação por IA', details: err?.message });
  }
});

app.post('/api/ai/assistant', async (req: Request, res: Response) => {
  const { mode, leadId, contextText, objectionType, selectedService } = req.body;
  const lead = leadId ? storage.getLeadById(leadId) : undefined;

  const mockLead = lead || {
    id: 'temp',
    name: 'Empresa Prospect',
    segment: 'Serviços Corporativos',
    city: 'São Paulo',
    neighborhood: 'Centro',
    commercialPhone: '(11) 99999-9999',
    whatsapp: '5511999999999',
    contactName: 'Diretor Comercial',
    contactRole: 'Diretor',
    source: 'Ativo',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado',
    stageId: 'identificada',
    priority: 'alta',
    assignedTo: 'Comercial',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const result = await runCommercialAssistant({
      mode: mode || 'generate_pitch',
      lead: mockLead,
      contextText,
      objectionType,
      selectedService
    });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha no assistente de IA', details: err?.message });
  }
});

// 6. WhatsApp Cloud API (Canal 1: Prospecção Oficial)
app.get('/api/whatsapp/config', (req: Request, res: Response) => {
  res.json(storage.getWhatsAppConfig());
});

app.post('/api/whatsapp/config', (req: Request, res: Response) => {
  const { phoneNumberId, wabaId, apiToken, webhookVerifyToken } = req.body;
  const updated = storage.updateWhatsAppConfig({ phoneNumberId, wabaId, apiToken, webhookVerifyToken });
  res.json(updated);
});

app.get('/api/whatsapp/logs', (req: Request, res: Response) => {
  res.json(storage.getWhatsAppLogs());
});

app.post('/api/whatsapp/send', async (req: Request, res: Response) => {
  const { leadId, templateName, messageText, userApproved } = req.body;
  const author = (req.headers['x-user-name'] as string) || 'Operador Comercial';

  if (!userApproved) {
    return res.status(400).json({
      error: 'Aprovação humana mandatória: o envio de mensagens comerciais requer validação prévia do operador.'
    });
  }

  const lead = storage.getLeadById(leadId);
  if (!lead) return res.status(404).json({ error: 'Empresa destinatária não encontrada' });

  if (storage.isPhoneNumberOptedOut(lead.whatsapp) || lead.consentStatus === 'opt_out') {
    return res.status(403).json({
      error: 'Envio bloqueado: Este número de WhatsApp registrou Opt-out / cancelamento de comunicações conforme a LGPD.'
    });
  }

  const config = storage.getWhatsAppConfig();
  const metaToken = storage.getMetaTokenSecret();

  // If token is missing, log transparently and respond
  if (!config.channel1.hasApiToken || !metaToken) {
    const log = storage.addWhatsAppLog({
      leadId: lead.id,
      leadName: lead.name,
      to: lead.whatsapp,
      channel: 'canal_1_prospeccao',
      direction: 'outbound',
      type: templateName ? 'template' : 'custom_text',
      templateName,
      content: messageText || `Template [${templateName}]`,
      status: 'falha',
      failureReason: 'Aguardando configuração do Access Token da Meta WhatsApp Cloud API no backend.',
      sentAt: new Date().toISOString(),
      approvedBy: author
    });

    return res.status(503).json({
      status: 'aguardando_configuracao',
      message: 'Aguardando configuração: O envio real via Canal 1 (+55 11 94579-9976) requer Token da Meta Graph API.',
      log
    });
  }

  // Real Meta Cloud API dispatch
  try {
    const payload = templateName
      ? {
          messaging_product: 'whatsapp',
          to: lead.whatsapp.replace(/\D/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'pt_BR' }
          }
        }
      : {
          messaging_product: 'whatsapp',
          to: lead.whatsapp.replace(/\D/g, ''),
          type: 'text',
          text: { body: messageText }
        };

    const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${config.channel1.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      const log = storage.addWhatsAppLog({
        leadId: lead.id,
        leadName: lead.name,
        to: lead.whatsapp,
        channel: 'canal_1_prospeccao',
        direction: 'outbound',
        type: templateName ? 'template' : 'custom_text',
        templateName,
        content: messageText || `Template [${templateName}]`,
        status: 'falha',
        failureReason: metaData?.error?.message || 'Erro retornado pela Meta Graph API',
        sentAt: new Date().toISOString(),
        approvedBy: author
      });

      return res.status(metaResponse.status).json({
        error: 'Erro na entrega via Meta Graph API',
        details: metaData?.error,
        log
      });
    }

    const messageId = metaData.messages?.[0]?.id;
    const log = storage.addWhatsAppLog({
      leadId: lead.id,
      leadName: lead.name,
      to: lead.whatsapp,
      channel: 'canal_1_prospeccao',
      direction: 'outbound',
      type: templateName ? 'template' : 'custom_text',
      templateName,
      content: messageText || `Template [${templateName}]`,
      status: 'enviado',
      sentAt: new Date().toISOString(),
      approvedBy: author,
      whatsappMessageId: messageId
    });

    if (lead.stageId === 'identificada' || lead.stageId === 'em_analise' || lead.stageId === 'oportunidade_qualificada' || lead.stageId === 'aguardando_autorizacao') {
      storage.updateLeadStage(lead.id, 'contato_realizado', author);
    }

    res.json({ success: true, messageId, log });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro interno ao disparar requisição Meta', details: err?.message });
  }
});

// --- CENTRAL WHATSAPP OMNICHANNEL API ---

// 1. List conversations with filters
app.get('/api/whatsapp/conversations', (req: Request, res: Response) => {
  const { status, operatorId, aiMode, search } = req.query;
  const conversations = storage.getWhatsAppConversations({
    status: status as any,
    operatorId: operatorId as string,
    aiMode: aiMode as any,
    search: search as string
  });
  res.json(conversations);
});

// 2. Get single conversation
app.get('/api/whatsapp/conversations/:id', (req: Request, res: Response) => {
  const conv = storage.getWhatsAppConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });
  res.json(conv);
});

// 3. Create or find conversation for a lead / phone
app.post('/api/whatsapp/conversations', (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Operador Comercial';
  const { leadId, phoneNumber, contactName, companyName, initialMessage } = req.body;

  let conv = leadId ? storage.getWhatsAppConversations().find(c => c.leadId === leadId) : undefined;
  if (!conv && phoneNumber) {
    conv = storage.getWhatsAppConversationByPhone(phoneNumber);
  }

  if (!conv) {
    const lead = leadId ? storage.getLeadById(leadId) : undefined;
    conv = storage.createWhatsAppConversation({
      leadId: lead?.id || leadId,
      contactName: contactName || lead?.contactName || 'Contato WhatsApp',
      companyName: companyName || lead?.name || 'Empresa',
      phoneNumber: phoneNumber || lead?.whatsapp || '',
      city: lead?.city,
      neighborhood: lead?.neighborhood,
      segment: lead?.segment,
      site: lead?.site,
      opportunityTier: (lead?.opportunityTier as any) || 'B',
      commercialStageId: lead?.stageId || 'contato_realizado',
      assignedOperatorId: 'user-sdr',
      assignedOperatorName: author,
      aiMode: 'copiloto',
      tags: lead ? [lead.segment, 'CRM Lead'] : ['Novo Lead']
    }, author);
  }

  if (initialMessage && conv) {
    storage.addWhatsAppChatMessage({
      conversationId: conv.id,
      sender: 'operator',
      senderName: author,
      content: initialMessage,
      type: 'text',
      status: 'enviado'
    });
  }

  res.status(201).json(conv);
});

// 4. Update conversation (mode, stage, operator, tags, priority, status)
app.patch('/api/whatsapp/conversations/:id', (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Operador Comercial';
  const updated = storage.updateWhatsAppConversation(req.params.id, req.body, author);
  if (!updated) return res.status(404).json({ error: 'Conversa não encontrada' });
  res.json(updated);
});

// 5. Get messages for a conversation & mark as read
app.get('/api/whatsapp/conversations/:id/messages', (req: Request, res: Response) => {
  const conv = storage.getWhatsAppConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

  // Mark unread as 0 on view
  if (conv.unreadCount > 0) {
    storage.updateWhatsAppConversation(conv.id, { unreadCount: 0 });
  }

  const messages = storage.getWhatsAppChatMessages(req.params.id);
  res.json(messages);
});

// 6. Send message in a conversation (text, media, internal note)
app.post('/api/whatsapp/conversations/:id/messages', async (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Operador Comercial';
  const { content, type = 'text', mediaUrl, mediaName, mediaSize, audioDurationSeconds, isInternalNote, replyToMessageId, replyToContent } = req.body;

  const conv = storage.getWhatsAppConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

  if (storage.isPhoneNumberOptedOut(conv.phoneNumber) && !isInternalNote) {
    return res.status(403).json({
      error: 'Envio bloqueado: Este número registrou Opt-out LGPD.'
    });
  }

  const senderType = isInternalNote ? 'operator' : 'operator';
  const newMsg = storage.addWhatsAppChatMessage({
    conversationId: conv.id,
    sender: senderType,
    senderName: author,
    content: content || (type === 'audio' ? 'Mensagem de voz gravada' : ''),
    type: isInternalNote ? 'internal_note' : type,
    mediaUrl,
    mediaName,
    mediaSize,
    audioDurationSeconds,
    status: isInternalNote ? 'lido' : 'enviado',
    isInternalNote: Boolean(isInternalNote),
    replyToMessageId,
    replyToContent
  });

  // Attempt real Meta Cloud API dispatch for external outbound customer messages
  if (!isInternalNote) {
    const config = storage.getWhatsAppConfig();
    const token = storage.getMetaTokenSecret();
    if (token && config.channel1.phoneNumberId && conv.phoneNumber) {
      try {
        const cleanTo = conv.phoneNumber.replace(/\D/g, '');
        let payload: any = {
          messaging_product: 'whatsapp',
          to: cleanTo
        };

        if (type === 'text') {
          payload.type = 'text';
          payload.text = { body: content };
        } else if (type === 'image' && mediaUrl) {
          payload.type = 'image';
          payload.image = { link: mediaUrl, caption: content };
        } else if (type === 'document' && mediaUrl) {
          payload.type = 'document';
          payload.document = { link: mediaUrl, filename: mediaName || 'documento.pdf', caption: content };
        } else if (type === 'audio' && mediaUrl) {
          payload.type = 'audio';
          payload.audio = { link: mediaUrl };
        } else {
          payload.type = 'text';
          payload.text = { body: content || 'Mensagem' };
        }

        const metaRes = await fetch(`https://graph.facebook.com/v21.0/${config.channel1.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          storage.updateWhatsAppChatMessage(newMsg.id, {
            status: 'entregue',
            failureReason: undefined
          });
          storage.addWhatsAppLog({
            leadId: conv.leadId || 'desconhecido',
            leadName: conv.companyName,
            to: conv.phoneNumber,
            channel: 'canal_1_prospeccao',
            direction: 'outbound',
            type: 'custom_text',
            content: content || type,
            status: 'entregue',
            sentAt: new Date().toISOString(),
            approvedBy: author,
            whatsappMessageId: metaJson.messages?.[0]?.id
          });
        } else {
          const errData = await metaRes.json();
          storage.updateWhatsAppChatMessage(newMsg.id, {
            status: 'falha',
            failureReason: errData?.error?.message || 'Erro retornado pela Meta Graph API'
          });
        }
      } catch (err: any) {
        console.warn('Meta API dispatch warning (offline or network):', err.message);
      }
    }
  }

  res.status(201).json(newMsg);
});

// 7. Suggest AI response (Copilot)
app.post('/api/whatsapp/conversations/:id/suggest-reply', async (req: Request, res: Response) => {
  const conv = storage.getWhatsAppConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

  const messages = storage.getWhatsAppChatMessages(conv.id);
  const recentMsgs = messages.slice(-8).map(m => ({
    sender: m.sender,
    content: m.content,
    timestamp: m.timestamp
  }));

  const suggestion = await generateWhatsAppCopilotSuggestion({
    conversationId: conv.id,
    contactName: conv.contactName,
    companyName: conv.companyName,
    segment: conv.segment,
    site: conv.site,
    stage: conv.commercialStageId,
    lastMessages: recentMsgs
  });

  res.json(suggestion);
});

// 8. Transfer conversation (to another operator or to Human Canal 2)
app.post('/api/whatsapp/conversations/:id/transfer', async (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Operador Comercial';
  const { targetOperatorId, targetOperatorName, transferToCanal2 } = req.body;

  const conv = storage.getWhatsAppConversationById(req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversa não encontrada' });

  if (transferToCanal2 && conv.leadId) {
    const result = storage.sendOfficialTransfer(conv.leadId, author);
    storage.updateWhatsAppConversation(conv.id, {
      commercialStageId: 'encaminhamento_enviado',
      aiMode: 'humano'
    }, author);
    return res.json({ success: true, message: 'Encaminhamento oficial enviado ao cliente!', result });
  }

  const updated = storage.updateWhatsAppConversation(conv.id, {
    assignedOperatorId: targetOperatorId || conv.assignedOperatorId,
    assignedOperatorName: targetOperatorName || conv.assignedOperatorName,
    aiMode: 'humano'
  }, author);

  storage.addWhatsAppChatMessage({
    conversationId: conv.id,
    sender: 'operator',
    senderName: author,
    content: `🔒 NOTA INTERNA: Atendimento transferido para ${targetOperatorName || 'novo atendente'}. Modo IA alterado para Humano.`,
    type: 'internal_note',
    status: 'lido',
    isInternalNote: true
  });

  res.json({ success: true, conversation: updated });
});

// 9. Dashboard metrics for Central WhatsApp
app.get('/api/whatsapp/dashboard-metrics', (req: Request, res: Response) => {
  const metrics = storage.getWhatsAppDashboardMetrics();
  res.json(metrics);
});

// Process an incoming message event (used by both real Meta webhook and the test simulator)
async function handleIncomingMessageEvent(from: string, text: string, messageId?: string, contactProfileName?: string) {
  const leads = storage.getLeads();
  const cleanFrom = from.replace(/\D/g, '');
  const matched = leads.find(l => l.id === from || (cleanFrom && l.whatsapp.replace(/\D/g, '').endsWith(cleanFrom)) || (cleanFrom && cleanFrom.endsWith(l.whatsapp.replace(/\D/g, ''))));

  const resolvedContactName = matched?.contactName || contactProfileName || `Contato ${from}`;

  const leadForAnalysis = matched || {
    id: 'desconhecido',
    name: (contactProfileName ? `${contactProfileName} (Lead WhatsApp)` : `Contato ${from}`),
    segment: 'Indefinido',
    city: 'Não informada',
    neighborhood: '',
    commercialPhone: from,
    whatsapp: from,
    contactName: resolvedContactName,
    contactRole: 'Decisor',
    source: 'Inbound WhatsApp',
    lastVerifiedAt: new Date().toISOString(),
    consentStatus: 'autorizado' as const,
    stageId: 'contato_realizado' as const,
    priority: 'alta' as const,
    assignedTo: 'Carlos Mendes (SDR)',
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 1. Classify with Gemini
  const classification = await classifyIncomingMessage(text, leadForAnalysis);

  // 2. Check for Opt-Out / Refusal
  if (classification.isOptOut) {
    storage.addOptOut(from);
    if (matched) {
      storage.updateLeadStage(matched.id, 'perdido', 'Opt-out registrado pela IA');
    }
  }

  // 3. Find or create omnichannel conversation
  let conv = storage.getWhatsAppConversationByPhone(from);
  if (!conv && matched) {
    conv = storage.getWhatsAppConversations().find(c => c.leadId === matched.id);
  }
  if (!conv) {
    conv = storage.createWhatsAppConversation({
      leadId: matched?.id,
      contactName: resolvedContactName,
      companyName: matched?.name || (contactProfileName ? `${contactProfileName} (WhatsApp)` : `Empresa ${from}`),
      phoneNumber: from,
      city: matched?.city,
      neighborhood: matched?.neighborhood,
      segment: matched?.segment,
      site: matched?.site,
      opportunityTier: (matched?.opportunityTier as any) || 'B',
      commercialStageId: matched?.stageId || 'contato_realizado',
      aiMode: 'copiloto',
      tags: matched ? [matched.segment, 'Inbound WhatsApp'] : ['Inbound WhatsApp']
    }, 'Webhook Meta WhatsApp');
  } else if (contactProfileName && (!conv.contactName || conv.contactName.startsWith('Contato '))) {
    // Enrich conversation contact name if previously generic
    storage.updateWhatsAppConversation(conv.id, { contactName: contactProfileName });
  }

  // 4. Add message to chatMessages
  storage.addWhatsAppChatMessage({
    conversationId: conv.id,
    sender: 'lead',
    senderName: conv.contactName,
    content: text,
    type: 'text',
    status: 'recebido'
  });

  // 5. Record incoming message log
  const log = storage.addWhatsAppLog({
    leadId: matched ? matched.id : 'desconhecido',
    leadName: matched ? matched.name : `Contato ${from}`,
    to: from,
    channel: 'canal_1_prospeccao',
    direction: 'inbound',
    type: 'custom_text',
    content: text,
    status: 'recebido',
    sentAt: new Date().toISOString(),
    isHumanReply: !classification.isAutoReply,
    whatsappMessageId: messageId,
    classification
  });

  // 6. If Auto-Reply: IGNORE as a transfer trigger
  if (classification.isAutoReply) {
    if (matched) {
      storage.updateLead(
        matched.id,
        {
          notes: `${matched.notes}\n[IA: Resposta automática de ausência detectada em ${new Date().toLocaleTimeString('pt-BR')}; transferência ignorada]`
        },
        'IA Classificador'
      );
    }
    return { log, classification, transferTriggered: false, lead: matched ? storage.getLeadById(matched.id) : null };
  }

  // 7. If Automatic AI Mode is active on this conversation: generate instant reply
  if (conv.aiMode === 'automatico' && !classification.isOptOut) {
    const recentMsgs = storage.getWhatsAppChatMessages(conv.id).slice(-6).map(m => ({
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp
    }));
    const aiSug = await generateWhatsAppCopilotSuggestion({
      conversationId: conv.id,
      contactName: conv.contactName,
      companyName: conv.companyName,
      segment: conv.segment,
      site: conv.site,
      stage: conv.commercialStageId,
      lastMessages: recentMsgs
    });

    if (aiSug?.suggestedResponse) {
      storage.addWhatsAppChatMessage({
        conversationId: conv.id,
        sender: 'ai',
        senderName: 'FMWS IA (Automático)',
        content: aiSug.suggestedResponse,
        type: 'text',
        status: 'enviado',
        aiSuggested: true,
        aiConfidence: aiSug.confidence
      });

      // Attempt to dispatch via Meta API
      const config = storage.getWhatsAppConfig();
      const token = storage.getMetaTokenSecret();
      if (token && config.channel1.phoneNumberId) {
        fetch(`https://graph.facebook.com/v21.0/${config.channel1.phoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: from.replace(/\D/g, ''),
            type: 'text',
            text: { body: aiSug.suggestedResponse }
          })
        }).catch(err => console.error('Error dispatching automated AI message to Meta:', err));
      }
    }
  }

  // 8. If Real Interest: Automatic Transfer Flow
  if (classification.classification === 'interesse_real' && matched) {
    matched.stageId = 'interessado';
    matched.lastClassification = classification;
    matched.notes = `${matched.notes}\n[IA Resumo de Interesse]: ${classification.summary}`;
    storage.updateLead(matched.id, matched, 'IA Classificador FMWS');
    storage.updateWhatsAppConversation(conv.id, { commercialStageId: 'interessado' });

    const transferResult = storage.sendOfficialTransfer(matched.id, 'Automação Comercial FMWS (Canal 1)');
    return {
      log,
      classification,
      transferTriggered: transferResult.success,
      transferLog: transferResult.log,
      lead: storage.getLeadById(matched.id)
    };
  } else if (matched && matched.stageId !== 'encaminhamento_enviado' && matched.stageId !== 'atendimento_confirmado' && matched.stageId !== 'cliente_fechado') {
    storage.updateLeadStage(matched.id, 'respondeu', 'Webhook WhatsApp Meta');
    storage.updateWhatsAppConversation(conv.id, { commercialStageId: 'respondeu' });
  }

  return { log, classification, transferTriggered: false, lead: matched ? storage.getLeadById(matched.id) : null };
}

// Meta Webhook Verification Handshake (GET / HEAD)
const handleWebhookVerification = (req: Request, res: Response) => {
  const mode = (req.query['hub.mode'] || req.query.mode) as string | undefined;
  const token = (req.query['hub.verify_token'] || req.query.verify_token) as string | undefined;
  const challenge = (req.query['hub.challenge'] || req.query.challenge) as string | undefined;

  const config = storage.getWhatsAppConfig();
  const configuredToken = (config.webhookVerifyToken || 'fmws_webhook_token_secure_2026').trim();
  const receivedToken = (token || '').trim();
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const userAgent = (req.headers['user-agent'] as string) || 'unknown';

  console.log('[Meta Webhook Verification Request]', {
    mode,
    receivedToken,
    configuredToken,
    challenge,
    ip,
    userAgent
  });

  const isTokenValid =
    receivedToken === configuredToken ||
    receivedToken === 'fmws_webhook_token_secure_2026' ||
    (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && receivedToken === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN.trim());

  if (mode === 'subscribe' && isTokenValid && challenge) {
    const attempt: WebhookVerificationAttempt = {
      timestamp: new Date().toISOString(),
      success: true,
      mode,
      receivedToken,
      expectedToken: configuredToken,
      challenge: String(challenge),
      ip,
      userAgent,
      details: 'Handshake Meta aprovado com sucesso (HTTP 200 plain text)'
    };
    webhookVerificationHistory.unshift(attempt);
    if (webhookVerificationHistory.length > 20) webhookVerificationHistory.pop();

    console.log(`[Meta Webhook Success] Validado com sucesso. Devolvendo challenge: ${challenge}`);
    
    // Meta requires plain text response with the exact challenge value
    return res
      .status(200)
      .type('text/plain')
      .set('Cache-Control', 'no-cache, no-store')
      .send(String(challenge));
  }

  const failReason = !mode
    ? 'Parâmetro hub.mode ausente'
    : mode !== 'subscribe'
    ? `hub.mode inesperado: "${mode}" (esperado: "subscribe")`
    : !challenge
    ? 'Parâmetro hub.challenge ausente'
    : `Token de verificação inválido: recebido "${receivedToken}", esperado "${configuredToken}"`;

  const attempt: WebhookVerificationAttempt = {
    timestamp: new Date().toISOString(),
    success: false,
    mode,
    receivedToken,
    expectedToken: configuredToken,
    challenge: challenge ? String(challenge) : undefined,
    ip,
    userAgent,
    details: `Falha na verificação: ${failReason}`
  };
  webhookVerificationHistory.unshift(attempt);
  if (webhookVerificationHistory.length > 20) webhookVerificationHistory.pop();

  console.warn(`[Meta Webhook Rejected] ${failReason}`);
  return res
    .status(403)
    .type('text/plain')
    .send(`Forbidden: ${failReason}`);
};

// Route aliases for Meta webhook verification
const WEBHOOK_PATHS = [
  '/api/webhooks/whatsapp',
  '/api/webhooks/whatsapp/',
  '/api/webhook/whatsapp',
  '/api/webhook/whatsapp/'
];

app.get(WEBHOOK_PATHS, handleWebhookVerification);
app.head(WEBHOOK_PATHS, handleWebhookVerification);

// Webhook status & Public Tunnel Info endpoint
app.get('/api/whatsapp/webhook-info', (req: Request, res: Response) => {
  const config = storage.getWhatsAppConfig();
  const tunnelInfo = tunnelManager.getInfo();
  const tunnelUrl = tunnelManager.getTunnelUrl();

  const publicWebhookUrl = tunnelUrl ? `${tunnelUrl}/api/webhooks/whatsapp` : null;
  const productionDomainUrl = 'https://crm.fazermeuwebsite.com.br/api/webhooks/whatsapp';

  res.json({
    tunnel: tunnelInfo,
    publicWebhookUrl,
    tunnelUrl,
    productionDomainUrl,
    verifyToken: config.webhookVerifyToken || 'fmws_webhook_token_secure_2026',
    recentVerifications: webhookVerificationHistory,
    lastVerification: webhookVerificationHistory[0] || null,
    isTunnelActive: tunnelInfo.status === 'online' && Boolean(tunnelUrl)
  });
});

// Restart Tunnel endpoint
app.post('/api/whatsapp/tunnel/restart', async (req: Request, res: Response) => {
  try {
    const url = await tunnelManager.restart(PORT);
    res.json({
      success: Boolean(url),
      tunnelUrl: url,
      publicWebhookUrl: url ? `${url}/api/webhooks/whatsapp` : null,
      info: tunnelManager.getInfo()
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Falha ao reiniciar túnel' });
  }
});

// Self-test Meta handshake against the active public webhook URL (with auto-healing on 502/503)
app.post('/api/whatsapp/test-webhook-handshake', async (req: Request, res: Response) => {
  let tunnelUrl = tunnelManager.getTunnelUrl();
  const config = storage.getWhatsAppConfig();
  const verifyToken = config.webhookVerifyToken || 'fmws_webhook_token_secure_2026';

  // Support testing a custom URL if provided in body
  const customTargetUrl = req.body?.targetUrl as string | undefined;

  if (!tunnelUrl && !customTargetUrl) {
    tunnelUrl = await tunnelManager.restart(PORT);
  }

  if (!tunnelUrl && !customTargetUrl) {
    return res.status(400).json({
      success: false,
      error: 'Túnel público não pôde ser iniciado. Clique em "Reiniciar Túnel" e aguarde alguns segundos.'
    });
  }

  const runHandshakeAttempt = async (targetBaseUrl: string) => {
    const testChallenge = `meta_challenge_${Math.floor(100000 + Math.random() * 900000)}`;
    const separator = targetBaseUrl.includes('?') ? '&' : '?';
    const testUrl = targetBaseUrl.includes('/api/webhooks/whatsapp')
      ? `${targetBaseUrl}${separator}hub.mode=subscribe&hub.challenge=${testChallenge}&hub.verify_token=${encodeURIComponent(verifyToken)}`
      : `${targetBaseUrl}/api/webhooks/whatsapp${separator}hub.mode=subscribe&hub.challenge=${testChallenge}&hub.verify_token=${encodeURIComponent(verifyToken)}`;

    const startTime = Date.now();
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'facebookplatform/1.0 (+http://developers.facebook.com)',
        'Bypass-Tunnel-Reminder': 'true'
      },
      signal: AbortSignal.timeout(8000)
    });

    const bodyText = await response.text();
    const latency = Date.now() - startTime;
    return {
      status: response.status,
      bodyText,
      latency,
      testChallenge,
      testUrl
    };
  };

  const targetUrl = customTargetUrl || tunnelUrl!;

  try {
    let result = await runHandshakeAttempt(targetUrl);

    // If localtunnel returned 502 or 503 Bad Gateway, auto-restart with a fresh clean tunnel and retry!
    if ((result.status === 502 || result.status === 503) && !customTargetUrl) {
      console.warn('[Handshake Diagnostic] Túnel retornou status', result.status, '— reiniciando com novo subdomínio limpo...');
      const freshUrl = await tunnelManager.restart(PORT);
      if (freshUrl) {
        tunnelUrl = freshUrl;
        result = await runHandshakeAttempt(freshUrl);
      }
    }

    if (result.status === 200 && result.bodyText.trim() === result.testChallenge) {
      return res.json({
        success: true,
        httpStatus: 200,
        latencyMs: result.latency,
        challengeReturned: result.bodyText.trim(),
        testedUrl: result.testUrl,
        activeTunnelUrl: tunnelUrl,
        publicWebhookUrl: `${tunnelUrl}/api/webhooks/whatsapp`,
        message: 'Teste de handshake executado com sucesso! O webhook está respondendo HTTP 200 OK com o desafio exato esperado pela Meta.'
      });
    }

    return res.status(400).json({
      success: false,
      httpStatus: result.status,
      latencyMs: result.latency,
      bodyReturned: result.bodyText,
      activeTunnelUrl: tunnelUrl,
      publicWebhookUrl: `${tunnelUrl}/api/webhooks/whatsapp`,
      error: `Handshake retornou status HTTP ${result.status} ou desafio divergente. Esperado: "${result.testChallenge}", Recebido: "${result.bodyText.substring(0, 150)}"`
    });
  } catch (err: any) {
    // If connection timed out or failed on edge, attempt one automatic restart
    if (!customTargetUrl) {
      try {
        console.warn('[Handshake Retry] Tentando recuperação rápida do túnel...');
        const freshUrl = await tunnelManager.restart(PORT);
        if (freshUrl) {
          const retryResult = await runHandshakeAttempt(freshUrl);
          if (retryResult.status === 200 && retryResult.bodyText.trim() === retryResult.testChallenge) {
            return res.json({
              success: true,
              httpStatus: 200,
              latencyMs: retryResult.latency,
              challengeReturned: retryResult.bodyText.trim(),
              testedUrl: retryResult.testUrl,
              activeTunnelUrl: freshUrl,
              publicWebhookUrl: `${freshUrl}/api/webhooks/whatsapp`,
              message: 'Túnel reestabelecido e handshake executado com sucesso!'
            });
          }
        }
      } catch {
        // ignore secondary error
      }
    }

    return res.status(502).json({
      success: false,
      error: `Erro ao testar URL do túnel: ${err?.message || 'Falha de conexão com a borda do túnel'}`
    });
  }
});

// --- META WHATSAPP CLOUD API: HMAC SHA-256 VALIDATION & EVENT PROCESSING ---

/**
 * Validates Meta X-Hub-Signature-256 HMAC SHA-256 header.
 * When WHATSAPP_APP_SECRET is configured, enforces strict cryptographic signature matching.
 */
function verifyMetaWebhookSignature(req: any): boolean {
  const appSecret = (process.env.WHATSAPP_APP_SECRET || '').trim();
  if (!appSecret) {
    // If App Secret not configured yet, allow request and log informational notice
    return true;
  }

  const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) {
    console.warn('[Meta Webhook HMAC] Header X-Hub-Signature-256 ausente ou formato inválido');
    return false;
  }

  const receivedHash = signatureHeader.slice(7);
  const rawBody: Buffer | undefined = req.rawBody;

  if (!rawBody) {
    console.warn('[Meta Webhook HMAC] Raw body buffer indisponível para cálculo de assinatura');
    return false;
  }

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const receivedBuf = Buffer.from(receivedHash, 'utf8');
  const expectedBuf = Buffer.from(expectedHash, 'utf8');

  if (receivedBuf.length !== expectedBuf.length) {
    return false;
  }

  const isValid = crypto.timingSafeEqual(receivedBuf, expectedBuf);
  if (!isValid) {
    console.warn('[Meta Webhook HMAC] Assinatura divergente para o payload recebido');
  }
  return isValid;
}

/**
 * Processes a single message from the Meta payload (text, image, audio, document, contacts, etc.)
 */
async function processMetaIncomingMessage(msg: any, contactMap: Map<string, { name?: string }>) {
  const messageId: string = msg.id;
  const from: string = msg.from;
  const contactInfo = contactMap.get(from);
  const contactProfileName = contactInfo?.name;

  // Extract content and message type
  let content = '';
  let msgType: 'text' | 'image' | 'document' | 'audio' = 'text';
  let mediaUrl: string | undefined;
  let mediaName: string | undefined;

  if (msg.type === 'text') {
    content = msg.text?.body || '';
    msgType = 'text';
  } else if (msg.type === 'image') {
    content = msg.image?.caption || 'Imagem recebida via WhatsApp';
    msgType = 'image';
    mediaUrl = msg.image?.id ? `https://graph.facebook.com/v21.0/${msg.image.id}` : undefined;
  } else if (msg.type === 'audio' || msg.type === 'voice') {
    content = 'Mensagem de áudio recebida via WhatsApp';
    msgType = 'audio';
    mediaUrl = (msg.audio?.id || msg.voice?.id) ? `https://graph.facebook.com/v21.0/${msg.audio?.id || msg.voice?.id}` : undefined;
  } else if (msg.type === 'document') {
    content = msg.document?.caption || msg.document?.filename || 'Documento recebido via WhatsApp';
    msgType = 'document';
    mediaName = msg.document?.filename;
    mediaUrl = msg.document?.id ? `https://graph.facebook.com/v21.0/${msg.document.id}` : undefined;
  } else if (msg.type === 'contacts') {
    const cardName = msg.contacts?.[0]?.name?.formatted_name || 'Contato compartilhado';
    content = `Cartão de contato compartilhado: ${cardName}`;
    msgType = 'text';
  } else if (msg.type === 'location') {
    content = `Localização compartilhada: ${msg.location?.latitude}, ${msg.location?.longitude} (${msg.location?.name || ''})`;
    msgType = 'text';
  } else if (msg.type === 'interactive') {
    content = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || 'Resposta interativa selecionada';
    msgType = 'text';
  } else if (msg.type === 'button') {
    content = msg.button?.text || 'Botão clicado';
    msgType = 'text';
  } else {
    content = msg[msg.type]?.body || `Mensagem do tipo [${msg.type}]`;
    msgType = 'text';
  }

  // Deduplication check: if message already processed, skip duplicate handling
  if (messageId && relDb.hasWhatsAppEventSync(messageId)) {
    console.log(`[Meta Webhook] Mensagem deduplicada ignorada: ${messageId}`);
    return;
  }

  // Record raw event in SQLite for audit and deduplication
  relDb.recordWhatsAppEventSync({
    eventId: messageId || `msg-${Date.now()}-${from}`,
    eventType: 'messages',
    senderPhone: from,
    recipientPhone: process.env.WHATSAPP_PHONE_NUMBER || '+55 11 94579-9976',
    payloadJson: JSON.stringify(msg),
    status: 'processado'
  });

  // Delegate business logic & conversational state to handleIncomingMessageEvent
  await handleIncomingMessageEvent(from, content, messageId, contactProfileName);
}

/**
 * Processes incoming status updates (sent, delivered, read, failed)
 */
async function processMetaStatusUpdate(st: any) {
  const statusId: string = st.id;
  const statusValue = st.status === 'delivered' ? 'entregue' : st.status === 'read' ? 'lido' : st.status === 'failed' ? 'falha' : 'enviado';
  const recipientId: string | undefined = st.recipient_id;
  const errorMsg: string | undefined = st.errors?.[0]?.message || st.errors?.[0]?.error_data?.details;

  // Deduplicate status updates by status + id
  const statusEventKey = `status-${statusId}-${st.status}`;
  if (relDb.hasWhatsAppEventSync(statusEventKey)) {
    return;
  }

  relDb.recordWhatsAppEventSync({
    eventId: statusEventKey,
    eventType: 'statuses',
    senderPhone: process.env.WHATSAPP_PHONE_NUMBER || '+55 11 94579-9976',
    recipientPhone: recipientId,
    payloadJson: JSON.stringify(st),
    status: 'processado',
    errorMessage: errorMsg
  });

  // Update in-memory and persistent storage
  storage.updateWhatsAppLogStatus(statusId, statusValue, errorMsg);

  // Also update corresponding chat message status in conversations
  const chatMsg = storage.getWhatsAppChatMessages('').find(m => m.id === statusId || (m as any).whatsappMessageId === statusId);
  if (chatMsg) {
    storage.updateWhatsAppChatMessage(chatMsg.id, {
      status: statusValue as any,
      failureReason: errorMsg
    });
  }
}

/**
 * Core event dispatcher for raw Meta payloads (supports direct invocation and queue reprocessing)
 */
async function dispatchMetaWebhookPayload(body: any): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  if (body.object !== 'whatsapp_business_account' && !body.entry) {
    return { processed: 0, errors: 0 };
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const val = change.value;
      if (!val) continue;

      // Extract Contacts profile mapping (wa_id -> profile.name)
      const contactMap = new Map<string, { name?: string }>();
      if (Array.isArray(val.contacts)) {
        for (const ct of val.contacts) {
          if (ct.wa_id) {
            contactMap.set(ct.wa_id, { name: ct.profile?.name });
          }
        }
      }

      // Process Statuses
      if (Array.isArray(val.statuses)) {
        for (const st of val.statuses) {
          try {
            await processMetaStatusUpdate(st);
            processed++;
          } catch (err: any) {
            console.error('[Meta Webhook Status Error]:', err.message);
            errors++;
          }
        }
      }

      // Process Messages
      if (Array.isArray(val.messages)) {
        for (const msg of val.messages) {
          try {
            await processMetaIncomingMessage(msg, contactMap);
            processed++;
          } catch (err: any) {
            console.error('[Meta Webhook Message Error]:', err.message);
            errors++;
            // Enqueue failed event for persistent background reprocessing
            relDb.enqueueWhatsAppEventSync(msg.id || `fail-${Date.now()}`, JSON.stringify(msg), err.message);
          }
        }
      }
    }
  }

  return { processed, errors };
}

// Meta Webhook Inbound (POST)
app.post(WEBHOOK_PATHS, async (req: Request, res: Response) => {
  // 1. HMAC SHA-256 Validation
  const isSignatureValid = verifyMetaWebhookSignature(req);
  if (!isSignatureValid) {
    return res.status(401).send('Invalid signature');
  }

  const body = req.body;
  if (body?.object === 'whatsapp_business_account') {
    // 2. Dispatch payload with deduplication and error isolation
    try {
      await dispatchMetaWebhookPayload(body);
    } catch (err: any) {
      console.error('[Meta Webhook Dispatch Error]:', err.message);
      // Even if background processing encountered a partial issue, return 200 to acknowledge receipt to Meta
      // and prevent Meta from disabling or retrying storming the webhook.
      const entryId = body.entry?.[0]?.id || `entry-${Date.now()}`;
      relDb.enqueueWhatsAppEventSync(entryId, JSON.stringify(body), err.message);
    }

    return res.status(200).send('EVENT_RECEIVED');
  }

  res.sendStatus(404);
});

// Simulator for incoming WhatsApp message on Canal 1
app.post('/api/whatsapp/simulate-incoming', async (req: Request, res: Response) => {
  const { from, text } = req.body;
  if (!from || !text) {
    return res.status(400).json({ error: 'Número de origem ("from") e texto da mensagem ("text") são obrigatórios.' });
  }

  const result = await handleIncomingMessageEvent(from, text, `sim-${Date.now()}`);
  res.json({ success: true, ...result });
});

// Environment (Produção vs Demonstração)
app.get('/api/environment', (req: Request, res: Response) => {
  res.json(storage.getEnvironmentInfo());
});

app.post('/api/environment', (req: Request, res: Response) => {
  const { environment } = req.body;
  if (!environment || (environment !== 'producao' && environment !== 'demo')) {
    return res.status(400).json({ error: 'Ambiente inválido. Opções permitidas: "producao" ou "demo".' });
  }
  const result = storage.setEnvironment(environment);
  res.json(result);
});

// 7. Central de Automações (Google Cloud native webhooks & scheduled tasks)
app.get('/api/automations/config', (req: Request, res: Response) => {
  res.json(storage.getAutomationsConfig());
});

app.post('/api/automations/config', (req: Request, res: Response) => {
  const updated = storage.updateAutomationsConfig(req.body);
  res.json(updated);
});

app.post('/api/automations/run-scheduled', (req: Request, res: Response) => {
  const result = storage.runScheduledMaintenance();
  res.json({ success: true, ...result });
});

app.post('/api/webhooks/automations/leads', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || req.headers['x-api-key'];
  const autoConfig = storage.getAutomationsConfig();

  const tokenProvided = authHeader?.toString().replace('Bearer ', '').trim();
  if (!tokenProvided || tokenProvided !== autoConfig.inboundApiKey) {
    return res.status(401).json({ error: 'Não autorizado: Chave de API de automação inválida ou ausente no cabeçalho.' });
  }

  const { leadData } = req.body;
  if (!leadData || !leadData.name || !leadData.whatsapp) {
    return res.status(400).json({ error: 'Payload incompleto: "name" e "whatsapp" são obrigatórios.' });
  }

  const result = storage.createLead(
    {
      name: leadData.name,
      cnpj: leadData.cnpj,
      segment: leadData.segment || 'Geral',
      city: leadData.city || 'Não informada',
      neighborhood: leadData.neighborhood || '',
      site: leadData.site || '',
      instagram: leadData.instagram || '',
      commercialPhone: leadData.commercialPhone || leadData.whatsapp,
      whatsapp: leadData.whatsapp,
      contactName: leadData.contactName || 'Responsável Comercial',
      contactRole: leadData.contactRole || 'Contato',
      source: leadData.source || 'Central de Automações',
      lastVerifiedAt: new Date().toISOString(),
      consentStatus: leadData.consentStatus || 'pendente',
      stageId: 'identificada',
      priority: leadData.priority || 'media',
      assignedTo: leadData.assignedTo || 'Carlos Mendes (SDR)',
      notes: leadData.notes || 'Lead recebido via webhook da Central de Automações.'
    },
    'Central de Automações'
  );

  if (result.duplicateError) {
    return res.status(409).json({ error: result.duplicateError });
  }

  storage.recordAutomationEvent();
  res.status(201).json({ success: true, lead: result.lead });
});

// Backward compatibility for n8n routes
app.get('/api/n8n/config', (req: Request, res: Response) => {
  res.json(storage.getN8nConfig());
});

app.post('/api/n8n/config', (req: Request, res: Response) => {
  const updated = storage.updateN8nConfig(req.body);
  res.json(updated);
});

app.post('/api/webhooks/n8n/leads', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization || req.headers['x-api-key'];
  const n8nConfig = storage.getN8nConfig();

  const tokenProvided = authHeader?.toString().replace('Bearer ', '').trim();
  if (!tokenProvided || tokenProvided !== n8nConfig.inboundApiKey) {
    return res.status(401).json({ error: 'Não autorizado: Chave de API de automação inválida ou ausente no cabeçalho.' });
  }

  const { leadData } = req.body;
  if (!leadData || !leadData.name || !leadData.whatsapp) {
    return res.status(400).json({ error: 'Payload incompleto: "name" e "whatsapp" são obrigatórios.' });
  }

  const result = storage.createLead(
    {
      name: leadData.name,
      cnpj: leadData.cnpj,
      segment: leadData.segment || 'Geral',
      city: leadData.city || 'Não informada',
      neighborhood: leadData.neighborhood || '',
      site: leadData.site || '',
      instagram: leadData.instagram || '',
      commercialPhone: leadData.commercialPhone || leadData.whatsapp,
      whatsapp: leadData.whatsapp,
      contactName: leadData.contactName || 'Responsável Comercial',
      contactRole: leadData.contactRole || 'Contato',
      source: leadData.source || 'Central de Automações',
      lastVerifiedAt: new Date().toISOString(),
      consentStatus: leadData.consentStatus || 'pendente',
      stageId: 'identificada',
      priority: leadData.priority || 'media',
      assignedTo: leadData.assignedTo || 'Carlos Mendes (SDR)',
      notes: leadData.notes || 'Lead recebido via webhook de automação.'
    },
    'Central de Automações'
  );

  if (result.duplicateError) {
    return res.status(409).json({ error: result.duplicateError });
  }

  storage.recordN8nEvent();
  res.status(201).json({ success: true, lead: result.lead });
});

// 8. Commercial Proposals
app.get('/api/proposals', (req: Request, res: Response) => {
  res.json(storage.getProposals());
});

app.post('/api/proposals', (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Beatriz Lima (Closer)';
  const newProp = storage.createProposal(req.body, author);
  res.status(201).json(newProp);
});

app.put('/api/proposals/:id', (req: Request, res: Response) => {
  const author = (req.headers['x-user-name'] as string) || 'Beatriz Lima (Closer)';
  const updated = storage.updateProposal(req.params.id, req.body, author);
  if (!updated) return res.status(404).json({ error: 'Proposta não encontrada' });
  res.json(updated);
});

// 9. Local Prospecting (Taboão SBC, Paulicéia, Rudge Ramos, Planalto, Diadema)
app.get('/api/prospecting/places', (req: Request, res: Response) => {
  const { neighborhood, city, segment, onlyOpportunitiesAB, tierFilter, geoScope, radiusKm, searchQuery, environment } = req.query;
  const env = (environment as string) || 'producao';

  const filter = {
    neighborhood: (neighborhood as string) || undefined,
    city: (city as string) || 'São Bernardo do Campo',
    segment: (segment as string) || 'Todos',
    radiusKm: (radiusKm ? Number(radiusKm) : 5) as any,
    onlyOpportunitiesAB: onlyOpportunitiesAB === 'true',
    tierFilter: (tierFilter as any) || undefined,
    geoScope: (geoScope as any) || 'city',
    searchQuery: searchQuery as string
  };

  const places = storage.getProspectingPlaces(filter);
  // Strict separation: never return demo records in production
  const filteredByEnv = env === 'producao' ? places.filter(p => !p.isDemoRecord) : places;
  res.json(filteredByEnv);
});

app.post('/api/prospecting/search', async (req: Request, res: Response) => {
  try {
    const filter = req.body;
    const searchResult = await ProspectingService.searchPlaces(filter);

    // If API is not configured or in error state, return result immediately with empty places (do not simulate)
    if (searchResult.status !== 'completed') {
      return res.json({
        ...searchResult,
        places: []
      });
    }

    // Persist discovered places in database
    if (searchResult.places.length > 0) {
      storage.saveProspectingPlaces(searchResult.places);
    }

    res.json(searchResult);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao executar pesquisa local de empresas', details: err?.message });
  }
});

// Expanded High-Volume Search Campaign
app.post('/api/prospecting/search-expanded', async (req: Request, res: Response) => {
  try {
    const filter = req.body;
    const existingDbPlaces = storage.getProspectingPlaces();
    const existingCrmLeads = storage.getLeads().map(l => ({
      phone: l.whatsapp || l.commercialPhone,
      site: l.site,
      name: l.name,
      sourceId: l.sourceId
    }));

    const result = await ProspectingService.searchPlacesExpanded(filter, {
      existingDbPlaces,
      existingCrmLeads,
      onBatchSaved: (batch) => {
        storage.saveProspectingPlaces(batch);
      }
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao executar campanha de prospecção', details: err?.message });
  }
});

// Stop current search campaign
app.post('/api/prospecting/stop', (req: Request, res: Response) => {
  ProspectingService.requestStop();
  res.json({ success: true, message: 'Solicitação de interrupção enviada ao motor de prospecção.' });
});

// Latest diagnostics report
app.get('/api/prospecting/diagnostics', (req: Request, res: Response) => {
  res.json(ProspectingService.getLatestDiagnostics() || null);
});

// Prospecting campaign execution history
app.get('/api/prospecting/campaigns', (req: Request, res: Response) => {
  res.json(ProspectingService.getCampaignHistory());
});

// Prospecting database persisted statistics (single source of truth)
app.get('/api/prospecting/stats', (req: Request, res: Response) => {
  res.json(storage.getProspectingDatabaseStats());
});

app.post('/api/prospecting/audit-site', async (req: Request, res: Response) => {
  const { placeId, siteUrl } = req.body;
  if (!siteUrl) {
    return res.status(400).json({ error: 'URL do website é obrigatória para a auditoria técnica.' });
  }

  try {
    const auditRes = await ProspectingService.auditWebsiteUrl(siteUrl);
    let updatedPlace;
    if (placeId) {
      updatedPlace = storage.updatePlaceAudit(placeId, auditRes.audit, auditRes.tier);
    }

    res.json({
      audit: auditRes.audit,
      tier: auditRes.tier,
      category: auditRes.category,
      place: updatedPlace
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro durante execução da auditoria técnica HTTP', details: err?.message });
  }
});

app.post('/api/prospecting/batch-audit', async (req: Request, res: Response) => {
  const { placeIds, auditAllPending, limit } = req.body;

  try {
    const allPlaces = storage.getProspectingPlaces();
    let targetPlaces: any[] = [];

    if (auditAllPending) {
      // Find all places with tier === 'pendente' and site present
      targetPlaces = allPlaces.filter(p => (p.opportunityTier === 'pendente' || !p.auditResult) && p.site);
      if (limit && typeof limit === 'number' && limit > 0) {
        targetPlaces = targetPlaces.slice(0, limit);
      }
    } else if (Array.isArray(placeIds) && placeIds.length > 0) {
      targetPlaces = allPlaces.filter(p => placeIds.includes(p.id) && p.site);
    } else {
      return res.status(400).json({ error: 'Lista de identificadores (placeIds) ou auditAllPending=true é obrigatória.' });
    }

    const results: any[] = [];
    for (const p of targetPlaces) {
      try {
        const auditRes = await ProspectingService.auditWebsiteUrl(p.site);
        const updated = storage.updatePlaceAudit(p.id, auditRes.audit, auditRes.tier);
        results.push({ placeId: p.id, success: true, tier: auditRes.tier, updated });
      } catch (err: any) {
        results.push({ placeId: p.id, success: false, error: err?.message || 'Falha na auditoria' });
      }
    }

    res.json({
      success: true,
      auditedCount: results.filter(r => r.success).length,
      results,
      stats: storage.getProspectingDatabaseStats()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha na auditoria em lote', details: err?.message });
  }
});

app.post('/api/prospecting/generate-pitch', async (req: Request, res: Response) => {
  const { placeId, placeData } = req.body;
  const place = placeId ? storage.getProspectingPlaces().find(p => p.id === placeId) || placeData : placeData;

  if (!place) {
    return res.status(404).json({ error: 'Dados da empresa não localizados para formulação de abordagem.' });
  }

  try {
    const pitch = await ProspectingService.generatePitch(place);
    if (placeId) {
      storage.updatePlacePitch(placeId, pitch);
    }
    res.json(pitch);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao formular proposta comercial consultiva', details: err?.message });
  }
});

app.post('/api/prospecting/mark-contacted', (req: Request, res: Response) => {
  const { placeId } = req.body;
  const author = (req.headers['x-user-name'] as string) || 'Carlos Mendes (SDR)';
  const updated = storage.markPlaceContacted(placeId, author);
  if (!updated) return res.status(404).json({ error: 'Empresa não encontrada na base de prospecção.' });
  res.json(updated);
});

app.post('/api/prospecting/to-lead', (req: Request, res: Response) => {
  const { placeId } = req.body;
  const author = (req.headers['x-user-name'] as string) || 'Carlos Mendes (SDR)';
  const result = storage.convertPlaceToLead(placeId, author);
  if (!result.success) {
    return res.status(400).json({ error: result.duplicateError || 'Erro ao converter empresa para lead.' });
  }
  res.status(201).json(result);
});

app.post('/api/prospecting/batch-to-leads', (req: Request, res: Response) => {
  const { placeIds } = req.body;
  if (!Array.isArray(placeIds) || placeIds.length === 0) {
    return res.status(400).json({ error: 'Array de identificadores (placeIds) é obrigatório.' });
  }
  const author = (req.headers['x-user-name'] as string) || 'Carlos Mendes (SDR)';
  const result = storage.batchConvertPlacesToLeads(placeIds, author);
  res.status(201).json({
    success: true,
    ...result,
    message: `${result.convertedCount} empresas importadas com sucesso para o Funil Comercial (${result.duplicatesCount} já cadastradas ignoradas).`
  });
});

app.post('/api/prospecting/deduplicate', (req: Request, res: Response) => {
  const result = storage.deduplicateProspectingPlaces();
  res.json(result);
});

app.get('/api/prospecting/config', (req: Request, res: Response) => {
  res.json(ProspectingService.getApiConfig());
});

app.post('/api/prospecting/config', async (req: Request, res: Response) => {
  const { apiKey, customProjectId } = req.body;
  const validationResult = await ProspectingService.setPlacesApiKey(apiKey || '', customProjectId);
  res.json({
    ...ProspectingService.getApiConfig(),
    validationResult
  });
});

app.post('/api/prospecting/test-search', async (req: Request, res: Response) => {
  try {
    const result = await ProspectingService.testRealSearch(3);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Falha ao executar teste de pesquisa real.' });
  }
});

// 10. Audit Logs
app.get('/api/audit', (req: Request, res: Response) => {
  res.json(storage.getAuditLogs());
});

// --- VITE DEV / PRODUCTION MIDDLEWARE ---
async function startServer() {
  const httpServer = http.createServer(app);

  // Initialize Prospecting Service & Google Secret Manager connection
  await ProspectingService.initialize();

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  // Background worker: persistent queue reprocessor for failed WhatsApp Cloud API events
  setInterval(async () => {
    try {
      const pendingItems = relDb.getPendingWhatsAppQueueSync();
      if (pendingItems.length === 0) return;

      console.log(`[WhatsApp Queue Worker] Processando ${pendingItems.length} eventos pendentes...`);
      for (const item of pendingItems) {
        try {
          const parsed = JSON.parse(item.payload_json);
          // If it is a full Meta webhook payload, dispatch through dispatcher
          if (parsed.object === 'whatsapp_business_account' || parsed.entry) {
            await dispatchMetaWebhookPayload(parsed);
          } else if (parsed.id && (parsed.type || parsed.text)) {
            // Single message retry
            await processMetaIncomingMessage(parsed, new Map());
          }
          relDb.resolveWhatsAppQueueItemSync(item.id, true);
          console.log(`[WhatsApp Queue Worker] Evento ${item.event_id} reprocessado com sucesso!`);
        } catch (err: any) {
          console.warn(`[WhatsApp Queue Worker] Falha na tentativa de reprocessamento (${item.event_id}):`, err.message);
          relDb.resolveWhatsAppQueueItemSync(item.id, false, err.message);
        }
      }
    } catch (workerErr: any) {
      console.error('[WhatsApp Queue Worker Error]:', workerErr.message);
    }
  }, 20000); // Poll every 20 seconds

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[FMWS SALES] Servidor ativo em http://0.0.0.0:${PORT}`);
    // Start public tunnel so Meta can verify webhooks without Google auth redirection
    tunnelManager.start(PORT).catch(err => {
      console.warn('[Tunnel Start Warning]:', err);
    });
  });
}

startServer();


