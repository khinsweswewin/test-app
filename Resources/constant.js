// constant.js

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
  ADMOB_PUBLISHER_ID_IPHONE:  'a14df0ee2671426',
//  ADMOB_PUBLISHER_ID_IPAD:    'a14ddf909971cf6',
  ADMOB_PUBLISHER_ID_IPAD:    'a14df0eee668982',
  ADMOB_PUBLISHER_ID_ANDROID: 'a14dd6a8b32eea4',
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