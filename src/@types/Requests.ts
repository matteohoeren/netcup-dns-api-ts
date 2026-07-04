import { DnsRecord } from './Responses';

export interface AuthParam {
  customernumber: string;
  apikey: string;
  apisessionid: string;
}

export type WithAuthentication<R> = R & AuthParam;

// DNS Request Wrappers
export interface InfoDNSRecordsRequest {
  action: string;
  param: WithAuthentication<InfoDNSRecordsParam>;
}

export interface InfoDNSZoneRequest {
  action: string;
  param: WithAuthentication<InfoDNSZoneParam>;
}

export interface UpdateDNSRecordsRequest {
  action: string;
  param: WithAuthentication<UpdateDNSRecordsParam>;
}

export interface UpdateDNSZoneRequest {
  action: string;
  param: WithAuthentication<UpdateDNSZoneParam>;
}

export interface LoginRequest {
  action: string;
  param: LoginParam;
}

export interface LogoutRequest {
  action: string;
  param: WithAuthentication<LogoutParam>;
}

// Domain Request Wrappers
export interface ListallDomainsRequest {
  action: string;
  param: WithAuthentication<ListallDomainsParam>;
}

export interface InfoDomainRequest {
  action: string;
  param: WithAuthentication<InfoDomainParam>;
}

export interface CreateDomainRequest {
  action: string;
  param: WithAuthentication<CreateDomainParam>;
}

export interface UpdateDomainRequest {
  action: string;
  param: WithAuthentication<UpdateDomainParam>;
}

export interface CancelDomainRequest {
  action: string;
  param: WithAuthentication<CancelDomainParam>;
}

export interface TransferDomainRequest {
  action: string;
  param: WithAuthentication<TransferDomainParam>;
}

export interface ChangeOwnerDomainRequest {
  action: string;
  param: WithAuthentication<ChangeOwnerDomainParam>;
}

export interface GetAuthcodeDomainRequest {
  action: string;
  param: WithAuthentication<GetAuthcodeDomainParam>;
}

// Handle Request Wrappers
export interface ListallHandleRequest {
  action: string;
  param: WithAuthentication<ListallHandleParam>;
}

export interface InfoHandleRequest {
  action: string;
  param: WithAuthentication<InfoHandleParam>;
}

export interface CreateHandleRequest {
  action: string;
  param: WithAuthentication<CreateHandleParam>;
}

export interface UpdateHandleRequest {
  action: string;
  param: WithAuthentication<UpdateHandleParam>;
}

export interface DeleteHandleRequest {
  action: string;
  param: WithAuthentication<DeleteHandleParam>;
}

// Utility Request Wrappers
export interface PriceTopleveldomainRequest {
  action: string;
  param: WithAuthentication<PriceTopleveldomainParam>;
}

export interface PollRequest {
  action: string;
  param: WithAuthentication<PollParam>;
}

export interface AckpollRequest {
  action: string;
  param: WithAuthentication<AckpollParam>;
}

// Parameter Types
export interface LoginParam {
  /**
   * Your Netcup API key generated from the [customer control panel](https://www.customercontrolpanel.de/daten_aendern.php?sprung=api).
   */
  apikey: string;
  /**
   * The associated password for the API key.
   */
  apipassword: string;
  /**
   * Your customer number.
   */
  customernumber: string;
}

export interface LogoutParam {
  // Empty params, auth is handled by WithAuthentication
}

export interface InfoDNSZoneParam {
  /**
   * The name of the domain to retrieve the zone info from.
   * @example "example.com"
   */
  domainname: string;
}

export interface InfoDNSRecordsParam {
  /**
   * The name of the domain to retrieve the records from.
   */
  domainname: string;
}

export interface UpdateDNSRecordsParam {
  /**
   * The domain name for which the DNS records should be updated.
   */
  domainname: string;
  /**
   * The DNS entries of the domain to update.
   */
  dnsrecordset: { dnsrecords: DnsRecord[] };
}

