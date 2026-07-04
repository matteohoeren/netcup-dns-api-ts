import { Actions } from './Actions';
import { OptionalHandleAttribute } from './Requests';

export type ContactHandleReference = string | number | null;

export interface DomainContactentries {
  ownerc?: ContactHandleReference;
  adminc?: ContactHandleReference;
  techc?: ContactHandleReference;
  zonec?: ContactHandleReference;
  billingc?: ContactHandleReference;
  onsitec?: ContactHandleReference;
  generalrequest?: ContactHandleReference;
  abusecontact?: ContactHandleReference;
}

export interface NameserverEntryObject {
  hostname: string;
  ipv4?: string;
  ipv6?: string;
}

export interface NameserverEntriesObject {
  nameserver1?: NameserverEntryObject;
  nameserver2?: NameserverEntryObject;
  nameserver3?: NameserverEntryObject;
  nameserver4?: NameserverEntryObject;
  nameserver5?: NameserverEntryObject;
  nameserver6?: NameserverEntryObject;
  nameserver7?: NameserverEntryObject;
  nameserver8?: NameserverEntryObject;
}

export interface ApiResponse {
  serverrequestid: string;
  clientrequestid: string;
  action: string;
  status: string;
  statuscode: number;
  shortmessage: string;
  longmessage: string;
  responsedata: unknown;
}

export interface LoginResponse extends ApiResponse {
  action: Actions.login;
  responsedata: LoginResponsedata;
}

export interface LoginResponsedata {
  apisessionid: string;
}

export interface InfoDNSZoneResponse extends ApiResponse {
  action: Actions.infoDnsZone;
  responsedata: InfoDNSZoneResponseData;
}

export interface InfoDNSZoneResponseData {
  /** Domain name of the DNS zone. */
  name: string;
  /**
   * Time-to-live in seconds.
   * Controls how long resolvers may cache this zone before re-querying authoritative nameservers.
   */
  ttl: number;
  /**
   * Zone serial number.
   * Used by secondary nameservers to detect zone changes (read-only from API perspective).
   */
  serial: number | null;
  /**
   * Refresh interval in seconds.
   * How often secondary nameservers check the primary nameserver for zone updates.
   */
  refresh: number;
  /**
   * Retry interval in seconds.
   * Delay before a secondary nameserver retries after a failed refresh attempt.
   */
  retry: number;
  /**
   * Expire interval in seconds.
   * Maximum time a secondary nameserver serves zone data without successful refresh.
   */
  expire: number;
  /**
   * DNSSEC enablement state on this nameserver.
   * DNSSEC activation/deactivation may be limited by provider timing constraints.
   */
  dnssecstatus: boolean;
}

export interface InfoDNSRecordsResponse extends ApiResponse {
  action: Actions.infoDnsRecords;
  responsedata: InfoDNSRecordsResponseData;
}

export interface InfoDNSRecordsResponseData {
  dnsrecords: DnsRecord[];
}

/** Supported DNS record types in Netcup CCP API. */
export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'MX'
  | 'CNAME'
  | 'NS'
  | 'TXT'
  | 'SOA'
  | 'SRV'
  | 'PTR'
  | 'CAA'
  | 'TLSA'
  | 'SSHFP'
  | 'NAPTR'
  | 'SPF'
  | (string & {});

export type DnsRecordState = 'yes' | 'no' | (string & {});

export interface DnsRecord {
  /** Internal Netcup record ID. */
  id?: number | null;
  /**
   * The name of the DNS record. If the record is a subdomain, the name is the subdomain name.
   * @example "www"
   */
  hostname: string;
  /**
   * The type of the DNS record.
   * @example "A"
   * @example "AAAA"
   */
  type: DnsRecordType;
  /** Priority for record types like MX/SRV. */
  priority?: number | null;
  /**
   * The destination of the DNS record. For A and AAAA records, this is the IP address.
   * @example "192.168.178.1"
   * @example "2000::1"
   */
  destination: string;
  /**
   * Indicates whether the DNS record should be deleted.
   */
  deleterecord?: boolean;
  /** Activation state returned by API, usually `yes` or `no`. */
  state?: DnsRecordState;
}

export interface UpdateDNSRecordsResponse extends ApiResponse {
  action: Actions.updateDnsRecords;
  responsedata: UpdateDNSRecordsResponseData;
}

export interface UpdateDNSRecordsResponseData {
  dnsrecords: DnsRecord[];
}

// DNS Zone Update Response
export interface UpdateDNSZoneResponse extends ApiResponse {
  action: Actions.updateDnsZone;
  responsedata: DnsZone;
}

export interface DnsZone {
  /** Domain name of the DNS zone. */
  name: string;
  /**
   * Time-to-live in seconds.
   * Controls how long resolvers may cache this zone before re-querying authoritative nameservers.
   */
  ttl: number;
  /**
   * Zone serial number.
   * Used by secondary nameservers to detect zone changes (read-only from API perspective).
   */
  serial: number | null;
  /**
   * Refresh interval in seconds.
   * How often secondary nameservers check the primary nameserver for zone updates.
   */
  refresh: number;
  /**
   * Retry interval in seconds.
   * Delay before a secondary nameserver retries after a failed refresh attempt.
   */
  retry: number;
  /**
   * Expire interval in seconds.
   * Maximum time a secondary nameserver serves zone data without successful refresh.
   */
  expire: number;
  /**
   * DNSSEC enablement state on this nameserver.
   * DNSSEC activation/deactivation may be limited by provider timing constraints.
   */
  dnssecstatus: boolean;
}

