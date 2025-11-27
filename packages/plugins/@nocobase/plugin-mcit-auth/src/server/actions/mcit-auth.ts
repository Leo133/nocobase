/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import {
  namespace,
  MCIT_AUTH_TYPE_OIDC,
  MCIT_AUTH_TYPE_SAML,
  MCIT_AUTH_TYPE_OAUTH2,
  PIN_SESSIONS_COLLECTION,
} from '../../constants';
import { OIDCAuth } from '../providers/oidc-auth';
import { SAMLAuth } from '../providers/saml-auth';
import { OAuth2Auth } from '../providers/oauth2-auth';
import { PINAuth } from '../providers/pin-auth';

/**
 * Get the authorization URL for SSO login
 */
async function getAuthUrl(ctx: Context, next: Next) {
  const { authenticator: authenticatorName, redirectUrl } = ctx.action.params.values || {};

  if (!authenticatorName) {
    ctx.throw(400, ctx.t('Authenticator name is required', { ns: namespace }));
  }

  // Get authenticator configuration
  const authenticatorsRepo = ctx.db.getRepository('authenticators');
  const authenticator = await authenticatorsRepo.findOne({
    filter: { name: authenticatorName, enabled: true },
  });

  if (!authenticator) {
    ctx.throw(404, ctx.t('Authenticator not found or not enabled', { ns: namespace }));
  }

  let authUrl: string;
  const state = OIDCAuth.generateState();

  // Store state in session for validation
  ctx.session = ctx.session || {};
  ctx.session.authState = state;
  ctx.session.redirectUrl = redirectUrl || '/admin';

  switch (authenticator.authType) {
    case MCIT_AUTH_TYPE_OIDC: {
      const auth = new OIDCAuth({
        authenticator,
        options: authenticator.options || {},
        ctx,
      });
      authUrl = auth.getAuthorizationUrl(state);
      break;
    }
    case MCIT_AUTH_TYPE_SAML: {
      const auth = new SAMLAuth({
        authenticator,
        options: authenticator.options || {},
        ctx,
      });
      const { url } = auth.generateAuthRequest(state);
      authUrl = url;
      break;
    }
    case MCIT_AUTH_TYPE_OAUTH2: {
      const auth = new OAuth2Auth({
        authenticator,
        options: authenticator.options || {},
        ctx,
      });
      authUrl = auth.getAuthorizationUrl(state);
      break;
    }
    default:
      ctx.throw(400, ctx.t('Unsupported authentication type', { ns: namespace }));
  }

  ctx.body = {
    url: authUrl,
    state,
  };

  await next();
}

/**
 * Handle SSO callback
 */
async function callback(ctx: Context, next: Next) {
  const { authenticator: authenticatorName, code, state, SAMLResponse, RelayState } = ctx.action.params.values || {};

  if (!authenticatorName) {
    ctx.throw(400, ctx.t('Authenticator name is required', { ns: namespace }));
  }

  // Get authenticator configuration
  const authenticatorsRepo = ctx.db.getRepository('authenticators');
  const authenticator = await authenticatorsRepo.findOne({
    filter: { name: authenticatorName, enabled: true },
  });

  if (!authenticator) {
    ctx.throw(404, ctx.t('Authenticator not found or not enabled', { ns: namespace }));
  }

  // Get authentication instance and sign in
  const auth = await ctx.app.authManager.get(authenticatorName, ctx);

  try {
    const result = await auth.signIn();
    ctx.body = result;
  } catch (error) {
    ctx.throw(401, ctx.t('Authentication failed: {{error}}', { ns: namespace, error: error.message }));
  }

  await next();
}

/**
 * Sign in with PIN for session authentication
 */
async function signInWithPin(ctx: Context, next: Next) {
  const { pin } = ctx.action.params.values || {};
  const currentUser = ctx.state.currentUser;

  if (!currentUser) {
    ctx.throw(401, ctx.t('You must be logged in to use PIN authentication', { ns: namespace }));
  }

  if (!pin) {
    ctx.throw(400, ctx.t('PIN is required', { ns: namespace }));
  }

  // Validate the PIN
  const pinAuth = new PINAuth({
    authenticator: { options: {} } as any,
    options: {},
    ctx,
  });

  await pinAuth.validatePin(currentUser.id, pin);

  ctx.body = {
    success: true,
    message: ctx.t('PIN verified successfully', { ns: namespace }),
  };

  await next();
}

/**
 * Set up or update PIN for current user
 */
async function setupPin(ctx: Context, next: Next) {
  const { pin, confirmPin } = ctx.action.params.values || {};
  const currentUser = ctx.state.currentUser;

  if (!currentUser) {
    ctx.throw(401, ctx.t('You must be logged in to set up a PIN', { ns: namespace }));
  }

  if (!pin) {
    ctx.throw(400, ctx.t('PIN is required', { ns: namespace }));
  }

  if (pin !== confirmPin) {
    ctx.throw(400, ctx.t('PINs do not match', { ns: namespace }));
  }

  const pinAuth = new PINAuth({
    authenticator: { options: {} } as any,
    options: {},
    ctx,
  });

  await pinAuth.setupPin(currentUser.id, pin);

  ctx.body = {
    success: true,
    message: ctx.t('PIN set up successfully', { ns: namespace }),
  };

  await next();
}

/**
 * Validate PIN (check if valid without creating session)
 */
async function validatePin(ctx: Context, next: Next) {
  const { pin } = ctx.action.params.values || {};
  const currentUser = ctx.state.currentUser;

  if (!currentUser) {
    ctx.throw(401, ctx.t('You must be logged in to validate PIN', { ns: namespace }));
  }

  if (!pin) {
    ctx.throw(400, ctx.t('PIN is required', { ns: namespace }));
  }

  const pinAuth = new PINAuth({
    authenticator: { options: {} } as any,
    options: {},
    ctx,
  });

  const isValid = await pinAuth.validatePin(currentUser.id, pin);

  ctx.body = {
    valid: isValid,
  };

  await next();
}

/**
 * Check if current user has PIN set up
 */
async function hasPinSetup(ctx: Context, next: Next) {
  const currentUser = ctx.state.currentUser;

  if (!currentUser) {
    ctx.throw(401, ctx.t('You must be logged in', { ns: namespace }));
  }

  const pinAuth = new PINAuth({
    authenticator: { options: {} } as any,
    options: {},
    ctx,
  });

  const hasPin = await pinAuth.hasPinSetup(currentUser.id);

  ctx.body = {
    hasPin,
  };

  await next();
}

export default {
  getAuthUrl,
  callback,
  signInWithPin,
  setupPin,
  validatePin,
  hasPinSetup,
};
