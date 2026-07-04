/// <reference types="jest" />
import {
  normalizeDnsZone,
  normalizeDnsRecord,
  normalizeDomainObject,
  normalizeHandleObject,
  normalizePollObject,
  normalizeTopleveldomainObject,
} from '../src/api';

describe('normalizeDnsZone', () => {
  test('converts string numbers to actual numbers', () => {
    const raw = {
      name: 'example.com',
      ttl: '3600',
      serial: '2024010101',
      refresh: '28800',
      retry: '7200',
      expire: '604800',
      dnssecstatus: 'true',
    };

    const result = normalizeDnsZone(raw as any);
    expect(result.ttl).toBe(3600);
    expect(result.serial).toBe(2024010101);
    expect(result.refresh).toBe(28800);
    expect(result.retry).toBe(7200);
    expect(result.expire).toBe(604800);
    expect(result.dnssecstatus).toBe(true);
  });

  test('passes through actual numbers unchanged', () => {
    const raw = {
      name: 'example.com',
      ttl: 3600,
      serial: null,
      refresh: 28800,
      retry: 7200,
      expire: 604800,
      dnssecstatus: false,
    };

    const result = normalizeDnsZone(raw);
    expect(result.ttl).toBe(3600);
    expect(result.serial).toBeNull();
    expect(result.dnssecstatus).toBe(false);
  });

  test('defaults ttl/refresh/retry/expire to 0 when null', () => {
    const raw = {
      name: 'example.com',
      ttl: null,
      serial: null,
      refresh: null,
      retry: null,
      expire: null,
      dnssecstatus: null,
    };

    const result = normalizeDnsZone(raw as any);
    expect(result.ttl).toBe(0);
    expect(result.refresh).toBe(0);
    expect(result.retry).toBe(0);
    expect(result.expire).toBe(0);
    expect(result.dnssecstatus).toBe(false);
  });
});

describe('normalizeDnsRecord', () => {
  test('converts string id and priority to numbers', () => {
    const raw = {
      id: '12345',
      hostname: 'www',
      type: 'A',
      destination: '192.168.1.1',
      priority: '10',
      deleterecord: 'true',
    };

    const result = normalizeDnsRecord(raw as any);
    expect(result.id).toBe(12345);
    expect(result.priority).toBe(10);
    expect(result.deleterecord).toBe(true);
  });

  test('handles null id and priority', () => {
    const raw = {
      id: null,
      hostname: 'www',
      type: 'A',
      destination: '192.168.1.1',
      priority: null,
      deleterecord: false,
    };

    const result = normalizeDnsRecord(raw as any);
    expect(result.id).toBeNull();
    expect(result.priority).toBeNull();
    expect(result.deleterecord).toBe(false);
  });
});

describe('normalizeDomainObject', () => {
  test('converts string fields to correct types', () => {
    const raw = {
      domainname: 'example.com',
      customernumber: '12345',
      ownerchangerunning: 'true',
      cancellationrunning: 'false',
      runtimemonths: '12',
      priceperruntime: '9.99',
    };

    const result = normalizeDomainObject(raw as any);
    expect(result.customernumber).toBe(12345);
    expect(result.ownerchangerunning).toBe(true);
    expect(result.cancellationrunning).toBe(false);
    expect(result.runtimemonths).toBe(12);
    expect(result.priceperruntime).toBe(9.99);
  });

  test('defaults priceperruntime to 0 when null', () => {
    const raw = {
      domainname: 'example.com',
      customernumber: null,
      ownerchangerunning: false,
      cancellationrunning: false,
      runtimemonths: null,
      priceperruntime: null,
    };

    const result = normalizeDomainObject(raw as any);
    expect(result.priceperruntime).toBe(0);
  });
});

describe('normalizeHandleObject', () => {
  test('converts string id to number and assignedtodomain to boolean', () => {
    const raw = {
      id: '99999',
      type: 'person',
      name: 'Test User',
      street: 'Street 1',
      postalcode: '10115',
      city: 'Berlin',
      countrycode: 'DE',
      telephone: '+49.123',
      email: 'test@example.com',
      assignedtodomain: 'true',
    };

    const result = normalizeHandleObject(raw as any);
    expect(result.id).toBe(99999);
    expect(result.assignedtodomain).toBe(true);
  });

  test('defaults id to 0 when null', () => {
    const raw = {
      id: null,
      type: 'person',
      name: 'Test User',
      street: 'Street 1',
      postalcode: '10115',
      city: 'Berlin',
      countrycode: 'DE',
      telephone: '+49.123',
      email: 'test@example.com',
      assignedtodomain: false,
    };

    const result = normalizeHandleObject(raw as any);
    expect(result.id).toBe(0);
  });
});

describe('normalizePollObject', () => {
  test('converts string id and statuscode to numbers', () => {
    const raw = {
      id: '55555',
      action: 'createDomain',
      status: 'success',
      statuscode: '2000',
      shortmessage: 'OK',
      longmessage: 'Request successful',
      apikey: 'key',
      serverrequestid: 'srv-1',
      clientrequestid: null,
      requestdatetime: '2024-01-01T00:00:00Z',
      domainorhandle: 'domain',
      messageformat: 'json',
      apisessionid: 'session',
    };

    const result = normalizePollObject(raw as any);
    expect(result.id).toBe(55555);
    expect(result.statuscode).toBe(2000);
  });

  test('defaults id and statuscode to 0 when null', () => {
    const raw = {
      id: null,
      action: 'createDomain',
      status: 'success',
      statuscode: null,
      shortmessage: 'OK',
      apikey: 'key',
      serverrequestid: 'srv-1',
      requestdatetime: '2024-01-01T00:00:00Z',
      domainorhandle: 'domain',
      messageformat: 'json',
      apisessionid: 'session',
    };

    const result = normalizePollObject(raw as any);
    expect(result.id).toBe(0);
    expect(result.statuscode).toBe(0);
  });
});

describe('normalizeTopleveldomainObject', () => {
  test('converts string runtimemonths to number', () => {
    const raw = {
      topleveldomainname: 'de',
      priceperruntime: 9.99,
      setupfee: 5.0,
      runtimemonths: '12',
    };

    const result = normalizeTopleveldomainObject(raw as any);
    expect(result.runtimemonths).toBe(12);
  });

  test('converts null runtimemonths to null', () => {
    const raw = {
      topleveldomainname: 'de',
      priceperruntime: 9.99,
      setupfee: 5.0,
      runtimemonths: null,
    };

    const result = normalizeTopleveldomainObject(raw as any);
    expect(result.runtimemonths).toBeNull();
  });

  test('handles non-numeric string runtimemonths as null', () => {
    const raw = {
      topleveldomainname: 'de',
      priceperruntime: 9.99,
      setupfee: 5.0,
      runtimemonths: 'abc',
    };

    const result = normalizeTopleveldomainObject(raw as any);
    expect(result.runtimemonths).toBeNull();
  });
});
