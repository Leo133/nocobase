/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import {
  Table,
  Button,
  Space,
  Input,
  Dropdown,
  Modal,
  message,
  Tooltip,
  Checkbox,
  Spin,
  Typography,
  Tag,
  Popover,
  Form,
  Select,
  DatePicker,
  InputNumber,
  Switch,
  Empty,
  Pagination,
  Drawer,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  MoreOutlined,
  SearchOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  TableOutlined,
  AppstoreOutlined,
  CalendarOutlined,
  ProjectOutlined,
  ExpandOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useAPIClient, useDataSourceManager } from '@nocobase/client';
import { useT } from '../locale';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

// View types supported by the editor
export type ViewType = 'grid' | 'form' | 'kanban' | 'calendar' | 'gallery';

interface MCITSpreadsheetEditorProps {
  dataSourceKey?: string;
  collectionName?: string;
}

// Styling
const containerClass = css`
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
`;

const toolbarClass = css`
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 8px;
`;

const viewTabsClass = css`
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  
  .ant-tabs-nav {
    margin-bottom: 0;
  }
`;

const tableContainerClass = css`
  flex: 1;
  overflow: auto;
  
  .ant-table {
    .ant-table-thead > tr > th {
      background: #fafafa;
      font-weight: 600;
      border-bottom: 2px solid #e8e8e8;
    }
    
    .ant-table-tbody > tr > td {
      padding: 8px 12px;
      border-right: 1px solid #f0f0f0;
    }
    
    .ant-table-tbody > tr:hover > td {
      background: #e6f7ff;
    }
  }
`;

const cellClass = css`
  min-width: 100px;
  cursor: pointer;
  position: relative;
  
  &:hover {
    background: #f0f5ff;
  }
  
  &.editing {
    padding: 0;
    
    .cell-editor {
      width: 100%;
      border: none;
      outline: none;
      box-shadow: none;
    }
  }
`;

const rowActionsClass = css`
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  
  tr:hover & {
    opacity: 1;
  }
`;

