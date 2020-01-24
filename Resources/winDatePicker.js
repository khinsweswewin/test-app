
function initialize(win) {
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
  var columnWidth = Titanium.Platform.displayCaps.platformWidth / 2;
  if (columnWidth < 220) {
    columnWidth = 220;
  } else if (columnWidth > 300) {
    columnWidth = 300;
  }
  var rows = [];
  var columns = [];
  var max = 28;
  var selectedIndex = null;
  for (var i = 0; i <= max; i++) {
    var value = i == max ? 0 : (i + 1);
    var text = win.makeValueStr(value);
    var rowOption = {
//      title: text,
      value: value,
      width: Ti.UI.SIZE,
      height: Ti.UI.SIZE,
      selected: value == winData
    };
    if (isAndroid) {
      rowOption.title = text;
    }
    var row = Ti.UI.createPickerRow(rowOption);
    if (!isAndroid) {
      var label = Ti.UI.createLabel({
        text: text,
        font: {fontSize:24, fontWeight:'bold'},
        textAlign: 'center',
        color: 'black',
        width: Ti.UI.SIZE,
        height: Ti.UI.SIZE
      });
      row.add(label);
    }
    rows.push(row);
    if (rowOption.selected) {
      selectedIndex = i;
    }
  }
  var pickerColumn = Ti.UI.createPickerColumn({
    rows: rows,
    width: columnWidth
  });
  columns.push(pickerColumn);
  picker = Ti.UI.createPicker({
    columns: columns,
    backgroundColor: 'white',
    useSpinner: true
  });
//  picker.top = Math.min(winHeight / 2, winHeight - picker.height - 60);
  picker.selectionIndicator = true;

  win.add(picker);
  setTimeout(function() {
    picker.setSelectedRow(0, selectedIndex, false);
  }, 1);

  function getPickerValue() {
    var row = picker.getSelectedRow(0);
    //info('getPickerValue:' + row);
    //info('picker.value:' + row.value);
    return row ? row.value: null;
  }

}

exports.initialize = initialize;
