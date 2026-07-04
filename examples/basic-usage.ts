/**
 * Basic usage: initialize the client, read DNS zone and records.
 *
 * Run: npx tsx examples/basic-usage.ts
 * Requires NETCUP_CUSTOMER_NUMBER, NETCUP_API_KEY, NETCUP_API_PASSWORD in .env
 */

import dotenv from 'dotenv';
import NetcupApi, { NetcupRequestError, formatApiError } from 'netcup-dns-ts';

dotenv.config({ path: '.env.local' });
dotenv.config();

const api = await new NetcupApi().init({
  customernumber: process.env.NETCUP_CUSTOMER_NUMBER!,
  apikey: process.env.NETCUP_API_KEY!,
  apipassword: process.env.NETCUP_API_PASSWORD!,
});

const domain = process.argv[2] || 'example.com';

try {
  const zone = await api.infoDnsZone({ domainname: domain });
  console.log(`Zone: ${zone.responsedata.name}`);
  console.log(`TTL: ${zone.responsedata.ttl}`);
  console.log(`Serial: ${zone.responsedata.serial}`);

  const records = await api.infoDnsRecords({ domainname: domain });
  console.log(`\nRecords for ${domain}:`);
  for (const r of records.responsedata.dnsrecords) {
    console.log(`  ${r.hostname} ${r.type} ${r.destination}`);
  }
} catch (error: unknown) {
  if (error instanceof NetcupRequestError) {
    console.error(`API error [${error.details.statuscode}]: ${error.details.shortmessage}`);
    if (error.details.longmessage && error.details.longmessage !== error.details.shortmessage) {
      console.error(`  ${error.details.longmessage}`);
    }
  } else {
    console.error(formatApiError(error));
  }
  process.exitCode = 1;
} finally {
  await api.logout();
}
