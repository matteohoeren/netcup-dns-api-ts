import { Formats } from './@types/Formats';
import { InitParams } from './@types/InitParams';
import { NetcupAuth } from './@types/NetcupAuth';
import {
  InfoDNSRecordsParam,
  InfoDNSZoneParam,
  UpdateDNSRecordsParam,
  UpdateDnsRecordWithCurrentIpParams,
  DeleteDnsRecordsParam,
  ListallDomainsParam,
  InfoDomainParam,
  CreateDomainParam,
  UpdateDomainParam,
  CancelDomainParam,
  TransferDomainParam,
  ChangeOwnerDomainParam,
  GetAuthcodeDomainParam,
  ListallHandleParam,
  InfoHandleParam,
  CreateHandleParam,
  UpdateHandleParam,
  DeleteHandleParam,
  PriceTopleveldomainParam,
  PollParam,
  AckpollParam,
  UpdateDNSZoneParam,
  LogoutParam,
  WithAuthentication,
} from './@types/Requests';
import {
  DnsRecord,
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
  AckpollResponse,
} from './@types/Responses';
import { get } from 'node:https';
import { isIP } from 'node:net';
import NetcupRestApi, {
  normalizeDnsZone,
  normalizeDnsRecord,
  normalizeDomainObject,
  normalizeHandleObject,
  normalizePollObject,
  normalizeTopleveldomainObject,
} from './api';
import { INVALID_FORMAT_ERROR, NOT_INITIALIZED_ERROR } from './constants';

class NetcupApi {
  private authData: NetcupAuth = {
    apiKey: '',
    apiPassword: '',
    customerNumber: '',
    apiSessionId: '',
  };
  public readonly restApi: NetcupRestApi = new NetcupRestApi();
  private dangerousOperationsEnabled = false;
  private readonly sessionRefreshIntervalMs = 14 * 60 * 1000;
  private lastAuthRefreshAt = 0;
  private refreshAuthPromise: Promise<void> | null = null;

  /**
   * Enable verbose request/response logging (masks sensitive fields).
   */
  public enableDebugLogging(): void {
    this.restApi.debug = true;
  }

  /**
   * Disable verbose request/response logging.
   */
  public disableDebugLogging(): void {
    this.restApi.debug = false;
  }

  private async checkAndRefreshAuth() {
    if (
      this.authData.apiKey === '' ||
      this.authData.apiPassword === '' ||
      this.authData.customerNumber === ''
    ) {
      throw new Error(NOT_INITIALIZED_ERROR);
    }

    const shouldRefresh =
      this.authData.apiSessionId === '' ||
      Date.now() - this.lastAuthRefreshAt >= this.sessionRefreshIntervalMs;

    if (!shouldRefresh) {
      return;
    }

    if (!this.refreshAuthPromise) {
      this.refreshAuthPromise = this.refreshSession().finally(() => {
        this.refreshAuthPromise = null;
      });
    }

    await this.refreshAuthPromise;
  }

  private async refreshSession(): Promise<void> {
    const res: LoginResponse = await this.restApi.login({
      apikey: this.authData.apiKey,
      apipassword: this.authData.apiPassword,
      customernumber: this.authData.customerNumber,
    });
    this.authData.apiSessionId = res.responsedata.apisessionid;
    this.lastAuthRefreshAt = Date.now();
  }

  /**
   * Initializes authentication parameters
   */
  public async init(params: InitParams): Promise<NetcupApi> {
    if (params.format && !Object.values(Formats).includes(params.format)) {
      throw new Error(INVALID_FORMAT_ERROR);
    }
    this.restApi.format = params.format || Formats.JSON;
    this.authData.apiKey = params.apikey;
    this.authData.apiPassword = params.apipassword;
    this.authData.customerNumber = params.customernumber;
    await this.refreshSession();
    return this;
  }

  /**
   * Enables dangerous operations (createDomain, cancelDomain).
   * These operations have irreversible consequences and must be explicitly enabled.
   * @remarks Warning: This action has security implications. Only enable when explicitly needed.
   */
  public enableDangerousOperations(): void {
    console.warn(
      'WARNING: Dangerous operations are now enabled. ' +
        'createDomain charges your account and registers domains. ' +
        'cancelDomain initiates domain termination.'
    );
    this.dangerousOperationsEnabled = true;
  }

