/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card, Divider, Space, Typography } from 'antd';
import React from 'react';
import { useMcitAuthTranslation } from '../locale';
import { PINSetupForm } from '../pin/PINComponents';

const { Title, Paragraph, Text } = Typography;

export const McitAuthSettings: React.FC = () => {
  const { t } = useMcitAuthTranslation();

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Title level={4}>{t('MCIT Authentication')}</Title>
        <Paragraph>
          {t(
            'This plugin provides SSO authentication options (OIDC, SAML, OAuth 2.0) and 4-digit PIN session authentication for technicians.',
          )}
        </Paragraph>

        <Divider />

        <Title level={5}>{t('SSO Authentication')}</Title>
        <Paragraph>
          <Text>
            {t(
              'Configure SSO authenticators in the Authentication settings. Supported protocols include OIDC (OpenID Connect), SAML 2.0, and OAuth 2.0.',
            )}
          </Text>
        </Paragraph>

        <Divider />

        <Title level={5}>{t('PIN Authentication')}</Title>
        <Paragraph>
          <Text>
            {t(
              'PIN authentication allows users to quickly re-authenticate within an existing session using a 4-digit PIN. This is useful for secure areas of the application where you want to verify user identity without requiring a full login.',
            )}
          </Text>
        </Paragraph>

        <PINSetupForm />
      </Card>
    </Space>
  );
};
