Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;
// add admob
VCC.Utils.addAdmob(win);

var controller = require("controller/detail");
controller = controller.create();

var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
  var callback = function() {
    controller.deleteDateData();
    setView();
    win.isChanged = true;
  };
  VCC.Utils.createDialog(L('str_to_delete'), [L('str_ok'), L('str_cancel')], [callback], 1, 1);
});

// header
var topChange = (isAndroid ? 44 : 0);  // change top position by os

var headerView = VCC.Utils.createHeaderView('', topChange, {prev: L('str_day_prev'), next: L('str_day_next')}, headerButtonClick);
win.add(headerView);
headerView.child.title.addEventListener('dblclick', onTitleClick);

// create table view
var tableViewOptions = {
  data: null,
  backgroundColor: 'transparent',
  rowBackgroundColor: 'white',
  top: topChange + 50,
  footerView: Ti.UI.createView({height: 48})
};
if (!isAndroid) {
  tableViewOptions.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
}
var tableView = Ti.UI.createTableView(tableViewOptions);
tableView.addEventListener('click', onTableViewClick);
var workTime = 0;
var dataWorks = [];
var dataInterrupts = [];
var tableData = null;
var restTimeData = null;
var regularTimeData = null;
var dbDatas = {};
var todayDateTime = 0;
var isAnimate = false;
var btnNextEnabled = false;

win.addEventListener('swipe', onSwipe);
win.focusCallback = function(isChangeWindow, isChangeTab) {
  //info('winDetail:' + [isChangeWindow, isChangeTab, Ti.UI.currentTab.window.tabIndex]);
  if (isChangeTab || getCurrentTab().window.tabIndex != Ti.App.Properties.getInt('tabIndex')) {
    setView();
  }
}

setView();
setTitle();
win.add(tableView);

function onSwipe(e) {
  if (!isAnimate) {
    var direction = e.direction == 'right' ? -1 : 1;
    if (direction == 1 && !btnNextEnabled) return;
    changeData(direction);
    if (direction == 1 && !btnNextEnabled) {
      VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
    }
  }
}

function onTitleClick(e) {
  openDateTime(todayDateTime);
}

win.openDateTime = openDateTime;
function openDateTime(dateTime) {
  if (win.dateTime != dateTime) {
    var direction = win.dateTime > dateTime ? -1 : 1;
    win.dateTime = dateTime;
    changePage(direction);
  }
}

function changeData(direction, callback) {
  win.dateTime = VCC.Utils.fixSummerDateTime(win.dateTime + 24 * 60 * direction);
  isAnimate = true;
  changePage(direction, callback);
}

function changePage(direction, callback) {
  var winWidth = Titanium.Platform.displayCaps.platformWidth;
  var oldTableView = tableView;
  tableView = Ti.UI.createTableView(tableViewOptions);
  tableView.addEventListener('click', onTableViewClick);
  tableView.left = winWidth * direction;
  tableView.right = -winWidth * direction;
  win.add(tableView);
  tableData = null;
  setView();
  VCC.Utils.slideView(win, tableView, oldTableView, direction, function() {
    isAnimate = false;
    setTitle();
    if (callback) {
      callback();
    }
  });
}

function headerButtonClick(e) {
  var btn = e.source;
  var direction = btn.action == 'prev' ? -1 : 1;
  VCC.Utils.setButtonEnabled(btn, false);
  changeData(direction, function() {
    if (btn.action == 'prev' || btnNextEnabled) {
      VCC.Utils.setButtonEnabled(btn, true);
    }
  });
}