// Reseller Domain Responses
export interface ListallDomainsResponse extends ApiResponse {
  action: Actions.listallDomains;
  responsedata: DomainObject[];
}

export interface DomainObject {
  /** Name of the domain. */
  domainname?: string | null;
  /** Nameserver configuration for domain (structured entries or provider marker). */
  nameserverentry?: NameserverEntriesObject | string | null;
  /** Customer number. */
  customernumber?: number | null;
  /** Contact handle IDs for each role. */
  assignedcontacts?: DomainContactentries | null;
  /** TRUE when owner change is pending confirmation. */
  ownerchangerunning: boolean;
  /** TRUE when cancellation is pending confirmation. */
  cancellationrunning: boolean;
  /** Next billing date (YYYY-MM-DD). */
  nextbilling?: string | null;
  /** Runtime in months. */
  runtimemonths?: number | null;
  /** Last registry update date. */
  lastupdate?: string | null;
  /** Domain creation date at registry. */
  domaincreated?: string | null;
  /** Deletion date at registry. */
  deletiondate?: string | null;
  /** AuthInfo code. */
  authcode?: string | null;
  /** Domain state: "inclusive" or "additional". */
  state?: string | null;
  /** Domain status text returned by API (e.g. "additional domain"). */
  status?: string | null;
  /** Registry handle names for each contact type. */
  registrycontacts?: DomainContactentries | null;
  /** Price for next billing. */
  priceperruntime: number;
  /** DNSSEC type: "unknown", "digest", "publickey" or "unavailable". */
  dnssectype?: string | null;
  /** DNSSEC entries array; shape may vary by provider and DNSSEC type. */
  dnssecentries?: Array<Record<string, unknown>>;
}

export type RegistryContacts = DomainContactentries;

export interface InfoDomainResponse extends ApiResponse {
  action: Actions.infoDomain;
  responsedata: DomainObject;
}

export interface CreateDomainResponse extends ApiResponse {
  action: Actions.createDomain;
  responsedata: CreateDomainResponseData;
}

export interface CreateDomainResponseData {
  domain: string;
  domainextension: string;
  orderid: string;
}

export interface UpdateDomainResponse extends ApiResponse {
  action: Actions.updateDomain;
  responsedata: DomainObject;
}

export interface CancelDomainResponse extends ApiResponse {
  action: Actions.cancelDomain;
  responsedata: { cancellationrequestid: string };
}

export interface TransferDomainResponse extends ApiResponse {
  action: Actions.transferDomain;
  responsedata: { orderid: string };
}

export interface ChangeOwnerDomainResponse extends ApiResponse {
  action: Actions.changeOwnerDomain;
  responsedata: ChangeOwnerDomainResponseData;
}

export interface ChangeOwnerDomainResponseData {
  ownerchange: {
    id: string;
    type: string;
    createddate: string;
    expirationdate: string;
    oldownerc: string;
    newownerc: string;
    domain: string;
  };
}

export interface GetAuthcodeDomainResponse extends ApiResponse {
  action: Actions.getAuthcodeDomain;
  responsedata: { authcode: string };
}

// Reseller Handle Responses
export interface ListallHandleResponse extends ApiResponse {
  action: Actions.listallHandle;
  responsedata: HandleObject[];
}

export interface HandleObject {
  id: number;
  type: 'person' | 'organisation' | 'role';
  /** Full name of contact. */
  name: string;
  organisation?: string | null;
  street: string;
  postalcode: string;
  city: string;
  countrycode: string;
  telephone: string;
  email: string;
  /** Whether the handle is assigned to a domain. */
  assignedtodomain: boolean;
  /** Optional TLD-specific attributes. */
  optionalhandleattributes?: OptionalHandleAttribute[] | null;
}

export interface InfoHandleResponse extends ApiResponse {
  action: Actions.infoHandle;
  responsedata: HandleObject;
}

export interface CreateHandleResponse extends ApiResponse {
  action: Actions.createHandle;
  responsedata: HandleObject;
}

export interface UpdateHandleResponse extends ApiResponse {
  action: Actions.updateHandle;
  responsedata: HandleObject;
}

export interface DeleteHandleResponse extends ApiResponse {
  action: Actions.deleteHandle;
  responsedata: Record<string, unknown>;
}

// Utility Responses
export interface PriceTopleveldomainResponse extends ApiResponse {
  action: Actions.priceTopleveldomain;
  /** Pricing object for the requested TLD. */
  responsedata: TopleveldomainObject;
}

export interface TopleveldomainObject {
  /** TLD identifier returned by API (e.g. `de`, `com`, `co.uk`). */
  topleveldomainname: string;
  /** Recurring price per runtime period (usually monthly price in EUR). */
  priceperruntime: number;
  /** One-time setup fee for this TLD (may be 0). */
  setupfee: number;
  /** Runtime length in months for this pricing entry (e.g. 12 or 24). */
  runtimemonths?: number | null;
}

export interface PollResponse extends ApiResponse {
  action: Actions.poll;
  responsedata: PollObject[] | null;
}

export interface PollObject {
  id: number;
  action: string;
  status: 'success' | 'error' | 'started' | 'pending' | 'warning';
  statuscode: number;
  shortmessage: string;
  longmessage?: string | null;
  apikey: string;
  serverrequestid: string;
  clientrequestid?: string | null;
  requestdatetime: string;
  domainorhandle: string;
  messageformat: string;
  apisessionid: string;
}

export interface AckpollResponse extends ApiResponse {
  action: Actions.ackpoll;
  responsedata: Record<string, unknown>;
}
