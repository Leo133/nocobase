/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, lazy } from '@nocobase/client';
import {
  MCIT_AUTH_TYPE_OIDC,
  MCIT_AUTH_TYPE_SAML,
  MCIT_AUTH_TYPE_OAUTH2,
  MCIT_AUTH_TYPE_PIN,
} from '../constants';
import { NAMESPACE } from './locale';

// Lazy load components
const { OIDCSignInButton, OIDCOptions } = lazy(
  () => import('./sso/OIDCComponents'),
  'OIDCSignInButton',
  'OIDCOptions',
);
const { SAMLSignInButton, SAMLOptions } = lazy(
  () => import('./sso/SAMLComponents'),
  'SAMLSignInButton',
  'SAMLOptions',
);
const { OAuth2SignInButton, OAuth2Options } = lazy(
  () => import('./sso/OAuth2Components'),
  'OAuth2SignInButton',
  'OAuth2Options',
);
const { PINSignInForm, PINOptions, PINSetupForm } = lazy(
  () => import('./pin/PINComponents'),
  'PINSignInForm',
  'PINOptions',
  'PINSetupForm',
);
const { McitAuthSettings } = lazy(() => import('./settings/McitAuthSettings'), 'McitAuthSettings');

export class PluginMcitAuthClient extends Plugin {
  async load() {
    // Register plugin settings
    this.app.pluginSettingsManager.add(NAMESPACE, {
      icon: 'SafetyCertificateOutlined',
      title: `{{t("MCIT Authentication", { ns: "${NAMESPACE}" })}}`,
      aclSnippet: 'pm.mcit-auth',
    });

    this.app.pluginSettingsManager.add(`${NAMESPACE}.settings`, {
      title: `{{t("Settings", { ns: "${NAMESPACE}" })}}`,
      Component: McitAuthSettings,
      aclSnippet: `pm.${NAMESPACE}.settings`,
      sort: 1,
    });

    // Get auth plugin to register auth types
    const authPlugin = this.app.pm.get('auth') as any;

    if (authPlugin) {
      // Register OIDC authentication type
      authPlugin.registerType(MCIT_AUTH_TYPE_OIDC, {
        components: {
          SignInButton: OIDCSignInButton,
          AdminSettingsForm: OIDCOptions,
        },
      });

      // Register SAML authentication type
      authPlugin.registerType(MCIT_AUTH_TYPE_SAML, {
        components: {
          SignInButton: SAMLSignInButton,
          AdminSettingsForm: SAMLOptions,
        },
      });

      // Register OAuth 2.0 authentication type
      authPlugin.registerType(MCIT_AUTH_TYPE_OAUTH2, {
        components: {
          SignInButton: OAuth2SignInButton,
          AdminSettingsForm: OAuth2Options,
        },
      });

      // Register PIN authentication type
      authPlugin.registerType(MCIT_AUTH_TYPE_PIN, {
        components: {
          SignInForm: PINSignInForm,
          AdminSettingsForm: PINOptions,
        },
      });
    }

    // Add components to the app
    this.app.addComponents({
      PINSetupForm,
    });
  }
}

export default PluginMcitAuthClient;
