// summary.js
Ti.include('utils.js');
Ti.include('database.js');

var Summary = function() {
  this.initialize.apply(this, arguments);
};

Summary.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = getDB();
    var base = require("controller/dataMonth");
    this.base = base.create();
    var setting = require("controller/setting");
    this.setting = setting.create();
  },
  setYaerMonth: function(year, month) {
    this.base.setYaerMonth(year, month);
  },
  getMonthlySummary: function() {
    return this.base.getMonthlySummary();
  },
  getEndDateTime: function() {
    return this.base.getEndDateTime();
  },
  exportProcess: function() {
    return this.base.exportProcess();
  },
  dummy: function() {
  }
};

exports.create = function(options) {
  return new Summary(options);
};
