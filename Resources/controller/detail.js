// detail.js
Ti.include('utils.js');
Ti.include('database.js');

var Detail = function() {
  this.initialize.apply(this, arguments);
};

Detail.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = getDB();
    var setting = require("controller/setting");
    this.setting = setting.create();
  },
  setDateTime: function(dateTime) {
    this.dateTime = dateTime;
    this.date = new Date(this.dateTime * 60000);
    this.year = this.date.getFullYear();
    this.month = this.date.getMonth() + 1;
    this.day = this.date.getDate();
    this.restTimeData = this.setting.getRestTimeData();
    this.regularTimeData = this.setting.getRegularTimeData();
  },
  getDateStr: function() {
    return this.date ? VCC.Utils.formatDate(null, this.month, this.day, this.date.getDay()) : '';
  },
  getDateData: function() {
    this.datas = this.db.getDateData(this.year, this.month, this.day);
    return this.datas;
  },
  getRestTimeData: function() {
    return this.restTimeData;
  },
  getRegularTimeData: function() {
    return this.regularTimeData;
  },
  setMemo: function(memo) {
    this.datas.memoId = this.db.setMemo(memo, this.dateTime);
    this.datas.memo = memo;
    return this.datas.memoId;
  },
  updateWorkData: function(index, key, value) {
    var state = {
      state: key == 'startTime' ? Ti.App.VCC.STATE_COME : Ti.App.VCC.STATE_LEFT,
      time: value
    };
    var workState = this.datas.workStates[index];
    if (workState) {
      this.db.updateTimeState(workState.id, state);
    } else {
      var id = this.db.setTimeState(state);
      workState = {id: id, workTime: 0};
    }
    workState[key] = value;
    if (workState.endTime > 0) {
      workState.workTime = workState.endTime - workState.startTime;
    }
    this.datas.workStates[index] = workState;
    return workState;
  },
  updateInterruptData: function(index, startTime, endTime) {
    var interruptState = this.datas.interruptStates[index];
    if (startTime || endTime) {
      var state = {
        state: startTime ? Ti.App.VCC.STATE_INTERRUPT : Ti.App.VCC.STATE_RETURN,
        time: startTime ? startTime : endTime
      };
      if (interruptState) {
        this.db.updateTimeState(interruptState.id, state);
      } else {
        var id = this.db.setTimeState(state);
        interruptState = {id: id, interruptTime: 0};
      }
    }
    if (startTime && endTime) {
      var state = {
        state: Ti.App.VCC.STATE_RETURN,
        time: endTime
      };
      this.db.updateTimeState(interruptState.id, state);
    }
    if (startTime) {
      interruptState.startTime = startTime;
    }
    if (endTime) {
      interruptState.endTime = endTime;
    }
    if (interruptState.endTime > 0) {
      interruptState.interruptTime = interruptState.endTime - interruptState.startTime;
    }
    this.datas.interruptStates[index] = interruptState;
    return interruptState;
  },
  deleteInterrupt: function(index) {
    var interruptState = this.datas.interruptStates[index];
    this.db.deleteTimeState(interruptState.id);
    var interruptStates = this.datas.interruptStates;
    this.datas.interruptStates = [];
    for (var i = 0; i < interruptStates.length; i++) {
      if (i == index) continue;
      this.datas.interruptStates.push(interruptStates[i]);
    }
    return this.datas.interruptStates;
  },
  deleteDateData: function() {
    if (this.datas) {
      var ids = [];
      for (var i = 0; i < this.datas.workStates.length; i++) {
        if (!this.datas.workStates[i].id) continue;
        ids.push(this.datas.workStates[i].id);
      }
      for (var i = 0; i < this.datas.interruptStates.length; i++) {
        if (!this.datas.interruptStates[i].id) continue;
        ids.push(this.datas.interruptStates[i].id);
      }
      if (ids.length) {
        this.db.deleteRowsById('timestate', ids);
      }
      if (this.datas.memoId) {
        this.db.deleteRowsById('memo', this.datas.memoId);
      }
      return {workStates: [], interruptStates: [], workTime: 0, interruptTime: 0, memo:''};
    }
  },
  dummy: function() {
  }
};

exports.create = function(options) {
  return new Detail(options);
};

