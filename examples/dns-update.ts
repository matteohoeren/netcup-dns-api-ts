/**
 * DNS updates: upsert records, delete records, update to current public IP.
 *
 * Run: npx tsx examples/dns-update.ts <domain> [hostname]
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
const hostname = process.argv[3] || 'www';

try {
  // Upsert an A record
  console.log(`Setting ${hostname}.${domain} -> 192.0.2.10`);
  await api.updateDnsRecords({
    domainname: domain,
    dnsrecordset: {
      dnsrecords: [{ hostname, type: 'A', destination: '192.0.2.10' }],
    },
  });
  console.log('Done.\n');

  // Update that record to the current public IP
  console.log(`Updating ${hostname}.${domain} to current public IP...`);
  await api.updateDnsRecordWithCurrentIp({ domainname: domain, hostname });
  console.log('Done.\n');

  // Delete records matching a hostname
  console.log(`Deleting all records for old.${domain}...`);
  await api.deleteDnsRecords({ domainname: domain, hostname: 'old', type: 'A', allMatches: true });
  console.log('Done.');
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
