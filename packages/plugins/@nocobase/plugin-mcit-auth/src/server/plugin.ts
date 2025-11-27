/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import { tval } from '@nocobase/utils';
import {
  namespace,
  MCIT_AUTH_TYPE_OIDC,
  MCIT_AUTH_TYPE_SAML,
  MCIT_AUTH_TYPE_OAUTH2,
  MCIT_AUTH_TYPE_PIN,
} from '../constants';
import { OIDCAuth } from './providers/oidc-auth';
import { SAMLAuth } from './providers/saml-auth';
import { OAuth2Auth } from './providers/oauth2-auth';
import { PINAuth } from './providers/pin-auth';
import mcitAuthActions from './actions/mcit-auth';

export class PluginMcitAuthServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    // Register OIDC authentication type
    this.app.authManager.registerTypes(MCIT_AUTH_TYPE_OIDC, {
      auth: OIDCAuth,
      title: tval('OIDC (OpenID Connect)', { ns: namespace }),
      getPublicOptions: (options) => ({
        ...options?.public,
      }),
    });

    // Register SAML authentication type
    this.app.authManager.registerTypes(MCIT_AUTH_TYPE_SAML, {
      auth: SAMLAuth,
      title: tval('SAML 2.0', { ns: namespace }),
      getPublicOptions: (options) => ({
        ...options?.public,
      }),
    });

    // Register OAuth 2.0 authentication type
    this.app.authManager.registerTypes(MCIT_AUTH_TYPE_OAUTH2, {
      auth: OAuth2Auth,
      title: tval('OAuth 2.0', { ns: namespace }),
      getPublicOptions: (options) => ({
        ...options?.public,
      }),
    });

    // Register PIN authentication type
    this.app.authManager.registerTypes(MCIT_AUTH_TYPE_PIN, {
      auth: PINAuth,
      title: tval('4-Digit PIN', { ns: namespace }),
      getPublicOptions: (options) => ({
        ...options?.public,
      }),
    });

    // Register custom actions
    Object.entries(mcitAuthActions).forEach(([action, handler]) =>
      this.app.resourceManager.registerActionHandler(`mcitAuth:${action}`, handler),
    );

    // Set up ACL permissions
    this.app.acl.allow('mcitAuth', 'getAuthUrl', 'public');
    this.app.acl.allow('mcitAuth', 'callback', 'public');
    this.app.acl.allow('mcitAuth', 'signInWithPin', 'loggedIn');
    this.app.acl.allow('mcitAuth', 'setupPin', 'loggedIn');
    this.app.acl.allow('mcitAuth', 'validatePin', 'loggedIn');

    // Register audit actions
    this.app.auditManager?.registerActions([
      {
        name: 'mcitAuth:signInWithPin',
        getMetaData: async (ctx: any) => {
          return {
            request: {
              body: {
                ...ctx.request?.body,
                pin: undefined, // Don't log the PIN
              },
            },
          };
        },
      },
      'mcitAuth:callback',
    ]);
  }

  async install(options?: InstallOptions) {
    // Installation logic - create default configurations if needed
  }

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginMcitAuthServer;
