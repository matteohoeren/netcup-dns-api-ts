# Changelog

## 1.0.0

Initial release.

### Features

- Full TypeScript wrapper for Netcup CCP API (DNS + Reseller)
- 22 API methods mapping 1:1 to Netcup actions
- Hybrid ESM/CJS package with full type declarations
- Auto session refresh (14-minute interval)
- User-managed rate limiting for Netcup's `180 requests/minute` limit
- Dangerous operation guards (`createDomain`, `cancelDomain`)
- Convenience helpers: `updateDnsRecordWithCurrentIp`, `deleteDnsRecords`
- Structured error handling via `NetcupRequestError`
