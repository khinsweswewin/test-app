Ti.include('utils.js');

var win = Ti.UI.currentWindow;
win.focusCallback = function(isChangeWindow, isChangeTab) {
  //info('winPicker:' + [isChangeWindow, isChangeTab, Ti.UI.currentTab.window.tabIndex]);
  if (isChangeTab && win.isCloseOnChangeTab) {
    win.onChangeTab = true;
    win.close();
  }
};


// get param from app.js
var isAndroid = Ti.App.VCC.isAndroid;
var winHeight = win.height || Titanium.Platform.displayCaps.platformHeight;

var title = win.title;
var offsetData = 0;

var toolBar = win.toolBar;
toolBar.btnRight.addEventListener('click', function(e) {
  // 保存と前の画面に戻る処理
  win.value = getPickerValue();
  var returnData = win.value / 60000 - offsetData;
  win.returnData = returnData;
  win.close();
});

var pickerType = typeof win.pickerType != 'undefined' ? win.pickerType : (isAndroid ? Ti.UI.PICKER_TYPE_TIME : Ti.UI.PICKER_TYPE_DATE_AND_TIME);
var minDate = null;
var maxDate = null;
if (win.minTime !== undefined) {
  minDate = createDate(win.minTime);
}
if (win.maxTime !== undefined) {
  maxDate = createDate(win.maxTime);
}
var dataDate = createDate(win.data) || new Date(VCC.Utils.getDateTime() * 60000);
//info('dateDate:' + dataDate);
dataDate = VCC.Utils.checkDateRange(dataDate, minDate, maxDate);
var picker;
var standardDate = null;
var columns = [];
var rowIndexes = [];
var useMyTimePicker = isAndroid;
//info('createPicker:' + [dataDate, minDate, maxDate]);
if (useMyTimePicker) {
//if (true) {
  var columnWidth = (Titanium.Platform.displayCaps.platformWidth - 30) / 3;
  if (win.dateTime) {
    standardDate = new Date(win.dateTime * 60000);
    var picker1 = Ti.UI.createPickerColumn({width: columnWidth});
    var max = 5;
    if (maxDate) {
      max = Math.round((VCC.Utils.fixSummerDate(maxDate).getTime() - standardDate.getTime()) / (24 * 60 * 60000)) + 1;
    }
    for (var i = 0; i < max; i++) {
      var second = win.dateTime + i * 24 * 60;
      var date = VCC.Utils.fixSummerDate(second * 60000);
      picker1.addRow(Ti.UI.createPickerRow({title: VCC.Utils.formatDate(null, date.getMonth() + 1, date.getDate()), value: second, type: 'date', font: {fontSize:20}}));
    }
    columns.push(picker1);
  }
  var picker2 = Ti.UI.createPickerColumn({width: columnWidth});
  //??
  for (var i = 0; i < 24; i++) {
    picker2.addRow(Ti.UI.createPickerRow({title: String.formatDecimal(i, '00'), value: i, type: 'hour', font: {fontSize:20}}));
  }
  columns.push(picker2);

  var picker3 = Ti.UI.createPickerColumn({width: columnWidth});
  for (var i = 0; i < 60; i++) {
    picker3.addRow(Ti.UI.createPickerRow({title: String.formatDecimal(i, '00'), value: i, type: 'minute', font: {fontSize:20}}));
  }
  columns.push(picker3);
  // 2 columns as an array
  //picker.add([picker1,picker2]);
  picker = Ti.UI.createPicker({
    columns: columns,
    useSpinner: true,
    top: 94
  });
  setPickerValue(dataDate);
} else {
  picker = Ti.UI.createPicker({
    type: pickerType,
    value: dataDate,
    minDate: minDate,
    maxDate: maxDate,
    useSpinner: isAndroid//,
    //top: (isAndroid ? 94 : 50)
  });
}

if (picker.height) {
  picker.top = Math.min(winHeight / 2, winHeight - picker.height);
} else if (winHeight < 600) {
  if (!isOldiOS && winHeight > 500) {
    picker.top = winHeight / 3;
  } else {
    picker.bottom = 0;
  }
} else {
  picker.top = winHeight / 2;
}
picker.selectionIndicator = true;
picker.addEventListener('change', function(e) {
  rowIndexes[e.columnIndex] = e.rowIndex;
  var date = getPickerValue();
  var checkDate = VCC.Utils.checkDateRange(date, minDate, maxDate);
  if (checkDate.getTime() != date.getTime()) {
    setPickerValue(checkDate);
  }
});
win.add(picker);

var btnNow = Ti.UI.createButton({
  title: L('str_now'),
  color: '#000',
  font: {fontSize:20},
  backgroundImage: 'images/button_large.png',
  backgroundLeftCap: 30.0,
  height: 66,
  width: 215,
  top: winHeight / 3 - 110
});

btnNow.addEventListener('click', function(e){
  var date = getPickerValue();
  var now = new Date();
  date.setHours(now.getHours());
  date.setMinutes(now.getMinutes());
  //info('btnNow:' + [date, minDate, maxDate]);
  if (date.getTime() < minDate.getTime()) {
    date = minDate;
  } else if (date.getTime() > maxDate.getTime()) {
    date = maxDate;
  }
  setPickerValue(date);
});
win.add(btnNow);

function setPickerValue(date) {
  if (columns.length) {
    var valueIndex = 0;
    rowIndexes =[];
    if (columns.length == 3) {
      valueIndex = (VCC.Utils.resetTime(date).getTime() - standardDate.getTime()) / (24 * 60 * 60 * 1000);
      if (columns[0].rows.length <= valueIndex) valueIndex = 0;
      picker.setSelectedRow(rowIndexes.length, valueIndex, false);
      rowIndexes.push(valueIndex);
    } else {
      standardDate = new Date(date.getFullYear() + '/' + (date.getMonth() + 1) + '/' + date.getDate());
    }
    valueIndex = date.getHours();
    picker.setSelectedRow(rowIndexes.length, valueIndex, false);
    rowIndexes.push(valueIndex);
    valueIndex = date.getMinutes();
    picker.setSelectedRow(rowIndexes.length, valueIndex, false);
    rowIndexes.push(valueIndex);
  } else {
    picker.value = date;
  }
}

function getPickerValue() {
  if (columns.length) {
    var values = [];
    for (var i = 0; i < rowIndexes.length; i++) {
      values.push(picker.columns[i].rows[rowIndexes[i]]);
    }
    var date = values.length == 3 ? new Date(values[0].value * 60000) : standardDate;
    date.setHours(values[values.length - 2].value);
    date.setMinutes(values[values.length - 1].value);
    return date;
  } else {
    return picker.value;
  }
}

function createDate(time) {
  if (time === undefined) return;
  if (win.dataType == 'minutes') {
    //pickerType = Ti.UI.PICKER_TYPE_TIME;
    if (!offsetData) offsetData = new Date('1999/1/1').getTime() / 60000;
    time = +time + offsetData;
  } else if (!time) {
    return;
  }
  var date = new Date(time * 60000);
  return !isNaN(date.getTime()) ? date : new Date();
}
