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
import { Button, Space, message } from 'antd';
import React, { useCallback } from 'react';
import { useMcitAuthTranslation } from '../locale';

interface Authenticator {
  name: string;
  title?: string;
  options?: any;
}

export const OIDCSignInButton: React.FC<{ authenticator: Authenticator }> = ({ authenticator }) => {
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
      message.error(t('Failed to initiate OIDC login'));
    }
  }, [api, authenticator.name, t]);

  return (
    <Button type="default" block onClick={handleSignIn}>
      {authenticator.title || t('Sign in with OIDC')}
    </Button>
  );
};

const oidcOptionsSchema: ISchema = {
  type: 'object',
  properties: {
    issuer: {
      type: 'string',
      title: '{{t("Issuer URL")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://your-idp.com',
      },
      required: true,
    },
    clientId: {
      type: 'string',
      title: '{{t("Client ID")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      required: true,
    },
    clientSecret: {
      type: 'string',
      title: '{{t("Client Secret")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Password',
      required: true,
    },
    redirectUri: {
      type: 'string',
      title: '{{t("Redirect URI")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'https://your-app.com/api/mcitAuth:callback',
      },
      required: true,
    },
    scope: {
      type: 'string',
      title: '{{t("Scope")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      default: 'openid profile email',
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
          default: 'preferred_username',
        },
        nickname: {
          type: 'string',
          title: '{{t("Nickname Field")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          default: 'name',
        },
      },
    },
  },
};

export const OIDCOptions: React.FC = () => {
  const { t } = useMcitAuthTranslation();

  return <SchemaComponent schema={oidcOptionsSchema} scope={{ t }} />;
};