function onTableViewClick(e) {
  var index = e.index;
  var section = e.section;
  var row = e.row;
  var rowdata = e.rowData;
  var tab = getCurrentTab();
  
  switch (row.action) {
  case 'picker':
    var limit = VCC.Utils.createMinMaxTime(dataWorks[row.dataIndex], row.type, win.dateTime, row.type == 'endTime' ? -1 : 0);
    var interruptStartTime = dataInterrupts.length ? dataInterrupts[0].startTime : null;
    var interruptEndTime = dataInterrupts.length ? dataInterrupts[dataInterrupts.length - 1].endTime : null;
    if (!interruptEndTime && dataInterrupts.length) {
      interruptEndTime = dataInterrupts[dataInterrupts.length - 1].startTime + 1;
    }
    if (row.type == 'startTime') {
      if (interruptStartTime) limit.maxTime = interruptStartTime - 1;
    } else {
      if (!dataWorks[row.dataIndex]) {
        return;
      }
      if (interruptEndTime) limit.minTime = interruptEndTime + 1;
    }
    var data = row.data;
    if (!data) {
      data = VCC.Utils.getDateTime(win.dateTime);
      if (limit.minTime && limit.minTime > data) {
        data = limit.minTime;
      }
    }
    if (limit.minTime < dbDatas.prevEndTime) limit.minTime = dbDatas.prevEndTime;
    if (!limit.maxTime && dbDatas.nextStartTime) {
      limit.maxTime = dbDatas.nextStartTime;
    }
    //info('data:' + data + ', limit.minTime:' + limit.minTime + ', limit.maxTime:' + limit.maxTime);
    if (limit.maxTime && limit.minTime > limit.maxTime) {
      VCC.Utils.createDialog(String.format(L('str_notice_going_to_work'), VCC.Utils.getTimeStr(dbDatas.prevStartTime, win.dateTime), VCC.Utils.getTimeStr(dbDatas.prevEndTime, win.dateTime)), [L('str_ok')]);
      return;
    }
    var winPicker = VCC.Utils.createWin('winPicker.js', null, {
      title: headerView.child.title.text + ' ' + row.child.title.text,
      data: data,
      minTime: limit.minTime,
      maxTime: limit.maxTime,
      dateTime: win.dateTime,
      isCloseOnChangeTab: true
    });
    winPicker.addEventListener('close', function(e) {
      if (e.source.returnData) {
        var value = e.source.returnData;
        if (row.data != value) {
          row.data = value;
          row.child.value.text = VCC.Utils.getTimeStr(row.data, win.dateTime);
          dataWorks[row.dataIndex] = controller.updateWorkData(row.dataIndex, row.type, row.data);
          setWorkTimeStr();
          win.isChanged = true;
          if (row.type == 'startTime') {
            toolBar.btnRight.enabled = true;
            VCC.Utils.setTableViewRowEnabled(tableData.endTime[row.dataIndex], true);
            VCC.Utils.setTableViewRowEnabled(tableData.suspend[0], true);
          }
        }
      } else if (e.source.onChangeTab) {
         setView();
      }
    });
    VCC.Utils.openWin(winPicker, tab);
    break;
  case 'settingBreak':
    var winSettingBreak = VCC.Utils.createWin('winSettingBreak.js', null, {  
      data: row.data
    });
    VCC.Utils.openWin(winSettingBreak, tab);
    break;
  case 'memo':
    var winMemo = VCC.Utils.createWin('winMemo.js', null, {  
      data: row.data
    });
    winMemo.addEventListener('close', function(e) {
      if (e.source.value !== undefined) {
        var value = e.source.value;
        if (row.data != value) {
          row.data = value;
          row.child.value.text = value.replace(/\n/g, ' ');
          controller.setMemo(value);
          win.isChanged = true;
        }
        if (e.source.value != '') {
          toolBar.btnRight.enabled = true;
        }
      }
    });
    VCC.Utils.openWin(winMemo, tab);
    break;
  case 'suspend':
    if (!dataWorks[0]) {
      // TODO
      return;
    }
    var data = VCC.Utils.copyObject(row.data);
    var minTime = dataWorks[0].startTime + 1;
    var maxTime = dataWorks[0].endTime ? (dataWorks[0].endTime - 1) : null;
    for (var i = 0; i < dataInterrupts.length; i++) {
      if (row.dataIndex == i) continue;
      if (i < row.dataIndex && dataInterrupts[i].endTime) {
        minTime = dataInterrupts[i].endTime;
      }
      if (i > row.dataIndex && dataInterrupts[i].startTime) {
        maxTime = dataInterrupts[i].startTime;
      }
    }
    if (minTime && maxTime && minTime > maxTime) {
      return;
    }
    var winSuspend = VCC.Utils.createWin('winSuspend.js', null, {
      data: data,
      dateTime: win.dateTime,
      minTime: minTime,
      maxTime: maxTime
    });
    winSuspend.addEventListener('close', function(e) {
      switch (e.source.returnAction) {
      case 'save':
        if (e.source.returnData !== undefined) {
          var value = e.source.returnData;
          var data = row.data || {};
          if (data.startTime != value.startTime || data.endTime != value.endTime) {
            //row.data = value;
            data.startTime = value.startTime;
            data.endTime = value.endTime;
            dataInterrupts[row.dataIndex] = controller.updateInterruptData(row.dataIndex, data.startTime, data.endTime);
            //row.data = dataInterrupts[row.dataIndex] = controller.updateInterruptData(row.dataIndex, data.startTime, data.endTime);
            //row.child.value.text = getInterruptStr(row.data.startTime, row.data.endTime);
            //setWorkTimeStr();
            setView();
            win.isChanged = true;
          }
        }
        break;
      case 'delete':
        if (dataInterrupts[row.dataIndex]) {
          dataInterrupts = controller.deleteInterrupt(row.dataIndex);
          setView();
          win.isChanged = true;
        }
        break;
      }
    });
    VCC.Utils.openWin(winSuspend, tab);
    break;
  }
}

