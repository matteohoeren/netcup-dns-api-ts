# Netcup API Status / Error Codes

This file collects status codes that are currently known in this project.

Netcup groups response codes similarly to HTTP classes:

- `2xxx`: success-class responses
- `4xxx`: customer/request-side errors
- `5xxx`: server/processing-side errors

> Note: This is a living list based on official Netcup docs and observed responses.

## Known codes

| Code   | Class                   | Meaning                                                                                                                                                                                                                                                                                    | Typical handling                                                                                                                                                     |
| ------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `2000` | Success                 | Request completed successfully.                                                                                                                                                                                                                                                            | Treat as success.                                                                                                                                                    |
| `2002` | Success/Pending         | Operation accepted and pending (for example domain creation still waiting for registry confirmation).                                                                                                                                                                                      | Do **not** throw; use `poll` to retrieve final result.                                                                                                               |
| `4001` | Client error            | Session ID invalid format / expired session behavior seen in the wild.                                                                                                                                                                                                                     | Re-authenticate (`login`) and retry request once.                                                                                                                    |
| `4003` | Client error            | API Key invalid                                                                                                                                                                                                                                                                            |
| `4013` | Client error            | Validation error. **Misleading message:** says "Customer account not found. JSON decode failed while validating request." but actually fires when the API key or password is wrong (customer number may be correct). Also used for rate-limiting (`More than 180 requests per minute...`). | Verify API key + password first; if credentials are confirmed correct, throttle requests in your application to stay under `180 requests/minute`.                    |
| `5006` | Server/processing error | Polling failed. No messages found for this user.                                                                                                                                                                                                                                           | Not an error — means there are no unread poll messages.                                                                                                              |
| `5014` | Server/processing error | Handle deletion failed. The handle may still be assigned to one or more domains.                                                                                                                                                                                                           | Verify the handle is not referenced by any domain's contacts before retrying.                                                                                        |
| `5016` | Server/processing error | Handle/contact creation failed with generic invalid-input semantics. It can indicate UTF-8 encoding issues (`Invalid inputs. All Inputs must be UTF-8 encoded.`) and can also surface when a single handle field is malformed.                                                             | Validate every submitted field (email, telephone, countrycode, length-limited fields, optional attribute enums/formats) and ensure UTF-8-safe payload serialization. |
| `5017` | Server/processing error | Generic `createDomain` failure. Seen for nameserver validation errors (nameserver not yet authoritative) and when the domain is already registered/taken.                                                                                                                                  | Inspect `longmessage` for the exact cause; either fix nameserver delegation or choose/check a different domain before retry.                                         |
| `5022` | Server/processing error | `createDomain` order failure. Similar to `5017`.                                                                                                                                                                                                                                           | Inspect `longmessage` for specifics.                                                                                                                                 |
| `5031` | Server/processing error | Getting DNS zone failed. Domain may not exist in the account, may not be DNS-enabled, or the customer number may be incorrect.                                                                                                                                                             | Verify the domain exists in your Netcup account and has DNS service enabled. Check `longmessage` for specifics.                                                      |

## Related status strings

The API also returns a status string (separate from `statuscode`):

- `success`
- `pending`
- `started`
- `warning`
- `error`

## Project behavior

- The library treats all `2xxx` response codes as non-error responses.
- The library throws `NetcupRequestError` for non-`2xxx` codes.
