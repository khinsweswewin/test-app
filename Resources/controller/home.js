// home.js
var path = Ti.App.VCC.isAndroid ? '../' : '';
Ti.include(path + 'utils.js');
Ti.include(path + 'database.js');

var Home = function() {
  this.initialize.apply(this, arguments);
};

Home.prototype = {
  initialize: function(options) {
    this.options = options || {};
    this.db = getDB();
  },
  openDetail: function(time) {
    var dateTime = VCC.Utils.getDayDateTime(time);
    var tab, win;
    if (Ti.App.VCC.isAndroid) {
      // TODO
    } else {
      var index = 1;
      Ti.App.Properties.setInt('tabIndex', index);
      var tabGroup = VCC.Utils.getGlobal('tabGroup');
      var tab = tabGroup.tabs[index];
      tabGroup.setActiveTab(tab);
      win = tab.window;
    }
    if (win) {
      if (typeof win.openWinDetail == 'function') {
        win.openWinDetail(dateTime);
      } else {
        win.openWinDetailDateTime = dateTime;
      }
    }
  },
  clickAction: function(action) {
    var state = null;
    switch(action) {
      case 'on_work': // 出社が押された
        state = this.setState(Ti.App.VCC.STATE_COME);
        break;
      case 'suspend': // 中断が押された
        state = this.setState(Ti.App.VCC.STATE_INTERRUPT);
        break;
      case 'leave': // 退社が押された
        state = this.setState(Ti.App.VCC.STATE_LEFT);
        break;
      case 'return': // 復帰が押された
        state = this.setState(Ti.App.VCC.STATE_COME);
        state.state = Ti.App.VCC.STATE_RETURN;
        break;
    }
    if (state != null) {
      this.db.setTimeState(state);
      return true;
    }
    return false;
  },
  setState: function(state) {
    var ss = VCC.Utils.createState(state);
    this.saveStateProperties(ss);
    return ss;
  },
  saveStateProperties: function(stateData) {
    if (!stateData.state) {
      VCC.Utils.setGlobal('state', '');
      VCC.Utils.setGlobal('time', 0);
      VCC.Utils.setGlobal('come_time', 0);
      return;
    }
    VCC.Utils.setGlobal('state', stateData.state);
    VCC.Utils.setGlobal('time', stateData.time);
    if (stateData.state == Ti.App.VCC.STATE_COME) {
      VCC.Utils.setGlobal('come_time', stateData.time);
    }
    if (stateData.come_time !== undefined) {
      VCC.Utils.setGlobal('come_time', stateData.come_time);
    }
  },
  getCurrentState: function() {
    var workState = this.db.getTimeStateDataRecent(this.db.TIMECARD_RECORD_TYPE_WORK);
    var interruptState = this.db.getTimeStateDataRecent(this.db.TIMECARD_RECORD_TYPE_INTERRUPTION);
    var state = {};
    if (workState) {
      Ti.API.info('getCurrentState:' + [workState.startTime, workState.endTime]);
      if (workState.endTime) {
        // 退社
        state.state = Ti.App.VCC.STATE_LEFT;
        state.time = workState.endTime;
        state.come_time = workState.startTime;
      } else {
        // 出社
        state.state = Ti.App.VCC.STATE_COME;
        state.time = state.come_time = workState.startTime;
        if (interruptState && !interruptState.endTime && interruptState.startTime > workState.startTime) {
          // 中断
          state.state = Ti.App.VCC.STATE_INTERRUPT;
          state.time = interruptState.startTime;
        }
      }
    }
    this.saveStateProperties(state);
    return state;
  },
  dummy: function() {
    ;
  }
};

exports.create = function(options) {
  return new Home(options);
};
