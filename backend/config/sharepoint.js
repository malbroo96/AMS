require('isomorphic-fetch');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const ApiError = require('../utils/ApiError');
const { sharepoint } = require('./env');

const requiredConfig = ['tenantId', 'clientId', 'clientSecret', 'siteId', 'driveId'];

function isSharePointConfigured() {
  return requiredConfig.every((key) => {
    const value = sharepoint[key];
    return value && !String(value).startsWith('YOUR_');
  });
}

function validateSharePointConfig() {
  const status = {};
  requiredConfig.forEach((key) => {
    const value = sharepoint[key];
    status[key] = !!(value && !String(value).startsWith('YOUR_'));
  });
  return status;
}

function assertSharePointConfig() {
  const missingOrInvalid = requiredConfig.filter((key) => {
    const value = sharepoint[key];
    return !value || String(value).startsWith('YOUR_');
  });
  if (missingOrInvalid.length) {
    const mapped = missingOrInvalid.map(
      (key) => `SHAREPOINT_${key.replace(/[A-Z]/g, (letter) => `_${letter}`).toUpperCase()}`
    );
    throw new ApiError(
      `SharePoint is not configured. Missing or placeholder values for: ${mapped.join(', ')}`,
      400
    );
  }
}

let msalClient;

function getMsalClient() {
  assertSharePointConfig();
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        authority: `https://login.microsoftonline.com/${sharepoint.tenantId}`,
        clientId: sharepoint.clientId,
        clientSecret: sharepoint.clientSecret,
      },
    });
  }
  return msalClient;
}

async function getAccessToken() {
  assertSharePointConfig();
  console.log('[DEBUG] [MSAL] Token acquisition start');
  try {
    const result = await getMsalClient().acquireTokenByClientCredential({
      scopes: ['https://graph.microsoft.com/.default'],
    });

    if (!result?.accessToken) {
      console.error('[DEBUG] [MSAL] Token acquisition returned empty accessToken');
      throw new ApiError('Unable to acquire Microsoft Graph access token', 401);
    }

    console.log('[DEBUG] [MSAL] Token acquisition success');
    return result.accessToken;
  } catch (error) {
    console.error('[DEBUG] [MSAL] Token acquisition failure:', error.message || error);
    throw new ApiError(`SharePoint MSAL authentication failed: ${error.message || error}`, 401);
  }
}

function getGraphClient() {
  assertSharePointConfig();
  return Client.init({
    authProvider: async (done) => {
      try {
        done(null, await getAccessToken());
      } catch (error) {
        done(error, null);
      }
    },
  });
}

module.exports = {
  getGraphClient,
  sharepointConfig: sharepoint,
  isSharePointConfigured,
  validateSharePointConfig,
  assertSharePointConfig,
};
