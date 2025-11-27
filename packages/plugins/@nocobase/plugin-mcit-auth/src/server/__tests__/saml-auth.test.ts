/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SAMLAuth } from '../providers/saml-auth';

describe('SAMLAuth', () => {
  describe('generateRelayState', () => {
    it('should generate a random relay state string', () => {
      const state1 = SAMLAuth.generateRelayState();
      const state2 = SAMLAuth.generateRelayState();

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1.length).toBeGreaterThan(0);
      expect(state1).not.toBe(state2);
    });

    it('should generate a hex string', () => {
      const state = SAMLAuth.generateRelayState();
      expect(/^[0-9a-f]+$/i.test(state)).toBe(true);
    });
  });

  describe('generateAuthRequest', () => {
    let mockAuth: SAMLAuth;

    beforeEach(() => {
      mockAuth = Object.create(SAMLAuth.prototype);
      mockAuth.getSAMLOptions = () => ({
        entryPoint: 'https://idp.example.com/sso',
        issuer: 'https://app.example.com',
        cert: '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----',
        callbackUrl: 'https://app.example.com/callback',
        signatureAlgorithm: 'sha256',
        userMapping: {},
      });
    });

    it('should generate a SAML auth request with URL', () => {
      const relayState = 'test-relay-state';
      const { url, id } = mockAuth.generateAuthRequest(relayState);

      expect(url).toContain('https://idp.example.com/sso');
      expect(url).toContain('SAMLRequest=');
      expect(url).toContain('RelayState=test-relay-state');
      expect(id).toBeDefined();
      expect(id.startsWith('_')).toBe(true);
    });
  });

  describe('mapUserInfo', () => {
    let mockAuth: SAMLAuth;

    beforeEach(() => {
      mockAuth = Object.create(SAMLAuth.prototype);
      mockAuth.getSAMLOptions = () => ({
        entryPoint: 'https://idp.example.com/sso',
        issuer: 'https://app.example.com',
        cert: '-----BEGIN CERTIFICATE-----\nMIIC...\n-----END CERTIFICATE-----',
        callbackUrl: 'https://app.example.com/callback',
        signatureAlgorithm: 'sha256',
        userMapping: {
          email: 'email',
          username: 'username',
          nickname: 'displayName',
        },
      });
    });

    it('should map SAML attributes to user fields', () => {
      const attributes = {
        email: 'user@example.com',
        username: 'testuser',
        displayName: 'Test User',
        nameId: 'user@example.com',
      };

      const result = mockAuth.mapUserInfo(attributes);

      expect(result.email).toBe('user@example.com');
      expect(result.username).toBe('testuser');
      expect(result.nickname).toBe('Test User');
    });

    it('should fall back to nameId for email if not present', () => {
      const attributes = {
        nameId: 'user@example.com',
        displayName: 'Test User',
      };

      const result = mockAuth.mapUserInfo(attributes);

      expect(result.email).toBe('user@example.com');
    });

    it('should derive username from nameId if not present', () => {
      const attributes = {
        nameId: 'user@example.com',
      };

      const result = mockAuth.mapUserInfo(attributes);

      expect(result.username).toBe('user');
    });
  });
});
