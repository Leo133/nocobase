/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CollectionBlockModel,
  MultiRecordResource,
  tExpr,
  observable,
  autorun,
} from '@nocobase/flow-engine';

/**
 * View types supported by the MCIT spreadsheet editor
 */
export type MCITViewType = 'grid' | 'form' | 'kanban' | 'calendar' | 'gallery';

/**
 * Column configuration for the spreadsheet
 */
export interface MCITColumnConfig {
  fieldName: string;
  width?: number;
  visible: boolean;
  order: number;
  frozen?: boolean;
}

/**
 * Filter configuration
 */
export interface MCITFilterConfig {
  field: string;
  operator: string;
  value: any;
}

/**
 * Sort configuration
 */
export interface MCITSortConfig {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * View configuration
 */
export interface MCITViewConfig {
  key: string;
  title: string;
  type: MCITViewType;
  columns: MCITColumnConfig[];
  filters: MCITFilterConfig[];
  sorts: MCITSortConfig[];
  groupBy?: string;
  isDefault?: boolean;
}

type MCITSpreadsheetBlockModelStructure = {
  subModels: {
    columns: any[];
    actions: any[];
  };
};

/**
 * MCIT Spreadsheet Block Model - A NocoDB-style spreadsheet editor model
 * 
 * Features:
 * - Inline cell editing with auto-save
 * - Multiple view types (grid, form, kanban, calendar, gallery)
 * - Column management (show/hide, reorder, resize)
 * - Filtering and sorting
 * - Bulk operations (multi-select, delete, duplicate)
 * - Keyboard navigation
 * - Row expansion for detailed editing
 */
export class MCITSpreadsheetBlockModel extends CollectionBlockModel<MCITSpreadsheetBlockModelStructure> {
  // Observable state
  selectedRowKeys = observable.ref<string[]>([]);
  editingCell = observable.ref<{ rowKey: string; fieldName: string } | null>(null);
  editingValue = observable.ref<any>(null);
  viewConfig = observable.ref<MCITViewConfig | null>(null);
  visibleFields = observable.ref<string[]>([]);
  searchText = observable.ref<string>('');
  
  private disposeAutorun: () => void;

  get resource() {
    return super.resource as MultiRecordResource;
  }

  onInit(options) {
    super.onInit(options);
  }

  onMount() {
    super.onMount();
    
    // Auto-compute visible columns based on collection fields
    this.disposeAutorun = autorun(() => {
      if (this.collection && this.visibleFields.value.length === 0) {
        const fields = Array.from(this.collection.fields.values());
        const visibleFieldNames = fields
          .filter((f: any) => !['createdAt', 'updatedAt', 'createdById', 'updatedById'].includes(f.options.name))
          .map((f: any) => f.options.name);
        this.visibleFields.value = visibleFieldNames;
      }
    });
  }

  onUnmount() {
    super.onUnmount();
    if (this.disposeAutorun) {
      this.disposeAutorun();
    }
  }

  createResource(ctx, params) {
    return this.context.createResource(MultiRecordResource);
  }

  /**
   * Start editing a cell
   */
  startEditing(rowKey: string, fieldName: string, currentValue: any) {
    this.editingCell.value = { rowKey, fieldName };
    this.editingValue.value = currentValue;
  }

  /**
   * Cancel cell editing
   */
  cancelEditing() {
    this.editingCell.value = null;
    this.editingValue.value = null;
  }

  /**
   * Save the current cell edit
   */
  async saveCell() {
    const editing = this.editingCell.value;
    if (!editing) return;

    const { rowKey, fieldName } = editing;
    const data = this.resource.getData();
    const record = data.find((r) => r[this.collection.filterTargetKey] === rowKey);
    
    if (!record || record[fieldName] === this.editingValue.value) {
      this.cancelEditing();
      return;
    }

    try {
      await this.resource.save({ [fieldName]: this.editingValue.value });
      
      // Update local data
      record[fieldName] = this.editingValue.value;
      this.context.message?.success(this.context.t('Saved'));
    } catch (error) {
      console.error('Failed to save cell:', error);
      this.context.message?.error(this.context.t('Failed to save'));
    } finally {
      this.cancelEditing();
    }
  }

