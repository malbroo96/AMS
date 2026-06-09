require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

const envPath = path.resolve(__dirname, '..', '.env');
const requiredValues = ['TENANT_ID', 'CLIENT_ID', 'CLIENT_SECRET', 'SHAREPOINT_SITE_URL'];

function parseSiteUrl(rawUrl) {
  let siteUrl;
  try {
    siteUrl = new URL(rawUrl);
  } catch {
    throw new Error(`SHAREPOINT_SITE_URL is not a valid URL: ${rawUrl}`);
  }

  const sitePath = siteUrl.pathname.replace(/\/+$/, '');
  if (!sitePath) {
    throw new Error('SHAREPOINT_SITE_URL must include a site path, for example /sites/EADMIT');
  }

  return {
    hostname: siteUrl.hostname,
    sitePath,
  };
}

async function createGraphClient(env) {
  const msalClient = new ConfidentialClientApplication({
    auth: {
      authority: `https://login.microsoftonline.com/${env.TENANT_ID}`,
      clientId: env.CLIENT_ID,
      clientSecret: env.CLIENT_SECRET,
    },
  });

  let result;
  try {
    result = await msalClient.acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });
  } catch (error) {
    throw new Error(`Microsoft Entra authentication failed: ${error?.errorMessage || error?.message || String(error)}`);
  }

  if (!result?.accessToken) {
    throw new Error('Microsoft Entra authentication failed: no access token was returned');
  }

  return Client.init({
    authProvider: (done) => done(null, result.accessToken),
  });
}

async function resolveSite(client, siteUrl) {
  const { hostname, sitePath } = parseSiteUrl(siteUrl);
  let directError;
  try {
    return await client.api(`/sites/${hostname}:${sitePath}`).get();
  } catch (error) {
    directError = error;
  }

  const siteName = sitePath.split('/').filter(Boolean).pop();
  try {
    const result = await client.api('/sites').query({ search: siteName }).get();
    const normalizedUrl = siteUrl.replace(/\/+$/, '').toLowerCase();
    const match = (result.value || []).find(
      (site) => String(site.webUrl || '').replace(/\/+$/, '').toLowerCase() === normalizedUrl
    );
    if (match) return match;
  } catch (searchError) {
    throw new Error(
      `Unable to resolve SharePoint site "${siteUrl}". Direct lookup: ${graphErrorMessage(directError)}. Search lookup: ${graphErrorMessage(searchError)}`
    );
  }

  throw new Error(
    `Unable to resolve SharePoint site "${siteUrl}". Direct lookup: ${graphErrorMessage(directError)}. No exact site matched Graph search.`
  );
}

async function resolveDrive(client, siteId, requestedDriveName) {
  let result;
  try {
    result = await client.api(`/sites/${siteId}/drives`).get();
  } catch (error) {
    throw new Error(`Unable to list SharePoint document libraries: ${graphErrorMessage(error)}`);
  }
  const drives = result.value || [];
  const driveName = requestedDriveName || 'Documents';
  const drive = drives.find((item) => item.name?.toLowerCase() === driveName.toLowerCase());

  if (!drive) {
    const available = drives.map((item) => item.name).filter(Boolean).join(', ') || 'none';
    throw new Error(`Document library "${driveName}" was not found. Available drives: ${available}`);
  }

  return drive;
}

function replaceOrAppendEnvValue(content, name, value, lineEnding) {
  const expression = new RegExp(`^([ \\t]*${name}[ \\t]*=[ \\t]*).*$`, 'm');
  if (expression.test(content)) {
    return content.replace(expression, `$1${value}`);
  }

  const separator = content.length === 0 || content.endsWith('\n') || content.endsWith('\r') ? '' : lineEnding;
  return `${content}${separator}${name}=${value}${lineEnding}`;
}

function updateEnvFile(content, siteId, driveId) {
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  let updated = replaceOrAppendEnvValue(content, 'SHAREPOINT_SITE_ID', siteId, lineEnding);
  updated = replaceOrAppendEnvValue(updated, 'SHAREPOINT_DRIVE_ID', driveId, lineEnding);
  return updated;
}

function graphErrorMessage(error) {
  const message =
    error?.body?.error?.message ||
    error?.body?.message ||
    error?.response?.data?.error?.message ||
    error?.errorMessage ||
    error?.message ||
    String(error);
  const details = [error?.code, error?.statusCode].filter(Boolean).join(', ');
  const formatted = details ? `${message} (${details})` : message;
  if (error?.statusCode === 401) {
    return `${formatted}. Verify Microsoft Graph application permissions and grant tenant admin consent.`;
  }
  if (error?.statusCode === 403) {
    return `${formatted}. The app is authenticated but does not have permission to access this SharePoint resource.`;
  }
  return formatted;
}

async function main() {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Environment file not found: ${envPath}`);
  }

  const originalContent = fs.readFileSync(envPath, 'utf8');
  const env = dotenv.parse(originalContent);
  const missing = requiredValues.filter((name) => !env[name]);
  if (missing.length) {
    throw new Error(`Missing required values in .env: ${missing.join(', ')}`);
  }

  const client = await createGraphClient(env);
  const site = await resolveSite(client, env.SHAREPOINT_SITE_URL);
  const drive = await resolveDrive(client, site.id, env.SHAREPOINT_DRIVE_NAME);
  const updatedContent = updateEnvFile(originalContent, site.id, drive.id);

  fs.writeFileSync(envPath, updatedContent, 'utf8');

  console.log('=====================================');
  console.log('');
  console.log('SharePoint Configuration Updated');
  console.log('');
  console.log('=====================================');
  console.log('');
  console.log(`SHAREPOINT_SITE_ID=${site.id}`);
  console.log('');
  console.log(`SHAREPOINT_DRIVE_ID=${drive.id}`);
  console.log('');
  console.log('.env updated successfully.');
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Unable to update SharePoint environment: ${graphErrorMessage(error)}`);
    process.exitCode = 1;
  });
}

module.exports = { parseSiteUrl, updateEnvFile };
