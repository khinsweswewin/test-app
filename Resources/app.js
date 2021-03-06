require('constant.js');
var utils = require('utils.js');
var VCC = utils.VCC;
var isAndroid = Ti.App.VCC.isAndroid;
// init param
VCC.Utils.setGlobal('winHistory', []);

// set the background color of the master UIView (when there are no windows/tab groups on it)
Ti.UI.setBackgroundColor('#000');

var isTabChange = false;
var tabIndex = Ti.App.Properties.getInt('tabIndex') || 0;
if (tabIndex < 0 || tabIndex >= Ti.App.VCC.Windows.length) {
  tabIndex = 0;
}
var isForeground = true;
Ti.App.addEventListener('pause', function() {
  isForeground = false;
});
Ti.App.addEventListener('resume', function() {
  isForeground = true;
});

// create tab group
var opt = {};
if (isAndroid) {
  opt = {
    style: Ti.UI.Android.TABS_STYLE_BOTTOM_NAVIGATION,
    shiftMode: false,
    tabsBackgroundSelectedColor :'gray',
  };
}
var tabGroup = Ti.UI.createTabGroup(opt);
// create base UI tab and window
for (var i = 0; i < Ti.App.VCC.Windows.length; i++) {
  i = i || 0;
  var win = VCC.Utils.createWin(Ti.App.VCC.Windows[i].winjs, i, null, true);
  var winjs = require(Ti.App.VCC.Windows[i].winjs);
  winjs.initialize(win);
  var createTab = Ti.UI.createTab({
    icon: Ti.App.VCC.Windows[i].icon,
    titleid: Ti.App.VCC.Windows[i].titleid,
    window: win
  });
  tabGroup.addTab(createTab);
}
tabGroup.addEventListener('focus', function(e) {
  // 謎のfocusイベントがくる（e.previousIndex=-1,e.index=0）のでその対策
  //info('tabGroup focus:' + [e.previousIndex, e.index]);
  if (e.previousIndex < 0) {
    if (isTabChange || e.index == -1) return;
    isTabChange = true;
  }
  Ti.App.Properties.setInt('tabIndex', e.index);
  if (tabIndex != e.index) {
    tabIndex = e.index;
  }
});
tabGroup.open({animated: true});
if (tabIndex > 0) {
  tabGroup.setActiveTab(tabIndex);
}
VCC.Utils.setGlobal('tabGroup', tabGroup);
if (Ti.App.iOS) {
  var userInterfaceStyle = Ti.App.iOS.userInterfaceStyle;
  Ti.App.iOS.addEventListener('traitcollectionchange', function() {
    if (isForeground && userInterfaceStyle != Ti.App.iOS.userInterfaceStyle) {
      tabGroup.tabs.forEach(function(tab) {
        var win = tab.window;
        win.backgroundColor = Ti.App.iOS.userInterfaceStyle == Ti.App.iOS.USER_INTERFACE_STYLE_DARK ? '#464646' : 'white';
        win.toolBar.title.color = Ti.App.iOS.userInterfaceStyle == Ti.App.iOS.USER_INTERFACE_STYLE_DARK ? 'white' : null;
      });
      userInterfaceStyle = Ti.App.iOS.userInterfaceStyle;
    }
  });
}
if (!VCC.Utils.isPurchased(Ti.App.VCC.PRODUCT_IDENTIFIER_REMOVE_ADS)) {
  var controller = VCC.Utils.getSettingController();
  if (!controller.isNotification(Ti.App.VCC.NOTIFICATION_REMOVE_ADS_INFO)) {
    VCC.Utils.alert("\n" + L('str_notification_remove_ads_info') + "\n\n");
    controller.setNotification(Ti.App.VCC.NOTIFICATION_REMOVE_ADS_INFO);
  }
}
