var utils = require('utils.js');
var VCC = utils.VCC;

function initialize(win) {
  var isAndroid = Ti.App.VCC.isAndroid;

  var logoTop = Ti.Platform.displayCaps.platformHeight / 4 - 30;
  var imgLogo = Ti.UI.createImageView({
    image: 'images/about.png',
    width: 280,
    height: 50,
    top: logoTop
  });
  var version = Ti.App.version;
  var parts = version.split('.');
  if (parts.length == 2 || (parts.length == 3 && parts[2].substr(0, 1) == '0')) {
    if (parts[1].length >= 2) {
      parts[2] = parts[1].substr(1);
      parts[1] = parts[1].substr(0, 1);
    }
    version = parts.join('.');
  }
  var lblVer = Ti.UI.createLabel({
    text: 'Version: ' + version,
  //  left: 10,
    top: logoTop + 70,
    height: 25,
    color: '#000',
    font: {fontSize: 20},
    textAlign: 'center'
  });
  var imgPowered = Ti.UI.createImageView({
    image: 'images/about_powerd.png',
    width: 85,
    height: 30,
    bottom: Ti.Platform.displayCaps.platformHeight / 12 - 30
  });
  var url = null;
  if (isAndroid) {
    url = Ti.UI.createLabel({
      text: Ti.App.url,
      left: 10,
      top: 280,
      height: 30,
      autoLink: Ti.UI.Android.LINKIFY_WEB_URLS,
      color: '#000'
    });
  } else {
    url = Ti.UI.createTextArea({
      autoLink: Ti.UI.AUTODETECT_LINK,
      left: 5,
      right: 5,
      top: 280,
      height: 30,
      editable: false,
      backgroundColor: '#fff',
      value: Ti.App.url,
      font: {fontSize: 16},
      color: '#000'
    });
  }
  var button = Ti.UI.createButton({
    titleid: 'str_credit',
    color: '#000',
    font: {fontSize:20},
    backgroundImage: 'images/button_large.png',
    backgroundLeftCap: 30.0,
    height: 66,
    width: 215,
    top: Ti.Platform.displayCaps.platformHeight / 2 - 45
  });
  button.addEventListener('click', function(e) {
    //クレジット画面を開く
    var winCredit = VCC.Utils.createWin('winCredit.js');
    VCC.Utils.openWin(winCredit, utils.getCurrentTab());
  });

  win.add(imgLogo);
  win.add(lblVer);
  win.add(button);
  //win.add(imgPowered);
  //win.add(url);
  //Ti.API.info('Ti.Platform.displayCaps.platformHeight:' + Ti.Platform.displayCaps.platformHeight);
}

exports.initialize = initialize;
