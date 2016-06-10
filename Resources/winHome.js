Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;
var winHeight = win.height || Ti.Platform.displayCaps.platformHeight;

var now;
// add admob
VCC.Utils.addAdmob(win);

// setting toolbar
var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
  var dateTime = VCC.Utils.resetTime(VCC.Utils.getGlobal('come_time') * 60000) / 60000;
  var winMemo = VCC.Utils.createWin('winMemo.js', null, {  
    dateTime: dateTime
  });
  VCC.Utils.openWin(winMemo, Ti.UI.currentTab);
});

var timeLabel = Ti.UI.createLabel({
  text: '',
  height: 100,
  shadowColor: '#aaa',
  color: '#000',
  font: {fontSize: 90, fontWeight: 'bold'},
  top: winHeight / 3 - (isAndroid ? 30 : 20),
  textAlign: 'center'
});
var dateLabel = Ti.UI.createLabel({
  text: '',
  height: 40,
  shadowColor: '#aaa',
  color: '#888',
  font: {fontSize: 20},
  top: winHeight / 3 + 65,
  width: 200,
  textAlign: 'center'
});
var statusLabel = Ti.UI.createLabel({
  text: 'ststus label',
  height: 50,
  shadowColor: '#aaa',
  color: '#888',
  font: {fontSize:20},
  top: winHeight / 2 + 110,
  width: 300,
  textAlign: 'center'
});

win.add(timeLabel);
win.add(dateLabel);
win.add(statusLabel);

// create buttons
var controller = require("controller/home");
controller = controller.create();

var winButtons = [];
var timeLabelText = null;
var dateLabelText = null;
var currentState = {};

var timertId = null;

win.addEventListener('blur', function(e) {
  stopTimer();
});
win.addEventListener('open', function(e) {
  startTimer();
});
win.focusCallback = function(isChangeWindow, isChangeTab) {
//  Ti.API.info('winHome focusCallback:' + [isChangeWindow, isChangeTab]);
  if (isChangeTab) {
    setView();
  }
  startTimer();
}
setView();

function setView() {
  currentState = controller.getCurrentState();
  setStatus();
  setDateTime();
}

function startTimer() {
  if (timertId === null) {
    timertId = setInterval(setDateTime, 500);
  }
}
function stopTimer() {
  if (timertId !== null) {
    clearInterval(timertId);
    timertId = null;
  }
}
function setStatus() {
  var state = VCC.Utils.getGlobal('state');
  currentState.state = state;
  currentState.time = VCC.Utils.getGlobal('time');
  currentState.come_time = VCC.Utils.getGlobal('come_time');
  var timeType = state == Ti.App.VCC.STATE_COME ? 'come_time' : 'time';
  var time = currentState[timeType];
  var dateStr = '';
  if (time > 0) {
    var date = VCC.Utils.makeDate(time * 60000);
    dateStr = String.format('(%s)', VCC.Utils.formatDate(null, date.month, date.day, null, date.hour, date.minute));
  }
  var newButtons = [];
  var buttonEnabled = true;
  switch (state) {
  case Ti.App.VCC.STATE_COME:
    newButtons = ['suspend', 'leave'];
    statusLabel.text = VCC.Utils.stateToText(state) + dateStr;
    toolBar.btnRight.enabled = true;
    break;
  case Ti.App.VCC.STATE_INTERRUPT:
    newButtons = ['return'];
    statusLabel.text = VCC.Utils.stateToText(state) + dateStr;
    toolBar.btnRight.enabled = true;
    break;
  case Ti.App.VCC.STATE_LEFT:
//    break;
  default:
    newButtons = ['on_work'];
    statusLabel.text = VCC.Utils.stateToText(state) + dateStr;
    toolBar.btnRight.enabled = false;
    break;
  }
  var isChangeButton = newButtons.length != winButtons.length;
  if (!isChangeButton) {
    for (var i = 0; i < newButtons.length; i++) {
      if (newButtons[i] != winButtons[i].action) {
        isChangeButton = true;
        break;
      }
    }
  }
  if (isChangeButton) {
    for (var i = 0; i < winButtons.length; i++) {
      win.remove(winButtons[i]);
    }
    winButtons = [];
    var winWidth = Ti.Platform.displayCaps.platformWidth;
    var buttonWidth = newButtons.length == 1 ? 215 : 120;
    var buttonPitch = winWidth > 320 ? 30 : 15;
    for (var i = 0; i < newButtons.length; i++) {
      var button = Ti.UI.createButton({
        title: L('str_' + newButtons[i], null, true),
        color: '#000',
        font: {fontSize:20},
        backgroundImage: 'images/button_large.png',
        backgroundLeftCap: 30.0,
        height: 66,
        width: buttonWidth,
        top: winHeight / 2 + 50,
        action: newButtons[i]
      });
      button.addEventListener('click', onButtonClick);
      button.left = winWidth / 2 - ((buttonWidth + buttonPitch) * newButtons.length - buttonPitch) / 2 + (buttonWidth + buttonPitch) * i;
      win.add(button);
      winButtons.push(button);
      Ti.API.info('button.title:' + button.title);
    }
    setDateTime();
  }
}