export interface UpdateDNSZoneParam {
  /**
   * The domain name for which the DNS zone should be updated.
   */
  domainname: string;
  /**
   * The DNS zone data to update.
   */
  dnszone: {
    /** Domain name of the DNS zone (domain name). */
    name?: string;
    /**
     * Time-to-live in seconds.
     * Controls resolver cache lifetime for records in this zone.
     */
    ttl?: number;
    /**
     * Zone serial number.
     * Used for zone transfer/versioning; commonly managed automatically by provider.
     */
    serial?: number | null;
    /**
     * Refresh interval in seconds.
     * How often secondary nameservers check the primary nameserver for updates.
     */
    refresh?: number;
    /**
     * Retry interval in seconds.
     * Delay before secondaries retry refresh after a failed attempt.
     */
    retry?: number;
    /**
     * Expire interval in seconds.
     * Maximum time secondaries keep serving stale zone data without refresh.
     */
    expire?: number;
  };
}

export interface UpdateDnsRecordWithCurrentIpParams {
  /**
   * The domain name for which DNS records with the current IP should be updated.
   * @example "example.com"
   */
  domainname: UpdateDNSRecordsParam['domainname'];
  /**
   * The host name of the DNS entry.
   * @example "www" - refers to www.example.com
   */
  hostname: DnsRecord['hostname'];
  /**
   * Indicates to update IPv6 (AAAA records) only.
   */
  useIpv6Only?: boolean;
  /**
   * Indicates to update IPv4 (A records) and IPv6 (AAAA records) records.
   */
  useIpv4AndIpv6?: boolean;
}

export interface DeleteDnsRecordsParam {
  /** Domain name of the DNS zone. */
  domainname: string;
  /**
   * Optional Netcup record IDs to delete.
   * Accepts a single id or a list of ids.
   */
  ids?: number | number[];
  /**
   * Optional hostname filter (relative label like `www`, or FQDN).
   * FQDN values ending with the zone are normalized to relative labels.
   */
  hostname?: string;
  /** Optional DNS type filter (e.g. `A`, `AAAA`, `TXT`). */
  type?: string;
  /** Optional destination/content filter. */
  destination?: string;
  /** Optional priority filter (e.g. for MX/SRV). */
  priority?: number;
  /**
   * If true, delete all records matching the filters.
   * If false/omitted, only the first matching record is deleted.
   */
  allMatches?: boolean;
}

// Reseller Domain Parameters
export interface ListallDomainsParam {
  // Empty params, only auth needed
}

export interface InfoDomainParam {
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
  /**
   * Optional: TRUE to get information from registry. Default FALSE.
   */
  registryinformationflag?: boolean;
}

export interface Contactentries {
  /** Owner contact handle ID. */
  ownerc?: string | null;
  /** Admin contact handle ID. */
  adminc?: string | null;
  /** Technical contact handle ID. */
  techc?: string | null;
  /** Zone contact handle ID. */
  zonec?: string | null;
  /** Billing contact handle ID. */
  billingc?: string | null;
  /** On-site contact handle ID. */
  onsitec?: string | null;
  /** General request contact handle ID. */
  generalrequest?: string | null;
  /** Abuse contact handle ID. */
  abusecontact?: string | null;
}

export interface Nameserverentry {
  /** Hostname of the nameserver. Mandatory. */
  hostname: string;
  /** IPv4 address (optional). */
  ipv4?: string;
  /** IPv6 address (optional). */
  ipv6?: string;
}

export interface Nameserverentries {
  /** First nameserver (required). */
  nameserver1: Nameserverentry;
  /** Second nameserver (required). */
  nameserver2: Nameserverentry;
  /** Optional additional nameservers. */
  nameserver3?: Nameserverentry;
  nameserver4?: Nameserverentry;
  nameserver5?: Nameserverentry;
  nameserver6?: Nameserverentry;
  nameserver7?: Nameserverentry;
  nameserver8?: Nameserverentry;
}