const headerCellClass = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  
  .field-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .field-actions {
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  &:hover .field-actions {
    opacity: 1;
  }
`;

const addRowClass = css`
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
  cursor: pointer;
  color: #1890ff;
  display: flex;
  align-items: center;
  gap: 8px;
  
  &:hover {
    background: #e6f7ff;
  }
`;

const statusBarClass = css`
  padding: 8px 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
  font-size: 12px;
  color: #666;
`;

export const MCITSpreadsheetEditor: React.FC<MCITSpreadsheetEditorProps> = (props) => {
  const params = useParams<{ dataSource?: string; collection?: string }>();
  const navigate = useNavigate();
  const apiClient = useAPIClient();
  const dataSourceManager = useDataSourceManager();
  const t = useT();

  const dataSourceKey = props.dataSourceKey || params.dataSource || 'main';
  const collectionName = props.collectionName || params.collection || '';

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [collection, setCollection] = useState<any>(null);
  const [fields, setFields] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowKey: string; fieldName: string } | null>(null);
  const [editingValue, setEditingValue] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<any[]>([]);
  const [sorts, setSorts] = useState<any[]>([]);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [showFieldSettings, setShowFieldSettings] = useState(false);
  const [expandedRecord, setExpandedRecord] = useState<any>(null);

  const inputRef = useRef<any>(null);

  // Load collection metadata
  const loadCollectionMeta = useCallback(async () => {
    try {
      const ds = dataSourceManager?.getDataSource(dataSourceKey);
      if (ds) {
        const coll = ds.collectionManager.getCollection(collectionName);
        if (coll) {
          setCollection(coll);
          const collFields = Array.from(coll.fields.values()).map((f: any) => f.options);
          setFields(collFields);
          // Initially show all fields except system fields
          const visibleFieldNames = collFields
            .filter((f: any) => !['createdAt', 'updatedAt', 'createdById', 'updatedById'].includes(f.name))
            .map((f: any) => f.name);
          setVisibleFields(visibleFieldNames);
        }
      }
    } catch (error) {
      console.error('Failed to load collection metadata:', error);
    }
  }, [dataSourceKey, collectionName, dataSourceManager]);

  // Load data
  const loadData = useCallback(async () => {
    if (!collectionName) return;
    
    setLoading(true);
    try {
      const filterParams: any = {};
      
      // Apply search filter
      if (searchText) {
        // Search across text fields
        const searchableFields = fields.filter((f) => 
          ['string', 'text', 'email', 'url', 'phone'].includes(f.type)
        );
        if (searchableFields.length > 0) {
          filterParams.$or = searchableFields.map((f) => ({
            [f.name]: { $includes: searchText },
          }));
        }
      }

      // Apply custom filters
      if (filters.length > 0) {
        filters.forEach((filter) => {
          if (filter.field && filter.operator && filter.value !== undefined) {
            filterParams[filter.field] = { [`$${filter.operator}`]: filter.value };
          }
        });
      }

      const response = await apiClient.request({
        resource: collectionName,
        action: 'list',
        params: {
          filter: Object.keys(filterParams).length > 0 ? filterParams : undefined,
          sort: sorts.length > 0 ? sorts.map((s) => `${s.order === 'desc' ? '-' : ''}${s.field}`).join(',') : undefined,
          page,
          pageSize,
        },
      });

      if (response?.data?.data) {
        setData(response.data.data);
        setTotalCount(response.data.meta?.count || response.data.data.length);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error(t('Failed to load data'));
    } finally {
      setLoading(false);
    }
  }, [collectionName, apiClient, page, pageSize, searchText, filters, sorts, fields, t]);

  // Initialize
  useEffect(() => {
    loadCollectionMeta();
  }, [loadCollectionMeta]);

  useEffect(() => {
    if (fields.length > 0) {
      loadData();
    }
  }, [loadData, fields.length]);

  // Focus input when editing
  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus?.();
      inputRef.current.select?.();
    }
  }, [editingCell]);

  // Get primary key field
  const getPrimaryKeyField = () => {
    return collection?.filterTargetKey || 'id';
  };

  // Handle cell click to start editing
  const handleCellClick = (record: any, field: any) => {
    if (field.primaryKey) return; // Don't edit primary key
    
    const rowKey = record[getPrimaryKeyField()];
    setEditingCell({ rowKey, fieldName: field.name });
    setEditingValue(record[field.name]);
  };

  // Handle cell value change
  const handleCellChange = (value: any) => {
    setEditingValue(value);
  };

  // Save cell value
  const handleCellSave = async () => {
    if (!editingCell) return;

    const { rowKey, fieldName } = editingCell;
    const record = data.find((r) => r[getPrimaryKeyField()] === rowKey);
    
    if (!record || record[fieldName] === editingValue) {
      setEditingCell(null);
      setEditingValue(null);
      return;
    }

    setSaving(true);
    try {
      await apiClient.request({
        resource: collectionName,
        action: 'update',
        params: {
          filterByTk: rowKey,
          values: { [fieldName]: editingValue },
        },
      });

      // Update local data
      setData((prev) =>
        prev.map((r) =>
          r[getPrimaryKeyField()] === rowKey ? { ...r, [fieldName]: editingValue } : r
        )
      );
      message.success(t('Saved'));
    } catch (error) {
      console.error('Failed to save:', error);
      message.error(t('Failed to save'));
    } finally {
      setSaving(false);
      setEditingCell(null);
      setEditingValue(null);
    }
  };

  // Cancel editing
  const handleCellCancel = () => {
    setEditingCell(null);
    setEditingValue(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!editingCell) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCellCancel();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellSave();
      // Move to next cell logic would go here
    }
  };

  // Create new row
  const handleAddRow = async () => {
    try {
      const response = await apiClient.request({
        resource: collectionName,
        action: 'create',
        params: {
          values: {},
        },
      });

      if (response?.data?.data) {
        setData((prev) => [...prev, response.data.data]);
        setTotalCount((prev) => prev + 1);
        message.success(t('Row added'));
      }
    } catch (error) {
      console.error('Failed to create row:', error);
      message.error(t('Failed to create row'));
    }
  };

  // Delete selected rows
  const handleDeleteRows = async () => {
    if (selectedRowKeys.length === 0) return;

    Modal.confirm({
      title: t('Delete rows'),
      content: t('Are you sure you want to delete {{count}} rows?', { count: selectedRowKeys.length }),
      okText: t('Delete'),
      okType: 'danger',
      cancelText: t('Cancel'),
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((key) =>
              apiClient.request({
                resource: collectionName,
                action: 'destroy',
                params: { filterByTk: key },
              })
            )
          );
          setData((prev) => prev.filter((r) => !selectedRowKeys.includes(r[getPrimaryKeyField()])));
          setTotalCount((prev) => prev - selectedRowKeys.length);
          setSelectedRowKeys([]);
          message.success(t('Rows deleted'));
        } catch (error) {
          console.error('Failed to delete rows:', error);
          message.error(t('Failed to delete rows'));
        }
      },
    });
  };

  // Duplicate row
  const handleDuplicateRow = async (record: any) => {
    const pkField = getPrimaryKeyField();
    const newRecord = { ...record };
    delete newRecord[pkField];
    delete newRecord.createdAt;
    delete newRecord.updatedAt;
    delete newRecord.createdById;
    delete newRecord.updatedById;

    try {
      const response = await apiClient.request({
        resource: collectionName,
        action: 'create',
        params: { values: newRecord },
      });

      if (response?.data?.data) {
        setData((prev) => [...prev, response.data.data]);
        setTotalCount((prev) => prev + 1);
        message.success(t('Row duplicated'));
      }
    } catch (error) {
      console.error('Failed to duplicate row:', error);
      message.error(t('Failed to duplicate row'));
    }
  };

  // Render cell editor based on field type
  const renderCellEditor = (field: any) => {
    const commonProps = {
      ref: inputRef,
      value: editingValue,
      onChange: (e: any) => handleCellChange(e?.target?.value ?? e),
      onKeyDown: handleKeyDown,
      onBlur: handleCellSave,
      size: 'small' as const,
      style: { width: '100%' },
    };

    switch (field.type) {
      case 'integer':
      case 'bigInt':
      case 'float':
      case 'double':
      case 'decimal':
        return (
          <InputNumber
            {...commonProps}
            value={editingValue}
            onChange={(value) => handleCellChange(value)}
          />
        );
      case 'boolean':
        return (
          <Switch
            checked={editingValue}
            onChange={(checked) => {
              setEditingValue(checked);
              setTimeout(() => handleCellSave(), 0);
            }}
            size="small"
          />
        );
      case 'date':
        return (
          <DatePicker
            {...commonProps}
            value={editingValue}
            onChange={(date) => {
              setEditingValue(date);
              setTimeout(() => handleCellSave(), 0);
            }}
          />
        );
      case 'datetime':
        return (
          <DatePicker
            {...commonProps}
            showTime
            value={editingValue}
            onChange={(date) => {
              setEditingValue(date);
              setTimeout(() => handleCellSave(), 0);
            }}
          />
        );
      case 'text':
        return (
          <Input.TextArea
            {...commonProps}
            autoSize={{ minRows: 1, maxRows: 4 }}
          />
        );
      default:
        return <Input {...commonProps} />;
    }
  };

  // Render cell value display
  const renderCellValue = (value: any, field: any) => {
    if (value === null || value === undefined) {
      return <Text type="secondary" italic>{t('Empty')}</Text>;
    }

    switch (field.type) {
      case 'boolean':
        return value ? <Tag color="green">{t('Yes')}</Tag> : <Tag>{t('No')}</Tag>;
      case 'date':
      case 'datetime':
        return new Date(value).toLocaleString();
      case 'json':
        return <Text code ellipsis style={{ maxWidth: 200 }}>{JSON.stringify(value)}</Text>;
      default:
        if (typeof value === 'object') {
          return <Text code ellipsis style={{ maxWidth: 200 }}>{JSON.stringify(value)}</Text>;
        }
        return String(value);
    }
  };

  // Build table columns
  const columns = useMemo(() => {
    const cols: any[] = [];

    // Row number column
    cols.push({
      title: '#',
      key: '_index',
      width: 50,
      fixed: 'left',
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    });

    // Field columns
    visibleFields.forEach((fieldName) => {
      const field = fields.find((f) => f.name === fieldName);
      if (!field) return;

      cols.push({
        title: (
          <div className={headerCellClass}>
            <span className="field-title">{field.uiSchema?.title || field.name}</span>
            <div className="field-actions">
              <Dropdown
                menu={{
                  items: [
                    { key: 'sort-asc', icon: <SortAscendingOutlined />, label: t('Sort A-Z') },
                    { key: 'sort-desc', icon: <SortAscendingOutlined style={{ transform: 'scaleY(-1)' }} />, label: t('Sort Z-A') },
                    { type: 'divider' },
                    { key: 'hide', icon: <EyeInvisibleOutlined />, label: t('Hide field') },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'sort-asc') {
                      setSorts([{ field: field.name, order: 'asc' }]);
                    } else if (key === 'sort-desc') {
                      setSorts([{ field: field.name, order: 'desc' }]);
                    } else if (key === 'hide') {
                      setVisibleFields((prev) => prev.filter((f) => f !== field.name));
                    }
                  },
                }}
                trigger={['click']}
              >
                <MoreOutlined onClick={(e) => e.stopPropagation()} />
              </Dropdown>
            </div>
          </div>
        ),
        dataIndex: field.name,
        key: field.name,
        width: 150,
        ellipsis: true,
        onCell: (record: any) => ({
          className: cellClass + (
            editingCell?.rowKey === record[getPrimaryKeyField()] &&
            editingCell?.fieldName === field.name
              ? ' editing'
              : ''
          ),
          onClick: () => handleCellClick(record, field),
        }),
        render: (value: any, record: any) => {
          const rowKey = record[getPrimaryKeyField()];
          const isEditing = editingCell?.rowKey === rowKey && editingCell?.fieldName === field.name;

          if (isEditing) {
            return (
              <div className="cell-editor" onClick={(e) => e.stopPropagation()}>
                {renderCellEditor(field)}
              </div>
            );
          }

          return renderCellValue(value, field);
        },
      });
    });

    // Actions column
    cols.push({
      title: '',
      key: '_actions',
      width: 80,
      fixed: 'right',
      render: (_: any, record: any) => (
        <div className={rowActionsClass}>
          <Tooltip title={t('Expand')}>
            <Button
              type="text"
              size="small"
              icon={<ExpandOutlined />}
              onClick={() => setExpandedRecord(record)}
            />
          </Tooltip>
          <Dropdown
            menu={{
              items: [
                { key: 'duplicate', icon: <CopyOutlined />, label: t('Duplicate') },
                { key: 'delete', icon: <DeleteOutlined />, label: t('Delete'), danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'duplicate') {
                  handleDuplicateRow(record);
                } else if (key === 'delete') {
                  const rowKey = record[getPrimaryKeyField()];
                  setSelectedRowKeys([rowKey]);
                  handleDeleteRows();
                }
              },
            }}
            trigger={['click']}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </div>
      ),
    });

    return cols;
  }, [fields, visibleFields, editingCell, page, pageSize, t]);

  // View type icons
  const viewIcons: Record<ViewType, React.ReactNode> = {
    grid: <TableOutlined />,
    form: <AppstoreOutlined />,
    kanban: <ProjectOutlined />,
    calendar: <CalendarOutlined />,
    gallery: <AppstoreOutlined />,
  };

  return (
    <div className={containerClass}>
      {/* Header Toolbar */}
      <div className={toolbarClass}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/admin/settings/mcit-data-editor/list')}
          >
            {t('Back')}
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {collection?.title || collectionName}
          </Title>
        </Space>
        <Space>
          <Input
            placeholder={t('Search...')}
            prefix={<SearchOutlined />}
            allowClear
            style={{ width: 200 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Tooltip title={t('Filter')}>
            <Button icon={<FilterOutlined />} />
          </Tooltip>
          <Tooltip title={t('Sort')}>
            <Button icon={<SortAscendingOutlined />} />
          </Tooltip>
          <Tooltip title={t('Fields')}>
            <Button icon={<SettingOutlined />} onClick={() => setShowFieldSettings(true)} />
          </Tooltip>
          <Tooltip title={t('Refresh')}>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} />
          </Tooltip>
        </Space>
      </div>

      {/* View Tabs */}
      <div className={viewTabsClass}>
        <Tabs
          activeKey={viewType}
          onChange={(key) => setViewType(key as ViewType)}
          items={[
            { key: 'grid', label: <Space>{viewIcons.grid} {t('Grid')}</Space> },
            { key: 'form', label: <Space>{viewIcons.form} {t('Form')}</Space>, disabled: true },
            { key: 'kanban', label: <Space>{viewIcons.kanban} {t('Kanban')}</Space>, disabled: true },
            { key: 'calendar', label: <Space>{viewIcons.calendar} {t('Calendar')}</Space>, disabled: true },
            { key: 'gallery', label: <Space>{viewIcons.gallery} {t('Gallery')}</Space>, disabled: true },
          ]}
          tabBarExtraContent={
            <Space>
              {selectedRowKeys.length > 0 && (
                <>
                  <Text type="secondary">{t('{{count}} selected', { count: selectedRowKeys.length })}</Text>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteRows}
                    size="small"
                  >
                    {t('Delete')}
                  </Button>
                </>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddRow}
                size="small"
              >
                {t('Add Row')}
              </Button>
            </Space>
          }
        />
      </div>

      {/* Table */}
      <div className={tableContainerClass}>
        <Table
          loading={loading}
          dataSource={data}
          columns={columns}
          rowKey={getPrimaryKeyField()}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys as string[]),
          }}
          pagination={false}
          scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
          size="small"
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={t('No data')}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddRow}>
                  {t('Add first row')}
                </Button>
              </Empty>
            ),
          }}
        />
      </div>

      {/* Add Row Button */}
      <div className={addRowClass} onClick={handleAddRow}>
        <PlusOutlined />
        <span>{t('Add new row')}</span>
      </div>

      {/* Status Bar */}
      <div className={statusBarClass}>
        <Space>
          <Text type="secondary">{t('{{count}} records', { count: totalCount })}</Text>
          {saving && <Text type="secondary">{t('Saving...')}</Text>}
        </Space>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={totalCount}
          onChange={(p, ps) => {
            setPage(p);
            setPageSize(ps);
          }}
          size="small"
          showSizeChanger
          showQuickJumper
        />
      </div>

      {/* Field Settings Drawer */}
      <Drawer
        title={t('Field Settings')}
        placement="right"
        onClose={() => setShowFieldSettings(false)}
        open={showFieldSettings}
        width={300}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary">{t('Toggle field visibility')}</Text>
          {fields.map((field) => (
            <div key={field.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text>{field.uiSchema?.title || field.name}</Text>
              <Switch
                checked={visibleFields.includes(field.name)}
                onChange={(checked) => {
                  if (checked) {
                    setVisibleFields((prev) => [...prev, field.name]);
                  } else {
                    setVisibleFields((prev) => prev.filter((f) => f !== field.name));
                  }
                }}
                size="small"
              />
            </div>
          ))}
        </Space>
      </Drawer>

      {/* Record Detail Drawer */}
      <Drawer
        title={t('Record Details')}
        placement="right"
        onClose={() => setExpandedRecord(null)}
        open={!!expandedRecord}
        width={500}
      >
        {expandedRecord && (
          <Form layout="vertical">
            {fields.map((field) => (
              <Form.Item
                key={field.name}
                label={field.uiSchema?.title || field.name}
              >
                {renderCellValue(expandedRecord[field.name], field)}
              </Form.Item>
            ))}
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default MCITSpreadsheetEditor;