// Button Click Action
function onButtonClick(e) {
  if (e.source.action == 'on_work') {
    var title = '', dialgButtons = [];
    var options = [];
    var come_time = currentState.come_time;
    var state = VCC.Utils.createState();
    var leave_time = currentState.time;
    var comeDateTime = come_time ? VCC.Utils.getDayDateTime(come_time) : null;
    var todayDateTime = VCC.Utils.getDayDateTime();
    var cancelIndex = null;
    if (comeDateTime == todayDateTime) {
      title = L('str_work_only_onece');
      dialgButtons = ['change_work_time', 'ok'];
    } else if (state.time < leave_time) {
      title = L('str_leave_time_since_now');
      dialgButtons = ['change_leave_time', 'ok'];
    } else {
      title = L('str_to_work');
      dialgButtons = ['on_work', 'cancel'];
      cancelIndex = 1;
    }
    if (!dialgButtons.length) {
      return;
    }
    for (var i = 0; i < dialgButtons.length; i++) {
      options.push(L('str_' + dialgButtons[i], null, true));
    }
    var callback = function(e) {
      var updateState = false;
      switch(dialgButtons[e.index]) {
        case 'on_work': // 出社が押された
          controller.clickAction('on_work');
          updateState = true;
          break;
        case 'cancel': // キャンセルが押された
          break;
        case 'change_leave_time': // 変更が押された
        case 'change_work_time': // 変更が押された
          controller.openDetail(comeDateTime);
          break;
      }
      if (updateState) {
        setStatus();
      }
    };
    VCC.Utils.createDialog(title, options, callback, cancelIndex, 1);
  } else {
    if (controller.clickAction(e.source.action)) {
      setStatus();
    }
  }
}
function setDateTime() {
  now = VCC.Utils.makeDate();
  var timeText = VCC.Utils.formatDate(null, null, null, null, now.hour, now.minute)
  var dateText = VCC.Utils.formatDate(now.year, now.month, now.day, now.dayOfWeek);
  if (timeLabelText != timeText) {
    timeLabel.text = timeText;
    timeLabelText = timeText;
  }
  if (dateLabelText != dateText) {
    dateLabel.text = dateText;
    dateLabelText = dateText;
  }
  var buttonEnabled = winButtons[0].enabled;
  if (((now.minuteTime == currentState.time)　&& (currentState.state != Ti.App.VCC.STATE_LEFT)) == buttonEnabled) {
    for (var i = 0; i < winButtons.length; i++) {
      VCC.Utils.setButtonEnabled(winButtons[i], !buttonEnabled);
    }
  }
}