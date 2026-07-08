# Netcup DNS API TypeScript Library

I have built this library because i was not satisfied with the existing libraries. This is an attempt to build a strongly typed TypeScript client to fully cover the (quite legacy-feeling like) netcup DNS API.

If you encounter issues or have suggestions, feel free to open an issue/contact me.

## Installation

```bash
pnpm add netcup-dns-ts
# or
npm install netcup-dns-ts
# or
yarn add netcup-dns-ts
```

```ts
import NetcupApi from 'netcup-dns-ts';

const api = await new NetcupApi().init({
  customernumber: process.env.NETCUP_CUSTOMER_NUMBER!,
  apikey: process.env.NETCUP_API_KEY!,
  apipassword: process.env.NETCUP_API_PASSWORD!,
});
```

Package: `https://www.npmjs.com/package/netcup-dns-ts`

## Quickstart

**Prerequisites:** Node.js >=16, a Netcup account with API access.

1. Get your API credentials from the Netcup panel (Customer number, API key, API password).
2. Store them as environment variables or in a `.env` file:

```bash
NETCUP_CUSTOMER_NUMBER=123456
NETCUP_API_KEY=your-api-key
NETCUP_API_PASSWORD=your-api-password
```

3. Initialize and use:

```ts
import dotenv from 'dotenv';
import NetcupApi from 'netcup-dns-ts';

dotenv.config();

const api = await new NetcupApi().init({
  customernumber: process.env.NETCUP_CUSTOMER_NUMBER!,
  apikey: process.env.NETCUP_API_KEY!,
  apipassword: process.env.NETCUP_API_PASSWORD!,
});

// Read DNS records
const records = await api.infoDnsRecords({ domainname: 'example.com' });
console.log(records.responsedata.dnsrecords);

await api.logout();
```

See `examples/` directory for complete working examples.

## Limits / Caveats

