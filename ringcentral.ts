function getRingCentralService() {
  return (
    OAuth2.createService('RC')
      .setAuthorizationBaseUrl(RC_APP.SERVER + '/restapi/oauth/authorize')
      .setTokenUrl(RC_APP.SERVER + '/restapi/oauth/token')
      .setClientId(RC_APP.CLIENT_ID)
      .setClientSecret(RC_APP.CLIENT_SECRET)
      .setCallbackFunction('authCallback')
      .setPropertyStore(PropertiesService.getUserProperties())
      .setCache(CacheService.getUserCache())
      .setTokenHeaders({
        Authorization: 'Basic ' + Utilities.base64EncodeWebSafe(RC_APP.CLIENT_ID + ':' + RC_APP.CLIENT_SECRET)
      })
  );
}

function logoutRingCentral() {
  const service = getRingCentralService();
  service.reset();
}

function checkRingCentralAuthorized() {
  const service = getRingCentralService();
  return service.hasAccess();
}

function authCallback(callbackRequest) {
  try {
    const authorized = getRingCentralService().handleCallback(callbackRequest);
    if (authorized) {
      return HtmlService.createHtmlOutput(
        'Success! <script>setTimeout(function() { top.window.close() }, 1);</script>'
      );
    } else {
      return HtmlService.createHtmlOutput('Denied');
    }
  } catch (err) {
    console.log('===>ERROR: auth callback', err);
    return HtmlService.createHtmlOutput('Denied');
  }
}

function makeRequest(options) {
  const method = options.method;
  let path = options.path;
  let body = options.body;
  const query = options.query;
  if (body) {
    body = JSON.stringify(body)
  }
  if (query) {
    const queryString = Object.keys(query).map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(query[key]);
    }).join('&');
    path = path + '?' + queryString;
  }
  const service = getRingCentralService();
  const response = UrlFetchApp.fetch(RC_APP.SERVER + path, {
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    },
    payload: body,
    contentType: 'application/json',
    method: method || 'get',
    muteHttpExceptions: true
  });
  const json = JSON.parse(response.getContentText('utf-8'));
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) {
    return json;
  } else if (code == 401 || code == 403) {
    console.log(
      'error',
      'will logout due to get code ',
      code,
      ' when request ',
      path,
      ' with ',
      body
    );
    service.reset();
    throw 'Token expired';
  } else {
    console.log('error', 'RingCentral Server Error', path, json);
    throw 'RingCentral Server Error: ' + (json.message || json.error_description);
  }
}

function getExtensionInfo() {
   const response = makeRequest({ path: '/restapi/v1.0/account/~/extension/~' });
   return response;
}

function syncCallLog(options) {
  let path = '/restapi/v1.0/account/~';
  if (options.syncLevel === 'extension') {
    path = path + '/extension/~';
  }
  path = path + '/call-log-sync';
  const query = {
    syncType: options.syncType,
  } as {
    dateFrom?: string;
    syncType: string;
    recordCount?: Number;
    syncToken?: string;
  };
  if (query.syncType === 'ISync') {
    query.syncToken = getCallLogSyncInfo().syncToken;
  } else {
    query.dateFrom = options.dateFrom;
    query.recordCount = 200;
  }
  const response = makeRequest({ path, query });
  const documentProperties = PropertiesService.getDocumentProperties();
  documentProperties.setProperty('CALL_LOG_SYNC_INFO', JSON.stringify(response.syncInfo));
  documentProperties.setProperty('CALL_LOG_SYNC_LEVEL', options.syncLevel);
  return response;
}

function getCallLogSyncInfo() {
  const documentProperties = PropertiesService.getDocumentProperties();
  const data = documentProperties.getProperty('CALL_LOG_SYNC_INFO');
  const syncInfo = (data && JSON.parse(data)) || {};
  const syncLevel = documentProperties.getProperty('CALL_LOG_SYNC_LEVEL') || 'extension';
  syncInfo.syncLevel = syncLevel;
  return syncInfo
}

function isRingCentralAdmin() {
  const extension = getExtensionInfo();
  return extension && extension.permissions && extension.permissions.admin && extension.permissions.admin.enabled;
}
