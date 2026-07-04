import { ApiResponse } from './@types/Responses';

export interface NetcupErrorDetails {
  action: string;
  status: string;
  statuscode: number;
  shortmessage?: string;
  longmessage?: string;
  serverrequestid?: string;
  clientrequestid?: string;
}

export class NetcupRequestError extends Error {
  public readonly details: NetcupErrorDetails;
  public readonly response: ApiResponse;

  constructor(response: ApiResponse) {
    const action = response.action || 'unknown';
    const statuscode = response.statuscode;
    const short = response.shortmessage || 'Netcup API request failed';
    const long = response.longmessage || short;
    super(`[${action}:${statuscode}] ${short}: ${long}`);
    this.name = 'NetcupRequestError';
    this.response = response;
    this.details = {
      action,
      status: response.status,
      statuscode,
      shortmessage: response.shortmessage,
      longmessage: response.longmessage,
      serverrequestid: response.serverrequestid,
      clientrequestid: response.clientrequestid,
    };
  }
}

export interface FormatApiErrorOptions {
  context?: string;
}

function getStringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return null;
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Returns a human-readable error string for CLI/log usage.
 * Handles Netcup API errors, regular Error objects, and unknown throwables.
 */
export function formatApiError(error: unknown, options: FormatApiErrorOptions = {}): string {
  const lines: string[] = [];

  if (options.context) {
    lines.push(`${options.context}`);
  }

  if (error instanceof NetcupRequestError) {
    const detail = error.details;
    lines.push('Netcup API Error');
    lines.push(`- Message: ${detail.shortmessage || 'Request failed'}`);

    const long = getStringValue(detail.longmessage);
    if (long && long !== detail.shortmessage) {
      lines.push(`- Details: ${long}`);
    }

    lines.push(`- Action: ${detail.action}`);
    lines.push(`- Status: ${detail.status}`);
    lines.push(`- Status Code: ${detail.statuscode}`);

    const serverRequestId = getStringValue(detail.serverrequestid);
    if (serverRequestId) {
      lines.push(`- Server Request ID: ${serverRequestId}`);
    }

    const clientRequestId = getStringValue(detail.clientrequestid);
    if (clientRequestId) {
      lines.push(`- Client Request ID: ${clientRequestId}`);
    }

    return lines.join('\n');
  }

  if (error instanceof Error) {
    lines.push('Application Error');
    lines.push(`- Name: ${error.name}`);
    lines.push(`- Message: ${error.message}`);
    return lines.join('\n');
  }

  lines.push('Unknown Error');
  lines.push(`- Value: ${safeJsonStringify(error)}`);
  return lines.join('\n');
}

export function isNetcupApiResponse(value: unknown): value is ApiResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const v = value as Partial<ApiResponse>;
  return (
    typeof v.action === 'string' &&
    typeof v.status === 'string' &&
    typeof v.statuscode === 'number' &&
    typeof v.shortmessage === 'string' &&
    typeof v.longmessage === 'string'
  );
}
