var utils = require('utils.js');
var VCC = utils.VCC;
var info = utils.info;

//initialize(Ti.UI.currentWindow);
var isOldiOS = Ti.App.VCC.isOldiOS;
var offsetTop = VCC.Utils.statusBarHeight();

function initialize(win) {

// get param from app.js
//var isAndroid = Ti.App.VCC.isAndroid;

  var controller = null;
  
  var pageYear;
  var pageMonth;
  
  var titleWidth = Ti.Platform.displayCaps.platformWidth > 320 ? 100 : 80;
  var titleSize = VCC.Utils.getStringBytesLength(L('str_sunday')) > 6 && titleWidth < 100 ? 16:  20;
  var totalLeft = Ti.Platform.displayCaps.platformWidth / 2 + 70;
  
  // setting toolbar
  var toolBar = null;
  // header
  var headerView = null;
  
  var tableView = null;
  var tableData = null;
  var workTotalTime = 0;
  var isAnimate = false;
  var btnNextEnabled = false;
  
  var views = [{}, {}];
  var viewIndex = 0;

  win.focusCallback = function(isChangeWindow, isChangeTab) {
    setTimeout(setup, 0);
  };

  function setup() {
    controller = require("controller/list");
    controller = controller.create();

    if (!pageYear) {
      var yearMonth = controller.getCurrentPageYearMonth();
      pageYear = yearMonth.year;
      pageMonth = yearMonth.month;
    }

    var rightOpt = {image: 'images/ico_write.png'};
    if (!isAndroid) {
      rightOpt.style = Ti.UI.iOS.SystemButtonStyle.BORDERED;
    }
    toolBar = win.toolBar;
    VCC.Utils.setToolbarButton(toolBar);
    toolBar.btnRight.addEventListener('click', function(e) {
      controller.exportProcess();
    });

    headerView = VCC.Utils.createHeaderView('', offsetTop + 44, {prev: L('str_month_prev'), next: L('str_month_next')}, headerButtonClick);
    win.add(headerView);
    headerView.child.title.addEventListener('dblclick', onTitleClick);
    headerView.child.title.addEventListener('swipe', onSwipe);

    //win.addEventListener('swipe', onSwipe);
    win.focusCallback = function(isChangeWindow, isChangeTab) {
      var updateList = VCC.Utils.getGlobal('updateList');
      if (isChangeTab || updateList) {
        setView();
      } else if (isChangeWindow) {
        win.winDetail = null;
      }
    };
    setTitle();
    setView();
    // add admob
    setTimeout(function() {
      VCC.Utils.addAdmob(win);
    }, 0);

    if (win.openWinDetailDateTime) {
      setTimeout(function() {
        openWinDetail(win.openWinDetailDateTime);
        win.openWinDetailDateTime = 0;
      }, 0);
    }
  }
  
  function onSwipe(e) {
    if (!isAnimate) {
      var direction = e.direction == 'right' ? -1 : 1;
      if (direction == 1 && !btnNextEnabled) return;
      changeData(direction);
      setTimeout(function() {
        if (direction == 1 && !btnNextEnabled) {
          VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
        }
      }, 0);
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
    var oldTableView = views[viewIndex].tableView;
    tableView = null;
    tableData = null;
    //initView(winWidth * direction);
    setView(winWidth * direction);
    var tableView = views[viewIndex].tableView;
    setTimeout(function() {
    VCC.Utils.slideView(win, tableView, oldTableView, direction, function() {
      isAnimate = false;
      setTitle();
      if (callback) {
        callback();
      }
    }, false);
    }, 500);
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
    if (offsetLeft) {
      viewIndex = (viewIndex + 1) % 2;
    }
    var view = views[viewIndex];
    if (!view.tableData) {
      initView(offsetLeft);
    } else if (offsetLeft) {
      view.tableView.left = offsetLeft;
      view.tableView.right = -offsetLeft;
    }
    setTimeout(function() {
      _setView(view, offsetLeft);
    }, 0);
  }
  function _setView(view, offsetLeft) {
    //info('setView(), winList:' + view.tableData);
    var isUpdate = false;
    var todayDateTime = VCC.Utils.getDayDateTime();
    controller.setYaerMonth(pageYear, pageMonth);
    var startDateTime = controller.getStartDateTime();
    if (todayDateTime < startDateTime) {
      var date = new Date(todayDateTime * 60000);
      pageYear = date.getFullYear();
      pageMonth = date.getMonth() + 1;
      setTitle();
      controller.setYaerMonth(pageYear, pageMonth);
      startDateTime = controller.getStartDateTime();
    }
    var startDayOfWeek = controller.getStartDayOfWeek();
    //info('startDayOfWeek:' + startDayOfWeek);
    var endDateTime = controller.getEndDateTime();
    var dbDatas = controller.getMonthlyData();
    var lastDay = dbDatas.length;
    var cuttOffDate = controller.getCuttOffDate();
    var _btnNextEnabled = btnNextEnabled;
    btnNextEnabled = todayDateTime > endDateTime;
    if (!isAnimate || !_btnNextEnabled) {
      VCC.Utils.setButtonEnabled(headerView.child.btnNext, btnNextEnabled);
    }
    workTotalTime = 0;

    //info('tableView.data:' + view.tableView.data);
    var data = view.tableView.data;
    //var sections = [data[1], data[2]];
    var sections = [Ti.UI.createTableViewSection(), Ti.UI.createTableViewSection()];
    //info('sections[0].headerTitle:' + sections[0].headerTitle);
    if (!cuttOffDate) {
      cuttOffDate = 0;
  //    sections[0].headerView.hide();
  //    sections[1].headerView.hide();
      if (sections[0].headerTitle != null) {
        delete sections[0].headerTitle;
      }
      if (sections[1].headerTitle != null) {
        delete sections[1].headerTitle;
      }
    } else {
      var month = pageMonth - 1;
      if (month == 0) {
        month = 12;
      }
  //    sections[0].headerView.show();
  //    sections[1].headerView.show();
      var monthStr1 = L('str_month_' + month) + L('str_month');
      var monthStr2 = L('str_month_' + pageMonth) + L('str_month');
      if (data[1].headerTitle != monthStr1) {
        data[1].headerTitle = sections[0].headerTitle = monthStr1;
      }
      if (data[2].headerTitle != monthStr2) {
        data[2].headerTitle = sections[1].headerTitle = monthStr2;
      }
    }
    var dayLnegths = [lastDay - cuttOffDate, cuttOffDate];
    //info('data[1].rows.length:' + (data[1].rows ? data[1].rows.length : 0));
    //info('data[2].rows.length:' + (data[2].rows ? data[2].rows.length : 0));
    //info('dayLnegths.length:' + dayLnegths.length);
    var index = 0;
    var day;
    for (var k = 0; k < dayLnegths.length; k++) {
      day = k == 0 ? (k + dayLnegths[1]) : (k + 1);
      var section = sections[k];
      var rows = view.tableData.sectionRows[k];
      //view.tableView.remove(section);
      //if (k == 1) break;
      var row;
      for (var i = 0; i < dayLnegths[k]; i++) {
        //info('k:' + k + ', i:' + i);
        if (rows.length > i) {
          row = rows[i];
        } else {
          row = createDayRow();
          //info('createDayRow');
          rows.push(row);
          //section.add(row);
          isUpdate = true;
        }
        var dateTime = controller.getDateTime(index);
        workTotalTime += 
        setRowData(
          row,
          dbDatas[index],
          (k == 0 ? (cuttOffDate + index) : (index - dayLnegths[0])) + 1,
          (startDayOfWeek + index) % 7,
          dateTime,
          dateTime <= todayDateTime
          );
        index++;
      }
      if (rows.length > dayLnegths[k]) {
        //info('length:' + [rows.length, dayLnegths[k]]);
        var n = rows.length - dayLnegths[k];
        for (var i = 0; i < n; i++) {
          var row = rows.pop();
          //section.remove(row);
          //view.tableView.remove(row);
        }
        isUpdate = true;
      }
      view.tableData.sectionRows[k] = rows;
      section.rows = rows;
      data[k + 1] = section;
      //data[k + 1].rows = rows;
      //if (imgLoading) {
        //win.remove(imgLoading);
        //imgLoading = null;
      //}
    }
    info('tableView.data[1]:' + [data[1].rows.length, data[1].rowCount]);
    //info('view.tableView.data[1].headerTitle:' + view.tableView.data[1]);
    //view.tableView.data = view.tableView.data;
    //view.tableView.setData(data);
    //info(data[1]);
    //info(data[2]);
    if (isUpdate) {
      view.tableView.updateSection(1, data[1], {animated: false});
      view.tableView.updateSection(2, data[2], {animated: false});
    }
    //view.tableData.total.text = createWorkTotalStr(workTotalTime);
    var totalText = createWorkTotalStr(workTotalTime);
    if (view.tableData.totalRows[0].children[0].text != totalText) {
      view.tableData.totalRows[0].children[0].text = view.tableData.totalRows[1].children[0].text = totalText;
    }
    VCC.Utils.setGlobal('updateList', false);
    if (isUpdate) {
      view.tableView.show();
    }
  }
  function initView(offsetLeft) {
    var view = views[viewIndex];
    view.tableData = {totalRows: [], dayRows: [], sectionRows: [[], []]};
    // tab view
    var rowData = [];
    // total
    var lblTotal = Ti.UI.createLabel({
      text: '', //L('str_total_worktime'),
      color: '#000',
      textAlign: 'center'
    });
    var totalRow = createTotalRow();
    //info('totalRow:' + totalRow);
    //totalRow.add(lblTotal);
    //view.tableData.total = lblTotal;
    rowData.push(totalRow);
    view.tableData.totalRows.push(totalRow);
    
    // セクション追加
    rowData.push(Ti.UI.createTableViewSection());
    /*
    for (var i = 0; i < 28; i++) {
      var row = createDayRow();
      rowData.push(row);
      view.tableData.dayRows.push(row);
      view.tableData.sectionRows[0].push(row);
    }
    */
    rowData.push(Ti.UI.createTableViewSection());
    rowData.push(Ti.UI.createTableViewSection());
    var totalRow2 = createTotalRow();
    rowData.push(totalRow2);
    view.tableData.totalRows.push(totalRow2);
    var tableViewOptions = {
      data: rowData,
      top: offsetTop + 89,
      visible: false
    };
    if (Ti.App.VCC.versionInt != 7) {
      tableViewOptions.footerView = Ti.UI.createView({height: Ti.App.VCC.isTablet ? 90 : 48});
    }
    if (offsetLeft) {
      tableViewOptions.left = offsetLeft;
      tableViewOptions.right = -offsetLeft;
    }
    //info('totalRow1:' + totalRow);
    view.tableView = Ti.UI.createTableView(tableViewOptions);
    win.add(view.tableView);
    view.tableView.addEventListener('click', function(e) {
      var index = e.index;
      var section = e.section;
      var row = e.row;
 //     if (row.hasChild && row.dateTime) {
 //       var rowdata = e.rowData;
 //       openWinDetail(row.dateTime);
 //     }
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
      VCC.Utils.openWin(win.winDetail, utils.getCurrentTab());
    }
  }
  
  function createDayRow() {
    var child = {};
    var row = Ti.UI.createTableViewRow({
      className: 'datarow',
      hasChild: true,
      height: 44
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
    row.addEventListener('click', function(e) {
      var row = e.row;
      if (row.hasChild && row.dateTime) {
        var rowdata = e.rowData;
        openWinDetail(row.dateTime);
      }
    });
    return row;
  }
  function createWorkTotalStr(workTotalTime) {
    var time = Math.round(workTotalTime * 10 / 60);
    return L('str_total_worktime') + ' ' + (time / 10) + 'h';
  }
  function setRowData(row, data, day, dayOfWeek, dateTime, hasChild) {
    //info('row.child.title.text:' + VCC.Utils.formatDate(null, null, i + 1, (startDayOfWeek + i) % 7));
    row.child.title.text = VCC.Utils.formatDate(null, null, day, dayOfWeek);
    var strTime = '', strWorkTime = '', isMemo = false, workTime = 0;
    if (data != undefined) {
      var day = 0;
      var timeStr = VCC.Utils.createStartEndTimeStr(data, null, true);
      strTime = timeStr.startTime ? (timeStr.startTime + ' - ' + timeStr.endTime) : '';
      if (timeStr.endTime) {
        workTime = data.totalTime || 0;
        strWorkTime = VCC.Utils.formatHourMinute(workTime, null, true);
      }
      isMemo = data.isMemo;
    }
    row.child.memo.visible = isMemo;
    row.child.time.text = strTime;
    row.child.total.text = strWorkTime;
    row.dateTime = dateTime;
    row.workTime = workTime;
    row.hasChild = hasChild;
    //row.selectedBackgroundColor = row.hasChild ? undefined : '#fff';
    if (row.hasChild) {
      if (row.selectedBackgroundColor) delete row.selectedBackgroundColor;
    } else {
      row.selectedBackgroundColor = '#fff';
    }
    return workTime;
  }
}

function createTotalRow() {
  var labelOptions = {
    text: '', //L('str_total_worktime'),
    color: '#000',
    textAlign: 'center'
  };
  if (Ti.App.VCC.versionInt == 7) {
    labelOptions.width = Ti.Platform.displayCaps.platformWidth;
  }
  var lblTotal = Ti.UI.createLabel(labelOptions);
  var totalRow = Ti.UI.createTableViewRow({
    backgroundColor: '#fff',
    selectedBackgroundColor: '#fff',
    className: 'total',
    height: 44
  });
  totalRow.add(lblTotal);
  return totalRow;
}
exports.initialize = initialize;
