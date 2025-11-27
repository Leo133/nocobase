/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { OAuth2Auth } from '../providers/oauth2-auth';

describe('OAuth2Auth', () => {
  describe('generateState', () => {
    it('should generate a random state string', () => {
      const state1 = OAuth2Auth.generateState();
      const state2 = OAuth2Auth.generateState();

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1.length).toBeGreaterThan(0);
      expect(state1).not.toBe(state2);
    });

    it('should generate a hex string', () => {
      const state = OAuth2Auth.generateState();
      expect(/^[0-9a-f]+$/i.test(state)).toBe(true);
    });
  });

  describe('getAuthorizationUrl', () => {
    let mockAuth: OAuth2Auth;

    beforeEach(() => {
      mockAuth = Object.create(OAuth2Auth.prototype);
      mockAuth.getOAuth2Options = () => ({
        authorizationUrl: 'https://oauth.example.com/authorize',
        tokenUrl: 'https://oauth.example.com/token',
        userInfoUrl: 'https://oauth.example.com/userinfo',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        redirectUri: 'https://app.example.com/callback',
        scope: 'read user',
        userMapping: {},
      });
    });

    it('should generate a valid authorization URL', () => {
      const state = 'test-state';
      const url = mockAuth.getAuthorizationUrl(state);

      expect(url).toContain('https://oauth.example.com/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('state=test-state');
      expect(url).toContain('scope=');
    });
  });

  describe('mapUserInfo', () => {
    let mockAuth: OAuth2Auth;

    beforeEach(() => {
      mockAuth = Object.create(OAuth2Auth.prototype);
      mockAuth.getOAuth2Options = () => ({
        authorizationUrl: 'https://oauth.example.com/authorize',
        tokenUrl: 'https://oauth.example.com/token',
        userInfoUrl: 'https://oauth.example.com/userinfo',
        clientId: 'test-client-id',
        clientSecret: 'test-secret',
        redirectUri: 'https://app.example.com/callback',
        scope: 'read user',
        userMapping: {
          email: 'email',
          username: 'login',
          nickname: 'name',
        },
      });
    });

    it('should map user info using configured mappings', () => {
      const userInfo = {
        email: 'user@example.com',
        login: 'testuser',
        name: 'Test User',
      };

      const result = mockAuth.mapUserInfo(userInfo);

      expect(result.email).toBe('user@example.com');
      expect(result.username).toBe('testuser');
      expect(result.nickname).toBe('Test User');
    });

    it('should handle GitHub-style user info', () => {
      const userInfo = {
        email: 'user@example.com',
        login: 'github-user',
        name: 'GitHub User',
        id: 12345,
      };

      const result = mockAuth.mapUserInfo(userInfo);

      expect(result.email).toBe('user@example.com');
      expect(result.username).toBe('github-user');
      expect(result.nickname).toBe('GitHub User');
    });
  });
});
