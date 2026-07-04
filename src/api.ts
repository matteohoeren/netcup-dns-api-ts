import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { Actions } from './@types/Actions';
import { Formats } from './@types/Formats';
import {
  InfoDNSRecordsParam,
  InfoDNSRecordsRequest,
  InfoDNSZoneParam,
  InfoDNSZoneRequest,
  LoginParam,
  LoginRequest,
  LogoutParam,
  LogoutRequest,
  UpdateDNSRecordsParam,
  UpdateDNSRecordsRequest,
  UpdateDNSZoneParam,
  UpdateDNSZoneRequest,
  WithAuthentication,
  ListallDomainsParam,
  ListallDomainsRequest,
  InfoDomainParam,
  InfoDomainRequest,
  CreateDomainParam,
  CreateDomainRequest,
  UpdateDomainParam,
  UpdateDomainRequest,
  CancelDomainParam,
  CancelDomainRequest,
  TransferDomainParam,
  TransferDomainRequest,
  ChangeOwnerDomainParam,
  ChangeOwnerDomainRequest,
  GetAuthcodeDomainParam,
  GetAuthcodeDomainRequest,
  ListallHandleParam,
  ListallHandleRequest,
  InfoHandleParam,
  InfoHandleRequest,
  CreateHandleParam,
  CreateHandleRequest,
  UpdateHandleParam,
  UpdateHandleRequest,
  DeleteHandleParam,
  DeleteHandleRequest,
  PriceTopleveldomainParam,
  PriceTopleveldomainRequest,
  PollParam,
  PollRequest,
  AckpollParam,
  AckpollRequest,
} from './@types/Requests';
import {
  DnsRecord,
  DnsZone,
  InfoDNSRecordsResponse,
  InfoDNSZoneResponse,
  LoginResponse,
  UpdateDNSRecordsResponse,
  UpdateDNSZoneResponse,
  ListallDomainsResponse,
  InfoDomainResponse,
  CreateDomainResponse,
  UpdateDomainResponse,
  CancelDomainResponse,
  TransferDomainResponse,
  ChangeOwnerDomainResponse,
  GetAuthcodeDomainResponse,
  ListallHandleResponse,
  InfoHandleResponse,
  CreateHandleResponse,
  UpdateHandleResponse,
  DeleteHandleResponse,
  PriceTopleveldomainResponse,
  PollResponse,
  PollObject,
  DomainObject,
  HandleObject,
  AckpollResponse,
  TopleveldomainObject,
} from './@types/Responses';
import { isNetcupApiResponse, NetcupRequestError } from './errors';
import { getFormattedUrl } from './utils';

export function defaultResponseHandler(response: AxiosResponse) {
  if (response.data && !isSuccessfulNetcupStatusCode(response.data.statuscode)) {
    if (isNetcupApiResponse(response.data)) {
      throw new NetcupRequestError(response.data);
    }

    throw new Error('Netcup API request failed with unknown error payload.');
  }
  return response;
}

function isSuccessfulNetcupStatusCode(statuscode: unknown): boolean {
  if (typeof statuscode === 'number') {
    return statuscode >= 2000 && statuscode < 3000;
  }

  if (typeof statuscode === 'string' && statuscode.trim() !== '') {
    const parsed = Number(statuscode);
    return Number.isFinite(parsed) && parsed >= 2000 && parsed < 3000;
  }

  return false;
}

type RawTopleveldomainObject = Omit<TopleveldomainObject, 'runtimemonths'> & {
  runtimemonths?: number | string | null;
};

export function normalizeTopleveldomainObject(
  value: RawTopleveldomainObject
): TopleveldomainObject {
  const runtime = value.runtimemonths;
  if (typeof runtime === 'string') {
    const parsed = Number(runtime);
    return {
      ...value,
      runtimemonths: Number.isFinite(parsed) ? parsed : null,
    };
  }

  return {
    ...value,
    runtimemonths: runtime ?? null,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (lowered === 'true') return true;
    if (lowered === 'false') return false;
  }
  return Boolean(value);
}

export function normalizeDnsZone(zone: DnsZone): DnsZone {
  return {
    ...zone,
    ttl: toNumber(zone.ttl) ?? 0,
    serial: toNumber(zone.serial),
    refresh: toNumber(zone.refresh) ?? 0,
    retry: toNumber(zone.retry) ?? 0,
    expire: toNumber(zone.expire) ?? 0,
    dnssecstatus: toBoolean(zone.dnssecstatus),
  };
}

export function normalizeDnsRecord(record: DnsRecord): DnsRecord {
  return {
    ...record,
    id: toNumber(record.id),
    priority: toNumber(record.priority),
    deleterecord: toBoolean(record.deleterecord),
  };
}