- **Reseller scope:** domain/handle operations require a Netcup reseller-capable account/API permissions.
- **Dangerous operations are opt-in:** `createDomain` and `cancelDomain` throws an error unless you call `enableDangerousOperations()` first.
- **`createDomain` nameserver requirement:** `createDomain` requires `nameservers` and they must be your own authoritative nameservers; Netcup default NS cannot be used during registration.
- **Rate limit:** Netcup limits requests to `180 requests/minute`; callers must throttle their own usage to stay below that limit.
- **Session lifetime:** Netcup sessions expire after inactivity; `NetcupApi` auto-refreshes session tokens.
- **IDN domains:** pass punycoded domains for non-ASCII names (for example via Node's `punycode` utilities) before calling API methods.
- **Known Netcup backend issues:** `vatnumber` in `optionalhandleattributes` will be rejected server-side for `createHandle`/`updateHandle`, even though it can appear in `infoHandle` responses. The current error is "Type vaumber is unknown.", i have created a support ticket for that issue.

## Available Functions

### Native API Functions (direct Netcup actions)

These methods map 1:1 to official Netcup API actions.

| Method                        | Netcup action         | Reseller only | Notes                                                                           |
| ----------------------------- | --------------------- | ------------- | ------------------------------------------------------------------------------- |
| `logout()`                    | `logout`              | No            | Ends current API session.                                                       |
| `infoDnsZone(params)`         | `infoDnsZone`         | No            | Fetch DNS zone metadata.                                                        |
| `infoDnsRecords(params)`      | `infoDnsRecords`      | No            | Fetch DNS records.                                                              |
| `updateDnsRecords(params)`    | `updateDnsRecords`    | No            | Upsert/delete DNS records via payload flags.                                    |
| `updateDnsZone(params)`       | `updateDnsZone`       | No            | Update zone settings (TTL, refresh, retry, expire).                             |
| `listallDomains(params?)`     | `listallDomains`      | Yes           | List all domains in account.                                                    |
| `infoDomain(params)`          | `infoDomain`          | Yes           | Get detailed domain information.                                                |
| `createDomain(params)`        | `createDomain`        | Yes           | Domain registration; requires dangerous-op enablement and your own nameservers. |
| `updateDomain(params)`        | `updateDomain`        | Yes           | Update contacts/nameservers.                                                    |
| `cancelDomain(params)`        | `cancelDomain`        | Yes           | Start cancellation workflow; requires dangerous-op enablement.                  |
| `transferDomain(params)`      | `transferDomain`      | Yes           | Incoming transfer with auth code.                                               |
| `changeOwnerDomain(params)`   | `changeOwnerDomain`   | Yes           | Start owner-change process.                                                     |
| `getAuthcodeDomain(params)`   | `getAuthcodeDomain`   | Yes           | Retrieve transfer auth code.                                                    |
| `listallHandle(params?)`      | `listallHandle`       | Yes           | List contact handles.                                                           |
| `infoHandle(params)`          | `infoHandle`          | Yes           | Read one contact handle.                                                        |
| `createHandle(params)`        | `createHandle`        | Yes           | Create contact handle with optional attributes.                                 |
| `updateHandle(params)`        | `updateHandle`        | Yes           | Update existing handle.                                                         |
| `deleteHandle(params)`        | `deleteHandle`        | Yes           | Delete handle if not assigned to domains.                                       |
| `priceTopleveldomain(params)` | `priceTopleveldomain` | Yes           | TLD pricing lookup (`de`, `.com`, etc.).                                        |
| `poll(params?)`               | `poll`                | Yes           | Read asynchronous messages.                                                     |
| `ackpoll(params)`             | `ackpoll`             | Yes           | Mark poll message as read.                                                      |

### Convenience functions (repo-provided)

These methods do not exist as direct Netcup actions; they are helpers from this library.

| Method                                           | Purpose                                                                                            |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `init(params)`                                   | Stores credentials, validates format, performs `login`, and enables auto session refresh behavior. |
| `enableDangerousOperations()`                    | Explicitly unlocks `createDomain` and `cancelDomain` for the current `NetcupApi` instance.         |
| `updateDnsRecordWithCurrentIp(params)`           | Resolves public IP and updates A/AAAA records via `updateDnsRecords`.                              |
| `deleteDnsRecords(params)`                       | Finds matching records and deletes them safely by forwarding record IDs with `deleterecord: true`. |
| `enableDebugLogging()` / `disableDebugLogging()` | Toggles sanitized request/response logging on the underlying REST client.                          |
| `getAuthData()`                                  | Returns in-memory auth/session state for diagnostics.                                              |

## Examples

### DNS read/update flow

```ts
import NetcupApi from 'netcup-dns-ts';

const api = await new NetcupApi().init({
  customernumber: process.env.NETCUP_CUSTOMER_NUMBER!,
  apikey: process.env.NETCUP_API_KEY!,
  apipassword: process.env.NETCUP_API_PASSWORD!,
});

const zone = await api.infoDnsZone({ domainname: 'example.com' });
console.log(zone.responsedata.ttl);

// This will effectively upsert the record
await api.updateDnsRecords({
  domainname: 'example.com',
  dnsrecordset: {
    dnsrecords: [
      {
        hostname: 'www',
        type: 'A',
        destination: '192.0.2.10',
      },
    ],
  },
});
```

### Delete DNS records with the convenience helper

```ts
await api.deleteDnsRecords({
  domainname: 'example.com',
  hostname: 'old',
  type: 'A',
  allMatches: true,
});
```

### Update a host to current public IP

```ts
await api.updateDnsRecordWithCurrentIp({
  domainname: 'example.com',
  hostname: 'home',
  useIpv4AndIpv6: true,
});
```

### Reseller: list domains and inspect one domain

```ts
const allDomains = await api.listallDomains();
console.log(allDomains.responsedata.map((d) => d.domainname));

const domain = await api.infoDomain({
  domainname: 'example.com',
  registryinformationflag: true,
});

console.log(domain.responsedata.assignedcontacts?.ownerc);
```

### Reseller: create a handle and register a domain

```ts
const ownerHandle = await api.createHandle({
  type: 'person',
  name: 'Max Mustermann',
  street: 'Musterstrasse 1',
  city: 'Karlsruhe',
  postalcode: '76131',
  countrycode: 'DE',
  telephone: '+49.123456789',
  email: 'max@example.com',
});

api.enableDangerousOperations();

await api.createDomain({
  domainname: 'my-new-domain.tld',
  contacts: {
    ownerc: String(ownerHandle.responsedata.id),
    adminc: String(ownerHandle.responsedata.id),
    techc: String(ownerHandle.responsedata.id),
    billingc: String(ownerHandle.responsedata.id),
    zonec: String(ownerHandle.responsedata.id),
  },
  // Required: must be your own authoritative nameservers
  nameservers: {
    nameserver1: {
      hostname: 'ns1.example-dns.net',
      ipv4: '198.51.100.10',
    },
    nameserver2: {
      hostname: 'ns2.example-dns.net',
      ipv4: '198.51.100.11',
    },
  },
});
```

### Reseller: poll asynchronous messages

```ts
const poll = await api.poll({ messagecount: 10 });

for (const msg of poll.responsedata ?? []) {
  console.log(msg.id, msg.action, msg.status, msg.shortmessage);
  await api.ackpoll({ apilogid: msg.id });
}
```

## TypeScript Types

All request parameters and response objects are fully typed. Key types:

```ts
import type {
  DnsRecord,
  DnsRecordType,
  DomainObject,
  HandleObject,
  PollObject,
  TopleveldomainObject,
} from 'netcup-dns-ts';
```

**Type narrowing for record types:**

```ts
import type { DnsRecordType } from 'netcup-dns-ts';

const recordType: DnsRecordType = 'A'; // narrowed to valid Netcup types
```

**Response data access:**

```ts
const zone = await api.infoDnsZone({ domainname: 'example.com' });
// zone.responsedata is InfoDNSZoneResponseData — fully typed
const ttl: number = zone.responsedata.ttl;
const serial: number = zone.responsedata.serial;
```

Run `pnpm run docs` to generate full API documentation.

## Error Handling

All non-success API responses are surfaced as exceptions (for known payloads as `NetcupRequestError`).

```ts
import { NetcupRequestError } from 'netcup-dns-ts';

try {
  await api.infoDnsRecords({ domainname: 'missing.example' });
} catch (error) {
  if (error instanceof NetcupRequestError) {
    console.error(error.details.statuscode, error.details.shortmessage);
  }
  throw error;
}
```

See [Error codes](./ERROR_CODES.md) for known status codes and their handling.

## Troubleshooting

**Session expired / 4001 errors:**
Sessions expire after ~15 minutes. The library auto-refreshes, but if you see 4001 errors, reinitialize with `init()`.

**Rate limiting / 4013 errors:**
Netcup limits requests to `180 requests/minute`. The library does not throttle or retry rate-limited requests; space out requests in your application.

**createDomain fails / 5017 errors:**
Nameservers must be your own authoritative nameservers and must be resolvable. Netcup default NS cannot be used during registration.

**Handle deletion fails / 5014 errors:**
The handle is still assigned to a domain. Update domain contacts first, then delete.

**TypeScript errors with `type` field:**
Use the exported `DnsRecordType` union type. The API accepts strings like `'A'`, `'AAAA'`, `'MX'`, etc.

**Debug mode:**

```ts
api.enableDebugLogging(); // see sanitized request/response logs
```

## Development

```bash
pnpm install            # install dependencies
pnpm run build          # build ESM + CJS bundles
pnpm run lint           # run ESLint
pnpm run typecheck      # run TypeScript type checking
pnpm test               # run tests with coverage
pnpm run docs           # regenerate TypeDoc documentation
```

After changing public types or API surface, regenerate docs and commit:

```bash
pnpm run docs && git add docs/
```

## References

- Netcup API general docs: `https://www.netcup.com/de/helpcenter/dokumentation/domain/unsere-api`
- Netcup API technical docs: `https://ccp.netcup.net/run/webservice/servers/endpoint.php`
- Package: `https://www.npmjs.com/package/netcup-dns-ts`
- Issues: `https://github.com/matteohoeren/netcup-dns-api-ts/issues`

## Acknowledgements

This library was inspired by `netcup-node` by proohit:

- `https://github.com/proohit/netcup-node`

## Disclaimer

This project was built with substantial assistance from AI tools. While the code is reviewed and tested, please verify behavior in your own environment before using it in production.

## License

MIT
