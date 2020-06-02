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

const CALL_LOG_LEG_KEYS = ['startTime', 'duration', 'type', 'direction', 'action', 'result', 'to.phoneNumber', 'to.name', 'from.phoneNumber', 'from.name', 'transport', 'legType'];

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
    const legsKeys = []
    const legArray = [0, 1, 2, 3]
    legArray.forEach((index) => {
      CALL_LOG_LEG_KEYS.forEach((key) => {
        legsKeys.push(`leg_${index}_${key}`);
      })
    });
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
      'Billing costIncluded',
      'Billing costPurchased',
      ...legsKeys
    ]);
  }
  result.records.forEach((call) => {
    const legsValues = [];
    (call.legs || []).forEach((leg) => {
      CALL_LOG_LEG_KEYS.forEach((key) => {
        if (key.indexOf('.') === -1) {
          legsValues.push(leg[key] || null);
          return;
        }
        const keys = key.split('.');
        legsValues.push(leg[keys[0]] && leg[keys[0]][keys[1]] || null);
      })
    });
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
      call.from && call.from.name,
      call.billing && call.billing.costIncluded,
      call.billing && call.billing.costPurchased,
      ...legsValues
    ]);
  });
  return result.syncInfo;
}