export function normalizeDomainObject(domain: DomainObject): DomainObject {
  return {
    ...domain,
    customernumber: toNumber(domain.customernumber),
    ownerchangerunning: toBoolean(domain.ownerchangerunning),
    cancellationrunning: toBoolean(domain.cancellationrunning),
    runtimemonths: toNumber(domain.runtimemonths),
    priceperruntime: toNumber(domain.priceperruntime) ?? 0,
  };
}

export function normalizeHandleObject(handle: HandleObject): HandleObject {
  return {
    ...handle,
    id: toNumber(handle.id) ?? 0,
    assignedtodomain: toBoolean(handle.assignedtodomain),
  };
}

export function normalizePollObject(poll: PollObject): PollObject {
  return {
    ...poll,
    id: toNumber(poll.id) ?? 0,
    statuscode: toNumber(poll.statuscode) ?? 0,
  };
}

export default class NetcupRestApi {
  axios = axios.create();
  format: Formats = Formats.JSON;
  debug: boolean = false;

  constructor(format?: Formats, debug?: boolean) {
    if (format) {
      this.format = format;
    }
    if (debug !== undefined) {
      this.debug = debug;
    }

    this.axios.interceptors.response.use((response) => {
      if (this.debug && !isSuccessfulNetcupStatusCode(response.data?.statuscode)) {
        console.log('[netcup-api] API ERROR RESPONSE:', JSON.stringify(response.data, null, 2));
      }
      return defaultResponseHandler(response);
    });
  }

