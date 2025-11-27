/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PINAuth } from '../providers/pin-auth';

describe('PINAuth', () => {
  describe('hashPin (sync)', () => {
    it('should hash a PIN with salt', () => {
      const { hash, salt } = PINAuth.hashPin('1234');
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for different PINs', () => {
      const { hash: hash1 } = PINAuth.hashPin('1234');
      const { hash: hash2 } = PINAuth.hashPin('5678');
      expect(hash1).not.toBe(hash2);
    });

    it('should produce same hash with same salt', () => {
      const salt = 'testsalt123';
      const { hash: hash1 } = PINAuth.hashPin('1234', salt);
      const { hash: hash2 } = PINAuth.hashPin('1234', salt);
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes with different salts', () => {
      const { hash: hash1 } = PINAuth.hashPin('1234', 'salt1');
      const { hash: hash2 } = PINAuth.hashPin('1234', 'salt2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashPinAsync', () => {
    it('should hash a PIN with salt asynchronously', async () => {
      const { hash, salt } = await PINAuth.hashPinAsync('1234');
      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
      expect(salt.length).toBeGreaterThan(0);
    });

    it('should produce same hash with same salt', async () => {
      const salt = 'testsalt123';
      const { hash: hash1 } = await PINAuth.hashPinAsync('1234', salt);
      const { hash: hash2 } = await PINAuth.hashPinAsync('1234', salt);
      expect(hash1).toBe(hash2);
    });
  });

  describe('verifyPin (sync)', () => {
    it('should return true for correct PIN', () => {
      const { hash, salt } = PINAuth.hashPin('1234');
      const result = PINAuth.verifyPin('1234', hash, salt);
      expect(result).toBe(true);
    });

    it('should return false for incorrect PIN', () => {
      const { hash, salt } = PINAuth.hashPin('1234');
      const result = PINAuth.verifyPin('5678', hash, salt);
      expect(result).toBe(false);
    });

    it('should return false for incorrect salt', () => {
      const { hash, salt } = PINAuth.hashPin('1234');
      const { hash: hash2, salt: salt2 } = PINAuth.hashPin('1234');
      // Using wrong salt should fail
      expect(salt).not.toBe(salt2);
      const result = PINAuth.verifyPin('1234', hash, salt2);
      expect(result).toBe(false);
    });
  });

  describe('verifyPinAsync', () => {
    it('should return true for correct PIN', async () => {
      const { hash, salt } = await PINAuth.hashPinAsync('1234');
      const result = await PINAuth.verifyPinAsync('1234', hash, salt);
      expect(result).toBe(true);
    });

    it('should return false for incorrect PIN', async () => {
      const { hash, salt } = await PINAuth.hashPinAsync('1234');
      const result = await PINAuth.verifyPinAsync('5678', hash, salt);
      expect(result).toBe(false);
    });
  });

  describe('validatePinFormat', () => {
    it('should return true for valid 4-digit PIN', () => {
      expect(PINAuth.validatePinFormat('1234')).toBe(true);
      expect(PINAuth.validatePinFormat('0000')).toBe(true);
      expect(PINAuth.validatePinFormat('9999')).toBe(true);
    });

    it('should return false for non-4-digit PINs', () => {
      expect(PINAuth.validatePinFormat('123')).toBe(false);
      expect(PINAuth.validatePinFormat('12345')).toBe(false);
      expect(PINAuth.validatePinFormat('')).toBe(false);
    });

    it('should return false for non-numeric PINs', () => {
      expect(PINAuth.validatePinFormat('abcd')).toBe(false);
      expect(PINAuth.validatePinFormat('12a4')).toBe(false);
      expect(PINAuth.validatePinFormat('12-4')).toBe(false);
    });
  });
});
