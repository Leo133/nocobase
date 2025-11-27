/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// @ts-ignore
import { name } from '../package.json';

export const namespace = name;

// Authentication type names
export const MCIT_AUTH_TYPE_OIDC = 'mcit-oidc';
export const MCIT_AUTH_TYPE_SAML = 'mcit-saml';
export const MCIT_AUTH_TYPE_OAUTH2 = 'mcit-oauth2';
export const MCIT_AUTH_TYPE_PIN = 'mcit-pin';

// Collection names
export const PIN_SESSIONS_COLLECTION = 'mcitPinSessions';
export const SSO_CONFIGS_COLLECTION = 'mcitSsoConfigs';

// PIN configuration
export const PIN_LENGTH = 4;
export const PIN_SESSION_EXPIRY_MINUTES = 30; // Default session expiry for PIN auth