export interface CreateDomainParam {
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
  /**
   * Contact handle IDs for the domain.
   */
  contacts: Contactentries;
  /**
   * Nameserver entries for the domain.
   *
   * **Important constraint from netcup docs:**
   * You MUST provide your **own** nameservers.
   * netcup's own nameservers (root-dns.netcup.net, second-dns.netcup.net, third-dns.netcup.net)
   * cannot be used here because the domain does not exist at the registry yet.
   */
  nameservers: Nameserverentries;
}

export interface UpdateDomainParam {
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
  /**
   * Optional contact handle updates.
   */
  contacts?: Contactentries;
  /**
   * Optional nameserver updates.
   * Same constraint as createDomain: you must use your own NS, not netcup's.
   */
  nameservers?: Nameserverentries | null;
  /**
   * Optional: preserve existing DNSSEC records. Default FALSE.
   */
  keepdnssecrecords?: boolean;
}

export interface CancelDomainParam {
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
}

export interface TransferDomainParam {
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
  /**
   * AuthInfo code from the losing registrar.
   */
  authcode: string;
  /**
   * Contact handle IDs.
   */
  contacts: Contactentries;
  /**
   * Nameserver entries. Same constraint as createDomain: you must use your own NS.
   * Can be omitted/null to not specify nameservers during transfer.
   */
  nameservers?: Nameserverentries | null;
}

export interface ChangeOwnerDomainParam {
  /**
   * Handle ID of the new owner contact.
   */
  new_handle_id: number;
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
}

export interface GetAuthcodeDomainParam {
  /**
   * Name of the domain including top-level domain.
   */
  domainname: string;
}

// Reseller Handle Parameters
export interface ListallHandleParam {
  // Empty params, only auth needed
}

export interface InfoHandleParam {
  /**
   * ID of the contact handle.
   */
  handle_id: number;
}

// Netcup simple type aliases from:
// https://ccp.netcup.net/run/webservice/xsd/simpletypes.xsd
//
// These aliases intentionally stay as `string` at runtime but improve IntelliSense
// and document the API constraints directly where the fields are used.
export type Max12Chars = string;
export type Max20Chars = string;
export type Max40Chars = string;
export type Max63Chars = string;
export type Max70Chars = string;
export type Max80Chars = string;
export type Max128Chars = string;
export type Max255Chars = string;
export type CountryCode2Char = string;
export type TelephoneNumber = string;
export type FaxNumber = string;
export type EmailAddress = string;
export type DateFormatYYYYMMDD = string;
export type UriTemplate = string;
export type JobsWebsite = string;

export type HandleType = 'person' | 'organisation' | 'role';
export type YesNo = 'Yes' | 'No';
export type AsiaTypeOfEntity =
  | 'naturalPerson'
  | 'corporation'
  | 'cooperative'
  | 'partnership'
  | 'government'
  | 'politicalParty'
  | 'society'
  | 'institution';
export type AsiaFormOfIdentity =
  | 'certificate'
  | 'legislation'
  | 'passport'
  | 'politicalPartyRegistry'
  | 'societyRegistry';
export type EsNumberType = 'DNI' | 'NIE' | 'NIF';
export type NexusCategory = 'C11' | 'C12' | 'C21' | 'C31' | 'C32';

/**
 * Typed optional handle attributes from `ArrayOfOptionalhandleattributes`.
 *
 * Each `item` only accepts the documented key and its matching value format.
 * This improves IntelliSense while keeping all attributes optional.
 */
