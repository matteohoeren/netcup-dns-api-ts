/// <reference types="node" />
/// <reference types="jest" />
import NetcupApi from '../src';
import {
  DomainObject,
  HandleObject,
  InfoDNSRecordsResponse,
  InfoDNSZoneResponse,
  PollObject,
} from '../src';

const REQUIRED_ENV_VARS = [
  'NETCUP_CUSTOMER_NUMBER',
  'NETCUP_API_KEY',
  'NETCUP_API_PASSWORD',
] as const;

const missingRequiredEnv = REQUIRED_ENV_VARS.filter(
  (key) => !process.env[key] || process.env[key]?.trim().length === 0,
);

const describeIfConfigured = missingRequiredEnv.length === 0 ? describe : describe.skip;

const ALLOW_MUTATION = process.env.NETCUP_TEST_ALLOW_MUTATION === 'true';
const ALLOW_ACKPOLL = process.env.NETCUP_TEST_ALLOW_ACKPOLL === 'true';

function asDomainList(value: unknown): DomainObject[] {
  if (Array.isArray(value)) {
    return value as DomainObject[];
  }
  if (
    value &&
    typeof value === 'object' &&
    'domainlist' in value &&
    Array.isArray((value as { domainlist?: unknown }).domainlist)
  ) {
    return (value as { domainlist: DomainObject[] }).domainlist;
  }
  return [];
}

function asHandleList(value: unknown): HandleObject[] {
  if (Array.isArray(value)) {
    return value as HandleObject[];
  }
  if (
    value &&
    typeof value === 'object' &&
    'handlelist' in value &&
    Array.isArray((value as { handlelist?: unknown }).handlelist)
  ) {
    return (value as { handlelist: HandleObject[] }).handlelist;
  }
  return [];
}

function asPollList(value: unknown): PollObject[] {
  if (Array.isArray(value)) {
    return value as PollObject[];
  }
  return [];
}

