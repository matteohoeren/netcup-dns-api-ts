# Building the Netcup DNS API TypeScript Library

## Project Goal

Complete TypeScript library wrapping Netcup CCP API functions (DNS + Reseller APIs) with strong typing from technical documentation.

## API Endpoint

REST (JSON): `https://ccp.netcup.net/run/webservice/servers/endpoint.php?JSON`

Technical docs: `https://ccp.netcup.net/run/webservice/servers/endpoint.php`

## Critical Typing Requirements

1. **All function parameters must be strictly typed** - no `any` types
2. **Response types must reflect actual API structures** - validate against technical docs
3. **Enum types for fixed values:**
   - Record types: A, AAAA, MX, CNAME, NS, TXT, SOA, SRV, PTR, etc.
   - Handle types: `person`, `organisation`, `role`
   - DNSSEC types: `digest`, `publickey`
   - Domain states: `inclusive`, `additional`
   - Poll message statuses: `success`, `error`, `started`, `pending`, `warning`

## All API Functions to Implement

### Session Management

- `login` - returns `apisessionid`
- `logout` - ends session (already in netcup-node)

### DNS Functions (Partial)

- `infoDnsZone(domainname, customernumber, apikey, apisessionid)`
- `infoDnsRecords(domainname, customernumber, apikey, apisessionid)`
- `updateDnsRecords(domainname, customernumber, apikey, apisessionid, dnsrecordset)`
- `updateDnsZone(domainname, customernumber, apikey, apisessionid, dnszone)`

### Reseller Domain Functions (PRIORITY)

- `listallDomains` - returns array of `DomainObject`
- `infoDomain` - detailed domain info with optional registry lookup
- `createDomain` - register new domain (requires handles + nameservers)
- `updateDomain` - update contacts and nameservers
- `cancelDomain` - initiate domain cancellation
- `transferDomain` - incoming domain transfer (requires authcode)
- `changeOwnerDomain` - owner handle change (expires after 5 days)
- `getAuthcodeDomain` - get auth info for transfer

### Reseller Handle Functions (PRIORITY)

- `listallHandle` - list all contact handles
- `infoHandle` - get handle details
- `createHandle` - register new contact (15+ optional attributes for TLDs)
- `updateHandle` - update contact info (can affect registry)
- `deleteHandle` - remove contact (only if not assigned to domain)

### Reseller Utility Functions

- `priceTopleveldomain` - get pricing for TLD (considers discounts)
- `poll` - get unread async messages (for pending operations)
- `ackpoll` - mark poll message as read

## Key Data Types to Define

### Strongly-Typed Objects

```
Responses:
- ResponseMessage (base response wrapper)
- SessionObject { apisessionid }
- DomainObject { domainname, nameserverentry, customernumber, ... }
- HandleObject { id, type, name, organisation, street, ... }
- DnsRecord { id, hostname, type, destination, priority, state }
- DnsZone { name, ttl, serial, refresh, retry, expire, dnssecstatus }
- PollObject { id, action, status, statuscode, domainorhandle, ... }
- TopleveldomainObject { name, priceperruntime, setupfee }

Arrays:
- ContactEntries { ownerc, adminc, techc, zonec, billingc, onsitec, generalrequest, abusecontact }
- NameserverEntries { nameserver1-8 }
- NameserverEntry { hostname, ipv4, ipv6 }
- DnsRecordSet { dnsrecords: DnsRecord[] }
- DnssecentryObject (20 entries possible)
- OptionalHandleAttribute { item, value } (domain-specific: state, fax, birthdate, vatnumber, etc.)
- RegistryContacts { ownerc, adminc, techc, ... } (handle names at registry)
```

### Optional Handle Attributes

**Vary by TLD.** Full list in technical docs - map common ones as enum:

- `state`, `fax`, `handlecomment`, `birthdate`, `birthplace`
- `registrationnumber`, `taxnumber`, `vatnumber`
- `.aero`: aeroensid, aeroenspassword
- `.xxx`: xxxmemberid, xxxmemberpasswort
- `.pro`: proprofession
- `.travel`: traveluin
- `.asia`: asiatypeofentity, asiaformofidentity, asiaidentnumber
- `.jobs`: jobstitelposition, jobswebsite, jobsindustrytype
- `.es`: esnumbertype, esnifnienumber
- `.us`: nexusCategory
- `.de`: uritemplate

## Build & Test

