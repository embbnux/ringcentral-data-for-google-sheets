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
    Logger.log('===>ERROR: auth callback', err);
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
    Logger.log(
      'error' +
      'will logout due to get code ' +
      code +
      ' when request ' +
      path +
      ' with ' +
      body
    );
    service.reset();
    throw new Error('RingCentral Authorization expired');
  } else {
    Logger.log('error' + 'RingCentral Server Error', path, json);
    throw new Error('RingCentral Server Error: ' + (json.message || json.error_description));
  }
}

function getExtensionInfo() {
   const response = makeRequest({ path: '/restapi/v1.0/account/~/extension/~' });
   return response;
}

const CALL_LOG_PATH = {
  account: {
    sync: '/restapi/v1.0/account/~/call-log-sync',
    list: '/restapi/v1.0/account/~/call-log'
  },
  extension: {
    sync: '/restapi/v1.0/account/~/extension/~/call-log-sync',
    list: '/restapi/v1.0/account/~/extension/~/call-log'
  }
};
const CALL_LOG_MAX_RECORD_COUNT = 250;

function fetchCallLogList(params: { dateTo: string; dateFrom: string; syncLevel: string }) {
  const path = CALL_LOG_PATH[params.syncLevel || 'extension'].list;
  let fetchedPages = 0;
  let totalPages = 1;
  let records = [];
  while (fetchedPages < totalPages) {
    fetchedPages += 1;
    const response = makeRequest({
      path,
      query: {
        perPage: 'MAX',
        dateTo: params.dateTo,
        dateFrom: params.dateFrom,
        page: fetchedPages,
        view: 'Detailed',
      }
    });
    totalPages = response.paging.totalPages;
    records = records.concat(response.records);
  }
  return records;
}

function fullSyncCallLog(params: { dateFrom: string; syncLevel?: 'account' | 'extension' }) {
  const path = CALL_LOG_PATH[params.syncLevel || 'extension'].sync;
  const query = {
    syncType: 'FSync',
    recordCount: CALL_LOG_MAX_RECORD_COUNT,
    dateFrom: params.dateFrom,
    view: 'Detailed',
  };
  const response = makeRequest({ path, query });
  let records = response.records;
  if (records.length >= CALL_LOG_MAX_RECORD_COUNT) {
    const dateTo = records[records.length - 1].startTime;
    if (dateTo !== params.dateFrom) {
      const olderRecords = fetchCallLogList({ dateFrom: params.dateFrom, dateTo, syncLevel: params.syncLevel });
      if (olderRecords[0] && olderRecords[0].id === records[records.length - 1].id) {
        olderRecords.shift();
      }
      records = records.concat(olderRecords);
    }
  }
  return { records, syncInfo: response.syncInfo };
}

function iSyncCallLog(params: { syncLevel?: 'account' | 'extension' }) {
  const path = CALL_LOG_PATH[params.syncLevel || 'extension'].sync;
  const lastSyncInfo = getCallLogSyncInfo();
  if (!lastSyncInfo.syncToken || !lastSyncInfo.syncTime) {
    throw new Error('Last Sync Info in current spreadsheet is empty, please use Full Sync.');
  }
  const query = {
    syncType: 'ISync',
    syncToken: lastSyncInfo.syncToken,
    view: 'Detailed',
  };
  let response;
  try {
    response = makeRequest({ path, query });
  } catch (e) {
    if (e.message.indexOf('Parameter [syncToken] is invalid') > -1) {
      response = fullSyncCallLog({ syncLevel: params.syncLevel, dateFrom: lastSyncInfo.syncTime });
    } else {
      throw e;
    }
  }
  return response;
}

function syncCallLog(options: { dateFrom: string; dateTo: string; syncLevel: 'account' | 'extension'; syncType: string }) {
  let response;
  if (options.syncType === 'ISync') {
    response = iSyncCallLog({ syncLevel: options.syncLevel });
  } else {
    if (options.dateTo === 'latest') {
      response = fullSyncCallLog({
        dateFrom: options.dateFrom,
        syncLevel: options.syncLevel,
      });
    } else {
      const records = fetchCallLogList({
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        syncLevel: options.syncLevel
      });
      response = { records, syncInfo: {} };
    }
  }
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
  return syncInfo as {
    syncLevel: 'account' | 'extension';
    syncType: 'FSync' | 'ISync';
    syncToken: string;
    syncTime: string;
  }
}

function isRingCentralAdmin() {
  const extension = getExtensionInfo();
  return extension && extension.permissions && extension.permissions.admin && extension.permissions.admin.enabled;
}
