// list.js
Ti.include('utils.js');
Ti.include('database.js');

var List = function() {
  this.initialize.apply(this, arguments);
};

List.prototype = {
  initialize: function(options) {
    this.options = options || {};
    var base = require("controller/dataMonth");
    this.base = base.create(options);
  },
  setYaerMonth: function(year, month) {
    this.base.setYaerMonth(year, month);
  },
  getMonthlyData: function() {
    return this.base.getMonthlyData();
  },
  getDateData: function(dateTime) {
    return this.base.getDateData(dateTime);
  },
  getStartDateTime: function() {
    return this.base.getStartDateTime();
  },
  getEndDateTime: function() {
    return this.base.getEndDateTime();
  },
  getStartDayOfWeek: function() {
    return this.base.getStartDayOfWeek();
  },
  exportProcess: function() {
    return this.base.exportProcess();
  },
  dummy: function() {
  }
};

exports.create = function(options) {
  return new List(options);
};

