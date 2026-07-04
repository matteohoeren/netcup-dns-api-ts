/**
 * Poll for asynchronous messages (domain creation confirmations, transfers, etc.).
 *
 * Run: npx tsx examples/poll-messages.ts
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

try {
  const poll = await api.poll({ messagecount: 10 });
  const messages = poll.responsedata ?? [];

  if (messages.length === 0) {
    console.log('No unread poll messages.');
  } else {
    console.log(`${messages.length} unread message(s):\n`);
    for (const msg of messages) {
      console.log(`  [${msg.statuscode}] ${msg.action} - ${msg.shortmessage}`);

      // Acknowledge each message
      await api.ackpoll({ apilogid: msg.id });
      console.log(`  Acked (ID: ${msg.id})\n`);
    }
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
