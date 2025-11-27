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

export interface OAuth2Options {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
  userMapping?: {
    email?: string;
    username?: string;
    nickname?: string;
    id?: string;
  };
}

export class OAuth2Auth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  /**
   * Get OAuth 2.0 configuration from options
   */
  getOAuth2Options(): OAuth2Options {
    const options = this.authenticator.options || {};
    return {
      authorizationUrl: options.authorizationUrl || '',
      tokenUrl: options.tokenUrl || '',
      userInfoUrl: options.userInfoUrl || '',
      clientId: options.clientId || '',
      clientSecret: options.clientSecret || '',
      redirectUri: options.redirectUri || '',
      scope: options.scope || 'read',
      userMapping: options.userMapping || {},
    };
  }

  /**
   * Generate authorization URL for OAuth 2.0 login
   */
  getAuthorizationUrl(state: string): string {
    const options = this.getOAuth2Options();
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: options.clientId,
      redirect_uri: options.redirectUri,
      scope: options.scope || 'read',
      state,
    });
    return `${options.authorizationUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(code: string): Promise<{ access_token: string; token_type?: string; refresh_token?: string }> {
    const options = this.getOAuth2Options();

    const response = await fetch(options.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
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

    const contentType = response.headers.get('content-type') || '';
    
    // Prefer JSON response format
    if (contentType.includes('application/json')) {
      return response.json();
    }

    // Handle form-urlencoded response (some OAuth providers like GitHub use this)
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await response.text();
      const params = new URLSearchParams(text);
      const accessToken = params.get('access_token');
      if (!accessToken) {
        throw new Error('No access token in response');
      }
      return {
        access_token: accessToken,
        token_type: params.get('token_type') || undefined,
        refresh_token: params.get('refresh_token') || undefined,
      };
    }

    // Default: try JSON parsing as fallback
    try {
      return response.json();
    } catch {
      throw new Error('Unable to parse token response');
    }
  }

  /**
   * Get user info from OAuth 2.0 provider
   */
  async getUserInfo(accessToken: string): Promise<Record<string, any>> {
    const options = this.getOAuth2Options();

    const response = await fetch(options.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user info from OAuth provider');
    }

    return response.json();
  }

  /**
   * Map OAuth 2.0 user info to local user fields
   */
  mapUserInfo(userInfo: Record<string, any>): { email?: string; username?: string; nickname?: string } {
    const options = this.getOAuth2Options();
    const mapping = options.userMapping || {};

    return {
      email: userInfo[mapping.email || 'email'],
      username: userInfo[mapping.username || 'login'] || userInfo[mapping.username || 'username'],
      nickname: userInfo[mapping.nickname || 'name'],
    };
  }

  /**
   * Find or create user based on OAuth 2.0 user info
   */
  async findOrCreateUser(userInfo: Record<string, any>): Promise<Model> {
    const mappedUser = this.mapUserInfo(userInfo);
    const ctx = this.ctx;

    if (!mappedUser.email && !mappedUser.username) {
      ctx.throw(400, ctx.t('Unable to get user identity from OAuth provider', { ns: namespace }));
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
   * Validate the OAuth 2.0 callback and authenticate user
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
      ctx.throw(401, ctx.t('OAuth authentication failed: {{error}}', { ns: namespace, error: error.message }));
    }
  }

  /**
   * Generate a random state for CSRF protection
   */
  static generateState(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
