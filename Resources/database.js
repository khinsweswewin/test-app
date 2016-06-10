// database.js
Ti.include('utils.js');

function getDB() {
  var db = VCC.Utils.getGlobal('db');
  if (!db) {
    db =  new VCC.DB();
    VCC.Utils.setGlobal('db', db);
  }
  return db;
}

var VCC;
VCC = VCC || {};
VCC.DB = function() {
  this.initialize.apply(this, arguments);
};
VCC.DB.prototype = {
  TABLE_VERSION: 15,
  DB_NAME: 'timecard',
  TIMECARD_RECORD_TYPE_WORK: 1,
  TIMECARD_RECORD_TYPE_INTERRUPTION: 2,
  TIMECARD_RECORD_TYPE_MODIFICATION: 3,
  TIMECARD_RECORD_TYPE_MANUAL_INPUT: 4,
  TIMECARD_RECORD_TYPE_ABSENCE: 5,
  TIMESETTING_RECORD_TYPE_WORK_TIME: 1,
  TIMESETTING_RECORD_TYPE_REST_TIME: 2,
  TIMESETTING_RECORD_TYPE_MIDNIGHT_TIME: 3,
  PROPERTY_WAGE_VALUE: 'wageValue',
  PROPERTY_WAGE_ENABLED: 'wageEnabled',
  initialize: function(options) {
    this.options = options;
    this.setUserId(1);
    try {
      var tableVersion = Ti.App.Properties.getInt('tableVersion');
    } catch (e) {
      var tableVersion = Ti.App.Properties.getDouble('tableVersion');
    }
    if (tableVersion === null) {
      this.firstRun();
    } else if (tableVersion < 15) {
      this.dropDB();
      this.firstRun();
    } else if (tableVersion < this.TABLE_VERSION) {
      // TODO
      //this.initData();
      this.firstRun();
    }
    Ti.App.Properties.setInt('tableVersion', this.TABLE_VERSION);
    //this.debugOut();
  },
  setUserId: function(userId) {
    this.userId = userId;
  },
  getCurrentTime: function() {
    return Math.floor(new Date().getTime() / 1000);
  },
  openDB: function() {
    if (this.db) return;
    this.db = Ti.Database.open(this.DB_NAME);
  },
  closeDB: function() {
    if (!this.db) return;
    this.db.close();
    this.db = undefined;
  },
  execute: function(sql) {
    if (!this.db) {
      this.openDB();
    }
    if (arguments.length > 1) {
      var parameterStrings = [];
      for (var i = 0; i < arguments.length; i++) {
        parameterStrings.push('arguments[' + i + ']');
      }
       return eval('this.db.execute(' + parameterStrings.join(',') + ')');
    } else {
      Ti.API.info('DB execute:' + sql);
      return this.db.execute(sql);      
    }
  },
  dropDB: function() {
    this.execute('DROP TABLE IF EXISTS timestate');
    //this.execute('DROP TABLE IF EXISTS timesetting');
    this.execute('DROP TABLE IF EXISTS memo');
  },
  firstRun: function() {
    this.execute('CREATE TABLE IF NOT EXISTS timestate  (id INTEGER NOT NULL PRIMARY KEY, type INTEGER, userId INTEGER, startTime INTEGER, endTime INTEGER, createTime INTEGER, updateTime INTEGER, message TEXT, enabled INTEGER)');
    this.execute('CREATE TABLE IF NOT EXISTS timesetting  (id INTEGER NOT NULL PRIMARY KEY, type INTEGER, userId INTEGER, startTime INTEGER, endTime INTEGER, createTime INTEGER, updateTime INTEGER, enabled INTEGER)');
    this.execute('CREATE TABLE IF NOT EXISTS memo  (id INTEGER NOT NULL PRIMARY KEY, userId INTEGER, string TEXT, dateTime INTEGER, createTime INTEGER, updateTime INTEGER, enabled INTEGER)');
    this.execute('CREATE TABLE IF NOT EXISTS property  (key TEXT NOT NULL PRIMARY KEY, userId INTEGER, value TEXT, createTime INTEGER, updateTime INTEGER)');
    this.closeDB();
  },
  deleteRowsById: function(table, ids) {
    if (!ids) return;
    if (ids == +ids) ids = [ids];
    var strs = [];
    for (var i = 0; i < ids.length; i++) {
      strs.push('id=' + ids[i]);
    }
    this.execute('DELETE FROM ' + table + ' WHERE userId = ? AND (' + strs.join(' OR ') + ')', this.userId);
    this.closeDB();
  },
  getTimeStateDataRecent: function(type) {
    var row = this.getTimeStateRecent(type);
    var stateData = row ? this.getStateData(row) : null;
    if (row) row.close();
    this.closeDB();
    return stateData;
  },
  getTimeStateRecent: function(type) {
    if (type === undefined) {
      var rows = this.execute('SELECT * FROM timestate WHERE userId = ? ORDER BY startTime DESC LIMIT 1', this.userId);
    } else {
      var rows = this.execute('SELECT * FROM timestate WHERE userId = ? AND type = ? ORDER BY startTime DESC LIMIT 1', this.userId, type);
    }
    return rows.isValidRow() ? rows : null;
  },
  toStringRow: function(row) {
    var values = [];
    var n = Ti.App.VCC.isAndroid ? row.fieldCount : row.fieldCount();
    for (var i = 0; i < n; i++) {
      values.push(row.fieldName(i) + ': ' + row.field(i));
    }
    return values.join(' ');
  },
  setTimeState: function(state) {
    var id = null;
    var updateTime = this.getCurrentTime();
    switch (state.state) {
    case Ti.App.VCC.STATE_COME:
    case Ti.App.VCC.STATE_INTERRUPT:
      var type = state.state == Ti.App.VCC.STATE_INTERRUPT ? this.TIMECARD_RECORD_TYPE_INTERRUPTION : this.TIMECARD_RECORD_TYPE_WORK;
      this.execute('INSERT INTO timestate (id, type, userId, startTime, createTime, updateTime, message, enabled) VALUES(NULL,?,?,?,?,?,?,1)',
        type,
        this.userId,
        state.time,
        updateTime,
        updateTime,
        '');
      id = this.db.lastInsertRowId;
      break;
    case Ti.App.VCC.STATE_LEFT:
    case Ti.App.VCC.STATE_RETURN:
      var row = this.getTimeStateRecent(state.state == Ti.App.VCC.STATE_RETURN ? this.TIMECARD_RECORD_TYPE_INTERRUPTION :this.TIMECARD_RECORD_TYPE_WORK);
      if (!row) {
        Ti.API.info('VCC.DB.setTimeState row is empty.');
      } else {
        id = row.fieldByName('id');
        this.execute('UPDATE timestate SET endTime = ?, updateTime = ? WHERE userId = ? AND id = ?', state.time, updateTime, this.userId, id);
        row.close();
      }
      break;
    }
    this.closeDB();
    return id;
  },
  updateTimeState: function(id, state) {
    var name;
    switch (state.state) {
    case Ti.App.VCC.STATE_COME:
    case Ti.App.VCC.STATE_INTERRUPT:
      name = 'startTime';
      break;
    case Ti.App.VCC.STATE_LEFT:
    case Ti.App.VCC.STATE_RETURN:
      name = 'endTime';
      break;
    default:
      return;
    }
    this.execute('UPDATE timestate SET ' + name + ' = ?, updateTime = ? WHERE userId = ? AND id = ?',
      state.time,
      this.getCurrentTime(),
      this.userId,
      id);
    this.closeDB();
  },
  deleteTimeState: function(id) {
    this.deleteRowsById('timestate', id);
    this.closeDB();
  },
  debugOut: function() {
    this.debugOutTable('sqlite_master');
    this.debugOutTable('timestate');
    this.debugOutTable('memo');
    this.debugOutTable('timesetting');
    this.debugOutTable('property');
    this.closeDB();
  },
  debugOutTable: function(name) {
    var rows = this.execute('SELECT * FROM ' + name);
    Ti.API.info('debugOut ' + name + ': rows COUNT = ' + rows.getRowCount());
    while (rows.isValidRow()) {
      Ti.API.info(this.toStringRow(rows));
      rows.next();
    }
    rows.close();
  },
  setMemo: function(memo, dateTime) {
    var updateTime = this.getCurrentTime();
    var row = this.getMemoRow(dateTime);
    var id = 0;
    if (row.isValidRow()) {
      id = +row.fieldByName('id');
      this.execute('UPDATE memo SET string = ?, updateTime = ? WHERE userId = ? AND id = ?', memo, updateTime, this.userId, id);
    } else {
      this.execute('INSERT INTO memo (id, userId, string, dateTime, createTime, updateTime, enabled) VALUES(NULL,?,?,?,?,?,1)', this.userId, memo, dateTime, updateTime, updateTime);
      id = this.db.lastInsertRowId;
    }
    row.close();
    return id;
  },
  getMemo: function(dateTime) {
    var row = this.getMemoRow(dateTime);
    var memo = '';
    if (row.isValidRow()) {
      memo = row.fieldByName('string');
      row.close();
    }
    return memo;
  },
  validDateTime: function(dateTime) {
    return Math.floor(dateTime / (24 * 60)) * (24 * 60);
  },
  getMemoRow: function(dateTime) {
    //return null;
    return this.execute('SELECT * FROM memo WHERE userId = ? AND dateTime = ? ORDER BY updateTime DESC LIMIT 1', this.userId, dateTime);
  },
  getDateData: function(year, month, day) {
    var datas = {workStates: [], interruptStates: [], workTime: 0, interruptTime: 0, prevStartTime: 0, prevEndTime: 0, nextStartTime: 0, memo:''};
    var startDateTime;
    if (month === undefined && day === undefined) {
      startDateTime = year;
    } else {
      startDateTime = new Date(year + '/' + month + '/' + day).getTime() / 60000;
    }
    var endDateTime = startDateTime + 24 * 60;
    var prevRows = this.execute('SELECT * FROM timestate WHERE userId = ? AND type = ? AND startTime < ? AND endTime > 0 AND enabled=1 ORDER BY endTime DESC LIMIT 1',
      this.userId, this.TIMECARD_RECORD_TYPE_WORK, startDateTime);
    if (prevRows.isValidRow()) {
      datas.prevStartTime = prevRows.fieldByName('startTime');
      datas.prevEndTime = prevRows.fieldByName('endTime');
    }
    prevRows.close();
    var nextRows = this.execute('SELECT * FROM timestate WHERE userId = ? AND type = ? AND startTime >= ? AND enabled=1 ORDER BY startTime LIMIT 1',
      this.userId, this.TIMECARD_RECORD_TYPE_WORK, endDateTime);
    if (nextRows.isValidRow()) {
      datas.nextStartTime = nextRows.fieldByName('startTime');
    }
    nextRows.close();
    var workRows = this.execute('SELECT * FROM timestate WHERE userId = ? AND type = ? AND startTime >= ? AND startTime < ? AND enabled=1 ORDER BY startTime',
      this.userId, this.TIMECARD_RECORD_TYPE_WORK, startDateTime, endDateTime);
    while (workRows.isValidRow()) {
      var state = this.getStateData(workRows);
      var endTime = state.endTime || datas.nextStartTime;
      datas.workStates.push(state);
      datas.workTime += state.workTime;
      // 間の中断を取得
      var sql = 'SELECT * FROM timestate WHERE userId = ? AND type = ? AND startTime >= ? ' + (endTime ? 'AND startTime < ? ' : '') + 'AND enabled=1 ORDER BY startTime';
      if (endTime) {
        var interruptRows = this.execute(sql,
          this.userId, this.TIMECARD_RECORD_TYPE_INTERRUPTION, state.startTime, endTime);
      } else {
        var interruptRows = this.execute(sql,
          this.userId, this.TIMECARD_RECORD_TYPE_INTERRUPTION, state.startTime);
      }
      while (interruptRows.isValidRow()) {
        var state2 = this.getStateData(interruptRows);
        datas.interruptStates.push(state2);
        datas.interruptTime += state2.interruptTime;
        interruptRows.next();
      }
      interruptRows.close();
      workRows.next();
    }
    workRows.close();
    var memoRows = this.execute('SELECT * FROM memo WHERE userId = ? AND dateTime >= ? AND dateTime < ? AND enabled=1 ORDER BY dateTime', this.userId, startDateTime, endDateTime);
    if (memoRows.isValidRow()) {
      datas.memo = memoRows.fieldByName('string');
      datas.memoId = memoRows.fieldByName('id');
    }
    memoRows.close();
    this.closeDB();
    return datas;
  },
  getMonthlyData: function(year, month, cuttOffDate) {
    if (!cuttOffDate || cuttOffDate != +cuttOffDate) {
      cuttOffDate = 0;
    }
    var startYear = year, endYear = year;
    var startMonth = month, endMonth = month;
    if (cuttOffDate == 0) {
      endMonth++;
      if (endMonth == 13) {
        endMonth = 1;
        endYear++;
      }
    } else {
      startMonth--;
      if (startMonth == 0) {
        startMonth = 12;
        startYear--;
      }
    }
    var startDateTime = new Date(startYear + '/' + startMonth + '/' + (cuttOffDate + 1)).getTime() / 60000;
    var endDateTime = new Date(endYear + '/' + endMonth + '/' + (cuttOffDate + 1)).getTime() / 60000;
    var stateRows = this.execute('SELECT * FROM timestate WHERE userId = ? AND startTime >= ? AND startTime < ? AND enabled=1 ORDER BY startTime', this.userId, startDateTime, endDateTime);
    var memoRows = this.execute('SELECT * FROM memo WHERE userId = ? AND dateTime >= ? AND dateTime < ? AND enabled=1 ORDER BY dateTime', this.userId, startDateTime, endDateTime);
    var length = (endDateTime - startDateTime) / (24 * 60);
    var datas = new Array(length);
    var data;
    while (stateRows.isValidRow()) {
      var state = this.getStateData(stateRows);
      switch (state.type) {
      case this.TIMECARD_RECORD_TYPE_WORK:
        var dataIndex = Math.floor((state.startTime - startDateTime) / (24 * 60));
        data = checkData(datas[dataIndex]);
        data.workStates.push(state);
        break;
      case this.TIMECARD_RECORD_TYPE_INTERRUPTION:
        data = checkData(data);
        data.interruptStates.push(state);
        break;
      }
      data.workTime += state.workTime;
      data.interruptTime += state.interruptTime;
      datas[dataIndex] = data;
      stateRows.next();
    }
    while (memoRows.isValidRow()) {
      var string = memoRows.fieldByName('string');
      var dateTime = memoRows.fieldByName('dateTime');
      var dataIndex = Math.floor((dateTime - startDateTime) / (24 * 60));
      var data = checkData(datas[dataIndex]);
      data.memo = string;
      data.memoId = +memoRows.fieldByName('id');
      datas[dataIndex] = data;
      memoRows.next();
    }
    stateRows.close();
    memoRows.close();
    function checkData(data) {
      return data || {workStates: [], interruptStates: [], workTime: 0, interruptTime: 0, memo:'', memoId: null};
    }
    this.closeDB();
    return datas;
  },
  getStateData: function(stateRows) {
    var type = +stateRows.fieldByName('type');
    var startTime = +stateRows.fieldByName('startTime');
    var endTime = +stateRows.fieldByName('endTime');
    var state = {
      id: +stateRows.fieldByName('id'),
      type: type,
      startTime: startTime,
      endTime: endTime,
      workTime: 0,
      interruptTime: 0
    };
    if (startTime > 0 && endTime > 0) {
      switch (type) {
      case this.TIMECARD_RECORD_TYPE_WORK:
        state.workTime = endTime - startTime;
        break;
      case this.TIMECARD_RECORD_TYPE_INTERRUPTION:
        state.interruptTime = endTime - startTime;
        break;
      }
    }
    return state;
  },
  setTimesettingTableData: function(type, id, data) {
    var dataNames = ['startTime', 'endTime', 'enabled'];
    var dataObj = {};
    for (var i = 0; i < dataNames.length; i++) {
      if (data[dataNames[i]] === undefined) continue;
      dataObj[dataNames[i]] = data[dataNames[i]];
    }
    var data = dataObj;
    var updateTime = new Date() / 1000;
    if (id) {
      var values = [];
      for (var n in data) {
        values.push(n + ' = ' + data[n]);
      }
      values.push('updateTime = ?');
      this.execute('UPDATE timesetting SET ' + values.join(', ') + ' WHERE userId = ? AND type = ? AND id = ?', updateTime, this.userId, type, id);
      if (this.db.rowsAffected == 0) {
        id = false;
      }
    } else {
      this.execute('INSERT INTO timesetting (id, type, userId, startTime, endTime, createTime, updateTime, enabled) VALUES (NULL,?,?,?,?,?,?,1)',
        type,// type
        this.userId,// userId
        data.startTime,// startTime
        data.endTime,// endTime
        updateTime,// createTime
        updateTime// updateTime
      );
      id = this.db.lastInsertRowId;
    }
    this.closeDB();
    return id;
  },
  getTimesettingTableData: function(type, isEnabledOnly) {
    var datas = [];
    var sql = 'SELECT * FROM timesetting WHERE userId = ? AND type = ? ';
    if (isEnabledOnly) {
      sql += 'AND enabled = 1 ';
    }
    sql += 'ORDER BY startTime';
    var rows = this.execute(sql, this.userId, type);
    while (rows.isValidRow()) {
      var data = {id: rows.fieldByName('id'), startTime: rows.fieldByName('startTime'), endTime: rows.fieldByName('endTime')};
      if (!isEnabledOnly) {
        data.enabled = rows.fieldByName('enabled');
      }
      datas.push(data);
      rows.next();
    }
    rows.close();
    this.closeDB();
    return datas;
  },
  setProperty: function(key, value) {
    var updateTime = this.getCurrentTime();
    this.execute('UPDATE property SET value = ?, updateTime = ? WHERE userId = ? AND key = ?', value, updateTime, this.userId, key);
    if (!this.db.rowsAffected) {
      this.execute('INSERT INTO property (key, userId, value, createTime, updateTime) VALUES(?,?,?,?,?)',
        key, this.userId, value, updateTime, updateTime);
    }
    this.closeDB();
  },
  getProperty: function(key) {
    var row = this.execute('SELECT value FROM property WHERE userId = ? AND key = ? LIMIT 1', this.userId, key);
    var value = row.isValidRow() ? row.field(0) : null;
    row.close();
    this.closeDB();
    return value;
  },
  setWorkingTimeData: function(id, data) {
    return this.setTimesettingTableData(this.TIMESETTING_RECORD_TYPE_WORK_TIME, id, data);
  },
  getWorkingTimeData: function() {
    return this.getTimesettingTableData(this.TIMESETTING_RECORD_TYPE_WORK_TIME, true);
  },
  setRestTimeData: function(id, data) {
    return this.setTimesettingTableData(this.TIMESETTING_RECORD_TYPE_REST_TIME, id, data);
  },
  getRestTimeData: function() {
    return this.getTimesettingTableData(this.TIMESETTING_RECORD_TYPE_REST_TIME, false);
  },
  setWageData: function(data) {
    data = data || {};
    if (typeof data.value != 'undefined') {
      this.setProperty(this.PROPERTY_WAGE_VALUE, data.value);
    }
    if (typeof data.enabled != 'undefined') {
      this.setProperty(this.PROPERTY_WAGE_ENABLED, data.enabled);
    }
    return ;
  },
  getWageData: function() {
    var value = this.getProperty(this.PROPERTY_WAGE_VALUE) || '';
    var enabled = +this.getProperty(this.PROPERTY_WAGE_ENABLED) || 0;
    if (typeof value == 'string' && value.indexOf('.0') == value.length - 2) {
      value = '' + (+value);
    }
    return {value: value, enabled: enabled};
  },
  convertData: function() {
    Ti.API.info('convertData');
    this.execute('CREATE TABLE IF NOT EXISTS timestate_tmp  (id INTEGER NOT NULL PRIMARY KEY, type INTEGER, userId INTEGER, startTime INTEGER, endTime INTEGER, updateTime INTEGER, message TEXT, enabled INTEGER)');
    var rows = this.execute('SELECT * FROM timestate ORDER BY startTime');
    var startDate, prevStartDate, isSave;
    while (rows.isValidRow()) {
      var type = rows.fieldByName('type');
      var startTime = Math.floor(rows.fieldByName('startTime') / 60) * 60;
      var endTime = Math.floor(rows.fieldByName('endTime') / 60) * 60;
      if (type == this.TIMECARD_RECORD_TYPE_WORK) {
        startDate = Math.floor(startTime / (24 * 60 * 60));
        isSave = prevStartDate != startDate;
        prevStartDate = startDate;
      } else {
        isSave = startTime != 0;
      }
      Ti.API.info('startTime:' + startTime + ', isSave:' + isSave);
      if (isSave) {
         this.execute('INSERT INTO timestate_tmp (id, type, userId, startTime, endTime, createTime, updateTime, message, enabled) VALUES(NULL,?,?,?,?,?,?,?,1)',
          type,
          1,
          startTime,
          endTime,
          rows.fieldByName('createTime'),
          rows.fieldByName('updateTime'),
          '');
      }
      rows.next();
    }
    rows.close();
    this.execute('DROP TABLE timestate');
    this.execute('ALTER TABLE timestate_tmp RENAME TO timestate');
    this.closeDB();
  },
  initData: function() {
    Ti.API.info('initData');
    var rows = this.execute('SELECT * FROM timestate ORDER BY startTime');
    var prevDateStr = '';
    while (rows.isValidRow()) {
      var id = rows.fieldByName('id');
      var type = rows.fieldByName('type');
      var startTime = rows.fieldByName('startTime');
      if (type == this.TIMECARD_RECORD_TYPE_WORK) {
        var date = new Date(startTime * 60000);
        var dateStr = '' + date.getFullYear() + (date.getMonth() + 1) + date.getDate();
        if (prevDateStr == dateStr) {
          this.execute('DELETE FROM timestate WHERE id = ?', id);
        }
        prevDateStr = dateStr;
      }
      rows.next();
    }
    rows.close();
    this.closeDB();
  },
  dummy: function() {
  }
}

/*
var db = new VCC.DB();
db.test();
*/
