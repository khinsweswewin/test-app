Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;

var winData = VCC.Utils.copyObject(win.data);

var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
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
  {title: L('str_rest_start'), value: VCC.Utils.formatHourMinute(win.data.startTime), data: win.data.startTime, action: 'picker', type: 'startTime'},
  {title: L('str_rest_end'), value: VCC.Utils.formatHourMinute(win.data.endTime), data: win.data.endTime, action: 'picker', type: 'endTime'},
];
var data = [];
for (var i = 0; i < datas.length; i++) {
  var dataItem = datas[i];
  var row = Ti.UI.createTableViewRow({
    className: 'datarow',
    hasChild: true,
    data: dataItem.data,
    action: dataItem.action,
    type: dataItem.type
  });
  var child = {};
  var title = Ti.UI.createLabel({
    color: '#000',
    textAlign: 'left',
    left: 10,
    text: dataItem.title
  });
  row.add(title);
  child.title = title;
  var value = Ti.UI.createLabel({
    color: '#222',
    textAlign: 'right',
    right: (isAndroid ? 35 : 20),
    text: dataItem.value
  });
  row.add(value);
  child.value = value;
  row.child = child;
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