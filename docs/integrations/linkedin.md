# LinkedIn Integration Guide — ROXTEN OS

This document details the architecture, setup, and operation of the official LinkedIn OAuth 2.0 and REST API integration in ROXTEN OS.

---

## 1. Overview & Principles

The ROXTEN OS LinkedIn integration adheres to production standards:
- **Official OAuth 2.0**: Uses standard LinkedIn OAuth authorization code grant and OpenID Connect (`/v2/userinfo`).
- **Official REST APIs**: Uses the LinkedIn Posts API (`https://api.linkedin.com/rest/posts`) with required protocol headers (`LinkedIn-Version: 202401`, `X-Restli-Protocol-Version: 2.0.0`).
- **No Mock or Fake Data**: Never generates fabricated follower counts or metrics. Follower and impression analytics are enabled only when the developer app possesses Community Management API access (`r_member_profileAnalytics`, `r_member_postAnalytics`).
- **Encrypted Token Storage**: All OAuth access and refresh tokens are encrypted at rest with AES-256-GCM.
- **Tenant Isolation**: Every integration credential and snapshot is strictly scoped by `userId`.

---

## 2. Configuration & Environment Variables

Add the following environment variables to your `.env` file:

```env
# LinkedIn OAuth 2.0 Credentials
LINKEDIN_CLIENT_ID="your_client_id"
LINKEDIN_CLIENT_SECRET="your_client_secret"
LINKEDIN_REDIRECT_URI="http://localhost:3000/api/integrations/linkedin/callback"
LINKEDIN_API_VERSION="202401"
```

### Server-Side Validation

If required variables (`LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`) are missing, the server rejects connection attempts with:

```json
{
  "success": false,
  "code": "LINKEDIN_CONFIGURATION_MISSING",
  "message": "LinkedIn OAuth is not configured on the server."
}
```

---

## 3. LinkedIn Developer Portal Setup

1. Go to the [LinkedIn Developer Portal](https://www.linkedin.com/developers/).
2. Create an application (e.g. **ROXTEN-OS**).
3. Under the **Products** tab, add:
   - **Share on LinkedIn** (grants `w_member_social` for feed posting)
   - **Sign In with LinkedIn using OpenID Connect** (grants `openid`, `profile`, `email`)
4. Under the **Auth** tab:
   - Configure the **Authorized redirect URLs for your app**:
     ```
     http://localhost:3000/api/integrations/linkedin/callback
     ```
   - Copy **Client ID** and **Primary Client Secret** into your `.env` file.

---

## 4. OAuth 2.0 Architecture & Scopes

### Authorization Flow
```
User clicks "Connect" on LinkedIn card
               ↓
GET /api/integrations/linkedin/connect
               ↓
Server generates CSRF state & sets secure httpOnly cookie
               ↓
Redirects (302) to https://www.linkedin.com/oauth/v2/authorization
               ↓
User authorizes permissions in LinkedIn
               ↓
LinkedIn redirects to GET /api/integrations/linkedin/callback?code=...&state=...
               ↓
Server validates state cookie against callback parameter
               ↓
POST https://www.linkedin.com/oauth/v2/accessToken (exchanges code for tokens)
               ↓
GET https://api.linkedin.com/v2/userinfo (fetches member name, sub, picture, email)
               ↓
AES-256-GCM encryption & database persistence
               ↓
Redirect to /dashboard/integrations?connected=linkedin
```

### Requested Scopes
- `openid` — OpenID Connect identifier
- `profile` — Member name and avatar
- `email` — Member email address
- `w_member_social` — Publishing text posts to member's personal feed

---

## 5. Capability Detection

The integration evaluates granted scopes dynamically:

| State | Scopes Present | Description |
|---|---|---|
| `DISCONNECTED` | None | Account is not linked |
| `CONNECTED_WITHOUT_ANALYTICS` | `openid`, `profile`, `w_member_social` | Profile & publishing operational. Follower/post analytics unavailable |
| `CONNECTED_WITH_ANALYTICS` | + `r_member_profileAnalytics`, `r_member_postAnalytics` | Full analytics enabled via Community Management API |

---

## 6. API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/integrations/linkedin/connect` | `GET` | Initiates OAuth flow and redirects to LinkedIn |
| `/api/integrations/linkedin/callback` | `GET` | Handles OAuth redirect, validates CSRF, saves tokens |
| `/api/integrations/linkedin/status` | `GET` | Returns connection state and capability flags |
| `/api/integrations/linkedin/disconnect` | `POST` / `DELETE` | Clears stored credentials and disconnects integration |
| `/api/integrations/linkedin/posts` | `POST` | Publishes post to LinkedIn (`{ text: string }`) |
| `/api/integrations/linkedin/analytics/followers` | `GET` | Retrieves follower statistics |
| `/api/integrations/linkedin/analytics/posts` | `GET` | Retrieves creator post analytics |
| `/api/integrations/linkedin/analytics/overview` | `GET` | Aggregated 30-day overview metrics |
| `/api/integrations/linkedin/analytics/insights` | `GET` | AI Growth Analyst health score and recommendations |