  // Session Management
  /**
   * Logout from the Netcup API
   */
  public async logout(): Promise<LoginResponse> {
    await this.checkAndRefreshAuth();
    const response = await this.restApi.logout({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
    } as WithAuthentication<LogoutParam>);
    this.authData.apiSessionId = '';
    this.lastAuthRefreshAt = 0;
    return response;
  }

  // DNS Functions
  /**
   * Returns information about the DNS zone of a domain
   * @example await api.infoDnsZone({ domainname: 'example.com' })
   */
  public async infoDnsZone(params: InfoDNSZoneParam): Promise<InfoDNSZoneResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.infoDnsZone({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Returns information about the DNS records of a domain
   * @example await api.infoDnsRecords({ domainname: 'example.com' })
   */
  public async infoDnsRecords(params: InfoDNSRecordsParam): Promise<InfoDNSRecordsResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.infoDnsRecords({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Updates DNS records of a domain and only those that are specified.
   * @example
   *  await api.updateDnsRecords({
          domainname: 'example.com',
          dnsrecordset: {
            dnsrecords: [{ hostname: 'www', type: 'A', destination: 'some-ip' }],
          },
        })
   * @example
   * // can also be used to delete records
   * await api.updateDnsRecords({
        domainname: 'example.com',
        dnsrecordset: {
          dnsrecords: [
            { hostname: 'www', type: 'A', destination: 'some-ip', deleterecord: true },
          ],
        },
      })
   */
  public async updateDnsRecords(params: UpdateDNSRecordsParam): Promise<UpdateDNSRecordsResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.updateDnsRecords({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Updates the DNS zone of a domain
   */
  public async updateDnsZone(params: UpdateDNSZoneParam): Promise<UpdateDNSZoneResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.updateDnsZone({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  private async resolvePublicIp(version: 4 | 6): Promise<string> {
    const endpoint = version === 4 ? 'https://api.ipify.org' : 'https://api6.ipify.org';

    return new Promise<string>((resolve, reject) => {
      const request = get(
        endpoint,
        {
          headers: { Accept: 'text/plain' },
        },
        (response) => {
          const statusCode = response.statusCode ?? 0;
          if (statusCode < 200 || statusCode >= 300) {
            response.resume();
            reject(new Error(`Failed to resolve public IPv${version}: HTTP ${statusCode}`));
            return;
          }

          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk: string) => {
            body += chunk;
          });
          response.on('end', () => {
            const ip = body.trim();
            if (isIP(ip) !== version) {
              reject(new Error(`Failed to resolve public IPv${version}: invalid response`));
              return;
            }
            resolve(ip);
          });
        }
      );

      request.setTimeout(10000, () => {
        request.destroy(new Error(`Failed to resolve public IPv${version}: request timeout`));
      });

      request.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Updates DNS records of a domain with the current public ip.
   * @example
   * // update ipv4 only
   * await api.updateDnsRecordsWithCurrentIp({
       domainname: 'example.com',
       hostname: 'www',
     })
   * @example
   *  // update ipv4 and ipv6
   *  await api.updateDnsRecordsWithCurrentIp({
       domainname: 'example.com',
       hostname: 'www',
       useIpv4AndIpv6: true,
     })
   * @example
   * // update ipv6 only
   * await api.updateDnsRecordsWithCurrentIp({
       domainname: 'example.com',
       hostname: 'www',
       useIpv6Only: true,
     })
   */
  public async updateDnsRecordWithCurrentIp(
    params: UpdateDnsRecordWithCurrentIpParams
  ): Promise<UpdateDNSRecordsResponse> {
    if (params.useIpv6Only) {
      const ipv6 = await this.resolvePublicIp(6);
      const ipv6Record: DnsRecord = {
        type: 'AAAA',
        hostname: params.hostname,
        destination: ipv6,
      };
      return this.updateDnsRecords({
        domainname: params.domainname,
        dnsrecordset: { dnsrecords: [ipv6Record] },
      });
    }

    const ipv4 = await this.resolvePublicIp(4);
    const ipv4Record: DnsRecord = {
      type: 'A',
      hostname: params.hostname,
      destination: ipv4,
    };

    if (params.useIpv4AndIpv6) {
      const ipv6 = await this.resolvePublicIp(6);
      const ipv6Record: DnsRecord = {
        type: 'AAAA',
        hostname: params.hostname,
        destination: ipv6,
      };
      return this.updateDnsRecords({
        domainname: params.domainname,
        dnsrecordset: { dnsrecords: [ipv4Record, ipv6Record] },
      });
    }

    return this.updateDnsRecords({
      dnsrecordset: { dnsrecords: [ipv4Record] },
      domainname: params.domainname,
    });
  }

  /**
   * Deletes DNS records by id or by filter criteria.
   *
   * This method first fetches current records and then sends an
   * `updateDnsRecords` call with `deleterecord: true` for the selected records.
   *
   * Netcup reliably applies deletion when the record `id` is included; therefore
   * this helper always forwards `id` from existing records.
   * It avoids common pitfalls when deleting records manually.
   */
  public async deleteDnsRecords(params: DeleteDnsRecordsParam): Promise<UpdateDNSRecordsResponse> {
    const recordsResponse = await this.infoDnsRecords({
      domainname: params.domainname,
    });

    const normalizeHostname = (input: string): string => {
      const trimmed = input.trim();
      const suffix = `.${params.domainname}`;
      if (trimmed.toLowerCase().endsWith(suffix.toLowerCase())) {
        return trimmed.slice(0, -suffix.length);
      }
      return trimmed;
    };

    const idSet =
      params.ids === undefined
        ? null
        : new Set(Array.isArray(params.ids) ? params.ids : [params.ids]);

    const filtered = recordsResponse.responsedata.dnsrecords.filter((record) => {
      if (idSet && !idSet.has(record.id ?? -1)) {
        return false;
      }
      if (
        params.hostname &&
        normalizeHostname(record.hostname) !== normalizeHostname(params.hostname)
      ) {
        return false;
      }
      if (params.type && record.type !== params.type) {
        return false;
      }
      if (params.destination && record.destination !== params.destination) {
        return false;
      }
      if (params.priority !== undefined && record.priority !== params.priority) {
        return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      throw new Error('No DNS records matched the delete criteria.');
    }

    const toDelete = params.allMatches ? filtered : [filtered[0]];

    return this.updateDnsRecords({
      domainname: params.domainname,
      dnsrecordset: {
        dnsrecords: toDelete.map((record) => ({
          id: record.id ?? undefined,
          hostname: record.hostname,
          type: record.type,
          destination: record.destination,
          priority: record.priority ?? undefined,
          deleterecord: true,
        })),
      },
    });
  }

  // Reseller Domain Functions
  /**
   * Lists all domains of the account
   */
  public async listallDomains(params?: ListallDomainsParam): Promise<ListallDomainsResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.listallDomains({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Returns detailed information about a domain
   */
  public async infoDomain(params: InfoDomainParam): Promise<InfoDomainResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.infoDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Registers a new domain
   * @remarks Warning: This operation CHARGES your account and registers a domain at the registry.
   * Requires explicit enable via enableDangerousOperations() first.
   * @throws Error if dangerous operations are not enabled
   */
  public async createDomain(params: CreateDomainParam): Promise<CreateDomainResponse> {
    if (!this.dangerousOperationsEnabled) {
      throw new Error(
        'createDomain requires explicit enable. Call enableDangerousOperations() first.'
      );
    }
    if (!params.nameservers) {
      throw new Error(
        'createDomain requires nameservers. You must provide your own authoritative nameservers.'
      );
    }
    await this.checkAndRefreshAuth();
    return this.restApi.createDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Updates domain contact information and nameservers
   */
  public async updateDomain(params: UpdateDomainParam): Promise<UpdateDomainResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.updateDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Initiates domain cancellation
   * @remarks Warning: This operation initiates a domain termination request (5-day confirmation period).
   * Requires explicit enable via enableDangerousOperations() first.
   * @throws Error if dangerous operations are not enabled
   */
  public async cancelDomain(params: CancelDomainParam): Promise<CancelDomainResponse> {
    if (!this.dangerousOperationsEnabled) {
      throw new Error(
        'cancelDomain requires explicit enable. Call enableDangerousOperations() first.'
      );
    }
    await this.checkAndRefreshAuth();
    return this.restApi.cancelDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Initiates incoming domain transfer
   */
  public async transferDomain(params: TransferDomainParam): Promise<TransferDomainResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.transferDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Changes the domain owner (requires 5-day confirmation)
   */
  public async changeOwnerDomain(
    params: ChangeOwnerDomainParam
  ): Promise<ChangeOwnerDomainResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.changeOwnerDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Retrieves the authorization code for domain transfer
   */
  public async getAuthcodeDomain(
    params: GetAuthcodeDomainParam
  ): Promise<GetAuthcodeDomainResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.getAuthcodeDomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  // Reseller Handle Functions
  /**
   * Lists all contact handles
   */
  public async listallHandle(params?: ListallHandleParam): Promise<ListallHandleResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.listallHandle({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Returns detailed information about a contact handle
   */
  public async infoHandle(params: InfoHandleParam): Promise<InfoHandleResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.infoHandle({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Creates a new contact handle
   */
  public async createHandle(params: CreateHandleParam): Promise<CreateHandleResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.createHandle({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  /**
   * Updates an existing contact handle
   */
  public async updateHandle(params: UpdateHandleParam): Promise<UpdateHandleResponse> {
    await this.checkAndRefreshAuth();

    const currentHandle = (await this.infoHandle({ handle_id: params.handle_id })).responsedata;
    const mergedParams: UpdateHandleParam = {
      handle_id: params.handle_id,
      type: params.type ?? currentHandle.type,
      name: params.name ?? currentHandle.name,
      organisation: params.organisation ?? currentHandle.organisation ?? undefined,
      street: params.street ?? currentHandle.street,
      city: params.city ?? currentHandle.city,
      postalcode: params.postalcode ?? currentHandle.postalcode,
      countrycode: params.countrycode ?? currentHandle.countrycode,
      telephone: params.telephone ?? currentHandle.telephone,
      email: params.email ?? currentHandle.email,
      optionalhandleattributes:
        params.optionalhandleattributes ?? currentHandle.optionalhandleattributes ?? undefined,
    };

    return this.restApi.updateHandle({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...mergedParams,
    });
  }

  /**
   * Deletes a contact handle
   */
  public async deleteHandle(params: DeleteHandleParam): Promise<DeleteHandleResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.deleteHandle({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  // Utility Functions
  /**
   * Retrieves pricing information for top-level domains
   */
  public async priceTopleveldomain(
    params: PriceTopleveldomainParam
  ): Promise<PriceTopleveldomainResponse> {
    await this.checkAndRefreshAuth();
    const normalizedTld = params.topleveldomain.replace(/^\./, '');
    return this.restApi.priceTopleveldomain({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
      topleveldomain: normalizedTld,
    });
  }

  /**
   * Retrieves unread poll messages for asynchronous operations
   */
  public async poll(params?: PollParam): Promise<PollResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.poll({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      messagecount: 10, // default; API requires positiveInteger (≥1)
      ...params,
    });
  }

  /**
   * Marks a poll message as read
   */
  public async ackpoll(params: AckpollParam): Promise<AckpollResponse> {
    await this.checkAndRefreshAuth();
    return this.restApi.ackpoll({
      apisessionid: this.authData.apiSessionId,
      customernumber: this.authData.customerNumber,
      apikey: this.authData.apiKey,
      ...params,
    });
  }

  public getAuthData(): NetcupAuth {
    return this.authData;
  }
}

export * from './@types';
export * from './errors';
export {
  NetcupRestApi,
  NetcupApi,
  normalizeDnsZone,
  normalizeDnsRecord,
  normalizeDomainObject,
  normalizeHandleObject,
  normalizePollObject,
  normalizeTopleveldomainObject,
};

export default NetcupApi;
