/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, useForm } from '@formily/react';
import { SchemaComponent, useAPIClient, useCurrentUserContext } from '@nocobase/client';
import { Button, Card, Input, Space, Typography, message } from 'antd';
import React, { useCallback, useState } from 'react';
import { useMcitAuthTranslation } from '../locale';
import { PIN_LENGTH } from '../../constants';

const { Text, Title } = Typography;

interface Authenticator {
  name: string;
  title?: string;
  options?: any;
}

/**
 * PIN input component - 4 digit boxes
 */
export const PINInput: React.FC<{
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}> = ({ value = '', onChange, disabled }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH);
      onChange?.(newValue);
    },
    [onChange],
  );

  return (
    <Input
      value={value}
      onChange={handleChange}
      maxLength={PIN_LENGTH}
      disabled={disabled}
      style={{
        textAlign: 'center',
        fontSize: '24px',
        letterSpacing: '8px',
        fontFamily: 'monospace',
      }}
      placeholder="••••"
      type="password"
    />
  );
};

/**
 * PIN Sign In Form - for quick session authentication
 */
export const PINSignInForm: React.FC<{ authenticator: Authenticator }> = ({ authenticator }) => {
  const { t } = useMcitAuthTranslation();
  const api = useAPIClient();
  const { data: currentUser } = useCurrentUserContext();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      message.error(t('PIN must be exactly {{length}} digits', { length: PIN_LENGTH }));
      return;
    }

    setLoading(true);
    try {
      await api.request({
        url: 'mcitAuth:signInWithPin',
        method: 'POST',
        data: {
          values: { pin },
        },
      });
      message.success(t('PIN verified successfully'));
      setPin('');
    } catch (error: any) {
      message.error(error.response?.data?.errors?.[0]?.message || t('Invalid PIN'));
    } finally {
      setLoading(false);
    }
  }, [api, pin, t]);

  if (!currentUser) {
    return (
      <Card>
        <Text type="secondary">{t('You must be logged in to use PIN authentication')}</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>{t('Quick access with PIN')}</Title>
        <PINInput value={pin} onChange={setPin} disabled={loading} />
        <Button type="primary" block onClick={handleSubmit} loading={loading} disabled={pin.length !== PIN_LENGTH}>
          {t('Sign in with PIN')}
        </Button>
      </Space>
    </Card>
  );
};

/**
 * PIN Setup Form - for setting up a new PIN
 */
export const PINSetupForm: React.FC = () => {
  const { t } = useMcitAuthTranslation();
  const api = useAPIClient();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSetup = useCallback(async () => {
    if (pin.length !== PIN_LENGTH) {
      message.error(t('PIN must be exactly {{length}} digits', { length: PIN_LENGTH }));
      return;
    }

    if (pin !== confirmPin) {
      message.error(t('PINs do not match'));
      return;
    }

    setLoading(true);
    try {
      await api.request({
        url: 'mcitAuth:setupPin',
        method: 'POST',
        data: {
          values: { pin, confirmPin },
        },
      });
      message.success(t('PIN set up successfully'));
      setPin('');
      setConfirmPin('');
    } catch (error: any) {
      message.error(error.response?.data?.errors?.[0]?.message || t('Failed to set up PIN'));
    } finally {
      setLoading(false);
    }
  }, [api, pin, confirmPin, t]);

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Title level={5}>{t('Set up PIN')}</Title>
        <div>
          <Text>{t('Enter PIN')}</Text>
          <PINInput value={pin} onChange={setPin} disabled={loading} />
        </div>
        <div>
          <Text>{t('Confirm PIN')}</Text>
          <PINInput value={confirmPin} onChange={setConfirmPin} disabled={loading} />
        </div>
        <Button
          type="primary"
          block
          onClick={handleSetup}
          loading={loading}
          disabled={pin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH}
        >
          {t('Set up PIN')}
        </Button>
      </Space>
    </Card>
  );
};

/**
 * PIN Options - Admin settings form
 */
const pinOptionsSchema: ISchema = {
  type: 'object',
  properties: {
    public: {
      type: 'object',
      properties: {
        allowPinAuth: {
          type: 'boolean',
          title: '{{t("Allow PIN Authentication")}}',
          'x-decorator': 'FormItem',
          'x-component': 'Checkbox',
          default: true,
        },
      },
    },
    sessionExpiryMinutes: {
      type: 'number',
      title: '{{t("Session Expiry (minutes)")}}',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 1440,
      },
      default: 30,
    },
    maxAttempts: {
      type: 'number',
      title: '{{t("Max Attempts")}}',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 10,
      },
      default: 5,
    },
    lockoutMinutes: {
      type: 'number',
      title: '{{t("Lockout Duration (minutes)")}}',
      'x-decorator': 'FormItem',
      'x-component': 'InputNumber',
      'x-component-props': {
        min: 1,
        max: 60,
      },
      default: 15,
    },
  },
};

export const PINOptions: React.FC = () => {
  const { t } = useMcitAuthTranslation();

  return <SchemaComponent schema={pinOptionsSchema} scope={{ t }} />;
};
