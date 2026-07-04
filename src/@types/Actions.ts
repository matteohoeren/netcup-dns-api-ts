export enum Actions {
  // Session Management
  login = 'login',
  logout = 'logout',

  // DNS Functions
  infoDnsZone = 'infoDnsZone',
  infoDnsRecords = 'infoDnsRecords',
  updateDnsRecords = 'updateDnsRecords',
  updateDnsZone = 'updateDnsZone',

  // Reseller Domain Functions
  listallDomains = 'listallDomains',
  infoDomain = 'infoDomain',
  createDomain = 'createDomain',
  updateDomain = 'updateDomain',
  cancelDomain = 'cancelDomain',
  transferDomain = 'transferDomain',
  changeOwnerDomain = 'changeOwnerDomain',
  getAuthcodeDomain = 'getAuthcodeDomain',

  // Reseller Handle Functions
  listallHandle = 'listallHandle',
  infoHandle = 'infoHandle',
  createHandle = 'createHandle',
  updateHandle = 'updateHandle',
  deleteHandle = 'deleteHandle',

  // Reseller Utility Functions
  priceTopleveldomain = 'priceTopleveldomain',
  poll = 'poll',
  ackpoll = 'ackpoll',
}
