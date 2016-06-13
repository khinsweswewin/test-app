Ti.include('constant.js');
Ti.include('utils.js');
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

if (isAndroid) {
  // open home window, not use tabgroup(for hide tabbar)
  var win = VCC.Utils.createWin(Ti.App.VCC.Windows[tabIndex].winjs, tabIndex, {exitOnClose: true});
  Ti.include(Ti.App.VCC.Windows[tabIndex].winjs);
  initialize(win);
  win.open({animated: true});
  var wins = [];
  wins[tabIndex] = win;
  VCC.Utils.setGlobal('wins', wins);
} else {
  // create tab group
  var tabGroup = Ti.UI.createTabGroup();
  // create base UI tab and window
  for (var i = 0; i < Ti.App.VCC.Windows.length; i++) {
    i = i || 0;
    var win = VCC.Utils.createWin(Ti.App.VCC.Windows[i].winjs, i, null, true);
    Ti.include(Ti.App.VCC.Windows[i].winjs);
    initialize(win);
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
/*
  // 復帰処理
  var resumeWin = Ti.UI.createWindow({
        backgroundColor: '#fff',
        orientationModes: Ti.App.VCC.OrientationModes,
        navBarHidden: false,
        tabBarHidden: false,
        visible: false
      });
      var img = Ti.UI.createImageView({
        //backgroundImage: Ti.Platform.osname + '/Default.png'
        backgroundImage: 'iphone/Default.png'
      })
      resumeWin.add(img);
      resumeWin.addEventListener('open', function() {
        info('open');
      });
      resumeWin.open();

  Ti.App.addEventListener('pause', function() {
    info('Ti.UI.currentWindow:' + resumeWin);
    if (resumeWin) {
      resumeWin.show();
    }
  });
  Ti.App.addEventListener('resume', function() {
    info('Ti.UI.currentWindow:' + resumeWin);
    setTimeout(function() {
      //if (resumeWin) resumeWin.close();
      if (resumeWin) resumeWin.hide();
    }, 2000);
  });
  */
}