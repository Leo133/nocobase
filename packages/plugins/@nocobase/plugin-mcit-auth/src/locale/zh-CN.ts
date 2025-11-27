/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  // General
  'MCIT Authentication': 'MCIT 认证',
  'SSO Authentication': 'SSO 认证',
  'PIN Authentication': 'PIN 认证',

  // Auth types
  'OIDC (OpenID Connect)': 'OIDC (OpenID Connect)',
  'SAML 2.0': 'SAML 2.0',
  'OAuth 2.0': 'OAuth 2.0',
  '4-Digit PIN': '4位 PIN',

  // OIDC
  'Issuer URL': '发行者 URL',
  'Client ID': '客户端 ID',
  'Client Secret': '客户端密钥',
  'Redirect URI': '重定向 URI',
  Scope: '范围',

  // SAML
  'Entry Point': '入口点',
  Issuer: '发行者',
  Certificate: '证书',
  'Private Key': '私钥',
  'Callback URL': '回调 URL',
  'Signature Algorithm': '签名算法',

  // OAuth
  'Authorization URL': '授权 URL',
  'Token URL': '令牌 URL',
  'User Info URL': '用户信息 URL',

  // User mapping
  'User Mapping': '用户映射',
  'Email Field': '邮箱字段',
  'Username Field': '用户名字段',
  'Nickname Field': '昵称字段',

  // PIN
  'Enter PIN': '输入 PIN',
  'Confirm PIN': '确认 PIN',
  'Set up PIN': '设置 PIN',
  'Change PIN': '更改 PIN',
  'Session Expiry (minutes)': '会话过期时间（分钟）',
  'Max Attempts': '最大尝试次数',
  'Lockout Duration (minutes)': '锁定时长（分钟）',

  // Messages
  'Authorization code is required': '需要授权码',
  'OIDC authentication failed: {{error}}': 'OIDC 认证失败：{{error}}',
  'Unable to get user identity from OIDC provider': '无法从 OIDC 提供商获取用户身份',
  'SAML response is required': '需要 SAML 响应',
  'SAML authentication failed: {{error}}': 'SAML 认证失败：{{error}}',
  'Unable to get user identity from SAML provider': '无法从 SAML 提供商获取用户身份',
  'OAuth authentication failed: {{error}}': 'OAuth 认证失败：{{error}}',
  'Unable to get user identity from OAuth provider': '无法从 OAuth 提供商获取用户身份',
  'PIN must be exactly {{length}} digits': 'PIN 必须正好是 {{length}} 位数字',
  'Invalid PIN format': 'PIN 格式无效',
  'PIN not set up for this user': '此用户尚未设置 PIN',
  'Account locked. Try again in {{minutes}} minutes': '账户已锁定。请在 {{minutes}} 分钟后重试',
  'Too many failed attempts. Account locked for {{minutes}} minutes':
    '尝试失败次数过多。账户已锁定 {{minutes}} 分钟',
  'Invalid PIN': 'PIN 无效',
  'User ID is required': '需要用户 ID',
  'PIN is required': '需要 PIN',
  'User not found': '用户未找到',
  'Authenticator name is required': '需要认证器名称',
  'Authenticator not found or not enabled': '认证器未找到或未启用',
  'Unsupported authentication type': '不支持的认证类型',
  'Authentication failed: {{error}}': '认证失败：{{error}}',
  'You must be logged in to use PIN authentication': '您必须登录才能使用 PIN 认证',
  'PIN verified successfully': 'PIN 验证成功',
  'You must be logged in to set up a PIN': '您必须登录才能设置 PIN',
  'PINs do not match': 'PIN 不匹配',
  'PIN set up successfully': 'PIN 设置成功',
  'You must be logged in to validate PIN': '您必须登录才能验证 PIN',
  'You must be logged in': '您必须登录',

  // UI
  'Sign in with OIDC': '使用 OIDC 登录',
  'Sign in with SAML': '使用 SAML 登录',
  'Sign in with OAuth': '使用 OAuth 登录',
  'Sign in with PIN': '使用 PIN 登录',
  'Continue with SSO': '使用 SSO 继续',
  'Quick access with PIN': '使用 PIN 快速访问',
  'Forgot PIN?': '忘记 PIN？',
  'Configure SSO': '配置 SSO',
  'Configure PIN': '配置 PIN',
};
