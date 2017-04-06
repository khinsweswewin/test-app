var utils = require('utils.js');
var VCC = utils.VCC;

function initialize(win) {
  // get param from app.js
  var isAndroid = Ti.App.VCC.isAndroid;

  var winData = win.data || {};
  if (winData.startTime < win.dateTime) {
    winData.startTime = 0;
  }
  if (winData.endTime < win.dateTime) {
    winData.endTime = 0;
  }

  var toolBar = win.toolBar;
  toolBar.btnRight.addEventListener('click', function(e) {
    // 保存と前の画面に戻る処理
    var callback = function() {
      win.returnAction = 'delete';
      win.close();
    };
    VCC.Utils.createDialog(L('str_to_delete'), [L('str_ok'), L('str_cancel')], [callback], 1, 1);
  });

  //win.data = win.data || {};
  // create table view data object
  var datas = [
    {title: L('str_suspend_start'), value: VCC.Utils.getTimeStr(winData.startTime, win.dateTime), data: winData.startTime, type: 'startTime', action: 'picker'},
    {title: L('str_return'), value: VCC.Utils.getTimeStr(winData.endTime, win.dateTime), data: winData.endTime, type: 'endTime', action: 'picker'}
  ];
  var tableDatas = [];
  for (var i = 0; i < datas.length; i++) {
    var child = {};
    var dataItem = datas[i];
    var row = Ti.UI.createTableViewRow({
      className: 'datarow',
      hasChild: true,
      height: 44,
      data: dataItem.data,
      type: dataItem.type,
      action: dataItem.action
    });
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
      text: dataItem.value,
    });
    row.add(value);
    child.value = value;
    row.child = child;
    tableDatas.push(row);
  }
  if (!winData.startTime) {
    VCC.Utils.setTableViewRowEnabled(tableDatas[1], false);
  }

  // create table view
  var tableViewOptions = {
    data: tableDatas,
    backgroundColor: 'transparent',
    rowBackgroundColor: 'white',
    top: (isAndroid ? 104 : 60),
    scrollable: false
  };
  if (!isAndroid) {
    tableViewOptions.style = Ti.UI.iOS.TableViewStyle.GROUPED;
  }

  var tableView = Ti.UI.createTableView(tableViewOptions);
  win.add(tableView);
  toolBar.btnRight.enabled = !!(winData.startTime && winData.endTime);

  var button = Ti.UI.createButton({
    titleid: 'str_finish',
    color: '#000',
    font: {fontSize:20},
    backgroundImage: 'images/button_large.png',
    backgroundLeftCap: 30.0,
    height: 66,
    width: 215,
    top: Titanium.Platform.displayCaps.platformHeight / 2 - 20
  });
  button.addEventListener('click', function(e) {
    // 保存と前の画面に戻る処理
    win.returnAction = 'save';
    win.returnData = winData;
    win.close();
  });
  win.add(button);

  tableView.addEventListener('click', function(e) {
    var index = e.index;
    var section = e.section;
    var row = e.row;
    var rowdata = e.rowData;

    if (row.action == 'picker') {
      var minTime = win.minTime;
      var maxTime = win.maxTime;
      if (row.type == 'startTime') {
        if (winData.endTime) {
          maxTime = winData.endTime - 1;
        }
      } else {
        if (!winData.startTime) {
          return;
        }
        minTime = winData.startTime + 1;
      }
      var data = row.data;
      if (!data) {
        data = VCC.Utils.getDateTime(win.dateTime);
      }
      var winPicker = VCC.Utils.createWin('winPicker.js', null, {
        title: row.child.title.text,
        data: data,
        minTime: minTime,
        maxTime: maxTime,
      });
      winPicker.addEventListener('close', function(e) {
        if (e.source.returnData) {
          var value = e.source.returnData;
          if (row.data != value) {
            row.data = value;
            row.child.value.text = VCC.Utils.getTimeStr(row.data, win.dateTime);
            winData[row.type] = value;
            toolBar.btnRight.enabled = true;
            if (row.type == 'startTime') {
              VCC.Utils.setTableViewRowEnabled(tableDatas[1], true);
            }
          }
        }
      });
      VCC.Utils.openWin(winPicker, utils.getCurrentTab());
    }
  });
}

exports.initialize = initialize;
