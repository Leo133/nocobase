/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Typography, Space, Tag, Input, Empty, Spin, Collapse, Button, Tooltip } from 'antd';
import {
  DatabaseOutlined,
  TableOutlined,
  SearchOutlined,
  RightOutlined,
  AppstoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAPIClient } from '@nocobase/client';
import { useT } from '../locale';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Panel } = Collapse;

interface Collection {
  name: string;
  title?: string;
  description?: string;
  fields?: any[];
  filterTargetKey?: string;
}

interface DataSource {
  key: string;
  displayName: string;
  status: string;
  type?: string;
  collections?: Collection[];
}

const containerClass = css`
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
`;

const headerClass = css`
  margin-bottom: 24px;
`;

const searchWrapperClass = css`
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
`;

const collectionItemClass = css`
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const collectionInfoClass = css`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const collectionMetaClass = css`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8c8c8c;
  font-size: 12px;
`;

const statusTagClass = css`
  &.loaded {
    background: #f6ffed;
    border-color: #b7eb8f;
    color: #52c41a;
  }
  
  &.loading {
    background: #e6f7ff;
    border-color: #91d5ff;
    color: #1890ff;
  }
  
  &.error {
    background: #fff2f0;
    border-color: #ffccc7;
    color: #ff4d4f;
  }
`;

export const MCITDataEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const apiClient = useAPIClient();
  const t = useT();
  
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  const loadDataSources = async () => {
    setLoading(true);
    try {
      const response = await apiClient.request({
        resource: 'dataSources',
        action: 'list',
        params: {
          paginate: false,
          appends: ['collections'],
        },
      });

      if (response?.data?.data) {
        setDataSources(response.data.data);
        // Auto-expand the main data source
        setExpandedKeys(['main']);
      }
    } catch (error) {
      console.error('Failed to load data sources:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDataSources();
  }, []);

  const handleCollectionClick = (dataSourceKey: string, collectionName: string) => {
    navigate(`/admin/settings/mcit-data-editor/${dataSourceKey}/${collectionName}`);
  };

  const filterCollections = (collections: Collection[] = []) => {
    if (!searchTerm) return collections;
    const term = searchTerm.toLowerCase();
    return collections.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        (c.title && c.title.toLowerCase().includes(term))
    );
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'loaded':
        return <Tag className={`${statusTagClass} loaded`}>{t('Connected')}</Tag>;
      case 'loading':
        return <Tag className={`${statusTagClass} loading`}>{t('Loading')}</Tag>;
      default:
        return <Tag className={`${statusTagClass} error`}>{t('Error')}</Tag>;
    }
  };

  const renderCollectionList = (dataSource: DataSource) => {
    const filteredCollections = filterCollections(dataSource.collections);
    
    if (!filteredCollections.length) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={searchTerm ? t('No matching collections') : t('No collections')}
          style={{ padding: 24 }}
        />
      );
    }

    return filteredCollections.map((collection) => (
      <div
        key={collection.name}
        className={collectionItemClass}
        onClick={() => handleCollectionClick(dataSource.key, collection.name)}
      >
        <div className={collectionInfoClass}>
          <TableOutlined style={{ fontSize: 18, color: '#1890ff' }} />
          <div>
            <Text strong>{collection.title || collection.name}</Text>
            {collection.title && collection.title !== collection.name && (
              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                ({collection.name})
              </Text>
            )}
            {collection.description && (
              <Paragraph
                type="secondary"
                style={{ margin: 0, fontSize: 12 }}
                ellipsis={{ rows: 1 }}
              >
                {collection.description}
              </Paragraph>
            )}
          </div>
        </div>
        <div className={collectionMetaClass}>
          <span>{collection.fields?.length || 0} {t('fields')}</span>
          <RightOutlined />
        </div>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className={containerClass} style={{ textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" tip={t('Loading data sources...')} />
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={headerClass}>
        <Title level={3}>
          <Space>
            <AppstoreOutlined />
            {t('MCIT Data Editor')}
          </Space>
        </Title>
        <Paragraph type="secondary">
          {t('Select a collection to edit data using the NocoDB-style spreadsheet editor. Supports inline editing, bulk operations, filtering, sorting, and multiple view modes.')}
        </Paragraph>
      </div>

      <div className={searchWrapperClass}>
        <Search
          placeholder={t('Search collections...')}
          allowClear
          size="large"
          style={{ maxWidth: 400 }}
          prefix={<SearchOutlined />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Tooltip title={t('Refresh')}>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDataSources}
            loading={loading}
          />
        </Tooltip>
      </div>

      <Collapse
        activeKey={expandedKeys}
        onChange={(keys) => setExpandedKeys(keys as string[])}
        expandIconPosition="start"
      >
        {dataSources.map((dataSource) => {
          const filteredCount = filterCollections(dataSource.collections).length;
          const totalCount = dataSource.collections?.length || 0;

          return (
            <Panel
              key={dataSource.key}
              header={
                <Space>
                  <DatabaseOutlined style={{ color: '#1890ff' }} />
                  <Text strong>{dataSource.displayName || dataSource.key}</Text>
                  {getStatusTag(dataSource.status)}
                  <Text type="secondary">
                    {searchTerm && filteredCount !== totalCount
                      ? `${filteredCount}/${totalCount}`
                      : totalCount}{' '}
                    {t('collections')}
                  </Text>
                </Space>
              }
            >
              {renderCollectionList(dataSource)}
            </Panel>
          );
        })}
      </Collapse>

      {!dataSources.length && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={t('No data sources available')}
        />
      )}
    </div>
  );
};

export default MCITDataEditorPage;
