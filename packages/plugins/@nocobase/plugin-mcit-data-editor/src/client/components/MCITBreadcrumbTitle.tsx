/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAPIClient, useCompile } from '@nocobase/client';
import { Breadcrumb, Typography } from 'antd';
import { useT } from '../locale';

const { Text } = Typography;

export const MCITBreadcrumbTitle: React.FC = () => {
  const params = useParams<{ dataSource?: string; collection?: string }>();
  const navigate = useNavigate();
  const compile = useCompile();
  const t = useT();

  const dataSourceName = params.dataSource || 'main';
  const collectionName = params.collection || '';

  const items = [
    {
      title: (
        <a
          onClick={(e) => {
            e.preventDefault();
            navigate('/admin/settings/mcit-data-editor/list');
          }}
        >
          {t('MCIT Data Editor')}
        </a>
      ),
    },
    {
      title: dataSourceName === 'main' ? t('Main Database') : dataSourceName,
    },
  ];

  if (collectionName) {
    items.push({
      title: <Text strong>{collectionName}</Text>,
    });
  }

  return <Breadcrumb items={items} />;
};

export default MCITBreadcrumbTitle;