function setTitle() {
  headerView.child.title.text = controller.getDateStr();
}

function initView() {
  var names = [
    'startTime',
    'endTime',
    'rest',
    'suspend',
    'worktime',
    'memo'
  ];
  tableData = {};
  var data = [];
  for (var i = 0; i < names.length; i++) {
    var row = createTableViewRow(names[i]);
    data.push(row);
    if (row.dataIndex == +row.dataIndex) {
      if (!tableData[names[i]]) tableData[names[i]] = [];
      tableData[names[i]].push(row);
    } else {
      tableData[names[i]] = row;
    }
  }
  tableView.data = data;
}

function setView() {
  //info('setView()');
  if (!tableData) {
    initView();
  }
  todayDateTime = VCC.Utils.getDayDateTime();
  info('todayDateTime:' + todayDateTime);
  var _btnNextEnabled = btnNextEnabled;
  btnNextEnabled = todayDateTime > win.dateTime;
  if (!isAnimate || !_btnNextEnabled) {
    VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
  }
  controller.setDateTime(win.dateTime);
  dbDatas = controller.getDateData();
  info('dbDatas:' + [dbDatas.workStates.length, dbDatas.interruptStates.length, dbDatas.memo]);
  toolBar.btnRight.enabled = !!(dbDatas.workStates.length || dbDatas.interruptStates.length || dbDatas.memo != '');
  dataWorks = dbDatas.workStates;
  dataInterrupts = dbDatas.interruptStates;
  restTimeData = controller.getRestTimeData();
  regularTimeData = controller.getRegularTimeData();
  var restStr = restTimeData.enabled ? VCC.Utils.createTimeRangeStr(restTimeData) : '';
  var interruptData = VCC.Utils.formatHourMinute(dbDatas.interruptTime);
  var calculateTime = VCC.Utils.calculateTime(dataWorks, dataInterrupts, [restTimeData], regularTimeData);
  workTime = calculateTime ? calculateTime.totalTime : 0;
  var workData = VCC.Utils.formatHourMinute(workTime);
  var isRowCountChange = false;
  var workEndTime = dataWorks[dataWorks.length - 1] ? dataWorks[dataWorks.length - 1].endTime : 0;
  var interruptEndTime = dataInterrupts[dataInterrupts.length - 1] ? dataInterrupts[dataInterrupts.length - 1].endTime : 0;
  var dataInterruptsLength = dataInterrupts.length;
  if (!dataInterruptsLength || (interruptEndTime && (!workEndTime || interruptEndTime < (workEndTime - 1)))) {
    dataInterruptsLength++;
  }
  info('tableData.startTime.length, dataWorks.length:' + [tableData.startTime.length, dataWorks.length]);
  if (tableData.startTime.length != (dataWorks.length || 1)) {
    isRowCountChange = true;
    var section = tableData.startTime[0].parent;
    if (tableData.startTime.length < dataWorks.length) {
      var startTime = tableData.startTime.slice(0, tableData.startTime.length);
      var works = [];
      var others = [];
      var isWorks = true;
      for (var i = 0; i < section.rows.length; i++) {
        if (section.rows[i].name == 'rest') {
          isWorks = false;
        }
        if (isWorks) {
          works.push(section.rows[i]);
        } else {
          others.push(section.rows[i]);
        }
      }
      var endTime = tableData.endTime.slice(0, tableData.endTime.length);
      for (var i = tableData.startTime.length; i < dataWorks.length; i++) {
        startTime[i] = createTableViewRow('startTime');
        endTime[i] = createTableViewRow('endTime');
        works.push(startTime[i]);
        works.push(endTime[i]);
      }
      tableData.startTime = startTime;
      tableData.endTime = endTime;
      section.rows = works.concat(others);
    } else {
      for (var i = dataWorks.length || 1; i < tableData.startTime.length; i++) {
        section.remove(tableData.startTime[i]);
        section.remove(tableData.endTime[i]);
      }
      tableData.startTime = tableData.startTime.slice(0, dataWorks.length || 1);
      tableData.endTime = tableData.endTime.slice(0, dataWorks.length || 1);
    }
  }
  info('tableData.suspend.length, dataInterruptsLength:' + [tableData.suspend.length, dataInterruptsLength]);
  if (tableData.suspend.length != dataInterruptsLength) {
    isRowCountChange = true;
    var section = tableData.suspend[0].parent;
    if (section) {
      if (tableData.suspend.length < dataInterruptsLength) {
        var suspend = tableData.suspend.slice(0, tableData.suspend.length);
        for (var i = tableData.suspend.length; i < dataInterruptsLength; i++) {
          suspend[i] = createTableViewRow('suspend');
          section.add(suspend[i]);
        }
        tableData.suspend = suspend;
      } else {
        for (var i = (dataInterruptsLength - 1) || 1; i < tableData.suspend.length; i++) {
          section.remove(tableData.suspend[i]);
        }
        tableData.suspend = tableData.suspend.slice(0, (dataInterruptsLength - 1) || 1);
      }
    }
  }
  if (isRowCountChange) {
    tableView.data = tableView.data;
  }
  info('dataWorks.length:' + dataWorks.length);
  for (var i = 0; i < 1 || i < dataWorks.length; i++) {
    var data = dataWorks[i] || {};
    var startData = data.startTime > 0 ? VCC.Utils.getTimeStr(data.startTime, win.dateTime) : '';
    var endData = data.endTime > 0 ? VCC.Utils.getTimeStr(data.endTime, win.dateTime) : '';
    VCC.Utils.setTableViewRowValues(tableData.startTime[i], {value: startData, data: data.startTime, dataIndex: i});
    VCC.Utils.setTableViewRowValues(tableData.endTime[i], {value: endData, data: data.endTime, dataIndex: i})
    VCC.Utils.setTableViewRowEnabled(tableData.endTime[i], startData != '');
  }
  //info('setTableViewRowValues:' + tableData.rest);
  VCC.Utils.setTableViewRowValues(tableData.rest, {value: restStr});
  info('dataInterrupts.length, tableData.suspend.length:' + [dataInterrupts.length, tableData.suspend.length]);
  for (var i = 0; i <= dataInterrupts.length; i++) {
    var data = dataInterrupts[i] || {};
    var interruptStr = getInterruptStr(data.startTime, data.endTime);
    VCC.Utils.setTableViewRowValues(tableData.suspend[i], {value: interruptStr, data: data, dataIndex: i});
    VCC.Utils.setTableViewRowEnabled(tableData.suspend[i], !!dataWorks[0]);
  }
  VCC.Utils.setTableViewRowValues(tableData.worktime, {value: workData, data: workTime});
  info([tableData.memo, typeof tableData.memo]);
  var memo = dbDatas.memo.replace(/\n/g, ' ');
  VCC.Utils.setTableViewRowValues(tableData.memo, {value: memo, data: dbDatas.memo, dbId: dbDatas.memoId});
}

