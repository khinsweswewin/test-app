// list.js
if (typeof utils_js == 'undefined') {
  Ti.include('utils.js');
}
if (typeof database_js == 'undefined') {
  Ti.include('database.js');
}

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
  getDateTime: function(index) {
    return this.base.getDateTime(index);
  },
  exportProcess: function() {
    return this.base.exportProcess();
  },
  getCuttOffDate: function() {
    return this.base.getCuttOffDate();
  },
  getCurrentPageYearMonth: function() {
    return this.base.getCurrentPageYearMonth();
  }
};

exports.create = function(options) {
  return new List(options);
};

