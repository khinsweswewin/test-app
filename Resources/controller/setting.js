// setting.js
var path = Ti.App.VCC.isAndroid ? '../' : '';
if (typeof VCC == 'undefined') {
  var utils = require(path + 'utils.js');
  var VCC = utils.VCC;
}
if (typeof database == 'undefined') {
  var database = require(path + 'database.js');
}

var Setting = function() {
  this.initialize.apply(this, arguments);
};

Setting.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = database.getDB();
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
  getWageData: function() {
    var data = this.db.getWageData();
    return VCC.Utils.extend({value: null, enabled: 0}, data);
  },
  setWageData: function(data) {
    this.db.setWageData(data);
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
  getCuttOffDate: function() {
    this.cuttOffDate = this.db.getProperty('cuttOffDate') || 0;
    if (this.cuttOffDate == + this.cuttOffDate) {
      this.cuttOffDate = Math.abs(this.cuttOffDate);
    }
    //this.db.deleteProperty('cuttOffDate');
    return this.cuttOffDate;
  },
  setCuttOffDate: function(cuttOffDate) {
    if (this.cuttOffDate != cuttOffDate) {
      this.db.setProperty('cuttOffDate', cuttOffDate);
      this.cuttOffDate = cuttOffDate;
    }
  },
  getPurchased: function(identifier) {
    if (!this.purchased) {
      this.purchased = {};
    }
    if (this.purchased[identifier] === undefined) {
      var data = this.db.getProperty('Pcd-' + identifier);
      if (Ti.Utils === undefined) {
        return;
      }
      this.purchased[identifier] = data == Ti.Utils.sha1(identifier + ':' + true);
    }
    return this.purchased[identifier];
  },
  setPurchased: function(identifier, value) {
    if (!this.purchased) {
      this.purchased = {};
    }
    this.db.setProperty('Pcd-' + identifier, Ti.Utils.sha1(identifier + ':' + value));
    this.purchased[identifier] = value;
    return;
  },
  isNotification: function(flag) {
    if (this.notification === undefined) {
      this.notification = this.db.getProperty('notification') || 0;
    }
    return (this.notification & flag) != 0;
  },
  setNotification: function(flag) {
    if (this.notification === undefined) {
      this.notification = this.db.getProperty('notification') || 0;
    }
    this.notification |= flag;
    this.db.setProperty('notification', this.notification);
  },
  dummy: function() {
  }
};

exports.create = function(options) {
  return new Setting(options);
};
