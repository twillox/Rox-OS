import 'dotenv/config';
import { LinkedInProvider } from '../src/lib/integrations/providers/LinkedInProvider';
import { NotionProvider } from '../src/lib/integrations/providers/NotionProvider';
import { GoogleProvider } from '../src/lib/integrations/providers/GoogleProvider';
import { IntegrationService } from '../src/lib/integrations/IntegrationService';
import { AgentIntegrationService } from '../src/lib/services/AgentIntegrationService';
import { encryptToken, decryptToken } from '../src/lib/security/encryption';
import { MOCK_INTEGRATIONS } from '../src/lib/mock/integrations/data';

async function runIntegrationsAudit() {
  console.log('=== STARTING ROXTEN OS FULL INTEGRATIONS AUDIT ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // 1. Audit MOCK_INTEGRATIONS (Only real 5 apps should exist)
  const allowedIds = new Set(['gmail', 'google-calendar', 'google-drive', 'linkedin', 'notion']);
  const allValid = MOCK_INTEGRATIONS.every(item => allowedIds.has(item.id));
  assert(allValid === true, 'MOCK_INTEGRATIONS contains only the 5 real configured integrations');
  assert(MOCK_INTEGRATIONS.length === 5, 'MOCK_INTEGRATIONS has exactly 5 items (all mock placeholders removed)');

  // 2. Audit Encryption Engine (AES-256-GCM)
  const plain = 'secret_access_token_super_secure_9999';
  const enc = encryptToken(plain);
  const dec = decryptToken(enc);
  assert(enc !== plain, 'AES-256 encryption obscures plain tokens');
  assert(dec === plain, 'AES-256 decryption successfully restores token');

  // 3. Audit Google Provider & URLs
  const google = new GoogleProvider();
  const googleAuthUrl = google.getAuthorizationUrl('user_test', 'nonce_123', { service: 'gmail', baseUrl: 'http://localhost:3000' });
  assert(googleAuthUrl.includes('accounts.google.com/o/oauth2/v2/auth'), 'Google Auth URL targets official Google OAuth endpoint');
  assert(googleAuthUrl.includes('client_id='), 'Google Auth URL includes client_id');
  assert(decodeURIComponent(googleAuthUrl).includes('gmail.modify'), 'Google Auth URL includes gmail.modify scope when service is gmail');

  // 4. Audit LinkedIn Provider & URLs
  const linkedin = new LinkedInProvider();
  const linkedInConfig = linkedin.validateConfiguration();
  assert(linkedInConfig.isValid === true, 'LinkedIn configuration is valid with .env credentials');
  const linkedInAuthUrl = linkedin.getAuthorizationUrl('user_test', 'nonce_123', { baseUrl: 'http://localhost:3000' });
  assert(linkedInAuthUrl.includes('linkedin.com/oauth/v2/authorization'), 'LinkedIn Auth URL targets official LinkedIn endpoint');
  assert(linkedInAuthUrl.includes('w_member_social'), 'LinkedIn Auth URL requests w_member_social');
  assert(!linkedInAuthUrl.includes('r_member_profileAnalytics'), 'LinkedIn Auth URL does not request ungranted analytics');

  // 5. Audit Notion Provider & URLs
  const notion = new NotionProvider();
  const notionAuthUrl = notion.getAuthorizationUrl('user_test', 'nonce_123', { baseUrl: 'http://localhost:3000' });
  assert(notionAuthUrl.includes('api.notion.com/v1/oauth/authorize'), 'Notion Auth URL targets official Notion OAuth endpoint');
  assert(notionAuthUrl.includes('client_id=3f3d872b-594c-8176-addd-00379382051e'), 'Notion Auth URL includes correct Notion Client ID');

  // 6. Audit Provider Instances mapping
  assert(IntegrationService.getProviderInstance('linkedin').provider.providerId === 'linkedin', 'IntegrationService resolves linkedin provider');
  assert(IntegrationService.getProviderInstance('notion').provider.providerId === 'notion', 'IntegrationService resolves notion provider');
  assert(IntegrationService.getProviderInstance('gmail').provider.providerId === 'google', 'IntegrationService resolves gmail provider');

  // 7. Audit Live Integrations Context
  const context = await AgentIntegrationService.getLiveIntegrationsContext('default_user', 'biz_roxten_corp');
  assert(typeof context.formattedText === 'string', 'AgentIntegrationService produces string context');
  assert(Array.isArray(context.connectedProviders), 'AgentIntegrationService produces connected providers list');

  console.log(`\n=== AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runIntegrationsAudit().catch(err => {
  console.error('Audit run failed:', err);
  process.exit(1);
});
