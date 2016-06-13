Ti.include('utils.js');

var win = Ti.UI.currentWindow;
var isAndroid = Ti.App.VCC.isAndroid;

var imgPath = Ti.Platform.osname == 'ipad' ? 'credit-Portrait.png' : 'credit.png';
var img = Ti.UI.createImageView({
//  backgroundImage: imgPath,
  image: imgPath,
//  backgroundLeftCap: 20.0,
//  backgroundRightCap: 20.0,
//  backgroundTopCap: 20.0,
//  backgroundBottomCap: 20.0,
});

win.add(img);
