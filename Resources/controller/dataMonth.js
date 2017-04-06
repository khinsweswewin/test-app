// dataMonth.js
var path = Ti.App.VCC.isAndroid ? '../' : '';
if (typeof VCC == 'undefined') {
  var utils = require(path + 'utils.js');
  var VCC = utils.VCC;
}
if (typeof database == 'undefined') {
  var database = require(path + 'database.js');
}

var DataMonth = function() {
  this.initialize.apply(this, arguments);
};

DataMonth.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = database.getDB();
    var setting = require("controller/setting");
    this.setting = setting.create();
  },
  setYaerMonth: function(year, month) {
    this.year = year;
    this.month = month;
    this.cuttOffDate = this.setting.getCuttOffDate() || 0;
    this.startYear = this.year;
    if (this.cuttOffDate) {
      this.startMonth = month - 1;
      if (this.startMonth == 0) {
        this.startMonth = 12;
        this.startYear--;
      }
    } else {
      this.startMonth = this.month;
    }
    this.startDate = new Date(this.startYear + '/' + this.startMonth + '/' + (this.cuttOffDate + 1));
    this.lastDay = VCC.Utils.getLastDay(this.startYear, this.startMonth);
    this.endDate = VCC.Utils.fixSummerDate(this.startDate.getTime() + (this.lastDay - 1) * 24 * 60 * 60000);
    this.restTimeData = this.setting.getRestTimeData();
    this.regularTimeData = this.setting.getRegularTimeData();
  },
  getMonthLastDay: function() {
    return this.lastDay;
  },
  getStartDateTime: function() {
    return this.startDate / 60000;
  },
  getEndDateTime: function() {
    return this.endDate / 60000;
  },
  getStartDayOfWeek: function() {
    return this.startDate.getDay();
  },
  getMonthlyData: function() {
    var datas = [];
    var dbDatas = this.db.getMonthlyData(this.year, this.month, this.cuttOffDate);
    for (var i = 0; i < this.lastDay; i++) {
      datas.push(this.makeDayData(dbDatas[i]));
    }
    return datas;
  },
  getDate: function(index) {
    return new Date(this.startDate.getFullYear(), this.startDate.getMonth(), this.startDate.getDate() + index);
  },
  getDateTime: function(index) {
    return this.getDate(index).getTime() / 60000;
  },
  makeDayData: function(dbData) {
    var data = {startTime:0, endTime:0, workTime:0, interruptTime:0, overTime: 0, isMemo:false};
    if (dbData != undefined) {
      for (var i = 0; i < dbData.workStates.length; i++) {
        if (!data.startTime) data.startTime = dbData.workStates[i].startTime;
        if (data.endTime <= dbData.workStates[i].startTime) data.endTime = dbData.workStates[i].endTime;
      }
      var calculateTime = VCC.Utils.calculateTime(dbData.workStates, dbData.interruptStates, [this.restTimeData], this.regularTimeData);
      if (calculateTime) {
        data.totalTime = calculateTime.totalTime;
        data.overTime = calculateTime.overTime;
        data.interruptTime = calculateTime.interruptTime;
        data.restTime = calculateTime.restTime;
      }
      data.workTime = dbData.workTime;
      data.memo = dbData.memo;
      data.isMemo = dbData.memo != '';
    }
    return data;
  },
  getDateData: function(dateTime) {
    var datas = this.db.getDateData(dateTime);
    return datas;
  },
  exportProcess: function() {
    var email = this.setting.getMailAddress();
    if (!email) {
      var buttons = [L('str_open_setting'), L('str_ok')];
      var callbacks = [this.openWinSetting];
      VCC.Utils.createDialog(L('str_notice_mail_address'), buttons, callbacks, null, 1);
      return false;
    }
    var to = [email];
    var subject = String.format(L('str_mail_subject'), VCC.Utils.formatDate(this.year, this.month));
    var body = this.createExportBody();
    VCC.Utils.exportProcess(to, subject, body);
    return true;
  },
  createExportBody: function() {
    var datas = this.getMonthlyData();
    var summary = this.getMonthlySummary(datas);
    var salaryTotal = typeof summary.salaryTotal == 'undefined' ? '' : summary.salaryTotal;
    var endDate = this.endDate;
    var text = String.format(L('str_mail_header'), VCC.Utils.formatDate(this.year, this.month).replace(/,/, ' ')) + '\n' +
      L('str_period') + ',' + 
        VCC.Utils.formatDate(this.startDate.getFullYear(), this.startDate.getMonth() + 1, this.startDate.getDate()).replace(/,/, ' ') +
        '-' +
        VCC.Utils.formatDate(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()).replace(/,/, ' ') +
        '\n' +
      L('str_work_days') + ',' + summary.workDay + '\n' +
      L('str_total_worktime2') + ',' + VCC.Utils.formatHourMinute(summary.totalTime, null, true) + '\n' +
      L('str_total_work_overtime') + ',' + VCC.Utils.formatHourMinute(summary.overTime, null, true) + '\n';
    if (salaryTotal !== '') {
      text += L('str_total_salary') + ',' + salaryTotal + '\n';
    }
    text += '\n' +
      L('str_detail') + '\n' +
      L('str_mail_header2') + '\n';
    var startDayOfWeek = this.getStartDayOfWeek();
    for (var i = 0; i < datas.length; i++) {
      var data = datas[i];
      var _date = this.getDate(i);
      Ti.API.info('_date:' + _date);
      var timeStr = VCC.Utils.createStartEndTimeStr(data, null, true);
      var cols = [];
      cols.push(VCC.Utils.formatDate(_date.getFullYear(), _date.getMonth() + 1, _date.getDate()).replace(/,/, ' '));
      cols.push(VCC.Utils.replaceDayStr((startDayOfWeek + i) % 7));
      cols.push(timeStr.startTime);
      cols.push(timeStr.endTime);
      cols.push(timeStr.endTime ? VCC.Utils.formatHourMinute(data.totalTime, null, true) : '');
      cols.push(timeStr.endTime ? VCC.Utils.formatHourMinute(data.restTime, null, true) : '');
      cols.push(timeStr.endTime ? VCC.Utils.formatHourMinute(data.interruptTime, null, true) : '');
      cols.push(timeStr.endTime ? VCC.Utils.formatHourMinute(data.overTime, null, true) : '');
      var memo = data.memo || '';
      memo = memo.replace(/\n+$/, '');
      if (memo.indexOf(',') >= 0 || memo.indexOf('\n') >= 0) {
        memo = '"' + memo + '"';
      }
      cols.push(memo);
      text += cols.join(',') + '\n';
    }
    return text;
  },
  openWinSetting: function() {
    var tabIndex = 3;
    Ti.App.Properties.setInt('tabIndex', tabIndex);
    if (Ti.App.VCC.isAndroid) {
      var win = VCC.Utils.createWin(Ti.App.VCC.Windows[tabIndex].winjs, tabIndex);
      win.open({animated: true});
    } else {
      var tabGroup = VCC.Utils.getGlobal('tabGroup');
      var currentWin = (Ti.UI.currentTab || tabGroup.activeTab).window;
      var tab = tabGroup.tabs[tabIndex];
      tabGroup.setActiveTab(tab);
      var currentWindow;
      var cb = function(e) {
        if (currentWindow) currentWindow.removeEventListener('close', cb);
        currentWindow = VCC.Utils.getGlobal('currentWindow');
        if (currentWindow && tab.window !== currentWindow && currentWin !== currentWindow) {
          currentWindow.addEventListener('close', cb);
          currentWindow.close();
        }
      };
      cb();
    }
  },
  getMonthlySummary: function(datas) {
    var datas = datas || this.getMonthlyData();
    var summary = {
      workDay: 0,
      totalTime: 0,
      workTime: 0,
      interruptTime: 0,
      overTime: 0
    };
    for (var i = 0; i < datas.length; i++) {
      var data = datas[i];
      if (data) {
        summary.totalTime += data.totalTime || 0;
        summary.overTime += data.overTime;
        summary.workTime += data.workTime;
        summary.interruptTime += data.interruptTime;
        if (data.workTime) {
          summary.workDay++;
        }
      }
    }
    var wageData = this.getWageData();
    if (wageData.enabled == 1) {
      var salaryTotal = summary.totalTime > 0 ? ((summary.totalTime / 60) * (wageData.value || 0)) : 0;
      summary.salaryTotal = Math.round(salaryTotal * 100) / 100;
    }
    return summary;
  },
  getRestTimeData: function() {
    return this.restTimeData;
  },
  getWageData: function() {
    var data = this.db.getWageData();
    return VCC.Utils.extend({value: null, enabled: 0}, data);
  },
  getCuttOffDate: function() {
    if (this.cuttOffDate === undefined) {
      this.cuttOffDate = this.setting.getCuttOffDate();
    }
    return this.cuttOffDate;
  },
  getCurrentPageYearMonth: function() {
    var cuttOffDate = this.getCuttOffDate();
    var now = VCC.Utils.makeDate();
    var year = now.year;
    var month = now.month;
    if (cuttOffDate && now.day > cuttOffDate) {
      month++;
      if (month == 13) {
        month = 1;
        year++;
      }
    }
    return {year: year, month: month};
  }
};

exports.create = function(options) {
  return new DataMonth(options);
};

