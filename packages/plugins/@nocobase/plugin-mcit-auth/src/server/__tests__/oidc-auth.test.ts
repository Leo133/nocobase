/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OIDCAuth } from '../providers/oidc-auth';

describe('OIDCAuth', () => {
  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state1 = OIDCAuth.generateState();
      const state2 = OIDCAuth.generateState();

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1.length).toBeGreaterThan(0);
      expect(state1).not.toBe(state2);
    });

    it('should generate a hex string', () => {
      const state = OIDCAuth.generateState();
      expect(/^[0-9a-f]+$/i.test(state)).toBe(true);
    });
  });

  describe('getAuthorizationUrl', () => {
    let mockAuth: OIDCAuth;

    beforeEach(() => {
      // Create a mock OIDCAuth instance
      mockAuth = Object.create(OIDCAuth.prototype);
      mockAuth.getOIDCOptions = () => ({
        issuer: 'https://idp.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        redirectUri: 'https://app.example.com/callback',
        scope: 'openid profile email',
        userMapping: {},
      });
    });

    it('should generate a valid authorization URL', () => {
      const state = 'test-state';
      const url = mockAuth.getAuthorizationUrl(state);

      expect(url).toContain('https://idp.example.com/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=');
    });
  });

  describe('mapUserInfo', () => {
    let mockAuth: OIDCAuth;

    beforeEach(() => {
      mockAuth = Object.create(OIDCAuth.prototype);
      mockAuth.getOIDCOptions = () => ({
        issuer: 'https://idp.example.com',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        redirectUri: 'https://app.example.com/callback',
        scope: 'openid profile email',
        userMapping: {
          email: 'email',
          username: 'preferred_username',
          nickname: 'name',
        },
      });
    });

    it('should map user info using default mappings', () => {
      const userInfo = {
        email: 'user@example.com',
        preferred_username: 'testuser',
        name: 'Test User',
      };

      const result = mockAuth.mapUserInfo(userInfo);

      expect(result.email).toBe('user@example.com');
      expect(result.username).toBe('testuser');
      expect(result.nickname).toBe('Test User');
    });

    it('should handle missing fields', () => {
      const userInfo = {
        email: 'user@example.com',
      };

      const result = mockAuth.mapUserInfo(userInfo);

      expect(result.email).toBe('user@example.com');
      expect(result.username).toBeUndefined();
      expect(result.nickname).toBeUndefined();
    });
  });
});
