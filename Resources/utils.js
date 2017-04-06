var isOldiOS = Ti.App.VCC.isOldiOS;
var isTablet = Ti.App.VCC.isTablet;
L = function(key, hint, isNoRemoveRetrunCode) {
  var str = hint === undefined ? Ti.Locale.getString(key) : Ti.Locale.getString(key, hint);
  if (str === null) {
    str = '';
  }
  if (!Ti.App.VCC.isAndroid && 0) {
    var i = 1;
    while (str.indexOf('%' + i + '$') >= 0) {
      str = str.replace('%' + i + '$', '%');
      i++;
    }
  }
  if (isNoRemoveRetrunCode) {
    return str;
  }
  return VCC.Utils.removeReturnCodeInIpad(str);
};

function info(message) {
  var date = new Date();
  Ti.API.info(message + String.format(' [%s:%s:%s %s]', String.formatDecimal(date.getHours(), '00'), String.formatDecimal(date.getMinutes(), '00'), String.formatDecimal(date.getSeconds(), '00'), String.formatDecimal(date.getMilliseconds(), '000')));
}
function setGlobal(key, value) {
  var golbal = Ti.App.Global || {};
  golbal[key] = value;
  Ti.App.Global = golbal;
}
function getGlobal(key) {
  return Ti.App.Global ? Ti.App.Global[key] : undefined;
}
function getCurrentTab() {
  if (Ti.UI.currentTab) {
    return Ti.UI.currentTab;
  }
  var tabGroup = VCC.Utils.getGlobal('tabGroup');
  if (tabGroup) {
    return tabGroup.activeTab;
  }
}
var VCC;
if (typeof VCC == 'undefined') {
  VCC = {};
}
VCC.Utils = getGlobal('_VCC_Utils');
if (typeof VCC.Utils == 'undefined') {
  info('VCC.Utils new');
  VCC.Utils = {};

  VCC.Utils.setGlobal = function (key, value) {
    setGlobal(key, value);
  };
  VCC.Utils.getGlobal = function (key) {
    return getGlobal(key);
  };
  VCC.Utils.addNoCacheParam = function (url) {
    return url + (url.indexOf('?') == -1 ? '?' : '&') + 't=' + new Date().getTime();
  };
  
  VCC.Utils.extend = function (obj1, obj2) {
    if (!obj1) obj1 = {};
    if (!obj2) obj2 = {};
    for (var n in obj2) {
      obj1[n] = obj2[n];
    }
    return obj1;
  };
  
  VCC.Utils.copyObject = function (obj) {
    if (typeof obj != 'object' || !Ti.App.VCC.isAndroid) return obj;
    var newObj = {};
    for (var n in obj) {
      newObj[n] = obj[n];
    }
    return newObj;
  };
  
  VCC.Utils.compareObject = function (obj1, obj2) {
    var count1 = 0, count2 = 0;
    for (var n in obj1) {
      if (obj1[n] !== obj2[n]) return false;
      count1++;
    }
    for (var n in obj2) count2++;
    return count1 == count2;
  };
  
  VCC.Utils.objectToStr = function (obj) {
    if (typeof obj != 'object') {
      return '' + obj;
    }
    var strs = [];
    for (var n in obj) {
      strs.push(n + ':' + VCC.Utils.objectToStr(obj[n]));
    }
    return '{' + strs.join(', ') + '}';
  };
  
  VCC.Utils.makeDate = function (time) {
    var date = time ? new Date(time) : new Date();
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      dayOfWeek: date.getDay(),
      hour: date.getHours(),
      minute: date.getMinutes(),
      minuteTime: Math.floor(date.getTime() / 60000)
    };
  };
  
  VCC.Utils.replaceDateItem = function (num) {
    return (num < 10 ? '0' + num : num);
  };
  VCC.Utils.checkDateRange = function (date, minDate, maxDate) {
    if (minDate && minDate.getTime() > date.getTime()) {
      return minDate;
    }
    if (maxDate && maxDate.getTime() < date.getTime()) {
      return maxDate;
    }
    return date;
  };
  VCC.Utils.resetTime = function (date) {
    if (typeof date != 'object') {
      date = new Date(date);
    }
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    return date;
  };
  VCC.Utils.fixSummerDate = function(time) {
    //info('date in :' + new Date(time));
    if (typeof time == 'object') {
      time = time.getTime();
    }
    time += 3 * 3600000;
    //info('date mid:' + new Date(time));
    //info('date out:' + VCC.Utils.resetTime(time));
    return VCC.Utils.resetTime(time);
  };
  VCC.Utils.fixSummerDateTime = function(dateTime) {
    return VCC.Utils.fixSummerDate(dateTime * 60000) / 60000;
  };
  VCC.Utils.getDayDateTime = function(dateTime) {
    var date = dateTime ? new Date(dateTime * 60000) : new Date();
    return VCC.Utils.resetTime(date).getTime() / 60000;
  };
  VCC.Utils.getDateTime = function (dateTime) {
    var date = new Date();
    if (dateTime) {
      return dateTime + date.getHours() * 60 + date.getMinutes();
    } else {
      return Math.floor(date.getTime() / 60000);
    }
  };
  VCC.Utils.replaceDayStr = function (day) {
    switch (day) {
      case 0: return L('str_sunday'); case 1: return L('str_monday'); case 2: return L('str_tuesday');
      case 3: return L('str_wednesday'); case 4: return L('str_thursday');
      case 5: return L('str_friday'); case 6: return L('str_saturday'); default: return '';
    }
  };
  VCC.Utils.validateDate = function (year, month, day) {
    var date = new Date(year, month - 1, day);
    return ((date.getFullYear() == year)
      && (date.getMonth() == month - 1)
      && (date.getDate() == day));
  };
  VCC.Utils.getLastDay = function (year, month) {
    var day = 31;
    while (!VCC.Utils.validateDate(year, month, day--));
    return day + 1; 
  };
  VCC.Utils.formatDate = function (year, month, day, dayOfWeek, hour, minute) {
    switch (Titanium.Locale.currentLanguage) {
    case 'en':
      return VCC.Utils.formatDate_en(year, month, day, dayOfWeek, hour, minute);
    default:
      return VCC.Utils.formatDate_ja(year, month, day, dayOfWeek, hour, minute);
    }
  };
  VCC.Utils.formatDate_ja = function (year, month, day, dayOfWeek, hour, minute) {
    var str = '';
    if (typeof year == 'number') {
      str += year;
    }
    if (typeof month == 'number') {
      str += (str != '' ? '/' : '') + L('str_month_' + month);
    }
    if (typeof day == 'number') {
      str += (str != '' ? '/' : '') + day;
    }
    if (typeof dayOfWeek == 'number') {
      str += String.format('(%s)', VCC.Utils.replaceDayStr(dayOfWeek));
    }
    if (typeof hour == 'number') {
      str += (str != '' ? ' ' : '') + String.formatDecimal(hour, '00');
    }
    if (typeof minute == 'number') {
      str += (str != '' ? ':' : '') + String.formatDecimal(minute, '00');
    }
    return str;
  };
  VCC.Utils.formatDate_en = function (year, month, day, dayOfWeek, hour, minute) {
    var str = '';
    if (typeof dayOfWeek == 'number') {
      str += VCC.Utils.replaceDayStr(dayOfWeek);
    }
    if (typeof month == 'number') {
      str += (str != '' ? ', ' : '') + L('str_month_' + month);
    }
    if (typeof day == 'number') {
      str += (str != '' ? ' ' : '') + day;
    }
    if (typeof year == 'number') {
      str += (str != '' ? ', ' : '') + year;
    }
    if (typeof hour == 'number') {
      str += (str != '' ? ' ' : '') + String.formatDecimal(hour, '00');
    }
    if (typeof minute == 'number') {
      str += (str != '' ? ':' : '') + String.formatDecimal(minute, '00');
    }
    return str;
  };
  VCC.Utils.getTimeStr = function(minutes, todayTime) {
    if (!minutes) {
      return '';
    }
    var today = new Date(todayTime * 60000);
    var date = new Date(minutes * 60000);
    var isDiffDay = today.getFullYear() != date.getFullYear() || today.getMonth() != date.getMonth() || today.getDate() != date.getDate();
    if (isDiffDay) {
      return VCC.Utils.formatDate(null, date.getMonth() + 1, date.getDate(), null, date.getHours(), date.getMinutes());
    } else {
      return VCC.Utils.formatHourMinute(date.getHours(), date.getMinutes());
    }
  };
  VCC.Utils.formatHourMinute = function(hours, minutes, isNoTopPadding) {
    if (minutes != +minutes) {
      minutes = hours % 60;
      hours = Math.floor(hours / 60);
    }
    var hourStr = isNoTopPadding ? ('' + hours) : String.formatDecimal(hours, '00');
    return String.format('%s:%s', hourStr, String.formatDecimal(minutes, '00'));
  };
  VCC.Utils.createStartEndTimeStr = function (startTime, endTime, isDiffDayLast) {
    if (typeof startTime == 'object' && !endTime) {
      endTime = startTime.endTime;
      startTime = startTime.startTime;
    }
    var data = {startTime: '', endTime: ''};
    var startDate = null;
    if (startTime) {
      startDate = new Date(startTime * 60000);
      data.startTime = VCC.Utils.formatHourMinute(startDate.getHours(), startDate.getMinutes());
    } 
    if (endTime) {
      var endDate = new Date(endTime * 60000);
      var endTime = VCC.Utils.formatHourMinute(endDate.getHours(), endDate.getMinutes());
      // 日にちが違う場合
      if (startDate && (endDate.getDate() != startDate.getDate() || endDate.getMonth() != startDate.getMonth() || endDate.getFullYear() != startDate.getFullYear())) {
        var strDay = VCC.Utils.formatDate(null, endDate.getMonth() + 1, endDate.getDate());
        if (isDiffDayLast) {
          endTime += '(' + strDay + ')';
        } else {
          endTime = strDay + endTime;
        }
      }
      data.endTime = endTime;
    }
    return data;
  };
  VCC.Utils.createMinMaxTime = function (timeData, setTimeType, baseDateTime, offsetDate) {
    var minTime = 0, maxTime = offsetDate != -1 ? ((24 * 60) * (1 + (offsetDate || 0)) - 1) : null;
    if (baseDateTime) {
      baseDateTime = VCC.Utils.getDayDateTime(baseDateTime);
      minTime += baseDateTime;
      if (maxTime !== null) {
        maxTime = VCC.Utils.fixSummerDateTime(maxTime + baseDateTime + 1) - 1;
      }
    }
    if (timeData) {
      if (setTimeType == 'startTime') {
        if (timeData.endTime && timeData.endTime == +timeData.endTime) {
          maxTime = timeData.endTime - 1;
        }
      } else {
        if (timeData.startTime !== +timeData.startTime) {
          return;
        }
        minTime = timeData.startTime + 1;
      }
    }
    return {minTime: minTime, maxTime: maxTime};
  };
  VCC.Utils.createTimeRangeStr = function (timeData) {
    return VCC.Utils.formatHourMinute(timeData.startTime) + ' - ' + VCC.Utils.formatHourMinute(timeData.endTime);
  };
  VCC.Utils.getMonthDateStr = function (dateTime) {
    var date = new Date(dateTime * 60000);
    return VCC.Utils.formatDate(null, date.getMonth() + 1, date.getDate());
  };
  VCC.Utils.openEmail = function (to, subject, body, cc, bcc, atachment) {
    var dialog = Ti.UI.createEmailDialog({
      toRecipients: to,
      subject: subject,
      messageBody: body
    });
    if (cc) {
      dialog.ccRecipients = cc;
    }
    if (bcc) {
      dialog.bccRecipients = bcc;
    }
    if (atachment) {
      dialog.addAttachment(atachment);
    }
    dialog.open();
  };
  VCC.Utils.exportProcess = function (to, subject, body) {
    var buttons = [L('str_send_mail'), L('str_cancel')];
    var callbacks = [function() {
      VCC.Utils.openEmail(to, subject, body);
    }];
    VCC.Utils.createDialog(null, buttons, callbacks, 1, 1);
  };
  VCC.Utils.createDialog = function (title, buttons, callbacks, cancelIndex, selectedIndex) {
    var opts = {
        options: buttons
    };
    if (title) {
      opts.title = title;
    }
    if (cancelIndex == +cancelIndex) {
      opts.cancel = cancelIndex;
    }
    if (Ti.App.VCC.isAndroid && selectedIndex == +selectedIndex) {
      opts.selectedIndex = 1;
    }
    var dialog = Ti.UI.createOptionDialog(opts);
    if (callbacks) {
      dialog.addEventListener('click', function(e) {
        if (typeof callbacks == 'function') {
          callbacks(e);
        } else if (callbacks[e.index]) {
          callbacks[e.index]();
        }
      });
    }
    dialog.show();
  };
  
  VCC.Utils.createToolbar = function (title, leftOpt, rightOpt, isTabWin) {
    // setting toolbar
    var lblBlank, flexSpace;
    if (!Ti.App.VCC.isAndroid) {
      lblBlank = Ti.UI.createLabel({
        text: '       ',
        color:'#fff',
        font:{fontSize:20}
      });
      flexSpace = Ti.UI.createButton({systemButton: Ti.UI.iOS.SystemButton.FLEXIBLE_SPACE});
    } else {
      lblBlank = {};
    }
    var lblTitle;
    if (isTabWin || Ti.App.VCC.isAndroid) {
      lblTitle = Ti.UI.createLabel({
        text: title,
        color: isOldiOS ? '#fff' : null,
        font: {fontSize:20, fontWeight: 'bold'},
        textAlign: 'center'
      });
    }
    var partsLeft;
    var partsRight;
    if (leftOpt) {
      if (!Ti.App.VCC.isAndroid) {
        leftOpt.style = Ti.UI.iOS.SystemButtonStyle.BORDERED;
      }
      partsLeft = Ti.UI.createButton(leftOpt);
      //partsLeft.addEventListener('click', leftObj.callback);
    } else {
      partsLeft = lblBlank;
    }
    if (rightOpt) {
      if (!Ti.App.VCC.isAndroid) {
        rightOpt.style = Ti.UI.iOS.SystemButtonStyle.BORDERED;
      }
      partsRight = Ti.UI.createButton(rightOpt);
    } else {
      partsRight = lblBlank;
    }
    var toolbar = null;
    if (Ti.App.VCC.isAndroid) {
      toolbar = Ti.UI.createView({
        backgroundColor: '#000',
        selectedBackgroundColor: '#000',
        top: 0,
        height: 44,
        borderTop: true,
        borderBottom: true
      });
      if (leftOpt) {
        toolbar.add(partsLeft);
      }
      toolbar.add(lblTitle);
      if (rightOpt) {
        partsRight.right = 0;
        toolbar.add(partsRight);
      }
    } else {
      if (isTabWin) {
        toolbar = Ti.UI.iOS.createToolbar({
          items: [partsLeft, flexSpace, lblTitle, flexSpace, partsRight],
          top: isOldiOS ? 0 : 20,
          borderTop: true,
          borderBottom: false,
          translucent: true,
          barColor: isOldiOS ? '#000' : null
        });
      }
    }
    return {toolbar:toolbar, btnLeft:partsLeft, title:lblTitle, btnRight:partsRight};
  };
  VCC.Utils.createWin = function (url, parent, options, isUnsetUrl) {
    var isTabWin = parent == +parent;
    var opt = {  
      backgroundColor: '#fff',
      //url: url,
      orientationModes: Ti.App.VCC.OrientationModes,
      navBarHidden: isTabWin,
      tabBarHidden: Ti.App.VCC.isAndroid
      //exitOnClose: exitOnClose
    };
    if (isTabWin) {
      opt.tabIndex = parent;
    } else if (parent) {
      opt.parentWin = parent;
    }
    if (!isTabWin && isOldiOS) {
      opt.barColor = '#000';
    }
    if (options) {
      for (var n in options) {
        opt[n] = options[n];
      }
    }
    var title = null;
    var backButtonTitle = null;
    var toolbar = null;
    var deleteButton = Ti.App.VCC.isAndroid ? {titleid: 'str_delete'} : {systemButton: Ti.UI.iOS.SystemButton.TRASH, enabled: false};
    switch (url) {
    case 'winHome.js':
      title = L('appname', Ti.App.name);
      toolbar = VCC.Utils.createToolbar(title, null, {image: 'images/ico_write.png'}, true);
      break;
    case 'winList.js':
      title = L('str_list');
      toolbar = VCC.Utils.createToolbar(title, null, {image: 'images/ico_to_mail.png'}, true);
      break;
    case 'winSummary.js':
      title = L('str_summary');
      toolbar = VCC.Utils.createToolbar(title, null, {image: 'images/ico_to_mail.png'}, true);
      break;
    case 'winSetting.js':
      title = L('str_setting');
      toolbar = VCC.Utils.createToolbar(title, null, null, true);
      break;
    case 'winDetail.js':
      title = L('str_detail');
      toolbar = VCC.Utils.createToolbar(title, null, deleteButton, false);
      break;
    case 'winInformation.js':
      title = L('str_about');
      break;
    case 'winCredit.js':
      title = L('str_credit');
      backButtonTitle = L('str_back');
      break;
    case 'winMemo.js':
      title = L('str_memo');
      backButtonTitle = L('str_cancel');
      toolbar = VCC.Utils.createToolbar(title, null, {titleid: 'str_save'}, false);
      break;
    case 'winPicker.js':
      title = '';
      backButtonTitle = L('str_cancel');
      toolbar = VCC.Utils.createToolbar(title, null, {titleid: 'str_save'}, false);
      break;
    case 'winDatePicker.js':
      title = '';
      backButtonTitle = L('str_cancel');
      toolbar = VCC.Utils.createToolbar(title, null, {titleid: 'str_save'}, false);
      break;
    case 'winSettingBreak.js':
      title = L('str_rest_fix');
      backButtonTitle = L('str_cancel');
      toolbar = VCC.Utils.createToolbar(title, null, {titleid: 'str_finish'}, false);
      break;
    case 'winSettingWage.js':
      title = L('str_set_wage');
      backButtonTitle = L('str_cancel');
      toolbar = VCC.Utils.createToolbar(title, null, {titleid: 'str_finish'}, false);
      break;
    case 'winSuspend.js':
      title = L('str_suspend_edit');
      backButtonTitle = L('str_cancel');
      toolbar = VCC.Utils.createToolbar(title, null, deleteButton, false);
      break;
    }
    title = opt.title || title;
    if ((!toolbar || !toolbar.toolbar) && title) {
      opt.title = title;
    }
    if (!Ti.App.VCC.isAndroid && backButtonTitle) {
      opt.backButtonTitle = backButtonTitle;
    }
    var newWin = Ti.UI.createWindow(opt);
    if (toolbar) {
      if (toolbar.toolbar) {
        newWin.add(toolbar.toolbar);
      } else if (toolbar.btnRight) {
        newWin.setRightNavButton(toolbar.btnRight);
      }
      newWin.toolBar = toolbar;
    }
    newWin.addEventListener('focus', function (e) {
      var tabGroup = VCC.Utils.getGlobal('tabGroup');
      if (tabGroup) {
        for (var i = 0; i < tabGroup.tabs.length; i++) {
          if (tabGroup.tabs[i] == tabGroup.activeTab) {
            Ti.App.Properties.setInt('tabIndex', i);
            break;
          }
        }
      }
      var win = e.source;
      var winHistory = VCC.Utils.getGlobal('winHistory') || [];
      var tabIndex = +Ti.App.Properties.getInt('tabIndex');
      var isChangeWindow = false;
      var isChangeTab = false;
      var winUrl = VCC.Utils.getWinURL(win);
      var curWin = winUrl + '_' + tabIndex;
      var prevWin = winHistory[0];
      winHistory.unshift(curWin);
      if (winHistory.length > 5) {
        winHistory = winHistory.slice(0, 5);
      }
      VCC.Utils.setGlobal('winHistory', winHistory);
      VCC.Utils.setGlobal('currentWindow', win);
      if (prevWin && prevWin != curWin) {
        var parts = prevWin.split('_');
        if (parts[0] != winUrl) {
          isChangeWindow = true;
        }
        if (+parts[1] != tabIndex) {
          isChangeTab = true;
        }
      }
      if (win.focusCallback) {
        win.focusCallback(isChangeWindow, isChangeTab);
      }    
    });
    if (Ti.App.VCC.isAndroid) {
      var activity = newWin.activity;
      activity.onCreateOptionsMenu = function(e) {
        var menu = e.menu;
        for (var i = 0; i < Ti.App.VCC.Windows.length; i++) {
          var menuItem = menu.add({title: L(Ti.App.VCC.Windows[i].titleid)});
          menuItem.setIcon(Ti.App.VCC.Windows[i].icon);
          if (!isTabWin || i != parent) {
            addEvent(menuItem, i);
          }
        }
      };
      function addEvent(menuItem, index) {
        menuItem.onclick = function() {
          var wins = VCC.Utils.getGlobal('wins');
          var win = wins[index];
          if (!win) {
            win = VCC.Utils.createWin(Ti.App.VCC.Windows[index].winjs, index);
            var winjs = require(Ti.App.VCC.Windows[index].winjs);
            winjs.initialize(win);
            wins[index] = win;
            VCC.Utils.setGlobal('wins', wins);
          }
          win.open({animated: true});
          Ti.App.Properties.setInt('tabIndex', index);
          newWin.close();
        };
        menuItem.addEventListener('click', menuItem.onclick);
      }
    }
    if (!isUnsetUrl) {
      var winjs = require(url);
      winjs.initialize(newWin);
    }
    VCC.Utils.setWinURL(newWin, url);
    return newWin;
  };
  VCC.Utils.openWin = function (win, tab) {
    if (tab) {
      tab.open(win, {animated: true});
    } else {
      win.open({animated: true});
    }
  };
  VCC.Utils.setToolbarButton = function (toolBar) {
    var toolbar = toolBar.toolbar;
    if (!toolbar) return;
    var items = toolbar.items;
    var setItems = false;
    if (toolBar.btnLeft.enabled !== undefined) {
      items[0] = toolBar.btnLeft;
      setItems = true;
    }
    if (toolBar.btnRight.enabled !== undefined) {
      items[4] = toolBar.btnRight;
      setItems = true;
    }
    if (setItems) toolbar.setItems(items);
  };
  // view.animateが動作しない(旧実装)
  VCC.Utils.slideViewOld = function (win, newView, oldView, direction, callback, isRemove) {
    var winWidth = Titanium.Platform.displayCaps.platformWidth;
    var a1complete = false;
    if (oldView) {
      var a1 = Titanium.UI.createAnimation();
      a1.left = -winWidth * direction;
      a1.right = winWidth * direction;
      a1.duration = 300;
      a1.addEventListener('complete', function(e) {
        if (isRemove) win.remove(oldView);
        a1complete = true;
        if (a2complete) {
          callback();
        }
      });
    } else {
      a1complete = true;
    }
    var a2 = Titanium.UI.createAnimation();
    a2.left = 0;
    a2.right = 0;
    a2.duration = 300;
    var a2complete = false;
    a2.addEventListener('complete', function(e) {
      a2complete = true;
      if (a1complete) {
        callback();
      }
    });
    if (oldView) oldView.animate(a1);
    newView.animate(a2);
  };
  // view.animateが動作しない(仮実装)
  VCC.Utils.slideView = function (win, newView, oldView, direction, callback, isRemove) {
    var winWidth = Titanium.Platform.displayCaps.platformWidth;
    var duration = 300;
    var num = 20;
    if (oldView) {
      var oldLeftTo = -winWidth * direction;
      var oldRightTo = winWidth * direction;
      var oldLeftFrom = oldView.left || 0;
      var oldRightFrom = oldView.right || 0;
    }
    var newLeftTo = 0;
    var newRightTo = 0;
    var newLeftFrom = newView.left || 0;
    var newRightFrom = newView.right || 0;
    var timerStart = new Date().getTime();
    _timer_cb();
    function _timer_cb() {
      var diff = new Date().getTime() - timerStart;
      if (diff < duration) {
        if (diff > 0) {
          var newLeft = (newLeftTo - newLeftFrom) * (diff / duration) + newLeftFrom;
          var newRight = (newRightTo - newRightFrom) * (diff / duration) + newRightFrom;
          newView.left = newLeft;
          newView.right = newRight;
          if (oldView) {
            var oldLeft = (oldLeftTo - oldLeftFrom) * (diff / duration) + oldLeftFrom;
            var oldRight = (oldRightTo - oldRightFrom) * (diff / duration) + oldRightFrom;
            oldView.left = oldLeft;
            oldView.right = oldRight;
          }
        }
        setTimeout(_timer_cb, duration / num);
      } else {
        newView.left = newLeftTo;
        newView.right = newRightTo;
        if (oldView) {
          oldView.left = oldLeftTo;
          oldView.right = oldRightTo;
        }
        callback();
      }
    }
  };
  // create state in current time
  VCC.Utils.createState = function (state, time) {
    if (!time) {
      time = VCC.Utils.getDateTime();
    }
    return {
      state: state,
      time: time
    };
  };
  // state to text
  VCC.Utils.stateToText = function (state) {
    switch (state) {
    case Ti.App.VCC.STATE_COME: return L('str_on_work');
    case Ti.App.VCC.STATE_INTERRUPT: return L('str_suspend');
    case Ti.App.VCC.STATE_LEFT: return L('str_leave');
    default: return '';
    }
  };
  VCC.Utils.calculateTime = function (workTimes, interruptTimes, restTimes, regularTime) {
    if (!workTimes.length) return;
    if (!workTimes[workTimes.length - 1].endTime) {
      return;
    }
    var baseTime = VCC.Utils.resetTime(workTimes[0].startTime * 60000).getTime() / 60000;
    var _workTimes = convTime(workTimes);
    var minusTimes = convTime(interruptTimes);
    var dayLength = Math.round((VCC.Utils.resetTime(workTimes[workTimes.length - 1].endTime * 60000).getTime() / 60000 - baseTime) / (24 * 60)) + 1;
    if (restTimes && restTimes.length) {
      var _restTimes = [];
      for (var i = 0; i < dayLength; i++) {
        var dateOffset = (i != 0 ? (VCC.Utils.fixSummerDateTime(baseTime + 24 * 60 * i) - baseTime) : 0);
        for (var j = 0; j < restTimes.length; j++) {
          if (!restTimes[j].enabled) continue;
          var endTime = restTimes[j].endTime + dateOffset;
          var _time = {startTime: restTimes[j].startTime + dateOffset, endTime: endTime, _endTime: endTime, isRest: true};
          if (_time.startTime >= _workTimes[_workTimes.length - 1].endTime) {
            break;
          } else {
            _restTimes.push(_time);
          }
        }
      }
      minusTimes = minusTimes.concat(_restTimes);
      minusTimes.sort(function(a, b) {return a.startTime - b.startTime;});
    }
    var regularTimes = [];
    if (regularTime) {
      for (var i = 0; i < dayLength; i++) {
        if (regularTime.startTime === null || !regularTime.endTime) continue;
        var dateOffset = (i != 0 ? (VCC.Utils.fixSummerDateTime(baseTime + 24 * 60 * i) - baseTime) : 0);
        var _time = {startTime: regularTime.startTime + dateOffset, endTime: regularTime.endTime + dateOffset};
        if (_time.startTime >= _workTimes[_workTimes.length - 1].endTime) {
          break;
        } else {
          regularTimes.push(_time);
        }
      }
    }
    var _minusTimes = [];
    for (var i = 0; i < minusTimes.length; i++) {
      if (i < minusTimes.length - 1) {
        if (minusTimes[i].startTime >= minusTimes[i + 1].startTime) {
          if (minusTimes[i + 1].endTime > minusTimes[i].endTime) {
            minusTimes[i + 1].startTime = minusTimes[i].endTime;
          } else {
            _minusTimes.push(minusTimes[i]);
            i++;
            continue;
          }
        }
        if (minusTimes[i].endTime > minusTimes[i + 1].startTime) {
          if (minusTimes[i].isRest) {
            info('2 minusTimes[i + 1].endTime, minusTimes[i].endTime:' + [minusTimes[i + 1].endTime, minusTimes[i].endTime]);
            info('2 minusTimes[i + 1].startTime, minusTimes[i].endTime:' + [minusTimes[i + 1].startTime, minusTimes[i].endTime]);
            if (minusTimes[i + 1].endTime > minusTimes[i].endTime) {
              minusTimes[i + 1].startTime = minusTimes[i].endTime;
            } else {
              minusTimes = [].concat(minusTimes.slice(0, i + 1), minusTimes.slice(i + 2, minusTimes.length));
            }
          } else {
            info('3 minusTimes[i + 1].endTime, minusTimes[i].endTime:' + [minusTimes[i + 1].endTime, minusTimes[i].endTime]);
            info('3 minusTimes[i].endTime, minusTimes[i + 1].startTime:' + [minusTimes[i].endTime, minusTimes[i + 1].startTime]);
            if (minusTimes[i + 1].endTime >= minusTimes[i].endTime) {
              minusTimes[i].endTime = minusTimes[i + 1].startTime;
            } else {
              var _time = {startTime: minusTimes[i + 1].endTime, endTime: minusTimes[i].endTime, _endTime: minusTimes[i].endTime};
              minusTimes = [].concat(minusTimes.slice(0, i + 2), [_time], minusTimes.slice(i + 2, minusTimes.length));
              minusTimes[i].endTime = minusTimes[i + 1].startTime;
            }
          }
        }
      }
      _minusTimes.push(minusTimes[i]);
    }
    minusTimes = _minusTimes;
    var totalTime = 0;
    var interruptTime = 0;
    var restTime = 0;
    var minusTime = minusTimes.shift();
    var rowWorkingTimes = [];
    var workStartTime;
    for (var i = 0; i < _workTimes.length; i++) {
      var workTime = _workTimes[i];
      workStartTime = workTime.startTime;
      totalTime += workTime.endTime - workTime.startTime;
      while (minusTime && workTime.endTime > minusTime.startTime) {
        var endTime = minusTime.endTime, startTime = minusTime.startTime;
        info('startTime, endTime:' + [startTime, endTime, new Date((startTime + baseTime) * 60000), new Date((endTime + baseTime) * 60000), minusTime.isRest]);
        if (workTime.startTime > startTime) startTime = workTime.startTime;
        if (workTime.endTime < endTime) endTime = workTime.endTime;
        if (endTime > startTime) {
          if (minusTime.isRest) {
            restTime += endTime - startTime;
          } else {
            interruptTime += endTime - startTime;
          }
          if (startTime > workStartTime) {
            rowWorkingTimes.push({startTime: workStartTime, endTime: startTime});
          }
          workStartTime = endTime;
        }
        minusTime = minusTimes.shift();
      }
      if (workTime.endTime > workStartTime) {
        rowWorkingTimes.push({startTime: workStartTime, endTime: workTime.endTime});
      }
    }
//    info('totalTime, interruptTime, restTime:' + [totalTime, interruptTime, restTime]);
    totalTime -= interruptTime + restTime;
    var regularTimeTotal = 0;
    if (regularTimes.length) {
      for (var i = 0; i < rowWorkingTimes.length; i++) {
        var rowWorkingTime = rowWorkingTimes[i];
        for (var j = 0; j < regularTimes.length; j++) {
          var _regularTime = regularTimes[j];
          var enabled = false;
          var startTime = rowWorkingTime.startTime, endTime = rowWorkingTime.endTime;
          if (_regularTime.startTime >= rowWorkingTime.startTime && _regularTime.startTime < rowWorkingTime.endTime) {
            startTime = _regularTime.startTime;
            if (rowWorkingTime.endTime > _regularTime.endTime) {
              endTime = _regularTime.endTime;
            }
            enabled = true;
          } else if (_regularTime.startTime < rowWorkingTime.startTime && _regularTime.endTime > rowWorkingTime.startTime) {
            if (rowWorkingTime.endTime > _regularTime.endTime) {
              endTime = _regularTime.endTime;
            }
            enabled = true;
          }
          if (enabled) {
            regularTimeTotal += endTime - startTime;
          }
        }
      }
    } else {
      regularTimeTotal = totalTime;
    }
    //info('calculateTime:' + [totalTime, totalTime - regularTimeTotal, interruptTime, restTime]);
    return {totalTime: totalTime, overTime: totalTime - regularTimeTotal, interruptTime: interruptTime, restTime: restTime};
    function convTime(times) {
      var _times = [];
      for (var i = 0; i < times.length; i++) {
        _times.push({startTime: times[i].startTime - baseTime, endTime: times[i].endTime - baseTime});
      }
      return _times;
    }
  };
  VCC.Utils.addAdmob = function (win) {
    if (Ti.Platform.osname != 'android') {
      if (!VCC.Utils.isPurchased(Ti.App.VCC.PRODUCT_IDENTIFIER_REMOVE_ADS)) {
        Titanium.Admob = require('ti.admob');
        var adview = Titanium.Admob.createView({
          bottom: 0,
          height: isTablet ? 90 : 50,
          zIndex: 5,
          visible: false,
          //testing: true,
          adBackgroundColor: 'black',
          primaryTextColor: 'blue',
          secondaryTextColor: 'green',
          adUnitId: isTablet ? Ti.App.VCC.ADMOB_PUBLISHER_ID_IPAD : Ti.App.VCC.ADMOB_PUBLISHER_ID_IPHONE
        });
        win.add(adview);
        function adCb(e) {
          //info('[ti.admob]' + e.type);
          if (VCC.Utils.isPurchased(Ti.App.VCC.PRODUCT_IDENTIFIER_REMOVE_ADS)) {
            adview.removeEventListener('didReceiveAd', adCb);
            adview.removeEventListener('didFailToReceiveAd', adCb);
            adview.removeEventListener('willPresentScreen', adCb);
            adview.removeEventListener('willDismissScreen', adCb);
            adview.removeEventListener('didDismissScreen', adCb);
            adview.removeEventListener('willLeaveApplication', adCb);
            adview.hide();
            return;
          }
          switch (e.type) {
          case 'didFailToReceiveAd':
            adview.hide();
            break;
          case 'didReceiveAd':
            adview.show();
            break;
          }
        }
        adview.addEventListener('didReceiveAd', adCb);
        adview.addEventListener('didFailToReceiveAd', adCb);
        adview.addEventListener('willPresentScreen', adCb);
        adview.addEventListener('willDismissScreen', adCb);
        adview.addEventListener('didDismissScreen', adCb);
        adview.addEventListener('willLeaveApplication', adCb);
      }
/*
*/
    }
  };
  VCC.Utils.createHeaderButton = function (title, action, clickCallback) {
    var opt = {
      title: title,
      color: '#000',
      width: 57,
      height: 28,
      backgroundImage: 'images/button.png',
      action: action
    };
    if (action == 'next') {
      opt.right = 9;
    } else {
      opt.left = 9;
    }
    var btn = Ti.UI.createButton(opt);
    if (clickCallback) {
      if (typeof btn.addEventListener == 'function') {
        btn.addEventListener('click', clickCallback);
      } else {
        setTimeout(function() {
          btn.addEventListener('click', clickCallback);
        }, 0);
      }
    }
    return btn;
  };
  VCC.Utils.setButtonEnabled = function (button, enabled) {
    button.enabled = enabled;
    button.color = enabled ? '#000' : '#888';
  };
  
  VCC.Utils.createHeaderView = function (title, top, buttonStrObj, buttonsCallback) {
    var child = {};
    child.btnPrev = VCC.Utils.createHeaderButton(buttonStrObj.prev, 'prev', buttonsCallback);
    child.title = Ti.UI.createLabel({
      text: title || ' ',
      color: '#000',
      textAlign: 'center',
      font: {fontSize: 30}
    });
    child.btnNext = VCC.Utils.createHeaderButton(buttonStrObj.next, 'next', buttonsCallback);
    var headerView = Ti.UI.createView({
      //backgroundColor: '#eff',
      //selectedBackgroundColor: '#eff',
      top: top,
      height: 44,
      borderTop: true,
      borderBottom: true
    });
    headerView.add(child.title);
    headerView.add(child.btnPrev);
    headerView.add(child.btnNext);
    headerView.child = child;
    return headerView;
  };
  VCC.Utils.createTableViewRow = function(dataItem) {
    var opt = {
      className: 'datarow',
      height: 44
    };
    for (var n in dataItem) {
      switch (n) {
      case 'title':
      case 'value':
        break;
      case 'selectionStyle':
        if (!Ti.App.VCC.isAndroid) {
          if (dataItem.selectionStyle == 'NONE') {
            opt.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
          } else {
            opt.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.BLUE;
          }
        }
        break;
      default:
        opt[n] = dataItem[n];
        break;
      }
    }
    var row = Ti.UI.createTableViewRow(opt);
    var child = {};
    if (dataItem.title) {
      var title = Ti.UI.createLabel({
        color: '#000',
        textAlign: 'left',
        left: 10,
        text: dataItem.title
      });
      row.add(title);
      child.title = title;
    }
    if (dataItem.value !== undefined) {
      if (dataItem.valueType == 'textField') {
        var opt2 = {
          textAlign: 'right',
          left: dataItem.left,
          right: 10,
          value: dataItem.value,
          type: dataItem.type,
          hintText: dataItem.hintText
        };
        if (dataItem.keyboardType) {
          opt2.keyboardType = dataItem.keyboardType;
        }
        if (dataItem.returnKeyType) {
          opt2.returnKeyType = dataItem.returnKeyType;
        }
        if (dataItem.borderStyle) {
          opt2.borderStyle = dataItem.borderStyle;
        }
        var value = Ti.UI.createTextField(opt2);
        value.addEventListener('return', dataItem.callback);
      } else {
        var valueOpt = {
          color: '#222',
          text: dataItem.value
        };
        if (dataItem.velueAlign == 'right') {
          valueOpt.textAlign = 'right';
          valueOpt.right = Ti.App.VCC.isAndroid ? 35 : 20;
        } else {
          valueOpt.textAlign = 'left';
          valueOpt.left = 10;
        }
        if (dataItem.valueLeft) {
          valueOpt.left = dataItem.valueLeft;
        }
        var value = Ti.UI.createLabel(valueOpt);
      }
      row.add(value);
      child.value = value;
    }
    row.child = child;
    return row;
  };
  
  VCC.Utils.setTableViewRowValues = function (tableViewRow, values) {
    if (!tableViewRow) {
      return;
    }
    for (var n in values) {
      switch (n) {
      case 'value':
        if (tableViewRow.child.value && tableViewRow.child.value.text != values[n]) {
          tableViewRow.child.value.text = values[n];
        }
        break;
      case 'selectionStyle':
        if (!Ti.App.VCC.isAndroid) {
          if (values.selectionStyle == 'NONE') {
            if (tableViewRow.selectionStyle != Ti.UI.iOS.TableViewCellSelectionStyle.NONE) {
              tableViewRow.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.NONE;
            }
          } else {
            if (typeof tableViewRow.selectionStyle != 'undefined' && tableViewRow.selectionStyle != Ti.UI.iOS.TableViewCellSelectionStyle.BLUE) {
              tableViewRow.selectionStyle = Ti.UI.iOS.TableViewCellSelectionStyle.BLUE;
            }
          }
        }
        break;
      default:
        if (tableViewRow[n] != values[n]) {
          tableViewRow[n] = values[n];
        }
        break;
      }
    }
  };
  VCC.Utils.setTableViewRowEnabled = function (tableViewRow, enabled) {
    VCC.Utils.setTableViewRowValues(tableViewRow, {
      hasChild: enabled,
      selectionStyle: enabled ? 'BLUE' : 'NONE'
    });
  };
  
  VCC.Utils.setObjectValue = function (target, obj) {
    if (!target) return ;
    for (var n in obj) {
      target[n] = obj[n];
    }
    return target;
  };
  VCC.Utils.getStringBytesLength = function (str) {
    var tbl = [ 0, 1, 1, 1, 2, 3, 2, 3, 4, 3 ];
    var len = 0;
    for (var i = 0; i < str.length; i++) {
      len += tbl [encodeURIComponent(str.charAt(i)).length];
    }
    return len;
  };
  VCC.Utils.removeReturnCodeInIpad = function (str) {
    if (isTablet) {
      str = str.replace(/\n/g, '');
    }
    return str;
  };

  VCC.Utils.isPurchased = function (identifier) {
    var purchasedStore = VCC.Utils.getGlobal('purchasedStore') || {};
    if (purchasedStore[identifier] === undefined) {
      var controller = VCC.Utils.getSettingController();
      var isPurchased = controller.getPurchased(identifier);
      if (isPurchased !== undefined) {
        purchasedStore[identifier] = isPurchased;
        VCC.Utils.setGlobal('purchasedStore', purchasedStore);
      }
    }
    return purchasedStore[identifier];
  };

  VCC.Utils.setPurchased = function (identifier, value) {
    var purchasedStore = VCC.Utils.getGlobal('purchasedStore') || {};
    purchasedStore[identifier] = value;
    VCC.Utils.setGlobal('purchasedStore', purchasedStore);
    var controller = VCC.Utils.getSettingController();
    controller.setPurchased(identifier, value);
  };

  VCC.Utils.getSettingController = function () {
    var controller = VCC.Utils.getGlobal('settingController');
    if (controller == null) {
      controller = require("controller/setting");
      controller = controller.create();
      VCC.Utils.setGlobal('settingController', controller);
    }
    return controller;
  };

  VCC.Utils.getStoreKit = function () {
    var storeKit = VCC.Utils.getGlobal('storeKit');
    if (storeKit == null) {
      var storeManager = require('storeManager.js');
      storeManager.initStorekit({VCC: VCC, info: info});
      storeKit = storeManager.Storekit;
      VCC.Utils.setGlobal('storeKit', storeKit);
    }
    return storeKit;
  };
  
  VCC.Utils.storeKit = VCC.Utils.getStoreKit();

  VCC.Utils.alert = function (msg, title) {
    var dialog = Ti.UI.createAlertDialog();
    if (title !== undefined) {
      dialog.setTitle(title);
    }
    dialog.setMessage(msg); 
    dialog.show();
  };

  VCC.Utils.getWinURL = function (win) {
    var winURL = VCC.Utils.getGlobal('winURL') || {};
    for (url in winURL) {
      for (var i = 0; i < winURL[url].length; i++) {
        if (winURL[url][i] === win) {
          return url;
        }
      }
    }
  };

  VCC.Utils.setWinURL = function (win, url) {
    var winURL = VCC.Utils.getGlobal('winURL') || {};
    if (!winURL[url]) {
      winURL[url] = [];
    }
    winURL[url].push(win);
    VCC.Utils.setGlobal('winURL', winURL);
  };

  setGlobal('_VCC_Utils', VCC.Utils);
}

exports.VCC = VCC;
exports.info = info;
exports.getCurrentTab = getCurrentTab;
