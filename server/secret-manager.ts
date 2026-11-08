/**
 * Google Secret Manager Service for FMWS SALES
 * Handles secure storage and retrieval of sensitive credentials (e.g. Google Places API Key).
 * Strictly complies with:
 * - Storing keys EXCLUSIVELY in Google Secret Manager
 * - Never storing keys in Firestore, localStorage, sessionStorage, frontend code, or logs
 * - Never exposing full secret values to the frontend
 * - Detecting and reporting exact GCP IAM / API permission errors without simulated saving
 */

export interface SecretManagerDiagnostic {
  isConfigured: boolean;
  projectId: string;
  serviceAccount: string;
  apiEnabled: boolean;
  canAccessSecrets: boolean;
  canWriteSecrets: boolean;
  httpStatus?: number;
  errorCode?: string;
  errorMessage?: string;
  missingPermissions?: string[];
  remediationCommands?: string[];
  consoleUrl?: string;
}

export interface SecretAccessResult {
  success: boolean;
  value?: string;
  status?: number;
  reason?: string;
  errorMessage?: string;
  diagnostic?: SecretManagerDiagnostic;
}

export interface SecretSaveResult {
  success: boolean;
  version?: string;
  status?: number;
  reason?: string;
  errorMessage?: string;
  missingPermissions?: string[];
  remediationCommands?: string[];
  consoleUrl?: string;
  diagnostic?: SecretManagerDiagnostic;
}

const METADATA_SERVER_BASE = 'http://metadata.google.internal/computeMetadata/v1';

export class SecretManagerService {
  private static cachedProjectId: string | null = null;
  private static cachedServiceAccount: string | null = null;

  /**
   * Retrieves GCP Project ID from runtime metadata or environment variables.
   */
  public static async getProjectId(overrideProjectId?: string): Promise<string> {
    if (overrideProjectId?.trim()) {
      return overrideProjectId.trim();
    }
    if (this.cachedProjectId) {
      return this.cachedProjectId;
    }

    const envProject =
      process.env.GCP_PROJECT_ID ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT;
    if (envProject) {
      this.cachedProjectId = envProject;
      return envProject;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${METADATA_SERVER_BASE}/project/project-id`, {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const pid = (await res.text()).trim();
        if (pid) {
          this.cachedProjectId = pid;
          return pid;
        }
      }
    } catch {
      // Running outside GCP or metadata server unavailable
    }

    // Default fallback to current container project or user project
    return 'ais-us-east1-ef4de02e35e84142b';
  }

  /**
   * Retrieves Service Account email from runtime metadata.
   */
  public static async getServiceAccountEmail(): Promise<string> {
    if (this.cachedServiceAccount) {
      return this.cachedServiceAccount;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${METADATA_SERVER_BASE}/instance/service-accounts/default/email`, {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const sa = (await res.text()).trim();
        if (sa) {
          this.cachedServiceAccount = sa;
          return sa;
        }
      }
    } catch {
      // Ignored
    }

    return 'ais-sandbox@ais-us-east1-ef4de02e35e84142b.iam.gserviceaccount.com';
  }

  /**
   * Retrieves an OAuth 2.0 access token for the backend's Google Service Account.
   */
  private static async getAccessToken(): Promise<string | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${METADATA_SERVER_BASE}/instance/service-accounts/default/token`, {
        headers: { 'Metadata-Flavor': 'Google' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        return data.access_token || null;
      }
    } catch {
      // Ignored
    }
    return null;
  }

  /**
   * Diagnoses Secret Manager API status, project enablement, and IAM permissions.
   */
  public static async diagnose(customProjectId?: string): Promise<SecretManagerDiagnostic> {
    const projectId = await this.getProjectId(customProjectId);
    const serviceAccount = await this.getServiceAccountEmail();
    const token = await this.getAccessToken();

    const consoleUrl = `https://console.cloud.google.com/security/secret-manager?project=${projectId}`;
    const remediationCommands = [
      `# 1. Ativar a API do Secret Manager no projeto Google Cloud:`,
      `gcloud services enable secretmanager.googleapis.com --project=${projectId}`,
      `# 2. Conceder permissão de escrita e leitura de segredos para a identidade do backend:`,
      `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="roles/secretmanager.admin"`,
      `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="roles/secretmanager.secretAccessor"`
    ];

