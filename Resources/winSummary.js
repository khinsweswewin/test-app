Ti.include('utils.js');

var win = Ti.UI.currentWindow;

// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;

var controller = require("controller/summary");
controller = controller.create();

var pageYear;
var pageMonth;

if (!pageYear) {
  var now = VCC.Utils.makeDate();
  pageYear = now.year;
  pageMonth = now.month;
}
// add admob
VCC.Utils.addAdmob(win);

var toolBar = win.toolBar;
// setting toolbar
toolBar.btnRight.addEventListener('click', function(e) {
  controller.exportProcess();
});

// header
var headerView = VCC.Utils.createHeaderView('', 44, {prev: L('str_month_prev'), next: L('str_month_next')}, headerButtonClick);
win.add(headerView);
headerView.child.title.addEventListener('dblclick', onTitleClick);

var tableView = null;
var tableData = null;
var isAnimate = false;
var btnNextEnabled = false;

win.addEventListener('swipe', onSwipe);
win.focusCallback = function(isChangeWindow, isChangeTab) {
  if (isChangeTab) {
    setView();
  }
}

setView();
setTitle();

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
  var winWidth = Titanium.Platform.displayCaps.platformWidth;
  var oldTableView = tableView;
  tableData = null;
  setView(winWidth * direction);
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

function setView(offsetLeft) {
  controller.setYaerMonth(pageYear, pageMonth);
  var todayDateTime = VCC.Utils.getDayDateTime();
  var endDateTime = controller.getEndDateTime();
  var _btnNextEnabled = btnNextEnabled;
  btnNextEnabled = todayDateTime > endDateTime;
  if (!isAnimate || !_btnNextEnabled) {
    VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
  }
  var summary = controller.getMonthlySummary();
  var workTimeTotal = summary.totalTime;
  var overTimeTotal = summary.overTime;
  var salaryTotal = typeof summary.salaryTotal == 'undefined' ? L('str_set_wage_message') : summary.salaryTotal;
  // create table view data object
  var datas = [
    {name: 'daysCount', title: L('str_work_days'), data: summary.workDay + L('str_days')},
    {name: 'totalWork', header: '', title: VCC.Utils.removeReturnCodeInIpad(L('str_worktime', null, true) + '\n（' + L('str_total', null, true) + '）'), data: VCC.Utils.formatHourMinute(workTimeTotal)},
    {name: 'averageWork', title: VCC.Utils.removeReturnCodeInIpad(L('str_worktime', null, true) + '\n（' + L('str_average', null, true) + '）'), data: VCC.Utils.formatHourMinute(summary.workDay ? (workTimeTotal / summary.workDay) : 0)},
    {name: 'totalOver', header: '', title: VCC.Utils.removeReturnCodeInIpad(L('str_work_overtime', null, true) + '\n（' + L('str_total', null, true) + '）'), data: VCC.Utils.formatHourMinute(overTimeTotal)},
    {name: 'averageOver', title: VCC.Utils.removeReturnCodeInIpad(L('str_work_overtime', null, true) + '\n（' + L('str_average', null, true) + '）'), data: VCC.Utils.formatHourMinute(summary.workDay ? (overTimeTotal / summary.workDay) : 0)},
    {name: 'totalSalary', header: '', title: L('str_salary') + '（' + L('str_total') + '）', data: salaryTotal},
  ];
  if (!tableData) {
    tableData = {};
    var data = [];
    for (var i = 0; i < datas.length; i++) {
      var dataItem = datas[i];
      var child = {};
      var row = Ti.UI.createTableViewRow({
        className: 'datarow'
      });
      if (dataItem.header != null) {
        row.header = dataItem.header;
      }
      var title = Ti.UI.createLabel({
        color: '#000',
        textAlign: 'left',
        left: 10,
        text: dataItem.title
      });
      row.add(title);
      child.title = title;
      var time = Ti.UI.createLabel({
        color: '#222',
        textAlign: 'right',
        right: (isAndroid ? 35 : 20),
        text: dataItem.data
      });
      row.add(time);
      child.time = time;
      row.child = child;
      data.push(row);
      if (dataItem.name) tableData[dataItem.name] = row;
    }
  
    // create table view
    var tableViewOptions = {
      data:data,
      backgroundColor:'transparent',
      rowBackgroundColor:'white',
      top: 90,
      allowsSelection: false,
      footerView: Ti.UI.createView({height: 48})
    };
    if (offsetLeft) {
      tableViewOptions.left = offsetLeft;
      tableViewOptions.right = -offsetLeft;
    }
    if (!isAndroid) {
      tableViewOptions.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
    }
    tableView = Ti.UI.createTableView(tableViewOptions);
    // create table view event listener
    win.add(tableView);
  } else {
    for (var i = 0; i < datas.length; i++) {
      var dataItem = datas[i];
      if (!dataItem.name) continue;
      var row = tableData[dataItem.name];
      row.child.time.text = dataItem.data;
    }
  }
}