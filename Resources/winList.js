Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;

var controller = require("controller/list");
controller = controller.create();

var pageYear;
var pageMonth;

if (!pageYear) {
  var now = VCC.Utils.makeDate();
  pageYear = now.year;
  pageMonth = now.month;
}

var titleWidth = Ti.Platform.displayCaps.platformWidth > 320 ? 100 : 80;
var titleSize = VCC.Utils.getStringBytesLength(L('str_sunday')) > 6 && titleWidth < 100 ? 16:  20;
var totalLeft = Ti.Platform.displayCaps.platformWidth / 2 + 70;

// add admob
VCC.Utils.addAdmob(win);

// setting toolbar
var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
  controller.exportProcess();
});
// header
var headerView = VCC.Utils.createHeaderView('', 44, {prev: L('str_month_prev'), next: L('str_month_next')}, headerButtonClick);
win.add(headerView);
headerView.child.title.addEventListener('dblclick', onTitleClick);
headerView.child.title.addEventListener('swipe', onSwipe);

var tableView = null;
var tableData = null;
var workTotalTime = 0;
var isAnimate = false;
var btnNextEnabled = false;

//win.addEventListener('swipe', onSwipe);
win.focusCallback = function(isChangeWindow, isChangeTab) {
  var updateList = VCC.Utils.getGlobal('updateList');
  if (isChangeTab || updateList) {
    setView();
  } else if (isChangeWindow) {
    win.winDetail = null;
  }
}

setView();
setTitle();

if (win.openWinDetailDateTime) {
  setTimeout(function() {
    openWinDetail(win.openWinDetailDateTime);
    win.openWinDetailDateTime = 0;
  }, 0);
}

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
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth() + 1;
  if (year != pageYear || month != pageMonth) {
    var direction = (pageYear * 100 + pageMonth) > (year * 100 + month) ? -1 : 1;
    pageYear = year;
    pageMonth = month;
    changePage(direction);
    VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
  }
}

function changeData(direction, callback) {
  pageMonth += direction;
  if (pageMonth == 0) {
    pageMonth = 12;
    pageYear--;
  } else if (pageMonth == 13) {
    pageMonth = 1;
    pageYear++;
  }
  changePage(direction, callback);
}

function changePage(direction, callback) {
  isAnimate = true;
  var winWidth = Ti.Platform.displayCaps.platformWidth;
  var oldTableView = tableView;
  tableData = null;
  initView(winWidth * direction);
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
  VCC.Utils.setButtonEnabled(btn, false);
  changeData(btn.action == 'prev' ? -1 : 1, function() {
    if (btn.action == 'prev' || btnNextEnabled) {
      VCC.Utils.setButtonEnabled(btn, true);
    }
  });
}

function setTitle() {
  headerView.child.title.text = VCC.Utils.formatDate(pageYear, pageMonth);
}

