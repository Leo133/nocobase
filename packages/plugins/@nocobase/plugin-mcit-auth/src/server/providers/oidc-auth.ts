/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import crypto from 'crypto';
import { namespace } from '../../constants';

export interface OIDCOptions {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
  userMapping?: {
    email?: string;
    username?: string;
    nickname?: string;
  };
}

export class OIDCAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  /**
   * Get OIDC configuration from options
   */
  getOIDCOptions(): OIDCOptions {
    const options = this.authenticator.options || {};
    return {
      issuer: options.issuer || '',
      clientId: options.clientId || '',
      clientSecret: options.clientSecret || '',
      redirectUri: options.redirectUri || '',
      scope: options.scope || 'openid profile email',
      userMapping: options.userMapping || {},
    };
  }

  /**
   * Generate authorization URL for OIDC login
   */
  getAuthorizationUrl(state: string): string {
    const options = this.getOIDCOptions();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      scope: options.scope || 'openid profile email',
      state,
    });
    return `${options.issuer}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * 
   * SECURITY NOTE: This implementation retrieves tokens from the OIDC provider
   * but does not perform full ID token validation (signature verification,
   * issuer validation, audience validation). For production use, consider:
   * - Using a library like 'openid-client' for full OIDC compliance
   * - Validating the ID token's signature against the issuer's JWKS
   * - Verifying the 'iss', 'aud', 'exp', and 'nonce' claims
   */
  async exchangeCode(code: string): Promise<{ access_token: string; id_token?: string }> {
    const options = this.getOIDCOptions();
    const tokenUrl = `${options.issuer}/token`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: options.clientId,
        client_secret: options.clientSecret,
        code,
        redirect_uri: options.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    return response.json();
  }

  /**
   * Get user info from OIDC provider
   */
  async getUserInfo(accessToken: string): Promise<Record<string, any>> {
    const options = this.getOIDCOptions();
    const userInfoUrl = `${options.issuer}/userinfo`;

    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info from OIDC provider');
    }

    return response.json();
  }

  /**
   * Map OIDC user info to local user fields
   */
  mapUserInfo(userInfo: Record<string, any>): { email?: string; username?: string; nickname?: string } {
    const options = this.getOIDCOptions();
    const mapping = options.userMapping || {};

    return {
      email: userInfo[mapping.email || 'email'],
      username: userInfo[mapping.username || 'preferred_username'] || userInfo[mapping.email || 'email'],
      nickname: userInfo[mapping.nickname || 'name'],
    };
  }

  /**
   * Find or create user based on OIDC user info
   */
  async findOrCreateUser(userInfo: Record<string, any>): Promise<Model> {
    const mappedUser = this.mapUserInfo(userInfo);
    const ctx = this.ctx;

    if (!mappedUser.email && !mappedUser.username) {
      ctx.throw(400, ctx.t('Unable to get user identity from OIDC provider', { ns: namespace }));
    }

    // Try to find existing user by email or username
    let user = await this.userRepository.findOne({
      filter: {
        $or: [
          ...(mappedUser.email ? [{ email: mappedUser.email }] : []),
          ...(mappedUser.username ? [{ username: mappedUser.username }] : []),
        ],
      },
    });

    if (!user) {
      // Create new user
      user = await this.userRepository.create({
        values: {
          email: mappedUser.email,
          username: mappedUser.username || mappedUser.email?.split('@')[0],
          nickname: mappedUser.nickname,
        },
      });
    }

    return user;
  }

  /**
   * Validate the OIDC callback and authenticate user
   */
  async validate(): Promise<Model> {
    const ctx = this.ctx;
    const { code, state } = ctx.action.params.values || {};

    if (!code) {
      ctx.throw(400, ctx.t('Authorization code is required', { ns: namespace }));
    }

    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCode(code);

      // Get user info
      const userInfo = await this.getUserInfo(tokens.access_token);

      // Find or create user
      const user = await this.findOrCreateUser(userInfo);

      return user;
    } catch (error) {
      ctx.throw(401, ctx.t('OIDC authentication failed: {{error}}', { ns: namespace, error: error.message }));
    }
  }

  /**
   * Generate a random state for CSRF protection
   */
  static generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