// get time from seconds
function setWorkTimeStr() {
  var calculateTime = VCC.Utils.calculateTime(dataWorks, dataInterrupts, [restTimeData], regularTimeData);
  workTime = calculateTime ? calculateTime.totalTime : 0;
  tableData.worktime.child.value.text = VCC.Utils.formatHourMinute(workTime);
}
// get interrupt string
function getInterruptStr(startTime, endTime) {
  if (!startTime) return '';
  var str = VCC.Utils.getTimeStr(startTime, win.dateTime) + ' - ';
  var time = (endTime - startTime);
  if (endTime) {
    str += VCC.Utils.getTimeStr(endTime, win.dateTime) + '  ' + VCC.Utils.formatHourMinute(time);
  }
  return str;
}
function createTableViewRow(name) {
  var dataInfo = {
    'startTime': {title: L('str_on_work'), value: '', velueAlign: 'right', hasChild: true, action: 'picker', type: 'startTime', dataIndex: 0},
    'endTime': {title: L('str_leave'), value: '', velueAlign: 'right', hasChild: true, action: 'picker', type: 'endTime', dataIndex: 0},
    'rest': {title: L('str_rest'), value: '', velueAlign: 'right', selectionStyle: 'NONE'},
    'suspend': {title: L('str_suspend'), value: '', velueAlign: 'right', valueLeft: 60, hasChild: true, action: 'suspend', dataIndex: 0},
    'worktime': {header: L('str_worktime'), value: '', velueAlign: 'right', selectionStyle: 'NONE'},
    'memo': {header: L('str_memo'), value: '', velueAlign: 'left', hasChild: true, action: 'memo'}
  };
  var dataItem = dataInfo[name];
  dataItem.name = name;
  return VCC.Utils.createTableViewRow(dataItem);
}
