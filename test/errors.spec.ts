/// <reference types="jest" />
import { formatApiError, isNetcupApiResponse, NetcupRequestError } from '../src/errors';

describe('isNetcupApiResponse', () => {
  test('returns true for valid ApiResponse shape', () => {
    expect(
      isNetcupApiResponse({
        serverrequestid: 'srv-1',
        clientrequestid: 'cli-1',
        action: 'infoDnsZone',
        status: 'success',
        statuscode: 2000,
        shortmessage: 'OK',
        longmessage: 'Request successful',
        responsedata: {},
      })
    ).toBe(true);
  });

  test('returns false for null', () => {
    expect(isNetcupApiResponse(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isNetcupApiResponse(undefined)).toBe(false);
  });

  test('returns false for primitive values', () => {
    expect(isNetcupApiResponse('hello')).toBe(false);
    expect(isNetcupApiResponse(42)).toBe(false);
  });

  test('returns false when missing required fields', () => {
    expect(isNetcupApiResponse({ action: 'test' })).toBe(false);
    expect(isNetcupApiResponse({ action: 'test', status: 'ok' })).toBe(false);
    expect(isNetcupApiResponse({ action: 'test', status: 'ok', statuscode: 2000 })).toBe(false);
  });

  test('returns false when statuscode is not a number', () => {
    expect(
      isNetcupApiResponse({
        serverrequestid: 'srv-1',
        clientrequestid: 'cli-1',
        action: 'test',
        status: 'success',
        statuscode: '2000',
        shortmessage: 'OK',
        longmessage: 'OK',
        responsedata: {},
      })
    ).toBe(false);
  });
});

describe('formatApiError', () => {
  test('formats a NetcupRequestError with full details', () => {
    const error = new NetcupRequestError({
      serverrequestid: 'srv-1',
      clientrequestid: 'cli-1',
      action: 'infoDnsZone',
      status: 'error',
      statuscode: 4001,
      shortmessage: 'Session invalid',
      longmessage: 'Session ID has expired',
      responsedata: {},
    });

    const result = formatApiError(error, { context: 'During zone fetch' });
    expect(result).toContain('During zone fetch');
    expect(result).toContain('Netcup API Error');
    expect(result).toContain('Session invalid');
    expect(result).toContain('Session ID has expired');
    expect(result).toContain('infoDnsZone');
    expect(result).toContain('4001');
    expect(result).toContain('srv-1');
    expect(result).toContain('cli-1');
  });

  test('formats a NetcupRequestError without context', () => {
    const error = new NetcupRequestError({
      serverrequestid: 'srv-1',
      clientrequestid: '',
      action: 'login',
      status: 'error',
      statuscode: 4003,
      shortmessage: 'API key invalid',
      longmessage: 'API key invalid',
      responsedata: {},
    });

    const result = formatApiError(error);
    expect(result).not.toContain('undefined');
    expect(result).toContain('API key invalid');
    expect(result).toContain('4003');
  });

  test('formats a regular Error', () => {
    const error = new TypeError('cannot read property of undefined');
    const result = formatApiError(error);
    expect(result).toContain('Application Error');
    expect(result).toContain('TypeError');
    expect(result).toContain('cannot read property of undefined');
  });

  test('formats an unknown throwable (string)', () => {
    const result = formatApiError('something went wrong');
    expect(result).toContain('Unknown Error');
    expect(result).toContain('something went wrong');
  });

  test('formats an unknown throwable (number)', () => {
    const result = formatApiError(42);
    expect(result).toContain('Unknown Error');
    expect(result).toContain('42');
  });

  test('omits longmessage line when it matches shortmessage', () => {
    const error = new NetcupRequestError({
      serverrequestid: 'srv-1',
      clientrequestid: '',
      action: 'login',
      status: 'error',
      statuscode: 4003,
      shortmessage: 'API key invalid',
      longmessage: 'API key invalid',
      responsedata: {},
    });

    const result = formatApiError(error);
    const lines = result.split('\n');
    const detailLines = lines.filter((l) => l.startsWith('- Details:'));
    expect(detailLines).toHaveLength(0);
  });

  test('includes clientrequestid when present', () => {
    const error = new NetcupRequestError({
      serverrequestid: 'srv-1',
      clientrequestid: 'my-client-id',
      action: 'login',
      status: 'error',
      statuscode: 4003,
      shortmessage: 'API key invalid',
      longmessage: 'API key invalid',
      responsedata: {},
    });

    const result = formatApiError(error);
    expect(result).toContain('my-client-id');
  });
});
