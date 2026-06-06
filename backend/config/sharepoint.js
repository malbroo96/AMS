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

function assertSharePointConfig() {
  const missing = requiredConfig.filter((key) => !sharepoint[key]);
  if (missing.length) {
    throw new ApiError(`Missing SharePoint configuration: ${missing.join(', ')}`, 500);
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
  const result = await getMsalClient().acquireTokenByClientCredential({
    scopes: ['https://graph.microsoft.com/.default'],
  });

  if (!result?.accessToken) {
    throw new ApiError('Unable to acquire Microsoft Graph access token', 500);
  }

  return result.accessToken;
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
};
