//winSettingWage.js

Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;

var winData = VCC.Utils.copyObject(win.data);

win.toolBar.btnRight.addEventListener('click', function(e) {
  // 保存と前の画面に戻る処理
  win.returnData = winData;
  win.close();
});

var s1 = Ti.UI.createSwitch({
  value: win.data.enabled == 1,
  top: (isAndroid ? 74 : 30)
});
win.add(s1);

// create table view data object
var datas = [
  {
    title: L('str_set_wage'),
    hintText: L('str_set_wage_hint'),
    valueType: 'textField',
    callback: onEventTextField,
    hasChild: false,
    selectionStyle: 'NONE',
    type: 'setWage',
    value: typeof winData.value == 'undefined' ? '' : winData.value,
    left: 100
  }
];
var data = [];
for (var i = 0; i < datas.length; i++) {
  var dataItem = datas[i];
  var row = VCC.Utils.createTableViewRow(VCC.Utils.extend({
    className: 'datarow',
    hasChild: true
  }, dataItem));
  data.push(row);
}

// create table view
var tableViewOptions = {
  data: data,
  backgroundColor: 'transparent',
  rowBackgroundColor: 'white',
  top: (isAndroid ? 124 : 80),
  scrollable: false
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

  if (row.action == 'picker') {
    var limitTime = VCC.Utils.createMinMaxTime(winData, row.type);
    var winPicker = VCC.Utils.createWin('winPicker.js', null, {  
      data: row.data,
      dataType: 'minutes',
      pickerType: Ti.UI.PICKER_TYPE_TIME,
      minTime: limitTime.minTime,
      maxTime: limitTime.maxTime
    });
    winPicker.addEventListener('close', function(e) {
      if (e.source.returnData) {
        var returnData = e.source.returnData;
        if (row.data != returnData) {
          winData[row.type] = row.data = returnData;
          row.child.value.text = VCC.Utils.formatHourMinute(row.data);
        }
      }
    })
    VCC.Utils.openWin(winPicker, Ti.UI.currentTab);
  }
});

s1.addEventListener('change', swichChange);
swichChange(s1);
function swichChange(e) {
  // e.value にはスイッチの新しい値が true もしくは false として設定されます。
  if (e.value == true) {
    tableView.show();
    winData.enabled = 1;
  } else {
    tableView.hide();
    winData.enabled = 0;
  }
}

function onEventTextField(e) {
  var textField = e.source;
  Ti.API.info('textField.type:' + textField.type);
  Ti.API.info('textField.value:' + [textField.value, /^([0-9.]*)$/.test(textField.value)]);
  var value = parseFloat(textField.value);
  if (isNaN(value)) {
    textField.value = '';
  } else {
    textField.value = value;
  }
  winData.value = textField.value;
//  if (textField.type == 'mailAddress') {
//    controller.setMailAddress(textField.value);
//  }
}
