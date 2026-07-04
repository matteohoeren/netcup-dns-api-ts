/// <reference types="jest" />
import { AxiosResponse } from 'axios';
import { defaultResponseHandler } from '../src/api';
import { NetcupRequestError } from '../src/errors';

function buildResponse(statuscode: number): AxiosResponse {
  return {
    data: {
      serverrequestid: 'srv-1',
      clientrequestid: 'cli-1',
      action: 'createDomain',
      status: statuscode === 2000 ? 'success' : 'pending',
      statuscode,
      shortmessage: 'message',
      longmessage: 'details',
      responsedata: {},
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {
      headers: {},
    },
    request: {},
  } as AxiosResponse;
}

describe('defaultResponseHandler', () => {
  test('accepts 2xxx status codes as successful API responses', () => {
    const pending = buildResponse(2002);

    expect(defaultResponseHandler(pending)).toBe(pending);
  });

  test('accepts numeric-string 2xxx status codes as successful API responses', () => {
    const pending = buildResponse(2000);
    pending.data.statuscode = '2002';

    expect(defaultResponseHandler(pending)).toBe(pending);
  });

  test('throws NetcupRequestError for non-2xxx status codes', () => {
    const failed = buildResponse(3001);

    expect(() => defaultResponseHandler(failed)).toThrow(NetcupRequestError);
  });
});
