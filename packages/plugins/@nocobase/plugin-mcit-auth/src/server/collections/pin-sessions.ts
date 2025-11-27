/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

/**
 * Collection for storing user PIN session data
 */
export default defineCollection({
  dumpRules: {
    group: 'third-party',
  },
  migrationRules: ['overwrite', 'schema-only'],
  shared: true,
  name: 'mcitPinSessions',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    {
      name: 'id',
      type: 'bigInt',
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
      interface: 'id',
    },
    {
      name: 'userId',
      type: 'bigInt',
      allowNull: false,
      unique: true,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '{{t("User ID")}}',
        'x-component': 'InputNumber',
        required: true,
      },
    },
    {
      name: 'pinHash',
      type: 'string',
      length: 256,
      allowNull: false,
    },
    {
      name: 'pinSalt',
      type: 'string',
      length: 64,
      allowNull: false,
    },
    {
      name: 'failedAttempts',
      type: 'integer',
      defaultValue: 0,
    },
    {
      name: 'lockedUntil',
      type: 'date',
      allowNull: true,
    },
    {
      name: 'lastUsedAt',
      type: 'date',
      allowNull: true,
    },
    {
      interface: 'belongsTo',
      type: 'belongsTo',
      name: 'user',
      target: 'users',
      foreignKey: 'userId',
      targetKey: 'id',
      onDelete: 'CASCADE',
    },
  ],
  indexes: [
    {
      fields: ['userId'],
      unique: true,
    },
  ],
});
