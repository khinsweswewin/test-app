// constant.js

var versionInt = parseInt(Ti.Platform.version);
// namespace
Ti.App.VCC = {
  // TITLE_TO_WORK: '出社でよろしいですか？',
  // TEXT_SHUSSHA: '出社',
  // TEXT_CANCEL: 'キャンセル',
  // TEXT_CHANGE: '変更する',
  // TEXT_INTERRUPT: '中断',
  // TEXT_RETURN: '復帰',
  // TEXT_LEAVE: '退社',
  STATE_COME: 'state_come',
  STATE_INTERRUPT: 'state_interrupt',
  STATE_LEFT: 'state_left',
  STATE_RETURN: 'state_return',
  appname: 'timevcard4smartphone',
  isAndroid: Ti.Platform.osname == 'android',
  isTablet: Ti.Platform.displayCaps.platformWidth > 728,
  versionInt: versionInt,
  isOldiOS: versionInt < 7,
  ADMOB_PUBLISHER_ID_IPHONE:  'ca-app-pub-9149619195536237/3326519708',
  ADMOB_PUBLISHER_ID_IPAD:    'ca-app-pub-9149619195536237/3326519708',
  ADMOB_PUBLISHER_ID_ANDROID: 'a14dd6a8b32eea4',
  PRODUCT_IDENTIFIER_REMOVE_ADS: 'net.vccorp.timesheet4sp.remove_ads',
  NOTIFICATION_REMOVE_ADS_INFO: 0x1 << 0,
  Windows: [
    {titleid: 'str_home', icon: 'images/ico_home.png', winjs: 'winHome.js'},
    {titleid: 'str_list', icon: 'images/ico_list.png', winjs: 'winList.js'},
    {titleid: 'str_summary', icon: 'images/ico_summary.png', winjs: 'winSummary.js'},
    {titleid: 'str_setting', icon: 'images/ico_setting.png', winjs: 'winSetting.js'}
  ],
  OrientationModes: [
    Ti.UI.PORTRAIT
    // Ti.UI.UPSIDE_PORTRAIT,
    // Ti.UI.LANDSCAPE_LEFT,
    // Ti.UI.LANDSCAPE_RIGHT
  ]
};
