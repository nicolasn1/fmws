import localtunnel, { Tunnel } from 'localtunnel';

export interface TunnelInfo {
  url: string | null;
  status: 'offline' | 'starting' | 'online' | 'error';
  lastStartedAt: string | null;
  errorMessage?: string;
  history: Array<{ timestamp: string; event: string }>;
}

class PublicTunnelService {
  private tunnel: Tunnel | null = null;
  private tunnelUrl: string | null = null;
  private status: 'offline' | 'starting' | 'online' | 'error' = 'offline';
  private lastStartedAt: string | null = null;
  private errorMessage?: string;
  private history: Array<{ timestamp: string; event: string }> = [];
  private isRestarting = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentPort = 3000;

  constructor() {
    this.logHistory('Serviço de túnel público HTTPS inicializado');
  }

  private logHistory(event: string) {
    this.history.unshift({
      timestamp: new Date().toISOString(),
      event
    });
    if (this.history.length > 25) {
      this.history.pop();
    }
  }

  public getInfo(): TunnelInfo {
    return {
      url: this.tunnelUrl,
      status: this.status,
      lastStartedAt: this.lastStartedAt,
      errorMessage: this.errorMessage,
      history: this.history
    };
  }

  public getTunnelUrl(): string | null {
    return this.tunnelUrl;
  }

  public async start(port = 3000): Promise<string | null> {
    this.currentPort = port;
    if (this.tunnel && this.status === 'online' && this.tunnelUrl) {
      return this.tunnelUrl;
    }

    this.status = 'starting';
    this.lastStartedAt = new Date().toISOString();
    this.errorMessage = undefined;

    // Generate unique fresh subdomain to avoid 503 collisions on loca.lt
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const chosenSubdomain = `fmws-meta-${uniqueSuffix}`;
    this.logHistory(`Iniciando túnel público seguro [${chosenSubdomain}] na porta ${port}...`);

    try {
      let activeTunnel: Tunnel;
      try {
        activeTunnel = await localtunnel({
          port,
          subdomain: chosenSubdomain
        });
      } catch (err: any) {
        const fallbackSubdomain = `fmws-sales-${Math.floor(1000 + Math.random() * 9000)}`;
        this.logHistory(`Tentando subdomínio alternativo ${fallbackSubdomain}...`);
        activeTunnel = await localtunnel({
          port,
          subdomain: fallbackSubdomain
        });
      }

      this.tunnel = activeTunnel;
      this.tunnelUrl = activeTunnel.url;
      this.status = 'online';
      this.logHistory(`Túnel público HTTPS ativo: ${this.tunnelUrl}`);
      console.log(`[Tunnel] URL Pública Meta Webhook Ativa: ${this.tunnelUrl}/api/webhooks/whatsapp`);

      this.startHeartbeat();

      activeTunnel.on('close', () => {
        console.warn('[Tunnel] Conexão do túnel encerrada.');
        this.status = 'offline';
        this.tunnelUrl = null;
        this.tunnel = null;
        this.logHistory('Conexão do túnel encerrada');

        // Auto-reconnect if not explicitly restarting
        if (!this.isRestarting) {
          setTimeout(() => {
            console.log('[Tunnel] Tentando reconectar túnel público...');
            this.start(port).catch(console.error);
          }, 3000);
        }
      });

      activeTunnel.on('error', (err: Error) => {
        console.error('[Tunnel Error]:', err);
        this.status = 'error';
        this.errorMessage = err.message;
        this.logHistory(`Erro no túnel: ${err.message}`);
      });

      return this.tunnelUrl;
    } catch (err: any) {
      console.error('[Tunnel Startup Error]:', err);
      this.status = 'error';
      this.errorMessage = err?.message || 'Falha ao inicializar túnel público';
      this.logHistory(`Falha de inicialização: ${this.errorMessage}`);
      return null;
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Ping every 25 seconds with Bypass-Tunnel-Reminder to keep edge connection warm
    this.heartbeatInterval = setInterval(async () => {
      if (!this.tunnelUrl || this.status !== 'online') return;
      try {
        const pingUrl = `${this.tunnelUrl}/api/whatsapp/webhook-info`;
        const res = await fetch(pingUrl, {
          method: 'GET',
          headers: {
            'Bypass-Tunnel-Reminder': 'true',
            'User-Agent': 'FMWS-Tunnel-Heartbeat'
          },
          signal: AbortSignal.timeout(6000)
        });
        if (res.status === 502 || res.status === 503) {
          console.warn(`[Tunnel Heartbeat] Status ${res.status}. Reiniciando túnel para manter disponibilidade...`);
          this.restart(this.currentPort).catch(console.error);
        }
      } catch (err: any) {
        // Network timeout on edge
        console.warn('[Tunnel Heartbeat Timeout] Verificando túnel:', err.message);
      }
    }, 25000);
  }

  public async stop(): Promise<void> {
    this.isRestarting = true;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.tunnel) {
      try {
        this.tunnel.close();
      } catch {
        // ignore
      }
      this.tunnel = null;
    }
    this.status = 'offline';
    this.tunnelUrl = null;
    this.logHistory('Túnel público finalizado');
    this.isRestarting = false;
  }

  public async restart(port = 3000): Promise<string | null> {
    await this.stop();
    await new Promise((r) => setTimeout(r, 1000));
    return this.start(port);
  }
}

export const tunnelManager = new PublicTunnelService();
