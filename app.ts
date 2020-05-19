function onOpen() {
  SpreadsheetApp.getUi()
      .createMenu('RingCentral')
      .addItem('Authorization', 'showAuthorizationDialog')
      .addItem('Sync Call Log', 'showCallLogDialog')
      .addToUi();
}

function onInstall() {
  onOpen();
}

function showAuthorizationDialog() {
  const html = HtmlService.createTemplateFromFile('authorization')
      .evaluate()
      .setWidth(400)
      .setHeight(200);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Authorization');
}

function showCallLogDialog() {
  const hasAccess = checkRingCentralAuthorized();
  if (!hasAccess) {
    showAuthorizationDialog();
    return;
  }
  const html = HtmlService.createTemplateFromFile('callLog')
      .evaluate()
      .setWidth(500)
      .setHeight(400);
  SpreadsheetApp.getUi()
      .showModalDialog(html, 'Sync RingCentral Call Log');
}

function syncCallsIntoSheet(options) {
  const result = syncCallLog(options);
  let sheet;
  if (options.sheet === 'new') {
    const spreedSheet = SpreadsheetApp.getActiveSpreadsheet();
    sheet = spreedSheet.insertSheet('New Sheet ' + Date.now());
  } else {
    sheet = SpreadsheetApp.getActiveSheet();
  }
  if (options.syncType === 'FSync' || options.sheet === 'new') {
    sheet.appendRow([
      'Session Id',
      'Direction',
      'Start Time',
      'Duration',
      'Type',
      'Action',
      'Result',
      'To Number',
      'To Name',
      'From Number',
      'From Name',
    ]);
  }
  result.records.forEach((call) => {
    sheet.appendRow([
      call.sessionId,
      call.direction,
      call.startTime,
      call.duration,
      call.type,
      call.action,
      call.result,
      call.to && (call.to.phoneNumber || call.to.extensionNumber),
      call.to && call.to.name,
      call.from && (call.from.phoneNumber || call.from.extensionNumber),
      call.from && call.from.name
    ]);
  });
  return result.syncInfo;
}
