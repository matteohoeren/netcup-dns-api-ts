/**
 * Reseller workflow: list domains, create a contact handle, register a domain.
 *
 * Run: npx tsx examples/reseller-domain.ts
 * Requires NETCUP_CUSTOMER_NUMBER, NETCUP_API_KEY, NETCUP_API_PASSWORD in .env
 * Requires a Netcup reseller account with API permissions.
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

try {
  // List existing domains
  const domains = await api.listallDomains();
  console.log('Your domains:');
  for (const d of domains.responsedata) {
    console.log(`  ${d.domainname}`);
  }

  // Create a contact handle
  console.log('\nCreating contact handle...');
  const handle = await api.createHandle({
    type: 'person',
    name: 'Example Contact',
    street: 'Example Street 1',
    city: 'Berlin',
    postalcode: '10115',
    countrycode: 'DE',
    telephone: '+49.123456789',
    email: 'contact@example.com',
  });
  console.log(`Handle created: ${handle.responsedata.id}`);

  // Register a domain (DANGEROUS - charges your account)
  api.enableDangerousOperations();

  console.log('\nRegistering domain...');
  const result = await api.createDomain({
    domainname: 'my-new-domain.de',
    contacts: {
      ownerc: String(handle.responsedata.id),
      adminc: String(handle.responsedata.id),
      techc: String(handle.responsedata.id),
      billingc: String(handle.responsedata.id),
      zonec: String(handle.responsedata.id),
    },
    nameservers: {
      nameserver1: { hostname: 'ns1.example-dns.net', ipv4: '198.51.100.10' },
      nameserver2: { hostname: 'ns2.example-dns.net', ipv4: '198.51.100.11' },
    },
  });
  console.log(`Domain registered: ${result.responsedata.domain}`);
  console.log(`Order ID: ${result.responsedata.orderid}`);
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