  protected async postJson<Req, Res>(
    url: string,
    data: Req,
    options?: AxiosRequestConfig
  ): Promise<Res> {
    if (this.debug) {
      const sanitized = JSON.parse(JSON.stringify(data));
      // Mask sensitive fields
      if (sanitized && typeof sanitized === 'object' && 'param' in sanitized) {
        const p = sanitized.param as Record<string, unknown>;
        if (p.apipassword) p.apipassword = '***';
        if (p.apisessionid) p.apisessionid = p.apisessionid.toString().slice(0, 8) + '***';
      }
      console.log('[netcup-api] REQUEST:', JSON.stringify(sanitized, null, 2));
    }

    try {
      const res = await this.axios.post(url, data, {
        ...options,
        responseType: 'json',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...options?.headers,
        },
      });

      if (this.debug) {
        console.log('[netcup-api] RESPONSE:', JSON.stringify(res.data, null, 2));
      }

      return res.data;
    } catch (err: unknown) {
      const maybeResponse =
        typeof err === 'object' && err !== null
          ? (err as { response?: { data?: unknown } }).response
          : null;
      const apiErrorPayload = maybeResponse?.data;
      const wrappedError = isNetcupApiResponse(apiErrorPayload)
        ? new NetcupRequestError(apiErrorPayload)
        : err;

      if (this.debug && maybeResponse?.data) {
        console.log('[netcup-api] ERROR RESPONSE:', JSON.stringify(maybeResponse.data, null, 2));
      }

      throw wrappedError;
    }
  }

  // Session Management
  public login(params: LoginParam): Promise<LoginResponse> {
    return this.postJson<LoginRequest, LoginResponse>(getFormattedUrl(this.format), {
      action: Actions.login,
      param: {
        ...params,
      },
    });
  }

  public logout(params: WithAuthentication<LogoutParam>) {
    return this.postJson<LogoutRequest, LoginResponse>(getFormattedUrl(this.format), {
      action: Actions.logout,
      param: {
        ...params,
      },
    });
  }

  // DNS Functions
  public infoDnsZone(params: WithAuthentication<InfoDNSZoneParam>) {
    return this.postJson<InfoDNSZoneRequest, InfoDNSZoneResponse>(getFormattedUrl(this.format), {
      action: Actions.infoDnsZone,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: normalizeDnsZone(response.responsedata),
    }));
  }

  public infoDnsRecords(params: WithAuthentication<InfoDNSRecordsParam>) {
    return this.postJson<InfoDNSRecordsRequest, InfoDNSRecordsResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.infoDnsRecords,
        param: {
          ...params,
        },
      }
    ).then((response) => ({
      ...response,
      responsedata: {
        ...response.responsedata,
        dnsrecords: response.responsedata.dnsrecords.map(normalizeDnsRecord),
      },
    }));
  }

  public updateDnsRecords(params: WithAuthentication<UpdateDNSRecordsParam>) {
    return this.postJson<UpdateDNSRecordsRequest, UpdateDNSRecordsResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.updateDnsRecords,
        param: {
          ...params,
        },
      }
    ).then((response) => ({
      ...response,
      responsedata: {
        ...response.responsedata,
        dnsrecords: response.responsedata.dnsrecords.map(normalizeDnsRecord),
      },
    }));
  }

  public updateDnsZone(params: WithAuthentication<UpdateDNSZoneParam>) {
    return this.postJson<UpdateDNSZoneRequest, UpdateDNSZoneResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.updateDnsZone,
        param: {
          ...params,
        },
      }
    ).then((response) => ({
      ...response,
      responsedata: normalizeDnsZone(response.responsedata),
    }));
  }

  // Reseller Domain Functions
  public listallDomains(params: WithAuthentication<ListallDomainsParam>) {
    return this.postJson<ListallDomainsRequest, ListallDomainsResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.listallDomains,
        param: {
          ...params,
        },
      }
    ).then((response) => ({
      ...response,
      responsedata: response.responsedata.map(normalizeDomainObject),
    }));
  }

  public infoDomain(params: WithAuthentication<InfoDomainParam>) {
    return this.postJson<InfoDomainRequest, InfoDomainResponse>(getFormattedUrl(this.format), {
      action: Actions.infoDomain,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: normalizeDomainObject(response.responsedata),
    }));
  }

  public createDomain(params: WithAuthentication<CreateDomainParam>) {
    return this.postJson<CreateDomainRequest, CreateDomainResponse>(getFormattedUrl(this.format), {
      action: Actions.createDomain,
      param: {
        ...params,
      },
    });
  }

  public updateDomain(params: WithAuthentication<UpdateDomainParam>) {
    return this.postJson<UpdateDomainRequest, UpdateDomainResponse>(getFormattedUrl(this.format), {
      action: Actions.updateDomain,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: normalizeDomainObject(response.responsedata),
    }));
  }

  public cancelDomain(params: WithAuthentication<CancelDomainParam>) {
    return this.postJson<CancelDomainRequest, CancelDomainResponse>(getFormattedUrl(this.format), {
      action: Actions.cancelDomain,
      param: {
        ...params,
      },
    });
  }

  public transferDomain(params: WithAuthentication<TransferDomainParam>) {
    return this.postJson<TransferDomainRequest, TransferDomainResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.transferDomain,
        param: {
          ...params,
        },
      }
    );
  }

  public changeOwnerDomain(params: WithAuthentication<ChangeOwnerDomainParam>) {
    return this.postJson<ChangeOwnerDomainRequest, ChangeOwnerDomainResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.changeOwnerDomain,
        param: {
          ...params,
        },
      }
    );
  }

  public getAuthcodeDomain(params: WithAuthentication<GetAuthcodeDomainParam>) {
    return this.postJson<GetAuthcodeDomainRequest, GetAuthcodeDomainResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.getAuthcodeDomain,
        param: {
          ...params,
        },
      }
    );
  }

  // Reseller Handle Functions
  public listallHandle(params: WithAuthentication<ListallHandleParam>) {
    return this.postJson<ListallHandleRequest, ListallHandleResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.listallHandle,
        param: {
          ...params,
        },
      }
    ).then((response) => ({
      ...response,
      responsedata: response.responsedata.map(normalizeHandleObject),
    }));
  }

  public infoHandle(params: WithAuthentication<InfoHandleParam>) {
    return this.postJson<InfoHandleRequest, InfoHandleResponse>(getFormattedUrl(this.format), {
      action: Actions.infoHandle,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: normalizeHandleObject(response.responsedata),
    }));
  }

  public createHandle(params: WithAuthentication<CreateHandleParam>) {
    return this.postJson<CreateHandleRequest, CreateHandleResponse>(getFormattedUrl(this.format), {
      action: Actions.createHandle,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: normalizeHandleObject(response.responsedata),
    }));
  }

  public updateHandle(params: WithAuthentication<UpdateHandleParam>) {
    return this.postJson<UpdateHandleRequest, UpdateHandleResponse>(getFormattedUrl(this.format), {
      action: Actions.updateHandle,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: normalizeHandleObject(response.responsedata),
    }));
  }

  public deleteHandle(params: WithAuthentication<DeleteHandleParam>) {
    return this.postJson<DeleteHandleRequest, DeleteHandleResponse>(getFormattedUrl(this.format), {
      action: Actions.deleteHandle,
      param: {
        ...params,
      },
    });
  }

  // Utility Functions
  public priceTopleveldomain(params: WithAuthentication<PriceTopleveldomainParam>) {
    return this.postJson<PriceTopleveldomainRequest, PriceTopleveldomainResponse>(
      getFormattedUrl(this.format),
      {
        action: Actions.priceTopleveldomain,
        param: {
          ...params,
        },
      }
    ).then((response) => ({
      ...response,
      responsedata: normalizeTopleveldomainObject(response.responsedata),
    }));
  }

  public poll(params: WithAuthentication<PollParam>) {
    return this.postJson<PollRequest, PollResponse>(getFormattedUrl(this.format), {
      action: Actions.poll,
      param: {
        ...params,
      },
    }).then((response) => ({
      ...response,
      responsedata: response.responsedata?.map(normalizePollObject) ?? null,
    }));
  }

  public ackpoll(params: WithAuthentication<AckpollParam>) {
    return this.postJson<AckpollRequest, AckpollResponse>(getFormattedUrl(this.format), {
      action: Actions.ackpoll,
      param: {
        ...params,
      },
    });
  }
}
