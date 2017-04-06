// summary.js
var path = Ti.App.VCC.isAndroid ? '../' : '';
if (typeof database == 'undefined') {
  var database = require(path + 'database.js');
}

var Summary = function() {
  this.initialize.apply(this, arguments);
};

Summary.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = database.getDB();
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
  exportProcess: function() {
    return this.base.exportProcess();
  },
  getStartDateTime: function() {
    return this.base.getStartDateTime();
  },
  getEndDateTime: function() {
    return this.base.getEndDateTime();
  },
  getCurrentPageYearMonth: function() {
    return this.base.getCurrentPageYearMonth();
  }
};

exports.create = function(options) {
  return new Summary(options);
};