    if (!token) {
      return {
        isConfigured: false,
        projectId,
        serviceAccount,
        apiEnabled: false,
        canAccessSecrets: false,
        canWriteSecrets: false,
        httpStatus: 0,
        errorCode: 'METADATA_UNAVAILABLE',
        errorMessage: 'Não foi possível obter o token da conta de serviço Google Cloud pelo servidor de metadados.',
        missingPermissions: ['Acesso ao servidor de metadados / IAM'],
        remediationCommands,
        consoleUrl
      };
    }

    try {
      const testRes = await fetch(`https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (testRes.ok) {
        return {
          isConfigured: true,
          projectId,
          serviceAccount,
          apiEnabled: true,
          canAccessSecrets: true,
          canWriteSecrets: true,
          httpStatus: 200,
          consoleUrl
        };
      }

      const errData = await testRes.json().catch(() => ({}));
      const httpStatus = testRes.status;
      const errorObj = errData?.error || {};
      const reason = errorObj?.details?.[0]?.reason || errorObj?.status || 'UNKNOWN';
      const rawMessage = errorObj?.message || `HTTP ${httpStatus}`;

      const missingPermissions: string[] = [];
      if (rawMessage.includes('has not been used in project') || reason === 'SERVICE_DISABLED') {
        missingPermissions.push('API do Secret Manager desativada (secretmanager.googleapis.com)');
      }
      if (httpStatus === 403 || reason === 'PERMISSION_DENIED') {
        missingPermissions.push('Papel IAM roles/secretmanager.admin');
        missingPermissions.push('Papel IAM roles/secretmanager.secretAccessor');
      }

      return {
        isConfigured: false,
        projectId,
        serviceAccount,
        apiEnabled: reason !== 'SERVICE_DISABLED',
        canAccessSecrets: false,
        canWriteSecrets: false,
        httpStatus,
        errorCode: reason,
        errorMessage: rawMessage,
        missingPermissions,
        remediationCommands,
        consoleUrl
      };
    } catch (err: any) {
      return {
        isConfigured: false,
        projectId,
        serviceAccount,
        apiEnabled: false,
        canAccessSecrets: false,
        canWriteSecrets: false,
        httpStatus: 0,
        errorCode: 'NETWORK_ERROR',
        errorMessage: `Falha de rede ao conectar à Secret Manager API: ${err?.message || err}`,
        missingPermissions: ['Conectividade com secretmanager.googleapis.com'],
        remediationCommands,
        consoleUrl
      };
    }
  }

  /**
   * Fetches secret version from Google Secret Manager.
   * Never logs or prints the secret value.
   */
  public static async getSecret(secretName: string, customProjectId?: string): Promise<SecretAccessResult> {
    const projectId = await this.getProjectId(customProjectId);
    const token = await this.getAccessToken();

    if (!token) {
      return {
        success: false,
        status: 0,
        reason: 'NO_TOKEN',
        errorMessage: 'Ambiente sem credenciais Google Cloud ativas para consultar Secret Manager.'
      };
    }

    try {
      const url = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}/versions/latest:access`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        const base64Data = data?.payload?.data;
        if (base64Data) {
          const secretValue = Buffer.from(base64Data, 'base64').toString('utf8');
          return {
            success: true,
            value: secretValue,
            status: 200
          };
        }
      }

      const errData = await res.json().catch(() => ({}));
      const reason = errData?.error?.details?.[0]?.reason || errData?.error?.status || `HTTP_${res.status}`;
      const message = errData?.error?.message || `HTTP ${res.status}`;

      return {
        success: false,
        status: res.status,
        reason,
        errorMessage: message
      };
    } catch (err: any) {
      return {
        success: false,
        status: 0,
        reason: 'FETCH_ERROR',
        errorMessage: `Erro de conexão ao acessar Secret Manager: ${err?.message || err}`
      };
    }
  }

  /**
   * Stores or updates a secret version in Google Secret Manager.
   * If permissions are missing, returns exact failure details without simulating saving.
   */
  public static async saveSecret(
    secretName: string,
    secretValue: string,
    customProjectId?: string
  ): Promise<SecretSaveResult> {
    const projectId = await this.getProjectId(customProjectId);
    const serviceAccount = await this.getServiceAccountEmail();
    const token = await this.getAccessToken();

    const consoleUrl = `https://console.cloud.google.com/security/secret-manager?project=${projectId}`;
    const remediationCommands = [
      `gcloud services enable secretmanager.googleapis.com --project=${projectId}`,
      `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="roles/secretmanager.admin"`,
      `gcloud projects add-iam-policy-binding ${projectId} --member="serviceAccount:${serviceAccount}" --role="roles/secretmanager.secretAccessor"`
    ];

    if (!token) {
      return {
        success: false,
        status: 0,
        reason: 'NO_TOKEN',
        errorMessage: 'Conta de serviço do backend não autenticada no servidor de metadados do Google Cloud.',
        remediationCommands,
        consoleUrl
      };
    }

    try {
      // 1. Check if the secret already exists
      const getSecretUrl = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}`;
      const checkRes = await fetch(getSecretUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!checkRes.ok && checkRes.status === 404) {
        // Create secret first
        const createUrl = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets?secretId=${secretName}`;
        const createRes = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            replication: {
              automatic: {}
            }
          })
        });

        if (!createRes.ok) {
          const createErr = await createRes.json().catch(() => ({}));
          const reason = createErr?.error?.details?.[0]?.reason || createErr?.error?.status || `HTTP_${createRes.status}`;
          const message = createErr?.error?.message || `HTTP ${createRes.status}`;

          return {
            success: false,
            status: createRes.status,
            reason,
            errorMessage: `Falha ao criar o segredo '${secretName}' no Secret Manager: ${message}`,
            missingPermissions: [
              'secretmanager.secrets.create',
              'roles/secretmanager.admin'
            ],
            remediationCommands,
            consoleUrl
          };
        }
      } else if (!checkRes.ok && checkRes.status !== 200) {
        const checkErr = await checkRes.json().catch(() => ({}));
        const reason = checkErr?.error?.details?.[0]?.reason || checkErr?.error?.status || `HTTP_${checkRes.status}`;
        const message = checkErr?.error?.message || `HTTP ${checkRes.status}`;

        return {
          success: false,
          status: checkRes.status,
          reason,
          errorMessage: `Falha de acesso ao Secret Manager (${secretName}): ${message}`,
          missingPermissions: [
            reason === 'SERVICE_DISABLED'
              ? 'Ativação da Secret Manager API (secretmanager.googleapis.com)'
              : 'roles/secretmanager.admin ou roles/secretmanager.secretVersionManager'
          ],
          remediationCommands,
          consoleUrl
        };
      }

      // 2. Add secret version
      const addVersionUrl = `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets/${secretName}:addVersion`;
      const base64Data = Buffer.from(secretValue, 'utf8').toString('base64');
      const addVersionRes = await fetch(addVersionUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payload: {
            data: base64Data
          }
        })
      });

      if (!addVersionRes.ok) {
        const verErr = await addVersionRes.json().catch(() => ({}));
        const reason = verErr?.error?.details?.[0]?.reason || verErr?.error?.status || `HTTP_${addVersionRes.status}`;
        const message = verErr?.error?.message || `HTTP ${addVersionRes.status}`;

        return {
          success: false,
          status: addVersionRes.status,
          reason,
          errorMessage: `Falha ao adicionar versão do segredo: ${message}`,
          missingPermissions: ['roles/secretmanager.secretVersionManager'],
          remediationCommands,
          consoleUrl
        };
      }

      const versionData = await addVersionRes.json();
      const versionName = versionData?.name || 'latest';

      return {
        success: true,
        version: versionName,
        status: 200,
        consoleUrl
      };
    } catch (err: any) {
      return {
        success: false,
        status: 0,
        reason: 'NETWORK_ERROR',
        errorMessage: `Erro de rede ao comunicar com Google Secret Manager: ${err?.message || err}`,
        remediationCommands,
        consoleUrl
      };
    }
  }
}
