/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginMCITDataEditorServer extends Plugin {
  async afterAdd() {
    // Plugin dependencies can be specified here
  }

  async beforeLoad() {
    // Register any collections or models
    this.app.db.collection({
      name: 'mcitViews',
      fields: [
        {
          type: 'uid',
          name: 'key',
          primaryKey: true,
        },
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'type',
          comment: 'grid | form | kanban | calendar | gallery',
        },
        {
          type: 'string',
          name: 'dataSourceKey',
        },
        {
          type: 'string',
          name: 'collectionName',
        },
        {
          type: 'json',
          name: 'config',
          comment: 'View configuration including columns, filters, sorting, grouping',
        },
        {
          type: 'json',
          name: 'visibleFields',
          comment: 'Array of visible field names',
        },
        {
          type: 'json',
          name: 'fieldOrder',
          comment: 'Array of field names in display order',
        },
        {
          type: 'json',
          name: 'fieldWidths',
          comment: 'Object mapping field names to widths',
        },
        {
          type: 'json',
          name: 'filters',
          comment: 'Filter configuration',
        },
        {
          type: 'json',
          name: 'sorts',
          comment: 'Sorting configuration',
        },
        {
          type: 'json',
          name: 'groupBy',
          comment: 'Group by configuration for kanban views',
        },
        {
          type: 'integer',
          name: 'sort',
          defaultValue: 0,
        },
        {
          type: 'boolean',
          name: 'isDefault',
          defaultValue: false,
        },
        {
          type: 'belongsTo',
          name: 'createdBy',
          target: 'users',
        },
        {
          type: 'date',
          name: 'createdAt',
          field: 'createdAt',
        },
        {
          type: 'date',
          name: 'updatedAt',
          field: 'updatedAt',
        },
      ],
    });
  }

  async load() {
    // Register resource actions for MCIT views
    this.app.resourceManager.define({
      name: 'mcitViews',
      actions: {
        list: {
          async handler(ctx, next) {
            const { dataSourceKey, collectionName } = ctx.action.params;
            const repository = ctx.db.getRepository('mcitViews');
            const views = await repository.find({
              filter: {
                dataSourceKey,
                collectionName,
              },
              sort: ['sort', 'createdAt'],
            });
            ctx.body = views;
            await next();
          },
        },
        create: {
          async handler(ctx, next) {
            const repository = ctx.db.getRepository('mcitViews');
            const view = await repository.create({
              values: ctx.action.params.values,
            });
            ctx.body = view;
            await next();
          },
        },
        update: {
          async handler(ctx, next) {
            const { filterByTk, values } = ctx.action.params;
            const repository = ctx.db.getRepository('mcitViews');
            await repository.update({
              filterByTk,
              values,
            });
            ctx.body = { success: true };
            await next();
          },
        },
        destroy: {
          async handler(ctx, next) {
            const { filterByTk } = ctx.action.params;
            const repository = ctx.db.getRepository('mcitViews');
            await repository.destroy({
              filterByTk,
            });
            ctx.body = { success: true };
            await next();
          },
        },
      },
    });

    // Register ACL permissions
    this.app.acl.registerSnippet({
      name: 'pm.mcit-data-editor',
      actions: ['mcitViews:*'],
    });

    this.app.acl.allow('mcitViews', '*', 'loggedIn');
  }

  async install() {
    // Run any installation logic
  }

  async afterEnable() {
    // Logic after plugin is enabled
  }

  async afterDisable() {
    // Logic after plugin is disabled
  }

  async remove() {
    // Cleanup when plugin is removed
  }
}

export default PluginMCITDataEditorServer;
