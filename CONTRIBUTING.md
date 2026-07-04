# Contributing

Thanks for helping improve `netcup-dns-ts`.

This project aims to be a complete and strongly typed TypeScript wrapper for the Netcup CCP API (DNS + reseller operations). Please keep changes predictable, type-safe, and production-safe.

## Engineering Principles

- Keep API mappings explicit and close to Netcup action names.
- Prefer strict typing over convenience shortcuts (`any` is not accepted).
- Preserve backward compatibility for public exports from `src/index.ts`.
- Fail loudly on API errors (status code handling is centralized).
- Protect dangerous operations (`createDomain`, `cancelDomain`) behind explicit opt-in.

## Project Structure

- `src/index.ts`: high-level `NetcupApi` class, session lifecycle, convenience methods, dangerous-operation guards.
- `src/api.ts`: low-level transport client (`NetcupRestApi`), action-to-request mapping, response normalization.
- `src/@types/Actions.ts`: canonical Netcup action names.
- `src/@types/Requests.ts`: request wrappers and parameter types.
- `src/@types/Responses.ts`: response objects and domain model types.
- `src/errors.ts`: typed error wrapper (`NetcupRequestError`) and helpers.
- `src/constants.ts`, `src/utils.ts`: shared constants and utility helpers.
- `test/non-dangerous-api.spec.ts`: integration-style API coverage with environment-gated mutation tests.
- `docs/`: generated TypeDoc output (committed to repository).

## Local Setup

Prerequisites:

- Node.js `>=16`
- pnpm `>=10`

Install dependencies:

```bash
pnpm install
```

## Development Workflow

1. Create a feature branch.
2. Implement changes with strict typing.
3. Run quality checks locally.
4. Update documentation/examples where behavior changed.
5. Open a PR with clear scope and rationale.

Quality checks:

```bash
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
pnpm run docs
```

## How We Add or Change API Functions

When adding a Netcup endpoint:

1. Add action constant in `src/@types/Actions.ts`.
2. Add param and request wrapper types in `src/@types/Requests.ts`.
3. Add response/data model types in `src/@types/Responses.ts`.
4. Implement HTTP mapping in `src/api.ts` via `postJson`.
5. Expose high-level method in `src/index.ts` with auth refresh handling.
6. Add tests for success and error pathways.
7. Regenerate docs (`pnpm run docs`).

## Testing

Run all tests:

```bash
pnpm test
```

### Test suites

| Suite            | File                           | What it tests                                                              | Runs without credentials? |
| ---------------- | ------------------------------ | -------------------------------------------------------------------------- | ------------------------- |
| Response handler | `api-response-handler.spec.ts` | Axios interceptor: 2xxx pass-through, non-2xxx throws `NetcupRequestError` | Yes                       |
| Errors           | `errors.spec.ts`               | `isNetcupApiResponse` type guard, `formatApiError` formatting              | Yes                       |
| Normalizers      | `normalizers.spec.ts`          | 6 functions that coerce API string responses to proper TS types            | Yes                       |
| Integration      | `non-dangerous-api.spec.ts`    | Full API lifecycle against live Netcup (auth, DNS, domains, handles, poll) | No — skips                |

### Environment variables

Copy `.env.local.example` to `.env.local` and fill in your credentials:

| Variable                     | Required          | Purpose                                                                             |
| ---------------------------- | ----------------- | ----------------------------------------------------------------------------------- |
| `NETCUP_CUSTOMER_NUMBER`     | Yes (integration) | Your Netcup customer number                                                         |
| `NETCUP_API_KEY`             | Yes (integration) | API key from Netcup panel                                                           |
| `NETCUP_API_PASSWORD`        | Yes (integration) | API password from Netcup panel                                                      |
| `NETCUP_TEST_DOMAIN`         | No                | Domain to use for DNS tests (defaults to first domain in account)                   |
| `NETCUP_TEST_TLD`            | No                | TLD for pricing lookup (defaults to account's first TLD, then `de`)                 |
| `NETCUP_TEST_HANDLE_ID`      | No                | Existing handle ID for info/update tests (defaults to first handle)                 |
| `NETCUP_TEST_ALLOW_MUTATION` | No                | Set `true` to run create/update/delete tests (creates real handles and DNS records) |
| `NETCUP_TEST_ALLOW_ACKPOLL`  | No                | Set `true` to acknowledge poll messages (marks real messages as read)               |

### Guidelines

- Keep unit tests deterministic.
- Gate mutating integration tests via env flags — never run them in CI.
- Use invalid inputs for negative-path coverage.
- Never test `createDomain`/`cancelDomain` against the real API.

## Dangerous Operations Policy

`createDomain` and `cancelDomain` remain blocked unless the caller explicitly invokes:

```ts
api.enableDangerousOperations();
```

Do not remove this safeguard.

## Style and Conventions

- TypeScript strict mode must stay green.
- Keep public names aligned with Netcup API wording where feasible.
- Prefer small focused functions and explicit return types on exported APIs.
- Avoid introducing implicit side effects.
- Use Prettier defaults in this repository.

## Pull Request Checklist

- [ ] Type-safe changes with no `any` additions
- [ ] `pnpm run lint`, `pnpm run typecheck`, and `pnpm test` pass
- [ ] Build succeeds (`pnpm run build`)
- [ ] TypeDoc regenerated when public types or API surface changed
- [ ] README/usage examples updated if behavior changed