### Commands

```bash
pnpm run build        # TSC ESM + CJS + declarations
pnpm run lint         # ESLint check
pnpm test             # Jest with coverage
pnpm run docs         # TypeDoc generation
```

### Quirks

- **Hybrid ESM/CJS build**: Uses `tsc-esm-fix`; CJS output gets `dist/cjs/package.json` with `type: commonjs`
- **Dual tsconfig**: `tsconfig.esm.json` + `tsconfig.cjs.json`
- **Strict mode**: `noImplicitAny`, `strictNullChecks`, `noUnusedLocals` enabled
- **Output**: TypeDoc in `docs/` directory (generated locally, ignored by git)

## Response Handler Pattern

All endpoints return `Responsemessage` wrapper:

```
{
  serverrequestid,
  clientrequestid (optional),
  action,
  status: "success" | "error" | "started" | "pending" | "warning",
  statuscode (e.g., 2000 = success),
  shortmessage,
  longmessage (optional),
  responsedata (nested object, varies by action)
}
```

**Throw on non-2xxx statuscode** (already in `api.ts` interceptor).

## Common Pitfalls to Avoid

### From netcup-node Code Review

1. **Parameter order in TS types** - match API docs exactly to avoid confusion
2. **Optional fields** - mark correctly (`?:`) vs required
3. **Nillable fields** - API docs specify min/max occurs; use for optionality
4. **Session expiry** - re-login after 15 min inactivity (implement auto-refresh if needed)
5. **UTF-8 encoding** - API requires UTF-8 input/output
6. **Punycode domains** - IDN domains must convert to Punycode before API call
7. **Array naming** - `nameserver1`, `nameserver2`, NOT `nameservers[0]`

## Reference Files

- **Types structure**: `netcup-node/src/@types/` - follow same pattern
- **API wrapper**: `netcup-node/src/api.ts` - extend for all reseller functions
- **Main class**: `netcup-node/src/index.ts` - add reseller methods below DNS methods
- **Test pattern**: `netcup-node/test/` - use same Jest + ts-jest setup
- **Actions enum**: `src/@types/Actions.ts` - keep action strings in sync with implemented methods
- **Requests/Responses**: `netcup-node/src/@types/Requests.ts` + `Responses.ts` - extend with all types

## Session Management Strategy

Current `NetcupApi` class stores auth state in-memory:

- Auto-refresh auth when the session is older than 14 minutes via `checkAndRefreshAuth()`
- Add reseller functions following same pattern (auth → restApi call → return)
- Consider: Extract common auth logic to avoid duplication

## Dangerous Operations (Explicit Enable Required)

### Operations Requiring Explicit Opt-In

Two functions have **irreversible consequences** and must be explicitly enabled per session:

- **`createDomain`** - charges account, registers domain at registry
- **`cancelDomain`** - initiates domain termination request (5-day confirmation period)

### Implementation Pattern

1. **Add flag to `NetcupApi` instance:**

   ```typescript
   private dangerousOperationsEnabled = false;
   ```

2. **Add enable method:**

   ```typescript
   public enableDangerousOperations(): void {
     // Print warning to console/log
     this.dangerousOperationsEnabled = true;
   }
   ```

3. **Guard dangerous methods:**

   ```typescript
   public async createDomain(params: CreateDomainParam): Promise<CreateDomainResponse> {
     if (!this.dangerousOperationsEnabled) {
       throw new Error('createDomain requires explicit enable. Call enableDangerousOperations() first.');
     }
     // proceed...
   }
   ```

4. **Document in JSDoc:**
   ```typescript
   /**
    * Register a new domain (DANGEROUS - charges account).
    * Requires explicit enable via enableDangerousOperations().
    * @throws Error if not explicitly enabled
    */
   public async createDomain(params: CreateDomainParam): Promise<CreateDomainResponse>
   ```

### Why This Matters

- Prevents accidental domain registrations (cost & commitment)
- Prevents accidental cancellation requests (5-day workflow)
- Developers must intentionally unlock these operations
- Single session flag (not per-call) prevents repeated checks

### Testing

- Unit tests should verify error thrown when not enabled
- Unit tests should verify success when enabled
- Do NOT test against real API with real domains

## Testing Notes

- Integration tests will require real Netcup API credentials (environment variables)
- Mock tests should validate JSON request/response structure
- Type safety benefits most from strict schema tests (not behavior tests)
