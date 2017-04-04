var offsetTop = isOldiOS ? 0 : 20;

function initialize(win) {
	//Ti.include('utils.js');
	var controller = null;

	var defaultRegularTime = {
		startTime : 9 * 60,
		endTime : 17 * 60
	};
	var defaultRestTime = {
		startTime : 12 * 60,
		endTime : 13 * 60
	};

	var regularTimeData = null;
	var restTimeData = null;
	var wageData = null;
	var cuttOffDate = null;
	var enabledStartTime = null;

	var tableDatas = [];
	var optValues = ['type', 'hasChild', 'header', 'data'];

	var tableView = null;

	win.focusCallback = function(isChangeWindow, isChangeTab) {
		setTimeout(setup, 0);
	};

	function setup() {
		win.focusCallback = null;

    controller = require("controller/setting");
    controller = controller.create();
    
    regularTimeData = controller.getRegularTimeData();
    restTimeData = controller.getRestTimeData();
    wageData = controller.getWageData();
    cuttOffDate = controller.getCuttOffDate();
    enabledStartTime = regularTimeData.startTime == +regularTimeData.startTime;
    // create table view data object
    var datas = [
      {
        header: L('str_setting_general'),
        title: L('str_regular_start'),
        value: enabledStartTime ? VCC.Utils.formatHourMinute(regularTimeData.startTime) : '',
        velueAlign: 'right',
        data: regularTimeData.startTime,
        hasChild: true,
        action: 'picker',
        type: 'startTime'
      },
      {
        title: L('str_regular_end'),
        value: regularTimeData.endTime == +regularTimeData.endTime ? VCC.Utils.formatHourMinute(regularTimeData.endTime) : '',
        velueAlign: 'right',
        data: regularTimeData.endTime,
        hasChild: enabledStartTime,
        selectionStyle: enabledStartTime ? 'BLUE' : 'NONE',
        action: 'picker',
        type: 'endTime'
      },
      {
        title: L('str_rest_fix'),
        value: makeRestTimeStr(restTimeData),
        velueAlign: 'right',
        data: restTimeData,
        hasChild: true,
        action: 'settingBreak',
        type: ''
      },
      {
        title: L('str_cut_off_date'),
        value: makeCuttOffDateStr(cuttOffDate),
        velueAlign: 'right',
        data: cuttOffDate,
        hasChild: true,
        action: 'datePicker',
        type: ''
      },
      {
        title: L('str_set_wage'),
        value: makeWageStr(wageData),
        velueAlign: 'right',
        data: wageData,
        hasChild: true,
        action: 'settingWage',
        type: ''
      },
      {
        header: L('str_setting_mail_address'),
        //title: L('str_mail_address'),
        valueType: 'textField',
        callback: onEventTextField,
        hintText: L('str_setting_mail_address_hint'),
        value: controller.getMailAddress(),
        left: 10,
        selectionStyle: 'NONE',
        type: 'mailAddress',
        keyboardType: Ti.UI.KEYBOARD_EMAIL,
        returnKeyType: Ti.UI.RETURNKEY_DONE
      }
    ];
    
    // アプリ内課金を追加	2014/02/17	start
		if (!Ti.App.VCC.isAndroid) {
			datas.push({
				header : L('str_setting_addon'),
				title : L('str_purchase_addon'),
				velueAlign : 'right',
				data : '',
				hasChild : true,
				action : 'purchaseAddon',
				type : ''
			});
		}
		// support
		datas.push({
			header : L('str_setting_others'),
			title : L('str_support'),
			velueAlign : 'right',
			data : 'http://vccorp.net/intersuite/timesheet/',
			hasChild : true,
			action : 'gotoSupportURL',
			type : ''
		});
		// about
		datas.push({
			title : L('str_about'),
			hasChild : true,
			action : 'information',
			type : ''
		});
		// アプリ内課金を追加	2014/02/17	end
    
    for (var i = 0; i < datas.length; i++) {
      var row = VCC.Utils.createTableViewRow(datas[i]);
      tableDatas.push(row);
    }
    
    // create table view
    var tableViewOptions = {
    	data: tableDatas,
    	backgroundColor: 'transparent',
    	rowBackgroundColor: 'white',
    	top: offsetTop + 44
    };
    if (!isAndroid) {
      tableViewOptions.style = Ti.UI.iPhone.TableViewStyle.GROUPED;
    }
    if (!isOldiOS) {
      tableViewOptions.headerView = Ti.UI.createView({height: 1});
    } else if (isTablet) {
      tableViewOptions.headerView = Ti.UI.createView({height: 20});
    }
    
    tableView = Ti.UI.createTableView(tableViewOptions);
    win.add(tableView);
    
    tableView.addEventListener('click', function(e) {
      var index = e.index;
      var section = e.section;
      var row = e.row;
      var rowdata = e.rowData;
      var tab = getCurrentTab();
      var data = VCC.Utils.copyObject(row.data);
    
      switch (row.action) {
      case 'picker':
        var limitTime = VCC.Utils.createMinMaxTime(regularTimeData, row.type);
        if (limitTime === undefined) {
          break;
        }
        if (data === undefined) {
          data = defaultRegularTime[row.type];
        }
        var winPicker = VCC.Utils.createWin('winPicker.js', null, {  
          title: row.child.title.text,
          data: data,
          dataType: 'minutes',
          pickerType: Ti.UI.PICKER_TYPE_TIME,
          minTime: limitTime.minTime,
          maxTime: limitTime.maxTime
        });
        winPicker.addEventListener('close', function(e) {
          if (e.source.returnData) {
            var returnData = e.source.returnData;
            if (row.data != returnData) {
              controller.setRegularTime(row.type, returnData);
              regularTimeData[row.type] = row.data = returnData;
              row.child.value.text = VCC.Utils.formatHourMinute(row.data);
              win.isChanged = true;
              VCC.Utils.setTableViewRowEnabled(tableDatas[1], true);
            }
          }
        });
        VCC.Utils.openWin(winPicker, tab);
        break;
      case 'settingBreak':
        if (data.startTime == undefined && data.endTime == undefined) {
          for (var n in defaultRestTime) {
            data[n] = defaultRestTime[n];
          }
        }
        var winSettingBreak = VCC.Utils.createWin('winSettingBreak.js', null, {
          data: data
        });
        winSettingBreak.addEventListener('close', function(e) {
          if (e.source.returnData) {
            var returnData = e.source.returnData;
            if (!VCC.Utils.compareObject(row.data, returnData)) {
              controller.setRestTimeData(returnData);
              restTimeData = row.data = returnData;
              row.child.value.text = makeRestTimeStr(row.data);
              win.isChanged = true;
              VCC.Utils.setGlobal('updateList', true);
            }
          }
        });
        VCC.Utils.openWin(winSettingBreak, tab);
        break;
      case 'datePicker':
        var winDatePicker = VCC.Utils.createWin('winDatePicker.js', null, {  
          title: row.child.title.text,
          data: data,
          dataType: 'minutes',
          pickerType: Ti.UI.PICKER_TYPE_TIME,
          makeValueStr: makeCuttOffDateStr
        });
        winDatePicker.addEventListener('close', function(e) {
          //info(e.source);
          //info(e.source.returnData);
          if (e.source.returnData != undefined) {
            var returnData = e.source.returnData;
            //info('row.data, returnData:' + [row.data, returnData]);
            if (row.data != returnData) {
              controller.setCuttOffDate(returnData);
              cuttOffDate = row.data = returnData;
              row.child.value.text = makeCuttOffDateStr(cuttOffDate);
              win.isChanged = true;
              VCC.Utils.setGlobal('updateList', true);
            }
          }
        });
        VCC.Utils.openWin(winDatePicker, tab);
        break;
      case 'settingWage':
        var winSettingWage = VCC.Utils.createWin('winSettingWage.js', null, {
          data: data
        });
        winSettingWage.addEventListener('close', function(e) {
          if (e.source.returnData) {
            var returnData = e.source.returnData;
            if (!VCC.Utils.compareObject(row.data, returnData)) {
              controller.setWageData(returnData);
              wageData = row.data = returnData;
              row.child.value.text = makeWageStr(row.data);
              win.isChanged = true;
            }
          }
        });
        VCC.Utils.openWin(winSettingWage, tab);
        break;
      case 'information':
        var winInfo = VCC.Utils.createWin('winInformation.js');
        VCC.Utils.openWin(winInfo, tab);
        break;
      case 'gotoSupportURL':
        Ti.Platform.openURL(row.data + '?locale=' + Ti.Platform.locale);
        break;
        // アプリ内課金を追加	2014/02/17	start
				case 'purchaseAddon':
					var winPurchaseAddon = VCC.Utils.createWin('winPurchaseAddon.js');
					VCC.Utils.openWin(winPurchaseAddon, tab);
					break;
      }
    });
  }
  
  function makeRestTimeStr(restTimeData) {
    if (restTimeData.enabled) {
      return VCC.Utils.createTimeRangeStr(restTimeData);
    } else {
      return L('str_off');
    }
  }
  
  function makeWageStr(wageData) {
    //info('wageData.enabled:' + [typeof wageData.enabled, wageData.enabled]);
    if (wageData.enabled) {
      return wageData.value || 0;
    } else {
      return L('str_off');
    }
  }
  
  function makeCuttOffDateStr(data) {
    return !data ? L('str_end_of_the_month') : ('' + data);
  }
  
  function onEventTextField(e) {
    var textField = e.source;
    if (textField.type == 'mailAddress') {
      controller.setMailAddress(textField.value);
    }
  }
}