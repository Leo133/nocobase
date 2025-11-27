/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  // General
  'MCIT Authentication': 'MCIT Authentication',
  'SSO Authentication': 'SSO Authentication',
  'PIN Authentication': 'PIN Authentication',

  // Auth types
  'OIDC (OpenID Connect)': 'OIDC (OpenID Connect)',
  'SAML 2.0': 'SAML 2.0',
  'OAuth 2.0': 'OAuth 2.0',
  '4-Digit PIN': '4-Digit PIN',

  // OIDC
  'Issuer URL': 'Issuer URL',
  'Client ID': 'Client ID',
  'Client Secret': 'Client Secret',
  'Redirect URI': 'Redirect URI',
  Scope: 'Scope',

  // SAML
  'Entry Point': 'Entry Point',
  Issuer: 'Issuer',
  Certificate: 'Certificate',
  'Private Key': 'Private Key',
  'Callback URL': 'Callback URL',
  'Signature Algorithm': 'Signature Algorithm',

  // OAuth
  'Authorization URL': 'Authorization URL',
  'Token URL': 'Token URL',
  'User Info URL': 'User Info URL',

  // User mapping
  'User Mapping': 'User Mapping',
  'Email Field': 'Email Field',
  'Username Field': 'Username Field',
  'Nickname Field': 'Nickname Field',

  // PIN
  'Enter PIN': 'Enter PIN',
  'Confirm PIN': 'Confirm PIN',
  'Set up PIN': 'Set up PIN',
  'Change PIN': 'Change PIN',
  'Session Expiry (minutes)': 'Session Expiry (minutes)',
  'Max Attempts': 'Max Attempts',
  'Lockout Duration (minutes)': 'Lockout Duration (minutes)',

  // Messages
  'Authorization code is required': 'Authorization code is required',
  'OIDC authentication failed: {{error}}': 'OIDC authentication failed: {{error}}',
  'Unable to get user identity from OIDC provider': 'Unable to get user identity from OIDC provider',
  'SAML response is required': 'SAML response is required',
  'SAML authentication failed: {{error}}': 'SAML authentication failed: {{error}}',
  'Unable to get user identity from SAML provider': 'Unable to get user identity from SAML provider',
  'OAuth authentication failed: {{error}}': 'OAuth authentication failed: {{error}}',
  'Unable to get user identity from OAuth provider': 'Unable to get user identity from OAuth provider',
  'PIN must be exactly {{length}} digits': 'PIN must be exactly {{length}} digits',
  'Invalid PIN format': 'Invalid PIN format',
  'PIN not set up for this user': 'PIN not set up for this user',
  'Account locked. Try again in {{minutes}} minutes': 'Account locked. Try again in {{minutes}} minutes',
  'Too many failed attempts. Account locked for {{minutes}} minutes':
    'Too many failed attempts. Account locked for {{minutes}} minutes',
  'Invalid PIN': 'Invalid PIN',
  'User ID is required': 'User ID is required',
  'PIN is required': 'PIN is required',
  'User not found': 'User not found',
  'Authenticator name is required': 'Authenticator name is required',
  'Authenticator not found or not enabled': 'Authenticator not found or not enabled',
  'Unsupported authentication type': 'Unsupported authentication type',
  'Authentication failed: {{error}}': 'Authentication failed: {{error}}',
  'You must be logged in to use PIN authentication': 'You must be logged in to use PIN authentication',
  'PIN verified successfully': 'PIN verified successfully',
  'You must be logged in to set up a PIN': 'You must be logged in to set up a PIN',
  'PINs do not match': 'PINs do not match',
  'PIN set up successfully': 'PIN set up successfully',
  'You must be logged in to validate PIN': 'You must be logged in to validate PIN',
  'You must be logged in': 'You must be logged in',

  // UI
  'Sign in with OIDC': 'Sign in with OIDC',
  'Sign in with SAML': 'Sign in with SAML',
  'Sign in with OAuth': 'Sign in with OAuth',
  'Sign in with PIN': 'Sign in with PIN',
  'Continue with SSO': 'Continue with SSO',
  'Quick access with PIN': 'Quick access with PIN',
  'Forgot PIN?': 'Forgot PIN?',
  'Configure SSO': 'Configure SSO',
  'Configure PIN': 'Configure PIN',
};