export type OptionalHandleAttribute =
  | { item: 'fax'; value: FaxNumber }
  | { item: 'state'; value: Max40Chars }
  | { item: 'handlecomment'; value: Max80Chars }
  | { item: 'birthdate'; value: DateFormatYYYYMMDD }
  | { item: 'birthplace'; value: Max70Chars }
  | { item: 'birthcountrycountrycode'; value: CountryCode2Char }
  | { item: 'birthstate'; value: Max63Chars }
  | { item: 'birthplacepostalcode'; value: Max12Chars }
  | { item: 'registrationnumber'; value: Max70Chars }
  | { item: 'idcardnumber'; value: Max70Chars }
  | { item: 'idcardissuedate'; value: DateFormatYYYYMMDD }
  | { item: 'idcardissueauthority'; value: Max70Chars }
  | { item: 'taxnumber'; value: Max70Chars }
  | { item: 'vatnumber'; value: Max70Chars }
  | { item: 'aeroensid'; value: Max70Chars }
  | { item: 'aeroenspassword'; value: Max70Chars }
  | { item: 'xxxmemberid'; value: Max20Chars }
  | { item: 'xxxmemberpasswort'; value: Max20Chars }
  | { item: 'proprofession'; value: Max70Chars }
  | { item: 'traveluin'; value: Max20Chars }
  | { item: 'trademarknumber'; value: Max80Chars }
  | { item: 'trademarkcountrycode'; value: CountryCode2Char }
  | { item: 'coopverificationcode'; value: Max20Chars }
  | { item: 'asiatypeofentity'; value: AsiaTypeOfEntity }
  | { item: 'asiaformofidentity'; value: AsiaFormOfIdentity }
  | { item: 'asiaidentnumber'; value: Max255Chars }
  | { item: 'jobstitelposition'; value: Max70Chars }
  | { item: 'jobswebsite'; value: JobsWebsite }
  | { item: 'jobsindustrytype'; value: Max128Chars }
  | { item: 'jobscontactisadmin'; value: YesNo }
  | { item: 'jobsassociationmember'; value: YesNo }
  | { item: 'esnumbertype'; value: EsNumberType }
  | { item: 'esnifnienumber'; value: Max70Chars }
  | { item: 'uritemplate'; value: UriTemplate }
  | { item: 'countryofcitizenshipcountrycode'; value: CountryCode2Char }
  | { item: 'nexusCategory'; value: NexusCategory };

export interface CreateHandleParam {
  /**
   * Contact type: "person", "organisation", or "role".
   */
  type: HandleType;
  /**
   * Contact name.
   * Netcup simple type: `max80chars` (1-80 chars).
   */
  name: Max80Chars;
  /**
   * Organization name (for organisations).
   * Netcup simple type: `organisation` (max 128 chars, restricted chars).
   */
  organisation?: string;
  /**
   * Street address.
   * Netcup simple type: `max63chars` (1-63 chars).
   *
   * Example API error when invalid:
   * `Value in field street does not match requirements of type: max63chars`.
   */
  street: Max63Chars;
  /**
   * City.
   * Netcup simple type: `max63chars` (1-63 chars).
   */
  city: Max63Chars;
  /**
   * Postal code.
   * Netcup simple type: `max12chars` (1-12 chars).
   */
  postalcode: Max12Chars;
  /**
   * Country code (ISO 3166-1 alpha-2).
   * Netcup simple type: `countrycode2char` (exactly 2 uppercase letters).
   */
  countrycode: CountryCode2Char;
  /**
   * Telephone number in format +CC.NUMBER (e.g., +49.4915730163481).
   * Netcup simple type: `telephone` (`\+[0-9]{1,4}\.([0-9]{1,57})`).
   */
  telephone: TelephoneNumber;
  /**
   * Email address.
   * Netcup simple type: `email`.
   *
   * Example API error when invalid:
   * `Value in field email does not match requirements of type: email`.
   */
  email: EmailAddress;
  /**
   * Additional TLD-specific optional attributes.
   *
   * Example:
   * `{ item: 'state', value: 'Bavaria' }`
   * `{ item: 'birthdate', value: '1990-04-21' }`
   * `{ item: 'nexusCategory', value: 'C11' }`
   */
  optionalhandleattributes?: OptionalHandleAttribute[];
}

