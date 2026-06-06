require('dotenv').config();
require('isomorphic-fetch');

const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

const required = ['TENANT_ID', 'CLIENT_ID', 'CLIENT_SECRET'];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireEnv() {
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    fail(`Missing required env values: ${missing.join(', ')}`);
  }
}

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : '';
}

function parseSharePointUrl(rawUrl) {
  if (!rawUrl) return {};
  const url = new URL(rawUrl);
  const siteMatch = url.pathname.match(/\/sites\/[^/]+/i) || url.pathname.match(/\/teams\/[^/]+/i);
  return {
    hostname: url.hostname,
    sitePath: siteMatch ? siteMatch[0] : '',
  };
}

async function graphClient() {
  const msalClient = new ConfidentialClientApplication({
    auth: {
      authority: `https://login.microsoftonline.com/${process.env.TENANT_ID}`,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
    },
  });

  return Client.init({
    authProvider: async (done) => {
      try {
        const token = await msalClient.acquireTokenByClientCredential({
          scopes: ['https://graph.microsoft.com/.default'],
        });
        done(null, token.accessToken);
      } catch (error) {
        done(error, null);
      }
    },
  });
}

async function resolveSite(client) {
  const urlParts = parseSharePointUrl(argValue('url') || process.env.SHAREPOINT_SITE_URL);
  const hostname = argValue('hostname') || process.env.SHAREPOINT_HOSTNAME || urlParts.hostname;
  const sitePath = argValue('path') || process.env.SHAREPOINT_SITE_PATH || urlParts.sitePath;
  const search = argValue('search') || process.env.SHAREPOINT_SITE_SEARCH;

  if (hostname && sitePath) {
    return client.api(`/sites/${hostname}:${sitePath}`).get();
  }

  if (!search) {
    fail(
      [
        'Provide one of:',
        '  SHAREPOINT_SITE_URL=https://tenant.sharepoint.com/sites/SiteName',
        '  SHAREPOINT_HOSTNAME=tenant.sharepoint.com and SHAREPOINT_SITE_PATH=/sites/SiteName',
        '  SHAREPOINT_SITE_SEARCH=SiteName',
      ].join('\n')
    );
  }

  const result = await client.api('/sites').query({ search }).get();
  const sites = result.value || [];
  if (sites.length === 0) {
    fail(`No SharePoint sites matched search: ${search}`);
  }
  if (sites.length > 1) {
    console.log('Multiple sites matched. Re-run with --url or --path for the exact site.\n');
    sites.forEach((site) => {
      console.log(`${site.name || site.displayName}\n  id: ${site.id}\n  webUrl: ${site.webUrl}\n`);
    });
    process.exit(0);
  }
  return sites[0];
}

async function resolveDrive(client, siteId) {
  const driveName = argValue('drive') || process.env.SHAREPOINT_DRIVE_NAME;
  const result = await client.api(`/sites/${siteId}/drives`).get();
  const drives = result.value || [];

  if (drives.length === 0) {
    fail('No document libraries/drives found for this SharePoint site.');
  }

  if (driveName) {
    const match = drives.find((drive) => drive.name.toLowerCase() === driveName.toLowerCase());
    if (!match) {
      fail(`No drive matched SHAREPOINT_DRIVE_NAME=${driveName}`);
    }
    return match;
  }

  const documents = drives.find((drive) => ['Documents', 'Shared Documents'].includes(drive.name));
  if (documents) return documents;

  if (drives.length === 1) return drives[0];

  console.log('Multiple document libraries found. Re-run with --drive=<name>.\n');
  drives.forEach((drive) => {
    console.log(`${drive.name}\n  id: ${drive.id}\n  webUrl: ${drive.webUrl || 'no webUrl returned'}\n`);
  });
  process.exit(0);
}

async function main() {
  requireEnv();
  const client = await graphClient();
  const site = await resolveSite(client);
  const drive = await resolveDrive(client, site.id);

  console.log('Resolved SharePoint identifiers:\n');
  console.log(`SHAREPOINT_SITE_ID=${site.id}`);
  console.log(`SHAREPOINT_DRIVE_ID=${drive.id}`);
  console.log('\nReference:');
  console.log(`Site: ${site.webUrl}`);
  console.log(`Drive: ${drive.name} (${drive.webUrl || 'no webUrl returned'})`);
}

main().catch((error) => {
  fail(error.message || String(error));
});
