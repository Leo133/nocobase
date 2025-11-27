/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Plugin, lazy } from '@nocobase/client';
import models from './models';
import { NAMESPACE } from './locale';

const { MCITDataEditorPage } = lazy(() => import('./components/MCITDataEditorPage'), 'MCITDataEditorPage');
const { MCITBreadcrumbTitle } = lazy(() => import('./components/MCITBreadcrumbTitle'), 'MCITBreadcrumbTitle');
const { MCITSpreadsheetEditor } = lazy(() => import('./components/MCITSpreadsheetEditor'), 'MCITSpreadsheetEditor');

export class PluginMCITDataEditorClient extends Plugin {
  async load() {
    // Register flow engine models
    this.flowEngine.registerModels(models);

    // Add settings page for the MCIT Data Editor
    this.app.pluginSettingsManager.add(NAMESPACE, {
      title: `{{t("MCIT Data Editor", { ns: "${NAMESPACE}" })}}`,
      icon: 'TableOutlined',
      sort: 95,
      showTabs: false,
      aclSnippet: 'pm.mcit-data-editor',
    });

    this.app.pluginSettingsManager.add(`${NAMESPACE}.list`, {
      title: `{{t("Data Sources", { ns: "${NAMESPACE}" })}}`,
      Component: MCITDataEditorPage,
      sort: 1,
      skipAclConfigure: true,
      aclSnippet: 'pm.mcit-data-editor',
    });

    this.app.pluginSettingsManager.add(`${NAMESPACE}/:dataSource/:collection`, {
      title: <MCITBreadcrumbTitle />,
      icon: 'TableOutlined',
      isTopLevel: false,
      sort: 100,
      Component: MCITSpreadsheetEditor,
      skipAclConfigure: true,
      aclSnippet: 'pm.mcit-data-editor',
    });
  }
}

export default PluginMCITDataEditorClient;
