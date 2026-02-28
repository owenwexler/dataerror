/**
 * dataerror — Comprehensive Vitest Test Suite
 *
 * Covers:
 *  1. Types & shape of the exported `errors` dictionary
 *  2. Internal `formatError` (tested indirectly via `failure`)
 *  3. Internal `logError`   (tested indirectly via `failure` + console spies)
 *  4. Exported `success<T>` function
 *  5. Exported `failure<T>` function (all branches)
 *  6. Edge cases, regressions, and the `syntaxErrror` typo bug
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  errors,
  success,
  failure,
  type ErrorType,
  type DataErrorReturnObject,
  type ErrorAdditionalArgs,
  type UnformattedError,
  type ErrorsObject,
} from '../src/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fully-formed ErrorType-shaped object for test inputs */
const makeErrorType = (overrides: Partial<ErrorType> = {}): ErrorType => ({
  code: 'test_code',
  message: 'Test message',
  details: 'Test details',
  hint: 'Test hint',
  ...overrides,
});

// ---------------------------------------------------------------------------
// 1. errors dictionary — shape & content
// ---------------------------------------------------------------------------

describe('errors dictionary', () => {
  const expectedKeys = [
    'internalServerError',
    'invalidCredentials',
    'badOAuthCallback',
    'userNotFound',
    'userAlreadyExists',
    'missingPassword',
    'weakPassword',
    'sessionNotFound',
    'missingInputs',
    'accessDenied',
    'databaseError',
    'cacheError',
    'unknownError',
    'referenceError',
    'typeError',
  ];

  it('should be a non-null object', () => {
    expect(errors).toBeDefined();
    expect(typeof errors).toBe('object');
    expect(errors).not.toBeNull();
  });

  it.each(expectedKeys)('should contain key "%s" with a valid ErrorType shape', (key) => {
    const entry = errors[key];
    expect(entry).toBeDefined();
    expect(typeof entry.code).toBe('string');
    expect(typeof entry.message).toBe('string');
    expect(typeof entry.details).toBe('string');
    expect(typeof entry.hint).toBe('string');
    expect(entry.code.length).toBeGreaterThan(0);
    expect(entry.message.length).toBeGreaterThan(0);
    expect(entry.details.length).toBeGreaterThan(0);
    expect(entry.hint.length).toBeGreaterThan(0);
  });

  it('should have unique error codes across all entries', () => {
    const codes = Object.values(errors).map((e) => e.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  // ---- Specific error values ----

  it('internalServerError should have code "internal_server_error"', () => {
    expect(errors.internalServerError.code).toBe('internal_server_error');
    expect(errors.internalServerError.message).toBe('Internal Server Error');
  });

  it('invalidCredentials should have code "invalid_credentials"', () => {
    expect(errors.invalidCredentials.code).toBe('invalid_credentials');
  });

  it('badOAuthCallback should have code "bad_oauth_callback"', () => {
    expect(errors.badOAuthCallback.code).toBe('bad_oauth_callback');
  });

  it('userNotFound should have code "user_not_found"', () => {
    expect(errors.userNotFound.code).toBe('user_not_found');
  });

  it('userAlreadyExists should have code "user_already_exists"', () => {
    expect(errors.userAlreadyExists.code).toBe('user_already_exists');
  });

  it('missingPassword should have code "missing_password"', () => {
    expect(errors.missingPassword.code).toBe('missing_password');
  });

  it('weakPassword should have code "weak_password"', () => {
    expect(errors.weakPassword.code).toBe('weak_password');
  });

  it('sessionNotFound should have code "session_not_found"', () => {
    expect(errors.sessionNotFound.code).toBe('session_not_found');
  });

  it('missingInputs should have code "missing_inputs"', () => {
    expect(errors.missingInputs.code).toBe('missing_inputs');
  });

  it('accessDenied should have code "access_denied"', () => {
    expect(errors.accessDenied.code).toBe('access_denied');
  });

  it('databaseError should have code "database_error"', () => {
    expect(errors.databaseError.code).toBe('database_error');
  });

  it('cacheError should have code "cache_error"', () => {
    expect(errors.cacheError.code).toBe('cache_error');
  });

  it('unknownError should have code "unknown_error"', () => {
    expect(errors.unknownError.code).toBe('unknown_error');
  });

  it('referenceError should have code "reference_error"', () => {
    expect(errors.referenceError.code).toBe('reference_error');
  });

  it('typeError should have code "type_error"', () => {
    expect(errors.typeError.code).toBe('type_error');
  });

  describe('syntaxError', () => {
    it('should have key "syntaxError" on the runtime object', () => {
      // The actual key in the source has three r's
      expect(errors['syntaxError']).toBeDefined();
      expect(errors['syntaxError'].code).toBe('syntax_error');
    });
  });
});

// ---------------------------------------------------------------------------
// 2. success<T>()
// ---------------------------------------------------------------------------

describe('success()', () => {
  it('should return a Promise', () => {
    const result = success<string>('hello');
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve with { data, error: null } for a string', async () => {
    const result = await success<string>('hello');
    expect(result).toEqual({ data: 'hello', error: null });
  });

  it('should resolve with { data, error: null } for a number', async () => {
    const result = await success<number>(42);
    expect(result.data).toBe(42);
    expect(result.error).toBeNull();
  });

  it('should resolve with { data, error: null } for a boolean', async () => {
    const result = await success<boolean>(true);
    expect(result.data).toBe(true);
    expect(result.error).toBeNull();
  });

  it('should work with an object type', async () => {
    type User = { id: number; name: string };
    const user: User = { id: 1, name: 'Alice' };
    const result = await success<User>(user);
    expect(result.data).toEqual({ id: 1, name: 'Alice' });
    expect(result.error).toBeNull();
  });

  it('should work with an array type', async () => {
    const items = [1, 2, 3];
    const result = await success<number[]>(items);
    expect(result.data).toEqual([1, 2, 3]);
    expect(result.error).toBeNull();
  });

  it('should work with null data', async () => {
    const result = await success<null>(null);
    expect(result.data).toBeNull();
    expect(result.error).toBeNull();
  });

  it('should work with undefined data', async () => {
    const result = await success<undefined>(undefined);
    expect(result.data).toBeUndefined();
    expect(result.error).toBeNull();
  });

  it('should work with an empty object', async () => {
    const result = await success<Record<string, never>>({});
    expect(result.data).toEqual({});
    expect(result.error).toBeNull();
  });

  it('should work with an empty string', async () => {
    const result = await success<string>('');
    expect(result.data).toBe('');
    expect(result.error).toBeNull();
  });

  it('should work with zero', async () => {
    const result = await success<number>(0);
    expect(result.data).toBe(0);
    expect(result.error).toBeNull();
  });

  it('should preserve reference identity for object data', async () => {
    const obj = { key: 'value' };
    const result = await success<typeof obj>(obj);
    expect(result.data).toBe(obj); // same reference
  });
});

// ---------------------------------------------------------------------------
// 3. failure<T>() — core behavior
// ---------------------------------------------------------------------------

describe('failure()', () => {
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a Promise', () => {
    const result = failure<string>(new Error('boom'), 'test');
    expect(result).toBeInstanceOf(Promise);
  });

  it('should resolve with { data: null, error: ErrorType }', async () => {
    const result = await failure<string>(new Error('boom'), 'testLocation');
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
    expect(result.error).not.toBeNull();
  });

  // ---- formatError behavior (tested through failure) ----

  describe('formatError — via failure()', () => {
    it('should detect ReferenceError and return errors.referenceError', async () => {
      const refErr = new ReferenceError('x is not defined');
      const result = await failure<string>(refErr, 'testFn');

      expect(result.error).toEqual(errors.referenceError);
      expect(result.error!.code).toBe('reference_error');
    });

    it('should detect TypeError and return errors.typeError', async () => {
      const typeErr = new TypeError('Cannot read properties of undefined');
      const result = await failure<string>(typeErr, 'testFn');

      expect(result.error).toEqual(errors.typeError);
      expect(result.error!.code).toBe('type_error');
    });

    it('should pass through a fully-formed ErrorType object as-is', async () => {
      const customError = makeErrorType({
        code: 'custom_error',
        message: 'Custom',
        details: 'Custom detail',
        hint: 'Custom hint',
      });
      const result = await failure<string>(customError, 'testFn');

      expect(result.error).toEqual(customError);
    });

    it('should fill missing fields from unknownError for a partial error', async () => {
      const partial = { code: 'partial_code' };
      const result = await failure<string>(partial, 'testFn');

      expect(result.error!.code).toBe('partial_code');
      expect(result.error!.message).toBe(errors.unknownError.message);
      expect(result.error!.details).toBe(errors.unknownError.details);
      expect(result.error!.hint).toBe(errors.unknownError.hint);
    });

    it('should fill missing code from unknownError when only message is present', async () => {
      const partial = { message: 'Something broke' };
      const result = await failure<string>(partial, 'testFn');

      expect(result.error!.code).toBe(errors.unknownError.code);
      expect(result.error!.message).toBe('Something broke');
      expect(result.error!.details).toBe(errors.unknownError.details);
      expect(result.error!.hint).toBe(errors.unknownError.hint);
    });

    it('should handle a partial error with only details and hint', async () => {
      const partial = { details: 'some detail', hint: 'try this' };
      const result = await failure<string>(partial, 'testFn');

      expect(result.error!.code).toBe(errors.unknownError.code);
      expect(result.error!.message).toBe(errors.unknownError.message);
      expect(result.error!.details).toBe('some detail');
      expect(result.error!.hint).toBe('try this');
    });

    it('should return unknownError fields for a completely empty object', async () => {
      const result = await failure<string>({}, 'testFn');

      expect(result.error!.code).toBe(errors.unknownError.code);
      expect(result.error!.message).toBe(errors.unknownError.message);
      expect(result.error!.details).toBe(errors.unknownError.details);
      expect(result.error!.hint).toBe(errors.unknownError.hint);
    });

    it('should handle a plain string thrown as an error', async () => {
      const result = await failure<string>('some string error', 'testFn');

      // A string has no .code / .message / .details / .hint properties,
      // so everything should fall back to unknownError defaults
      expect(result.error!.code).toBe(errors.unknownError.code);
      expect(result.error!.message).toBe(errors.unknownError.message);
    });

    it('should handle a number thrown as an error', async () => {
      const result = await failure<string>(404, 'testFn');

      expect(result.error!.code).toBe(errors.unknownError.code);
    });

    it('should handle null thrown as an error', async () => {
      // `null as UnformattedError` will cause `.code` access to fail;
      // the cast `(null as ErrorType)` has no properties.
      // formatError casts it — accessing properties on null won't throw
      // in JS (it returns undefined which is falsy), so it falls through.
      // Actually, accessing property on null DOES throw.
      // This tests the edge case & documents potential runtime crash.
      await expect(failure<string>(null, 'testFn')).rejects.toThrow();
    });

    it('should handle undefined thrown as an error', async () => {
      // Same as null — accessing .code on undefined throws
      await expect(failure<string>(undefined, 'testFn')).rejects.toThrow();
    });

    it('should handle a standard Error object (not Reference/Type)', async () => {
      const err = new Error('generic error');
      const result = await failure<string>(err, 'testFn');

      // Error has .message but no .code / .details / .hint
      expect(result.error!.code).toBe(errors.unknownError.code);
      expect(result.error!.message).toBe('generic error');
      expect(result.error!.details).toBe(errors.unknownError.details);
      expect(result.error!.hint).toBe(errors.unknownError.hint);
    });

    it('should handle a SyntaxError', async () => {
      const err = new SyntaxError('Unexpected token');
      const result = await failure<string>(err, 'testFn');

      expect(result.error!.code).toBe(errors.syntaxError.code);
      expect(result.error!.message).toBe(errors.syntaxError.message);
    });

    it('should handle a RangeError', async () => {
      const err = new RangeError('Maximum call stack');
      const result = await failure<string>(err, 'testFn');

      expect(result.error!.code).toBe(errors.rangeError.code);
      expect(result.error!.message).toBe(errors.rangeError.message);
    });

    it('should handle an error object with extra properties (index signature)', async () => {
      const err = {
        code: 'custom_code',
        message: 'Custom message',
        details: 'Custom details',
        hint: 'Custom hint',
        extraField: 'should be ignored by formatError but kept on the ref',
      };
      const result = await failure<string>(err, 'testFn');

      expect(result.error!.code).toBe('custom_code');
      // The original object is returned by reference when all 4 fields exist
      expect((result.error as any).extraField).toBe('should be ignored by formatError but kept on the ref');
    });
  });

  // ---- logError behavior (tested through failure + console spies) ----

  describe('logError — via failure()', () => {
    it('should call console.log and console.error for a non-credentials error', async () => {
      await failure<string>(new Error('boom'), 'myModule/myFunction');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('console.log should contain the location string', async () => {
      await failure<string>(new Error('boom'), 'auth/login');

      const logCall = consoleSpy.log.mock.calls[0][0] as string;
      expect(logCall).toContain('auth/login');
    });

    it('should format summary as "code: message at location" for typed errors', async () => {
      const err = makeErrorType({ code: 'db_fail', message: 'DB is down' });
      await failure<string>(err, 'dbLayer/query');

      const logCall = consoleSpy.log.mock.calls[0][0] as string;
      expect(logCall).toBe('db_fail: DB is down at dbLayer/query');
    });

    it('should format summary as first 15 chars of JSON for unknown errors', async () => {
      const weirdError = { foo: 'bar' };
      await failure<string>(weirdError, 'somePlace');

      const logCall = consoleSpy.log.mock.calls[0][0] as string;
      // JSON.stringify({ foo: 'bar' }) = '{"foo":"bar"}' (13 chars)
      // .slice(0, 15) = '{"foo":"bar"}'
      expect(logCall).toContain('{"foo":"bar"}');
      expect(logCall).toContain('somePlace');
    });

    it('should pass the raw error object to console.error', async () => {
      const rawErr = new Error('raw');
      await failure<string>(rawErr, 'loc');

      expect(consoleSpy.error).toHaveBeenCalledWith(rawErr);
    });
  });

  // ---- additionalArgs.returnErrorType ----

  describe('additionalArgs.returnErrorType', () => {
    it('should override the formatted error when returnErrorType is specified', async () => {
      const genericError = new Error('something vague');
      const result = await failure<string>(genericError, 'dbLayer/save', {
        returnErrorType: errors.databaseError,
      });

      expect(result.error).toEqual(errors.databaseError);
      expect(result.error!.code).toBe('database_error');
    });

    it('should still log the original error even when returnErrorType overrides the return', async () => {
      const originalError = new Error('original');
      await failure<string>(originalError, 'test', {
        returnErrorType: errors.cacheError,
      });

      // logError is called with the *original* error, not the override
      expect(consoleSpy.error).toHaveBeenCalledWith(originalError);
    });

    it('should return the override error, not the formatted one', async () => {
      const partialErr = { code: 'partial' };
      const result = await failure<string>(partialErr, 'fn', {
        returnErrorType: errors.internalServerError,
      });

      expect(result.error!.code).toBe('internal_server_error');
    });
  });

  // ---- additionalArgs.logInvalidCredentialsErrors ----

  describe('invalid credentials logging', () => {
    const invalidCredsError = { ...errors.invalidCredentials };

    it('should NOT log when error is invalid_credentials and logInvalidCredentialsErrors is not set', async () => {
      await failure<string>(invalidCredsError, 'auth/login');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should NOT log when error is invalid_credentials and logInvalidCredentialsErrors is false', async () => {
      await failure<string>(invalidCredsError, 'auth/login', {
        logInvalidCredentialsErrors: false,
      });

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('should log when error is invalid_credentials and logInvalidCredentialsErrors is true', async () => {
      await failure<string>(invalidCredsError, 'auth/login', {
        logInvalidCredentialsErrors: true,
      });

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should still return the invalidCredentials error type regardless of logging flag', async () => {
      const result = await failure<string>(invalidCredsError, 'auth/login');

      expect(result.error!.code).toBe('invalid_credentials');
    });

    it('should log non-credential errors normally even when logInvalidCredentialsErrors is false', async () => {
      await failure<string>(new Error('not creds'), 'somewhere', {
        logInvalidCredentialsErrors: false,
      });

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });
  });

  // ---- Combination: returnErrorType + logInvalidCredentialsErrors ----

  describe('combined additionalArgs', () => {
    it('should honor both returnErrorType and logInvalidCredentialsErrors together', async () => {
      const invalidCredsError = { ...errors.invalidCredentials };
      const result = await failure<string>(invalidCredsError, 'auth/login', {
        logInvalidCredentialsErrors: true,
        returnErrorType: errors.accessDenied,
      });

      // Should log because logInvalidCredentialsErrors is true
      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      // Should return the overridden error type
      expect(result.error).toEqual(errors.accessDenied);
    });

    it('should suppress logging for creds error but still apply returnErrorType', async () => {
      const invalidCredsError = { ...errors.invalidCredentials };
      const result = await failure<string>(invalidCredsError, 'auth/login', {
        logInvalidCredentialsErrors: false,
        returnErrorType: errors.internalServerError,
      });

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(result.error).toEqual(errors.internalServerError);
    });
  });

  // ---- Generic type T on failure ----

  describe('generic type T', () => {
    it('should return data: null typed correctly for string generic', async () => {
      const result = await failure<string>(new Error('e'), 'loc');
      expect(result.data).toBeNull();
    });

    it('should return data: null typed correctly for complex generic', async () => {
      type ComplexType = { users: { id: number; name: string }[] };
      const result = await failure<ComplexType>(new Error('e'), 'loc');
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// 4. success + failure integration — simulating real usage
// ---------------------------------------------------------------------------

describe('success + failure integration', () => {
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should simulate a successful API call pattern', async () => {
    type ApiResponse = { items: string[] };

    async function fetchItems(): Promise<DataErrorReturnObject<ApiResponse>> {
      try {
        const data: ApiResponse = { items: ['a', 'b', 'c'] };
        return await success<ApiResponse>(data);
      } catch (error) {
        return failure<ApiResponse>(error, 'fetchItems');
      }
    }

    const result = await fetchItems();
    expect(result.data).toEqual({ items: ['a', 'b', 'c'] });
    expect(result.error).toBeNull();
  });

  it('should simulate a failed API call pattern', async () => {
    type ApiResponse = { items: string[] };

    async function fetchItems(): Promise<DataErrorReturnObject<ApiResponse>> {
      try {
        throw new Error('Network timeout');
      } catch (error) {
        return failure<ApiResponse>(error, 'fetchItems');
      }
    }

    const result = await fetchItems();
    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.message).toBe('Network timeout');
  });

  it('should always have exactly one of data/error be non-null in success path', async () => {
    const result = await success<number>(10);
    const hasData = result.data !== null;
    const hasError = result.error !== null;
    expect(hasData).toBe(true);
    expect(hasError).toBe(false);
  });

  it('should always have exactly one of data/error be non-null in failure path', async () => {
    const result = await failure<number>(new Error('err'), 'loc');
    const hasData = result.data !== null;
    const hasError = result.error !== null;
    expect(hasData).toBe(false);
    expect(hasError).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Each predefined error used through failure()
// ---------------------------------------------------------------------------

describe('failure() with each predefined error from errors dictionary', () => {
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const errorKeys = Object.keys(errors);

  it.each(errorKeys)(
    'passing errors.%s through failure should return it in the error field',
    async (key) => {
      const predefinedError = errors[key];
      const result = await failure<string>(predefinedError, `test/${key}`);

      // Special case: invalidCredentials is not logged by default
      if (key === 'invalidCredentials') {
        expect(consoleSpy.log).not.toHaveBeenCalled();
      }

      expect(result.data).toBeNull();
      expect(result.error).toEqual(predefinedError);
    },
  );

  it.each(errorKeys)(
    'using errors.%s as returnErrorType override should work',
    async (key) => {
      const predefinedError = errors[key];
      const result = await failure<string>(new Error('generic'), `test/${key}`, {
        returnErrorType: predefinedError,
      });

      expect(result.error).toEqual(predefinedError);
    },
  );
});

// ---------------------------------------------------------------------------
// 6. Edge cases & robustness
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  let consoleSpy: { log: ReturnType<typeof vi.spyOn>; error: ReturnType<typeof vi.spyOn> };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('failure with an Error subclass that is not ReferenceError/TypeError', async () => {
    class CustomNativeError extends EvalError {
      constructor(msg: string) {
        super(msg);
      }
    }
    const err = new CustomNativeError('eval problem');
    const result = await failure<string>(err, 'customErrTest');

    expect(result.error!.code).toBe(errors.unknownError.code);
    expect(result.error!.message).toBe('eval problem');
  });

  it('failure with an error containing falsy but defined values', async () => {
    const err = { code: '', message: '', details: '', hint: '' };
    const result = await failure<string>(err, 'falsyTest');

    // Empty strings are falsy, so formatError will use unknownError fallbacks
    expect(result.error!.code).toBe(errors.unknownError.code);
    expect(result.error!.message).toBe(errors.unknownError.message);
    expect(result.error!.details).toBe(errors.unknownError.details);
    expect(result.error!.hint).toBe(errors.unknownError.hint);
  });

  it('failure with location as empty string', async () => {
    const result = await failure<string>(new Error('e'), '');

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    const logCall = consoleSpy.log.mock.calls[0][0] as string;
    expect(logCall).toContain(' at ');
  });

  it('failure with a very long location string', async () => {
    const longLocation = 'a'.repeat(10000);
    const result = await failure<string>(new Error('e'), longLocation);

    expect(result.error).not.toBeNull();
    const logCall = consoleSpy.log.mock.calls[0][0] as string;
    expect(logCall).toContain(longLocation);
  });

  it('failure with an error that has numeric code', async () => {
    // Some APIs return numeric error codes
    const err = { code: 500, message: 'Server error' };
    const result = await failure<string>(err as any, 'numericCode');

    // 500 is truthy, so it will be used as-is via the cast
    expect(result.error!.code).toBe(500 as any);
  });

  it('failure with error containing only code and message (no details/hint)', async () => {
    const err = { code: 'api_error', message: 'API failed' };
    const result = await failure<string>(err, 'apiLayer');

    // code and message are truthy, but not all 4 fields exist,
    // so the partial-fill path is taken
    expect(result.error!.code).toBe('api_error');
    expect(result.error!.message).toBe('API failed');
    expect(result.error!.details).toBe(errors.unknownError.details);
    expect(result.error!.hint).toBe(errors.unknownError.hint);
  });

  it('failure with an error that has all 4 fields plus extra fields', async () => {
    const err = {
      code: 'extended_error',
      message: 'Extended',
      details: 'Has details',
      hint: 'Has hint',
      statusCode: 422,
      timestamp: '2025-01-01',
    };
    const result = await failure<string>(err, 'extendedTest');

    // All 4 fields present → returned as-is (same reference)
    expect(result.error!.code).toBe('extended_error');
    expect(result.error).toBe(err); // reference equality — the object is returned directly
  });

  it('additionalArgs as empty object should not affect behavior', async () => {
    const err = makeErrorType();
    const result = await failure<string>(err, 'loc', {});

    expect(result.error).toEqual(err);
    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
  });

  it('success with deeply nested data preserves structure', async () => {
    const nested = {
      level1: {
        level2: {
          level3: {
            value: [1, 2, { deep: true }],
          },
        },
      },
    };
    const result = await success(nested);
    expect(result.data).toBe(nested);
    expect(result.data!.level1.level2.level3.value[2]).toEqual({ deep: true });
  });

  it('multiple concurrent success calls resolve independently', async () => {
    const [r1, r2, r3] = await Promise.all([
      success<number>(1),
      success<string>('two'),
      success<boolean>(false),
    ]);

    expect(r1.data).toBe(1);
    expect(r2.data).toBe('two');
    expect(r3.data).toBe(false);
  });

  it('multiple concurrent failure calls resolve independently', async () => {
    const [r1, r2] = await Promise.all([
      failure<number>(new Error('err1'), 'loc1'),
      failure<string>(new ReferenceError('err2'), 'loc2'),
    ]);

    expect(r1.error!.message).toBe('err1');
    expect(r2.error!.code).toBe('reference_error');
  });
});

// ---------------------------------------------------------------------------
// 7. Structural / type-level assertions
// ---------------------------------------------------------------------------

describe('structural and type-level assertions', () => {
  it('DataErrorReturnObject from success has error: null', async () => {
    const result: DataErrorReturnObject<string> = await success('test');
    expect(result.error).toBeNull();
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('error');
  });

  it('DataErrorReturnObject from failure has data: null', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const result: DataErrorReturnObject<string> = await failure(new Error('e'), 'loc');
    expect(result.data).toBeNull();
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('error');

    vi.restoreAllMocks();
  });

  it('each ErrorType in errors has exactly 4 string keys', () => {
    for (const [key, value] of Object.entries(errors)) {
      const keys = Object.keys(value);
      expect(keys).toEqual(expect.arrayContaining(['code', 'message', 'details', 'hint']));
      expect(keys).toHaveLength(4);
    }
  });

  it('errors object is not frozen (mutable — potential concern)', () => {
    // Document that the errors object is not frozen.
    // Library consumers could accidentally mutate it.
    // TODO: we want to make the errors object extendable, but not mutable
    expect(Object.isFrozen(errors)).toBe(false);
  });
});