  /**
   * Add a new row
   */
  async addRow(values: any = {}) {
    try {
      await this.resource.create(values);
      await this.resource.refresh();
      this.context.message?.success(this.context.t('Row added'));
    } catch (error) {
      console.error('Failed to add row:', error);
      this.context.message?.error(this.context.t('Failed to add row'));
    }
  }

  /**
   * Delete selected rows
   */
  async deleteSelectedRows() {
    const keys = this.selectedRowKeys.value;
    if (keys.length === 0) return;

    try {
      await Promise.all(
        keys.map((key) => this.resource.destroy(key))
      );
      await this.resource.refresh();
      this.selectedRowKeys.value = [];
      this.context.message?.success(this.context.t('Rows deleted'));
    } catch (error) {
      console.error('Failed to delete rows:', error);
      this.context.message?.error(this.context.t('Failed to delete rows'));
    }
  }

  /**
   * Duplicate a row
   */
  async duplicateRow(record: any) {
    const pkField = this.collection.filterTargetKey;
    const newRecord = { ...record };
    delete newRecord[pkField];
    delete newRecord.createdAt;
    delete newRecord.updatedAt;
    delete newRecord.createdById;
    delete newRecord.updatedById;

    await this.addRow(newRecord);
  }

  /**
   * Toggle field visibility
   */
  toggleFieldVisibility(fieldName: string) {
    const visible = this.visibleFields.value;
    if (visible.includes(fieldName)) {
      this.visibleFields.value = visible.filter((f) => f !== fieldName);
    } else {
      this.visibleFields.value = [...visible, fieldName];
    }
  }

  /**
   * Set search text
   */
  setSearchText(text: string) {
    this.searchText.value = text;
  }

  /**
   * Toggle row selection
   */
  toggleRowSelection(rowKey: string) {
    const selected = this.selectedRowKeys.value;
    if (selected.includes(rowKey)) {
      this.selectedRowKeys.value = selected.filter((k) => k !== rowKey);
    } else {
      this.selectedRowKeys.value = [...selected, rowKey];
    }
  }

  /**
   * Select all rows
   */
  selectAllRows() {
    const data = this.resource.getData();
    this.selectedRowKeys.value = data.map((r) => r[this.collection.filterTargetKey]);
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedRowKeys.value = [];
  }
}

// Register flows for the model
MCITSpreadsheetBlockModel.registerFlow({
  key: 'mcitSpreadsheetSettings',
  sort: 500,
  title: tExpr('Spreadsheet settings'),
  steps: {
    pageSize: {
      title: tExpr('Page size'),
      uiSchema: {
        pageSize: {
          'x-component': 'Select',
          'x-decorator': 'FormItem',
          enum: [
            { label: '20', value: 20 },
            { label: '50', value: 50 },
            { label: '100', value: 100 },
            { label: '200', value: 200 },
          ],
        },
      },
      defaultParams: {
        pageSize: 50,
      },
      handler(ctx, params) {
        ctx.model.resource.setPage(1);
        ctx.model.resource.setPageSize(params.pageSize);
      },
    },
    dataScope: {
      use: 'dataScope',
      title: tExpr('Data scope'),
    },
    defaultSorting: {
      use: 'sortingRule',
      title: tExpr('Default sorting'),
    },
    refreshData: {
      title: tExpr('Refresh data'),
      async handler(ctx) {
        await ctx.model.resource.refresh();
      },
    },
  },
});

// Model definition
MCITSpreadsheetBlockModel.define({
  label: tExpr('MCIT Spreadsheet'),
  group: tExpr('Data'),
  searchable: true,
  createModelOptions: {
    use: 'MCITSpreadsheetBlockModel',
    subModels: {
      columns: [],
      actions: [],
    },
  },
  sort: 100,
});
