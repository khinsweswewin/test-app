// storeManager.js
var Storekit = require('ti.storekit');
var VCC;
var info;

//info('Ti.Platform.id:' + Ti.Platform.id);
var IOS7 = !Ti.App.VCC.isOldiOS;
//レシートの処理はコメントアウト
//var verifyingReceipts = false;

function initStorekit(utils) {
  VCC = utils.VCC;
  info = utils.info;
  Storekit.autoFinishTransactions = false;
  Storekit.bundleVersion = "1.0";
  Storekit.bundleIdentifier = Ti.App.id;
  Storekit._purchseChanged = null;
  /**
   * Purchases a product.
   * @param product A Ti.Storekit.Product (hint: use Storekit.requestProducts to get one of these!).
   */
  Storekit.addEventListener('transactionState', function(evt) {
    // hideLoading();
    switch (evt.state) {
      case Storekit.TRANSACTION_STATE_FAILED:
        if (evt.cancelled) {
          VCC.Utils.alert(L('err_purchse_canceled'));
        } else {
          VCC.Utils.alert(L('err_buying_failed') + evt.message);
        }
        evt.transaction && evt.transaction.finish();
        break;
      case Storekit.TRANSACTION_STATE_PURCHASED:
//レシートの処理はコメントアウト
/*
        if (verifyingReceipts) {
          if (IOS7) {
            // iOS 7 Plus receipt validation is just as secure as pre iOS 7 receipt verification, but is done entirely on the device.
            var msg = Storekit.validateReceipt() ? 'Receipt is Valid!' : 'Receipt is Invalid.';
            VCC.Utils.alert(msg);
          } else {
            // Pre iOS 7 receipt verification
            Storekit.verifyReceipt(evt, function(e) {
              if (e.success) {
                if (e.valid) {
                  alert('Thanks! Receipt Verified');
                  markProductAsPurchased(evt.productIdentifier, true);
                } else {
                  alert('Sorry. Receipt is invalid');
                }
              } else {
                alert(e.message);
              }
            });
          }
        } else {
*/
          //VCC.Utils.alert(L('str_thanks_purchase'));
          markProductAsPurchased(evt.productIdentifier, true);
/*
        }
*/
        // If the transaction has hosted content, the downloads property will exist
        // Downloads that exist in a PURCHASED state should be downloaded immediately, because they were just purchased.
        if (evt.downloads && evt.downloads.length) {
          Storekit.startDownloads({
            downloads : evt.downloads
          });
        } else {
          // Do not finish the transaction here if you wish to start the download associated with it.
          // The transaction should be finished when the download is complete.
          // Finishing a transaction before the download is finished will cancel the download.
          evt.transaction && evt.transaction.finish();
        }

        break;
      case Storekit.TRANSACTION_STATE_PURCHASING:
        info('Purchasing ' + evt.productIdentifier);
        break;
      case Storekit.TRANSACTION_STATE_RESTORED:
        // The complete list of restored products is sent with the `restoredCompletedTransactions` event
        info('Restored ' + evt.productIdentifier);
        // Downloads that exist in a RESTORED state should not necessarily be downloaded immediately. Leave it up to the user.
        if (evt.downloads && evt.downloads.length) {
          info('Downloads available for restored product');
        }

        evt.transaction && evt.transaction.finish();
        // info('Restored');
        break;
      default:
        info('Unknown: ' + evt.productIdentifier);
        break;
    }
    if (Storekit._transactionState) {
      Storekit._transactionState(evt);
    }
  });

  /**
   * Notification of an Apple hosted product being downloaded.
   * Only supported on iOS 6.0 and later, but it doesn't hurt to add the listener.
   */
  Storekit.addEventListener('updatedDownloads', function(evt) {
    var download;
    for (var i = 0, j = evt.downloads.length; i < j; i++) {
      download = evt.downloads[i];
      info('Updated: ' + download.contentIdentifier + ' Progress: ' + download.progress);
      switch (download.downloadState) {
        case Storekit.DOWNLOAD_STATE_FINISHED:
        case Storekit.DOWNLOAD_STATE_FAILED:
        case Storekit.DOWNLOAD_STATE_CANCELLED:
          // hideLoading();
          break;
      }

      switch (download.downloadState) {
        case Storekit.DOWNLOAD_STATE_FAILED:
        case Storekit.DOWNLOAD_STATE_CANCELLED:
          download.transaction && download.transaction.finish();
          break;
        case Storekit.DOWNLOAD_STATE_FINISHED:
          // Apple hosted content can be found in a 'Contents' folder at the location specified by the the 'contentURL'
          // The name of the content does not need to be the same as the contentIdentifier,
          // it is the same in this example for simplicity.
          var file = Ti.Filesystem.getFile(download.contentURL, 'Contents', download.contentIdentifier + '.jpeg');
          if (file.exists()) {
            info('File exists. Displaying it...');
            var iv = Ti.UI.createImageView({
              bottom : 0,
              left : 0,
              image : file.read()
            });
            iv.addEventListener('click', function() {
              win.remove(iv);
              iv = null;
            });
            win.add(iv);
          } else {
            Ti.API.error('Downloaded File does not exist at: ' + file.nativePath);
          }

          // The transaction associated with the download that completed needs to be finished.
          download.transaction && download.transaction.finish();
          break;
      }
    }
    if (Storekit._updatedDownloads) {
      Storekit._updatedDownloads(evt);
    }
  });
  Storekit.addEventListener('restoredCompletedTransactions', function(evt) {
    // hideLoading();
    if (evt.error) {
      VCC.Utils.alert(evt.error);
    } else {
//レシートの処理はコメントアウト
/*
      if (IOS7 && verifyingReceipts) {
        if (Storekit.validateReceipt()) {
          info('Restored Receipt is Valid!');
        } else {
          Ti.API.error('Restored Receipt is Invalid.');
        }
      }
*/
      var tempPurchasedStore = {};
      if (evt.transactions == null || evt.transactions.length == 0) {
        VCC.Utils.alert(L('err_no_purchase_to_store'));
      } else {
        for (var i = 0; i < evt.transactions.length; i++) {
//レシートの処理はコメントアウト
/*
          if (!IOS7 && verifyingReceipts) {
            Storekit.verifyReceipt(evt.transactions[i], function(e) {
              if (e.valid) {
                markProductAsPurchased(e.productIdentifier, true);
                tempPurchasedStore[e.productIdentifier] = true;
              } else {
                Ti.API.error("Restored transaction is not valid");
                markProductAsPurchased(e.productIdentifier, false);
                tempPurchasedStore[e.productIdentifier] = false;
              }
            });
          } else {
*/
            markProductAsPurchased(evt.transactions[i].productIdentifier, true);
            tempPurchasedStore[evt.transactions[i].productIdentifier] = true;
/*
          }
*/
        }
      }
      //無効になっていた場合は未購入に戻す
      if (tempPurchasedStore[Ti.App.VCC.PRODUCT_IDENTIFIER_REMOVE_ADS] === undefined) {
        markProductAsPurchased(Ti.App.VCC.PRODUCT_IDENTIFIER_REMOVE_ADS, false);
      }
    }
    if (Storekit._restoredCompletedTransactions) {
      Storekit._restoredCompletedTransactions(evt);
    }
  });

  //Storekit.addTransactionObserver();
}


/**
 * Keeps track (internally) of purchased products.
 * @param identifier The identifier of the Ti.Storekit.Product that was purchased.
 */
function markProductAsPurchased(identifier, isPurchased) {
  info('Marking as purchased: ' + [identifier, isPurchased]);
  // And in to Ti.App.Properties for persistent storage.
  VCC.Utils.setPurchased(identifier, isPurchased);
  if (Storekit._purchseChanged != null) {
    Storekit._purchseChanged();
  }
}

exports.Storekit = Storekit;
exports.initStorekit = initStorekit;
exports.markProductAsPurchased = markProductAsPurchased;

