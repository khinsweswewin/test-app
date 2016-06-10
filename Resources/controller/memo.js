// memo.js
Ti.include('utils.js');
Ti.include('database.js');

var Memo = function() {
  this.initialize.apply(this, arguments);
};

Memo.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.setDateTime(options.dateTime);
    this.db = getDB();
  },
  setDateTime: function(dateTime) {
    this.dateTime = dateTime;
  },
  setMemo: function(memo) {
    this.db.setMemo(memo, this.dateTime);
  },
  getMemo: function() {
    return this.db.getMemo(this.dateTime);
  },
  dummy: function() {
  }
};

exports.create = function(options) {
  return new Memo(options);
};

