import 'dotenv/config';
import { LinkedInProvider } from '../src/lib/integrations/providers/LinkedInProvider';
import { encryptToken, decryptToken } from '../src/lib/security/encryption';
import { LinkedInGrowthAnalyst } from '../src/lib/integrations/linkedin/LinkedInGrowthAnalyst';

async function runTests() {
  console.log('=== STARTING LINKEDIN INTEGRATION TEST SUITE ===\n');
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

  // 1. Test Provider configuration validation
  const provider = new LinkedInProvider();
  const config = provider.validateConfiguration();
  assert(config.isValid === true, 'LinkedInProvider configuration valid with present .env credentials');
  assert(config.missing.length === 0, 'No required LinkedIn env vars are missing');

  // 2. Test Authorization URL Generation
  const authUrl = provider.getAuthorizationUrl('user_123', 'test_state_nonce', {
    baseUrl: 'http://localhost:3000',
  });
  assert(authUrl.startsWith('https://www.linkedin.com/oauth/v2/authorization'), 'Auth URL targets official LinkedIn endpoint');
  assert(authUrl.includes('client_id=77aryy8rc2neml'), 'Auth URL includes correct LinkedIn Client ID');
  assert(authUrl.includes('response_type=code'), 'Auth URL uses authorization code response type');
  assert(authUrl.includes('state=test_state_nonce'), 'Auth URL includes CSRF state nonce');
  assert(authUrl.includes('w_member_social'), 'Auth URL requests w_member_social for posting');
  assert(!authUrl.includes('r_member_profileAnalytics'), 'Auth URL does NOT prematurely request unapproved analytics scope');

  // 3. Test AES-256 Encryption & Decryption
  const sampleToken = 'AQV_fake_linkedin_access_token_12345';
  const encrypted = encryptToken(sampleToken);
  const decrypted = decryptToken(encrypted);
  assert(encrypted !== sampleToken, 'Token is successfully encrypted');
  assert(decrypted === sampleToken, 'Decrypted token matches original plain token');

  // 4. Test AI Growth Analyst Disconnected Fallback
  const disconnectedReport = await LinkedInGrowthAnalyst.analyzeGrowth('non_existent_user_999');
  assert(disconnectedReport.connected === false, 'Growth analyst reports connected=false for non-connected user');
  assert(disconnectedReport.analyticsAvailable === false, 'Growth analyst does NOT fabricate analytics for non-connected user');

  console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