describeIfConfigured('Netcup API non-dangerous integration', () => {
  const api = new NetcupApi();

  let selectedDomain: string | undefined;
  let existingHandleId: number | undefined;
  let createdHandleId: number | undefined;

  beforeAll(async () => {
    jest.setTimeout(120000);

    await api.init({
      customernumber: process.env.NETCUP_CUSTOMER_NUMBER as string,
      apikey: process.env.NETCUP_API_KEY as string,
      apipassword: process.env.NETCUP_API_PASSWORD as string,
    });
  });

  afterAll(async () => {
    if (createdHandleId && ALLOW_MUTATION) {
      try {
        await api.deleteHandle({ handle_id: createdHandleId });
      } catch {
        // best effort cleanup
      }
    }

    try {
      await api.logout();
    } catch {
      // ignore logout failures in test teardown
    }
  });

  test('initializes auth and exposes non-empty authData', () => {
    const auth = api.getAuthData();
    expect(auth.customerNumber).toBeTruthy();
    expect(auth.apiKey).toBeTruthy();
    expect(auth.apiSessionId).toBeTruthy();
  });

  test('listallDomains and infoDomain work for a valid domain', async () => {
    const list = await api.listallDomains();
    expect(list.statuscode).toBe(2000);

    const domains = asDomainList(list.responsedata);
    expect(Array.isArray(domains)).toBe(true);

    selectedDomain = process.env.NETCUP_TEST_DOMAIN?.trim() || domains[0]?.domainname || undefined;

    expect(selectedDomain).toBeTruthy();
    const info = await api.infoDomain({ domainname: selectedDomain as string });
    expect(info.statuscode).toBe(2000);
    expect(info.responsedata).toBeDefined();
  });

  test('DNS read methods work: infoDnsZone and infoDnsRecords', async () => {
    if (!selectedDomain) {
      return;
    }

    const zone: InfoDNSZoneResponse = await api.infoDnsZone({ domainname: selectedDomain });
    expect(zone.statuscode).toBe(2000);
    expect(zone.responsedata.name).toBeTruthy();

    const records: InfoDNSRecordsResponse = await api.infoDnsRecords({
      domainname: selectedDomain,
    });
    expect(records.statuscode).toBe(2000);
    expect(Array.isArray(records.responsedata.dnsrecords)).toBe(true);
  });

  test('priceTopleveldomain works for selected or configured TLD', async () => {
    const envTld = process.env.NETCUP_TEST_TLD?.trim();
    const inferredTld = selectedDomain?.split('.').pop();
    const topleveldomain = envTld || inferredTld || 'de';

    const price = await api.priceTopleveldomain({ topleveldomain });
    expect(price.statuscode).toBe(2000);
    expect(price.responsedata).toBeDefined();
  });

  test('listallHandle and infoHandle work', async () => {
    const handles = await api.listallHandle();
    expect(handles.statuscode).toBe(2000);

    const handleList = asHandleList(handles.responsedata);
    existingHandleId =
      process.env.NETCUP_TEST_HANDLE_ID && Number.isFinite(Number(process.env.NETCUP_TEST_HANDLE_ID))
        ? Number(process.env.NETCUP_TEST_HANDLE_ID)
        : handleList[0]?.id;

    if (!existingHandleId) {
      return;
    }

    const info = await api.infoHandle({ handle_id: existingHandleId });
    expect(info.statuscode).toBe(2000);
    expect(info.responsedata.id).toBe(existingHandleId);
  });

  test('poll works and ackpoll is optional via env flag', async () => {
    const poll = await api.poll({ messagecount: 10 });
    expect(poll.statuscode).toBe(2000);

    const pollItems = asPollList(poll.responsedata);
    if (!ALLOW_ACKPOLL || pollItems.length === 0) {
      return;
    }

    const ack = await api.ackpoll({ apilogid: pollItems[0].id });
    expect(ack.statuscode).toBe(2000);
  });

  test('getAuthcodeDomain works for selected domain', async () => {
    if (!selectedDomain) {
      return;
    }
    const authcode = await api.getAuthcodeDomain({ domainname: selectedDomain });
    expect(authcode.statuscode).toBe(2000);
    expect(typeof authcode.responsedata.authcode).toBe('string');
  });

  test('mutating/non-dangerous methods are exercised in safe negative-path mode', async () => {
    await expect(
      api.updateDnsZone({
        domainname: 'invalid-domain-for-test.invalid',
        dnszone: { ttl: 3600 },
      }),
    ).rejects.toThrow();

    await expect(
      api.updateDnsRecords({
        domainname: 'invalid-domain-for-test.invalid',
        dnsrecordset: {
          dnsrecords: [
            {
              hostname: 'www',
              type: 'A',
              destination: '127.0.0.1',
            },
          ],
        },
      }),
    ).rejects.toThrow();

    await expect(
      api.updateDnsRecordWithCurrentIp({
        domainname: 'invalid-domain-for-test.invalid',
        hostname: 'www',
      }),
    ).rejects.toThrow();

    await expect(
      api.updateDomain({ domainname: 'invalid-domain-for-test.invalid' }),
    ).rejects.toThrow();

    await expect(
      api.transferDomain({
        domainname: 'invalid-domain-for-test.invalid',
        authcode: 'invalid-auth-code',
        contacts: {},
      }),
    ).rejects.toThrow();

    await expect(
      api.changeOwnerDomain({
        domainname: 'invalid-domain-for-test.invalid',
        new_handle_id: 999999999,
      }),
    ).rejects.toThrow();

    await expect(
      api.createHandle({
        type: 'person',
        name: 'invalid',
        street: 'invalid',
        city: 'invalid',
        postalcode: '12345',
        countrycode: 'XX',
        telephone: '+99.123',
        email: 'invalid-email',
      }),
    ).rejects.toThrow();

    await expect(api.updateHandle({ handle_id: 999999999, city: 'Nowhere' })).rejects.toThrow();

    await expect(api.deleteHandle({ handle_id: 999999999 })).rejects.toThrow();
  });

  test('optional mutation coverage: DNS and handle lifecycle', async () => {
    if (!ALLOW_MUTATION || !selectedDomain) {
      return;
    }

    const hostname = process.env.NETCUP_TEST_HOSTNAME?.trim() || 'netcup-api-ts-test';
    const zone = await api.infoDnsZone({ domainname: selectedDomain });
    const records = await api.infoDnsRecords({ domainname: selectedDomain });

    const updateZone = await api.updateDnsZone({
      domainname: selectedDomain,
      dnszone: {
        name: zone.responsedata.name,
        ttl: zone.responsedata.ttl,
        serial: zone.responsedata.serial,
        refresh: zone.responsedata.refresh,
        retry: zone.responsedata.retry,
        expire: zone.responsedata.expire,
      },
    });
    expect(updateZone.statuscode).toBe(2000);

    const aRecord = records.responsedata.dnsrecords.find(
      (r) => r.hostname === hostname && r.type === 'A',
    );
    const dnsUpdate = await api.updateDnsRecords({
      domainname: selectedDomain,
      dnsrecordset: {
        dnsrecords: [
          {
            hostname,
            type: 'A',
            destination: aRecord?.destination || '127.0.0.1',
          },
        ],
      },
    });
    expect(dnsUpdate.statuscode).toBe(2000);

    const currentIpUpdate = await api.updateDnsRecordWithCurrentIp({
      domainname: selectedDomain,
      hostname,
    });
    expect(currentIpUpdate.statuscode).toBe(2000);

    const unique = Date.now();
    const create = await api.createHandle({
      type: 'person',
      name: `Netcup API Test ${unique}`,
      street: 'Test Street 1',
      city: 'Berlin',
      postalcode: '10115',
      countrycode: 'DE',
      telephone: '+49.1234567890',
      email: `netcup-api-test+${unique}@example.com`,
    });
    expect(create.statuscode).toBe(2000);
    createdHandleId = create.responsedata.id;

    const update = await api.updateHandle({
      handle_id: createdHandleId,
      city: 'Munich',
    });
    expect(update.statuscode).toBe(2000);

    const remove = await api.deleteHandle({ handle_id: createdHandleId });
    expect(remove.statuscode).toBe(2000);
    createdHandleId = undefined;
  });
});

describe('Netcup API non-dangerous integration (precondition)', () => {
  test('prints missing env vars when suite is skipped', () => {
    if (missingRequiredEnv.length > 0) {
      console.warn(
        `Skipping integration suite, missing env vars: ${missingRequiredEnv.join(', ')}`,
      );
    }
    expect(true).toBe(true);
  });
});