function setView() {
  Ti.API.info('setView(), winList');
  if (!tableData) {
    initView();
  }
  controller.setYaerMonth(pageYear, pageMonth);
  var dbDatas = controller.getMonthlyData();
  var lastDay = dbDatas.length;
  if (tableData.dayRows.length != lastDay) {
    var data = tableView.data;
    if (tableData.dayRows.length < lastDay) {
      for (var i = tableData.dayRows.length; i < lastDay; i++) {
        var row = createDayRow();
        tableData.dayRows.push(row);
      }
      var rows = data[0].rows;
      var newRows = [rows[0]];
      newRows = newRows.concat(tableData.dayRows, [rows[rows.length - 1]]);
      data[0].rows = newRows;
    } else {
      for (var i = lastDay; i < tableData.dayRows.length; i++) {
        data[0].remove(tableData.dayRows[i]);
      }
      tableData.dayRows = tableData.dayRows.slice(0, lastDay);
    }
    tableView.data = data;
  }
  var startDayOfWeek = controller.getStartDayOfWeek();
  var startDateTime = controller.getStartDateTime();
  var todayDateTime = VCC.Utils.getDayDateTime();
  var endDateTime = controller.getEndDateTime();
  var _btnNextEnabled = btnNextEnabled;
  btnNextEnabled = todayDateTime > endDateTime;
  if (!isAnimate || !_btnNextEnabled) {
    VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
  }
  workTotalTime = 0;
  for (var i = 0; i < lastDay; i++) {
    var row = tableData.dayRows[i];
    row.child.title.text = VCC.Utils.formatDate(null, null, i + 1, (startDayOfWeek + i) % 7);
    var strTime = '', strWorkTime = '', isMemo = false, workTime = 0;
    if (dbDatas[i] != undefined) {
      var day = 0;
      var timeStr = VCC.Utils.createStartEndTimeStr(dbDatas[i], null, true);
      strTime = timeStr.startTime ? (timeStr.startTime + ' - ' + timeStr.endTime) : '';
      if (timeStr.endTime) {
        workTime = dbDatas[i].totalTime || 0;
        strWorkTime = VCC.Utils.formatHourMinute(workTime, null, true);
      }
      isMemo = dbDatas[i].isMemo;
    }
    row.child.memo.visible = isMemo;
    row.child.time.text = strTime;
    row.child.total.text = strWorkTime;
    row.dateTime = startDateTime + 24 * 60 * i;
    row.workTime = workTime;
    row.hasChild = row.dateTime <= todayDateTime;
    //row.selectedBackgroundColor = row.hasChild ? undefined : '#fff';
    if (row.hasChild) {
      if (row.selectedBackgroundColor) delete row.selectedBackgroundColor;
    } else {
      row.selectedBackgroundColor = '#fff';
    }
    workTotalTime += workTime;
  }
  tableData.total.text = createWorkTotalStr(workTotalTime);
  VCC.Utils.setGlobal('updateList', false);
  //tableView.data = tableView.data;
}
function initView(offsetLeft) {
  tableData = {totalRows: [], dayRows: []};
  // tab view
  var rowData = [];
  // total
  var lblTotal = Ti.UI.createLabel({
    text: L('str_total_worktime'),
    color: '#000',
    textAlign: 'center'
  });
  var totalRow = Ti.UI.createTableViewRow({
    backgroundColor: '#fff',
    selectedBackgroundColor: '#fff',
    className: 'total'
  });
  Ti.API.info('totalRow:' + totalRow);
  Ti.API.info('totalRow.add:' + totalRow.add);
  totalRow.add(lblTotal);
  tableData.total = lblTotal;
  rowData.push(totalRow);
  tableData.totalRows.push(totalRow);
  for (var i = 0; i < 28; i++) {
    var row = createDayRow();
    rowData.push(row);
    tableData.dayRows.push(row);
  }
  rowData.push(totalRow);
  tableData.totalRows.push(totalRow);
  var tableViewOptions = {
    data: rowData,
    top: 89,
    footerView: Ti.UI.createView({height: 48})
  };
  if (offsetLeft) {
    tableViewOptions.left = offsetLeft;
    tableViewOptions.right = -offsetLeft;
  }
  tableView = Ti.UI.createTableView(tableViewOptions);
  win.add(tableView);
  tableView.addEventListener('click', function(e) {
    var index = e.index;
    var section = e.section;
    var row = e.row;
    if (row.hasChild && row.dateTime) {
      var rowdata = e.rowData;
      openWinDetail(row.dateTime);
    }
  });
}

win.openWinDetail = openWinDetail;

function openWinDetail(dateTime) {
  if (win.winDetail) {
    win.winDetail.openDateTime(dateTime);
  } else {
    win.winDetail = VCC.Utils.createWin('winDetail.js', win, {  
      dateTime: dateTime
    });
    win.winDetail.addEventListener('close', function(e) {
      if (e.source.isChanged) {
        setView();
      }
      win.winDetail = null;
    });
    VCC.Utils.openWin(win.winDetail, Ti.UI.currentTab);
  }
}

function createDayRow() {
  var child = {};
  var row = Ti.UI.createTableViewRow({
    className: 'datarow',
    hasChild: true
  });
  var left = 0;
  var title = Ti.UI.createLabel({
    color:'#000',
    font: {fontSize: titleSize},
    width: titleWidth,
    textAlign: 'center',
    left: left,
    text: ''
  });
  row.add(title);
  child.title = title;
  left += titleWidth;
  var memo = Ti.UI.createImageView({
    left: left,
    height: 28,
    width: 24,
    image: 'images/ico_write_s.png',
    visible: false
  });
  row.add(memo);
  child.memo = memo;
  left += 30;
  var time = Ti.UI.createLabel({
    color: '#222',
    textAlign: 'left',
    left: left,
    width: totalLeft - left,
    text: ''
  });
  row.add(time);
  child.time = time;
  var total = Ti.UI.createLabel({
    color: '#222',
    textAlign: 'left',
    left: totalLeft,
    text: ''
  });
  row.add(total);
  child.total = total;
  row.child = child;
  return row;
}
function createWorkTotalStr(workTotalTime) {
  var time = Math.round(workTotalTime * 10 / 60);
  return L('str_total_worktime') + ' ' + (time / 10) + 'h';
}
