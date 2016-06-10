Ti.include('utils.js');

var win = Ti.UI.currentWindow;
// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;
var winHeight = win.height || Titanium.Platform.displayCaps.platformHeight;

var title = win.title;

var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
  // 保存と前の画面に戻る処理
  win.value = getPickerValue();
  var returnData = win.value;
  win.returnData = returnData;
  win.close();
});

var winData = win.data;
var picker;
var columns = [];

var columnWidth = (Titanium.Platform.displayCaps.platformWidth - 30) / 3;
var picker1 = Ti.UI.createPickerColumn(/*{width: columnWidth}*/);
columns.push(picker1);
picker = Ti.UI.createPicker({
  columns: columns,
  useSpinner: true
});
var max = 28;
for (var i = 0; i <= max; i++) {
  var value = i == max ? 0 : (i + 1);
  var text = win.makeValueStr(value);
  var row = Ti.UI.createPickerRow({
    value: value,
    selected: value == winData
  });
  var label = Ti.UI.createLabel({
      text: text,
      font: {fontSize:24, fontWeight:'bold'},
      width: 'auto',
      height: 'auto'
  });
  row.add(label);
  picker.add(row);
}

picker.top = Math.min(winHeight / 2, winHeight - picker.height - 60);
picker.selectionIndicator = true;

win.add(picker);
Ti.API.info('picker.top:' + picker.top);
function getPickerValue() {
  var row = picker.getSelectedRow(0);
  Ti.API.info('getPickerValue:' + row);
  Ti.API.info('picker.value:' + row.value);
  return row ? row.value: null;
}

