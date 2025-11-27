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

export interface SAMLOptions {
  entryPoint: string;
  issuer: string;
  cert: string;
  privateKey?: string;
  callbackUrl: string;
  signatureAlgorithm?: string;
  userMapping?: {
    email?: string;
    username?: string;
    nickname?: string;
  };
}

export class SAMLAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  /**
   * Get SAML configuration from options
   */
  getSAMLOptions(): SAMLOptions {
    const options = this.authenticator.options || {};
    return {
      entryPoint: options.entryPoint || '',
      issuer: options.issuer || '',
      cert: options.cert || '',
      privateKey: options.privateKey,
      callbackUrl: options.callbackUrl || '',
      signatureAlgorithm: options.signatureAlgorithm || 'sha256',
      userMapping: options.userMapping || {},
    };
  }

  /**
   * Generate SAML authentication request
   */
  generateAuthRequest(relayState: string): { url: string; id: string } {
    const options = this.getSAMLOptions();
    const id = `_${crypto.randomBytes(16).toString('hex')}`;
    const issueInstant = new Date().toISOString();

    // Create a simple SAML AuthnRequest
    const samlRequest = `
      <samlp:AuthnRequest
        xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
        xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
        ID="${id}"
        Version="2.0"
        IssueInstant="${issueInstant}"
        AssertionConsumerServiceURL="${options.callbackUrl}"
        Destination="${options.entryPoint}"
        ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
        <saml:Issuer>${options.issuer}</saml:Issuer>
        <samlp:NameIDPolicy
          Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
          AllowCreate="true"/>
      </samlp:AuthnRequest>
    `.trim();

    // Encode the SAML request
    const encodedRequest = Buffer.from(samlRequest).toString('base64');

    // Build the redirect URL
    const params = new URLSearchParams({
      SAMLRequest: encodedRequest,
      RelayState: relayState,
    });

    return {
      url: `${options.entryPoint}?${params.toString()}`,
      id,
    };
  }

  /**
   * Parse SAML response and extract user attributes
   */
  parseSAMLResponse(samlResponse: string): Record<string, any> {
    // Decode the SAML response
    const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');

    // Basic XML parsing to extract attributes
    // In production, use a proper SAML library for secure parsing
    const attributes: Record<string, any> = {};

    // Extract NameID (usually email)
    const nameIdMatch = decodedResponse.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
    if (nameIdMatch) {
      attributes.nameId = nameIdMatch[1];
      attributes.email = nameIdMatch[1];
    }

    // Extract common attributes
    const attributeRegex = /<saml:Attribute Name="([^"]+)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g;
    let match;
    while ((match = attributeRegex.exec(decodedResponse)) !== null) {
      const attrName = match[1].split('/').pop() || match[1];
      attributes[attrName] = match[2];
    }

    return attributes;
  }

  /**
   * Map SAML attributes to local user fields
   */
  mapUserInfo(attributes: Record<string, any>): { email?: string; username?: string; nickname?: string } {
    const options = this.getSAMLOptions();
    const mapping = options.userMapping || {};

    return {
      email: attributes[mapping.email || 'email'] || attributes.nameId,
      username: attributes[mapping.username || 'username'] || attributes.nameId?.split('@')[0],
      nickname: attributes[mapping.nickname || 'displayName'] || attributes[mapping.nickname || 'name'],
    };
  }

  /**
   * Find or create user based on SAML attributes
   */
  async findOrCreateUser(attributes: Record<string, any>): Promise<Model> {
    const mappedUser = this.mapUserInfo(attributes);
    const ctx = this.ctx;

    if (!mappedUser.email && !mappedUser.username) {
      ctx.throw(400, ctx.t('Unable to get user identity from SAML provider', { ns: namespace }));
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
   * Validate the SAML callback and authenticate user
   */
  async validate(): Promise<Model> {
    const ctx = this.ctx;
    const { SAMLResponse, RelayState } = ctx.action.params.values || {};

    if (!SAMLResponse) {
      ctx.throw(400, ctx.t('SAML response is required', { ns: namespace }));
    }

    try {
      // Parse SAML response
      const attributes = this.parseSAMLResponse(SAMLResponse);

      // Find or create user
      const user = await this.findOrCreateUser(attributes);

      return user;
    } catch (error) {
      ctx.throw(401, ctx.t('SAML authentication failed: {{error}}', { ns: namespace, error: error.message }));
    }
  }

  /**
   * Generate a random relay state for CSRF protection
   */
  static generateRelayState(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
