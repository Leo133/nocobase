/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { Model } from '@nocobase/database';
import crypto from 'crypto';
import { namespace, PIN_LENGTH, PIN_SESSION_EXPIRY_MINUTES, PIN_SESSIONS_COLLECTION } from '../../constants';

export interface PINOptions {
  sessionExpiryMinutes?: number;
  maxAttempts?: number;
  lockoutMinutes?: number;
}

export class PINAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  /**
   * Get PIN configuration from options
   */
  getPINOptions(): PINOptions {
    const options = this.authenticator.options || {};
    return {
      sessionExpiryMinutes: options.sessionExpiryMinutes || PIN_SESSION_EXPIRY_MINUTES,
      maxAttempts: options.maxAttempts || 5,
      lockoutMinutes: options.lockoutMinutes || 15,
    };
  }

  /**
   * Hash a PIN for secure storage
   */
  static hashPin(pin: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(pin, useSalt, 10000, 64, 'sha512').toString('hex');
    return { hash, salt: useSalt };
  }

  /**
   * Verify a PIN against a stored hash
   */
  static verifyPin(pin: string, storedHash: string, salt: string): boolean {
    const { hash } = PINAuth.hashPin(pin, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
  }

  /**
   * Validate that a PIN meets requirements
   */
  static validatePinFormat(pin: string): boolean {
    return /^\d{4}$/.test(pin);
  }

  /**
   * Set up or update a user's PIN
   */
  async setupPin(userId: number, pin: string): Promise<void> {
    const ctx = this.ctx;

    if (!PINAuth.validatePinFormat(pin)) {
      ctx.throw(400, ctx.t('PIN must be exactly {{length}} digits', { ns: namespace, length: PIN_LENGTH }));
    }

    const { hash, salt } = PINAuth.hashPin(pin);

    const pinSessionsRepo = ctx.db.getRepository(PIN_SESSIONS_COLLECTION);

    // Check if user already has a PIN session record
    const existingSession = await pinSessionsRepo.findOne({
      filter: { userId },
    });

    if (existingSession) {
      await pinSessionsRepo.update({
        filterByTk: existingSession.id,
        values: {
          pinHash: hash,
          pinSalt: salt,
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
    } else {
      await pinSessionsRepo.create({
        values: {
          userId,
          pinHash: hash,
          pinSalt: salt,
          failedAttempts: 0,
        },
      });
    }
  }

  /**
   * Validate a user's PIN for session authentication
   */
  async validatePin(userId: number, pin: string): Promise<boolean> {
    const ctx = this.ctx;
    const options = this.getPINOptions();

    if (!PINAuth.validatePinFormat(pin)) {
      ctx.throw(400, ctx.t('Invalid PIN format', { ns: namespace }));
    }

    const pinSessionsRepo = ctx.db.getRepository(PIN_SESSIONS_COLLECTION);
    const pinSession = await pinSessionsRepo.findOne({
      filter: { userId },
    });

    if (!pinSession) {
      ctx.throw(404, ctx.t('PIN not set up for this user', { ns: namespace }));
    }

    // Check if account is locked
    if (pinSession.lockedUntil && new Date(pinSession.lockedUntil) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(pinSession.lockedUntil).getTime() - Date.now()) / 60000);
      ctx.throw(
        423,
        ctx.t('Account locked. Try again in {{minutes}} minutes', { ns: namespace, minutes: remainingMinutes }),
      );
    }

    // Verify the PIN
    const isValid = PINAuth.verifyPin(pin, pinSession.pinHash, pinSession.pinSalt);

    if (!isValid) {
      // Increment failed attempts
      const newFailedAttempts = (pinSession.failedAttempts || 0) + 1;
      const updates: any = { failedAttempts: newFailedAttempts };

      // Lock account if max attempts exceeded
      if (newFailedAttempts >= options.maxAttempts) {
        const lockUntil = new Date(Date.now() + options.lockoutMinutes * 60 * 1000);
        updates.lockedUntil = lockUntil;
      }

      await pinSessionsRepo.update({
        filterByTk: pinSession.id,
        values: updates,
      });

      if (updates.lockedUntil) {
        ctx.throw(
          423,
          ctx.t('Too many failed attempts. Account locked for {{minutes}} minutes', {
            ns: namespace,
            minutes: options.lockoutMinutes,
          }),
        );
      }

      ctx.throw(401, ctx.t('Invalid PIN', { ns: namespace }));
    }

    // Reset failed attempts on successful validation
    await pinSessionsRepo.update({
      filterByTk: pinSession.id,
      values: {
        failedAttempts: 0,
        lockedUntil: null,
        lastUsedAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Check if a user has a PIN set up
   */
  async hasPinSetup(userId: number): Promise<boolean> {
    const ctx = this.ctx;
    const pinSessionsRepo = ctx.db.getRepository(PIN_SESSIONS_COLLECTION);
    const pinSession = await pinSessionsRepo.findOne({
      filter: { userId },
    });
    return !!pinSession?.pinHash;
  }

  /**
   * Validate for PIN-based session authentication
   * This is used when a user wants to quickly re-authenticate within an existing session
   */
  async validate(): Promise<Model> {
    const ctx = this.ctx;
    const { userId, pin } = ctx.action.params.values || {};

    if (!userId) {
      ctx.throw(400, ctx.t('User ID is required', { ns: namespace }));
    }

    if (!pin) {
      ctx.throw(400, ctx.t('PIN is required', { ns: namespace }));
    }

    // Validate the PIN
    await this.validatePin(userId, pin);

    // Get the user
    const user = await this.userRepository.findOne({
      filter: { id: userId },
    });

    if (!user) {
      ctx.throw(404, ctx.t('User not found', { ns: namespace }));
    }

    return user;
  }
}
