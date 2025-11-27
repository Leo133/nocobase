/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { SchemaComponent, useAPIClient } from '@nocobase/client';
import { Button, message } from 'antd';
import React, { useCallback } from 'react';
import { useMcitAuthTranslation } from '../locale';

interface Authenticator {
  name: string;
  title?: string;
  options?: any;
}

export const SAMLSignInButton: React.FC<{ authenticator: Authenticator }> = ({ authenticator }) => {
  const { t } = useMcitAuthTranslation();
  const api = useAPIClient();

  const handleSignIn = useCallback(async () => {
    try {
      const response = await api.request({
        url: 'mcitAuth:getAuthUrl',
        method: 'POST',
        data: {
          values: {
            authenticator: authenticator.name,
            redirectUrl: window.location.href,
          },
        },
      });

      if (response.data?.data?.url) {
        window.location.href = response.data.data.url;
      }
    } catch (error) {
      message.error(t('Failed to initiate SAML login'));
    }
  }, [api, authenticator.name, t]);

  return (
    <Button type="default" block onClick={handleSignIn}>
      {authenticator.title || t('Sign in with SAML')}
    </Button>
  );
};

const samlOptionsSchema: ISchema = {
  type: 'object',
  properties: {
    entryPoint: {
      type: 'string',
      title: '{{t("Entry Point")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://idp.example.com/sso/saml',
      },
      required: true,
    },
    issuer: {
      type: 'string',
      title: '{{t("Issuer")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://your-app.com',
      },
      required: true,
    },
    cert: {
      type: 'string',
      title: '{{t("Certificate")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        rows: 6,
        placeholder: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
      },
      required: true,
    },
    privateKey: {
      type: 'string',
      title: '{{t("Private Key")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input.TextArea',
      'x-component-props': {
        rows: 6,
        placeholder: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
      },
    },
    callbackUrl: {
      type: 'string',
      title: '{{t("Callback URL")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://your-app.com/api/mcitAuth:callback',
      },
      required: true,
    },
    signatureAlgorithm: {
      type: 'string',
      title: '{{t("Signature Algorithm")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Select',
      enum: [
        { label: 'SHA-256', value: 'sha256' },
        { label: 'SHA-512', value: 'sha512' },
        { label: 'SHA-1', value: 'sha1' },
      ],
      default: 'sha256',
    },
    userMapping: {
      type: 'object',
      title: '{{t("User Mapping")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Card',
      properties: {
        email: {
          type: 'string',
          title: '{{t("Email Field")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          default: 'email',
        },
        username: {
          type: 'string',
          title: '{{t("Username Field")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          default: 'username',
        },
        nickname: {
          type: 'string',
          title: '{{t("Nickname Field")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          default: 'displayName',
        },
      },
    },
  },
};

export const SAMLOptions: React.FC = () => {
  const { t } = useMcitAuthTranslation();

  return <SchemaComponent schema={samlOptionsSchema} scope={{ t }} />;
};
