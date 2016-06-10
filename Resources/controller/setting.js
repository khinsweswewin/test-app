// setting.js
Ti.include('utils.js');
Ti.include('database.js');

var Setting = function() {
  this.initialize.apply(this, arguments);
};

Setting.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = getDB();
  },
  getRegularTimeData: function() {
    var datas = this.db.getWorkingTimeData();
    if (datas.length) {
      this.workingTimeId = datas[0].id;
      return datas[0];
    }
    return {startTime: null, endTime: null};
  },
  setRegularTime: function(type, time) {
    var data = {};
    data[type] = time;
    this.workingTimeId = this.db.setWorkingTimeData(this.workingTimeId, data);
  },
  getRestTimeData: function() {
    var datas = this.db.getRestTimeData();
    if (datas.length) {
      this.restTimeId = datas[0].id;
      return datas[0];
    }
    return {startTime: null, endTime: null, enabled: 0};
  },
  setRestTimeData: function(data) {
    this.restTimeId = this.db.setRestTimeData(this.restTimeId, data);
  },
  getMailAddress: function() {
    this.email = this.db.getProperty('mailAddress');
    return this.email;
  },
  setMailAddress: function(email) {
    if (this.email != email) {
      this.db.setProperty('mailAddress', email);
      this.email = email;
    }
  },
  dummy: function() {
  }
};

exports.create = function(options) {
  return new Setting(options);
};
