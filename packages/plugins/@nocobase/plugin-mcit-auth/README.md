# @nocobase/plugin-mcit-auth

MCIT Authentication plugin for NocoBase providing SSO options (OIDC, SAML, OAuth 2.0) and 4-digit PIN session authentication for technicians.

## Features

### Single Sign-On (SSO) Authentication

- **OIDC (OpenID Connect)**: Full OIDC protocol support with configurable user mapping
- **SAML 2.0**: SAML-based authentication with XML assertion parsing
- **OAuth 2.0**: Generic OAuth 2.0 provider support

### PIN Authentication

- **4-digit PIN**: Quick session re-authentication for secure areas
- **Security Features**: 
  - Account lockout after failed attempts
  - Secure PIN hashing with salt
  - Configurable session expiry

## Configuration

### OIDC Configuration

| Field | Description |
|-------|-------------|
| Issuer URL | The OIDC provider's issuer URL |
| Client ID | Your application's client ID |
| Client Secret | Your application's client secret |
| Redirect URI | The callback URL for your application |
| Scope | OAuth scopes (default: `openid profile email`) |

### SAML Configuration

| Field | Description |
|-------|-------------|
| Entry Point | The IdP's SSO URL |
| Issuer | Your application's entity ID |
| Certificate | The IdP's X.509 certificate |
| Callback URL | The ACS URL for your application |

### OAuth 2.0 Configuration

| Field | Description |
|-------|-------------|
| Authorization URL | The OAuth provider's authorize endpoint |
| Token URL | The OAuth provider's token endpoint |
| User Info URL | The OAuth provider's user info endpoint |
| Client ID | Your application's client ID |
| Client Secret | Your application's client secret |
| Redirect URI | The callback URL for your application |

### PIN Configuration

| Field | Description | Default |
|-------|-------------|---------|
| Session Expiry | How long the PIN session is valid (minutes) | 30 |
| Max Attempts | Maximum failed PIN attempts before lockout | 5 |
| Lockout Duration | How long the account is locked (minutes) | 15 |

## User Mapping

All SSO providers support configurable user mapping to map provider attributes to NocoBase user fields:

- Email Field
- Username Field
- Nickname Field

## Usage

### Setting up SSO

1. Install and enable the plugin
2. Go to Authentication settings
3. Add a new authenticator
4. Select the SSO type (OIDC, SAML, or OAuth 2.0)
5. Configure the provider settings

### Setting up PIN

1. Log in with your primary authentication method
2. Go to MCIT Authentication settings
3. Set up your 4-digit PIN
4. Use the PIN for quick re-authentication in secure areas

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `mcitAuth:getAuthUrl` | POST | Get SSO authorization URL |
| `mcitAuth:callback` | POST | Handle SSO callback |
| `mcitAuth:setupPin` | POST | Set up user PIN |
| `mcitAuth:signInWithPin` | POST | Authenticate with PIN |
| `mcitAuth:validatePin` | POST | Validate PIN |
| `mcitAuth:hasPinSetup` | GET | Check if user has PIN set up |

## Security Considerations

### SSO Implementations

The SSO implementations in this plugin provide basic functionality for OIDC, SAML, and OAuth 2.0 authentication. For production deployments with high security requirements, consider the following:

**OIDC**: 
- The current implementation does not perform full ID token signature validation
- For production use, consider integrating `openid-client` library for full OIDC compliance
- Ensure proper validation of `iss`, `aud`, `exp`, and `nonce` claims

**SAML**:
- The current SAML response parsing is simplified and does not validate XML signatures
- For production use, integrate `@node-saml/node-saml` or similar library
- Ensure proper certificate validation and replay attack prevention

**OAuth 2.0**:
- State parameter validation is implemented for CSRF protection
- Consider implementing PKCE (Proof Key for Code Exchange) for additional security

### PIN Authentication

- PINs are securely hashed using PBKDF2 with SHA-512 and unique salts
- Account lockout is implemented after configurable failed attempts
- Timing-safe comparison is used to prevent timing attacks

## License

AGPL-3.0 and NocoBase Commercial License