export interface UpdateHandleParam {
  /**
   * ID of the contact handle to update.
   */
  handle_id: number;
  /**
   * Contact type (cannot be changed for handles used at global TLDs).
   */
  type?: HandleType;
  /**
   * Contact name (cannot be changed for handles used at global TLDs).
   * Netcup simple type: `max80chars` (1-80 chars).
   */
  name?: Max80Chars;
  /**
   * Organization name.
   */
  organisation?: string;
  /**
   * Street address.
   * Netcup simple type: `max63chars` (1-63 chars).
   */
  street?: Max63Chars;
  /**
   * City.
   * Netcup simple type: `max63chars` (1-63 chars).
   */
  city?: Max63Chars;
  /**
   * Postal code.
   * Netcup simple type: `max12chars` (1-12 chars).
   */
  postalcode?: Max12Chars;
  /**
   * Country code (ISO 3166-1 alpha-2).
   * Netcup simple type: `countrycode2char` (exactly 2 uppercase letters).
   */
  countrycode?: CountryCode2Char;
  /**
   * Telephone number in format +CC.NUMBER (e.g., +49.4915730163481).
   * Netcup simple type: `telephone` (`\+[0-9]{1,4}\.([0-9]{1,57})`).
   */
  telephone?: TelephoneNumber;
  /**
   * Email address (cannot be changed if used at global TLD).
   * Netcup simple type: `email`.
   */
  email?: EmailAddress;
  /**
   * Additional TLD-specific optional attributes.
   */
  optionalhandleattributes?: OptionalHandleAttribute[];
}

export interface DeleteHandleParam {
  /**
   * The handle ID to delete.
   */
  handle_id: number;
}

// Utility Parameters
/**
 * Frequently used/known TLD values for `priceTopleveldomain` autocomplete.
 *
 * The Netcup catalog changes over time, so `TopleveldomainValue` also accepts
 * arbitrary strings.
 */
export type KnownTopleveldomain =
  | 'ac'
  | 'academy'
  | 'accountants'
  | 'actor'
  | 'ae'
  | 'ag'
  | 'app'
  | 'art'
  | 'asia'
  | 'at'
  | 'be'
  | 'biz'
  | 'blog'
  | 'ca'
  | 'cc'
  | 'ch'
  | 'cloud'
  | 'cn'
  | 'co'
  | 'co.uk'
  | 'com'
  | 'com.au'
  | 'de'
  | 'dev'
  | 'eu'
  | 'fr'
  | 'gg'
  | 'info'
  | 'io'
  | 'it'
  | 'jobs'
  | 'li'
  | 'me'
  | 'net'
  | 'nl'
  | 'org'
  | 'org.uk'
  | 'pl'
  | 'pro'
  | 'shop'
  | 'site'
  | 'tv'
  | 'uk'
  | 'us'
  | 'xyz';

/**
 * TLD value accepted by `priceTopleveldomain`.
 *
 * - Supports known literals for autocomplete (`KnownTopleveldomain`)
 * - Supports leading-dot notation (e.g. `.de`)
 * - Supports arbitrary strings for forward compatibility
 */
export type TopleveldomainValue =
  | KnownTopleveldomain
  | `.${KnownTopleveldomain}`
  | `.${string}`
  | (string & {});

export interface PriceTopleveldomainParam {
  /**
   * Name of the top-level domain.
   *
   * Accepts values with or without leading dot (e.g. `de` or `.de`).
   * The client normalizes leading dots before sending to the API.
   */
  topleveldomain: TopleveldomainValue;
}

export interface PollParam {
  /**
   * Maximum number of unread messages to receive. Must be a positive integer (≥1).
   * Defaults to 10 if not provided.
   */
  messagecount?: number;
}

export interface AckpollParam {
  /**
   * ID of the poll message to acknowledge.
   * The API field name is `apilogid` (positiveInteger).
   */
  apilogid: number;
}
