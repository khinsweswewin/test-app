Ti.include('utils.js');

var defaultRegularTime = {
  startTime: 9 * 60,
  endTime: 17 * 60
}
var defaultRestTime = {
  startTime: 12 * 60,
  endTime: 13 * 60
}

var win = Ti.UI.currentWindow;

// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;

var controller = require("controller/setting");
controller = controller.create();

var regularTimeData = controller.getRegularTimeData();
var restTimeData = controller.getRestTimeData();
var enabledStartTime = regularTimeData.startTime == +regularTimeData.startTime;
// create table view data object
var datas = [
  {
    header: L('str_setting_general'),
    title: L('str_regular_start'),
    value: enabledStartTime ? VCC.Utils.formatHourMinute(regularTimeData.startTime) : '',
    velueAlign: 'right',
    data: regularTimeData.startTime,
    hasChild: true,
    action: 'picker',
    type: 'startTime'
  },
  {
    title: L('str_regular_end'),
    value: regularTimeData.endTime == +regularTimeData.endTime ? VCC.Utils.formatHourMinute(regularTimeData.endTime) : '',
    velueAlign: 'right',
    data: regularTimeData.endTime,
    hasChild: enabledStartTime,
    selectionStyle: enabledStartTime ? 'BLUE' : 'NONE',
    action: 'picker',
    type: 'endTime'
  },
  {
    title: L('str_rest_fix'),
    value: makeRestTimeStr(restTimeData),
    velueAlign: 'right',
    data: restTimeData,
    hasChild: true,
    action: 'settingBreak',
    type: ''
  },
  {
    header: L('str_setting_mail_address'),
    //title: L('str_mail_address'),
    valueType: 'textField',
    callback: onEventTextField,
    hintText: L('str_setting_mail_address_hint'),
    value: controller.getMailAddress(),
    left: 10,
    selectionStyle: 'NONE',
    type: 'mailAddress'
  },
  {
    header: L('str_setting_others'),
    title: L('str_about'),
    hasChild: true,
    action: 'information',
    type: ''
  }
];
var tableDatas = [];
var optValues = ['type', 'hasChild', 'header', 'data'];
for (var i = 0; i < datas.length; i++) {
  var row = VCC.Utils.createTableViewRow(datas[i]);
  tableDatas.push(row);
}

// create table view
var tableViewOptions = {
	data: tableDatas,
	backgroundColor: 'transparent',
	rowBackgroundColor: 'white',
	top: 44
};
if (!isAndroid) {
  tableViewOptions.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
}

var tableView = Ti.UI.createTableView(tableViewOptions);
win.add(tableView);

tableView.addEventListener('click', function(e) {
  var index = e.index;
  var section = e.section;
  var row = e.row;
  var rowdata = e.rowData;
  var tab = Ti.UI.currentTab;

  switch (row.action) {
  case 'picker':
    var limitTime = VCC.Utils.createMinMaxTime(regularTimeData, row.type);
    var data = row.data;
    if (data === undefined) {
      data = defaultRegularTime[row.type];
    }
    var winPicker = VCC.Utils.createWin('winPicker.js', null, {  
      title: row.child.title.text,
      data: data,
      dataType: 'minutes',
      pickerType: Ti.UI.PICKER_TYPE_TIME,
      minTime: limitTime.minTime,
      maxTime: limitTime.maxTime
    });
    winPicker.addEventListener('close', function(e) {
      if (e.source.returnData) {
        var returnData = e.source.returnData;
        if (row.data != returnData) {
          controller.setRegularTime(row.type, returnData);
          regularTimeData[row.type] = row.data = returnData;
          row.child.value.text = VCC.Utils.formatHourMinute(row.data);
          win.isChanged = true;
          VCC.Utils.setTableViewRowEnabled(tableDatas[1], true);
        }
      }
    });
    VCC.Utils.openWin(winPicker, tab);
    break;
  case 'settingBreak':
    var data = VCC.Utils.copyObject(row.data);
    if (data.startTime == undefined && data.endTime == undefined) {
      for (var n in defaultRestTime) {
        data[n] = defaultRestTime[n];
      }
    }
    var winSettingBreak = VCC.Utils.createWin('winSettingBreak.js', null, {
      data: data
    });
    winSettingBreak.addEventListener('close', function(e) {
      if (e.source.returnData) {
        var returnData = e.source.returnData;
        if (!VCC.Utils.compareObject(row.data, returnData)) {
          controller.setRestTimeData(returnData);
          restTimeData = row.data = returnData;
          row.child.value.text = makeRestTimeStr(row.data);
          win.isChanged = true;
        }
      }
    });
    VCC.Utils.openWin(winSettingBreak, tab);
    break;
  case 'information':
    var winInfo = VCC.Utils.createWin('winInformation.js');
    VCC.Utils.openWin(winInfo, tab);
    break;
  }
});

function makeRestTimeStr(restTimeData) {
  if (restTimeData.enabled) {
    return VCC.Utils.createTimeRangeStr(restTimeData);
  } else {
    return L('str_off');
  }
}

function onEventTextField(e) {
  var textField = e.source;
  if (textField.type == 'mailAddress') {
    controller.setMailAddress(textField.value);
  }
}
