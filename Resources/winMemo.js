Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;

var controller = null;
var value = '';
if (win.dateTime) {
  controller = require("controller/memo");
  controller = controller.create({dateTime: win.dateTime});
  value = controller.getMemo();
} else if (win.data) {
  value = win.data;
}

var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
  // 保存と前の画面に戻る処理
  if (controller) controller.setMemo(ta1.value);
  win.value = ta1.value;
  win.close();
});
var ta1 = Ti.UI.createTextArea({
  value: value,
  height: 200,	
  width: Math.min(Titanium.Platform.displayCaps.platformWidth - 20, 600),
  top: (isAndroid ? 54 : 10),
  font: {fontSize: 20},
  color: '#000',
  textAlign: 'left',
  //appearance: Ti.UI.KEYBOARD_APPEARANCE_ALERT,
  //keyboardType: Ti.UI.KEYBOARD_DEFAULT,
  //returnKeyType: Ti.UI.RETURNKEY_DEFAULT,
  borderWidth: 2,
  borderColor: '#bbb',
  borderRadius: 5,
  suppressReturn: false
});
win.add(ta1);

