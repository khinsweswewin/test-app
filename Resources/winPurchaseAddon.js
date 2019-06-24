var utils = require('utils.js');
var VCC = utils.VCC;
var info = utils.info;

function initialize(win) {
  var isAndroid = Ti.App.VCC.isAndroid;

  var tableDatas = [];
  var datas = [];
  var tableView = null;
  var product = null;
  var productPrice = "--";

  var restoreHandler = null;
  var loadingCount = 0;
  var storeKit = VCC.Utils.storeKit;

  var productIdentifier = Ti.App.VCC.PRODUCT_IDENTIFIER_REMOVE_ADS;
  var fixIndicator = false;

  var loadingIndicator = Ti.UI.createActivityIndicator({
    height: Ti.UI.SIZE,
    width: Ti.UI.SIZE,
    style: Ti.UI.ActivityIndicatorStyle.BIG
  });

  var loading = Ti.UI.createView({
    height: 50,
    width: 50,
    backgroundColor: 'black',
    opacity: 0.5,
    borderRadius: 10
  });
  loading.add(loadingIndicator);

  var loadingMask = Ti.UI.createView({
  //  backgroundColor:'red',
    width: Titanium.Platform.displayCaps.platformWidth,
    height: Titanium.Platform.displayCaps.platformWidth + 160
  });

  initWin();

  function showLoading() {
    loadingCount += 1;
    if (loadingCount == 1) {
      loading.show();
      loadingIndicator.show();
      loadingMask.show();
    }
    if (!fixIndicator && loading.rect.width && loadingIndicator.rect.height) {
      var left = (loading.rect.width - loadingIndicator.rect.height) / 2;
      loadingIndicator.setLeft(left);
      fixIndicator = true;
    }
    //  info('showLoading:' + loadingCount);
  }

  function hideLoading() {
    //  info('hideLoading:' + loadingCount);
    if (loadingCount > 0) {
      loadingCount -= 1;
      if (loadingCount == 0) {
        loadingMask.hide();
        loadingIndicator.hide();
        loading.hide();
      }
    }
  }

  function initWin() {
    initTableViewInfo();
    win.add(loadingMask);
    win.add(loading);
    storeKit._restoredCompletedTransactions = function(evt) {
      info('restoredCompletedTransactions:' + evt);
      evt.transaction && evt.transaction.finish();
      hideLoading();
      if (!evt.error && !(evt.transactions == null || evt.transactions.length == 0)) {
        // alert('Restored ' + evt.transactions.length + ' purchases!');
        if (restoreHandler) {
          restoreHandler();
        };
      }
    };
    storeKit._transactionState = function(evt) {
      info('transactionState:' + evt);
      if (evt.state != storeKit.TRANSACTION_STATE_PURCHASING) {
        hideLoading();
      }
      if (evt.state == storeKit.TRANSACTION_STATE_PURCHASED) {
        VCC.Utils.alert(L('str_thanks_purchase'));
      }
    };
    storeKit._updatedDownloads = function(evt) {
      info('updatedDownloads:' + evt);
    };
    storeKit._purchseChanged = setTableViewInfo;
    storeKit.addTransactionObserver();
    initTableView();
    //generateTableviewDatas();
    //showLoading();
  }

  function initTableView() {
    showLoading();
    configTableviews();
  }

  function configTableviews() {
    var isPurchsed = VCC.Utils.isPurchased(productIdentifier);
    if (isPurchsed) {
      //productPrice = L('str_past_purchases');
      setTableViewInfo(isPurchsed);
      hideLoading();
    } else {
      storeKit.requestProducts([productIdentifier], function(evt) {
        if (!evt.success) {
          VCC.Utils.alert(L('err_failed_talk_to_apple'));
        } else if (evt.invalid) {
          VCC.Utils.alert(L('err_request_invalid_product'));
        } else {
          var p = evt.products[0];
          if (p != null) {
            productPrice = p.formattedPrice;
            product = p;
          } else {
            productPrice = "--";
          }
          setTableViewInfo();
        }
        hideLoading();
      });
      //hideLoading();
    }
  }

  function initTableViewInfo() {
    // removes_buy
    datas.push({
      header: L('str_purchase_buy'),
      title: L('str_remove_ads'),
      value: '',
      velueAlign: 'right',
      action: 'removeAds',
      data: '',
      type: ''
    });
    // buyed
    datas.push({
      header: L('str_past_purchases'),
      title: L('str_restore_purchase'),
      velueAlign: 'right',
      data: '',
      hasChild: true,
      action: 'restorePurchases',
      type: ''
    });
    generateTableviewDatas();
    // create table view
    var tableViewOptions = {
      data: tableDatas,
      backgroundColor: 'transparent',
      rowBackgroundColor: 'white',
      top: 0//44
    };
    if (!isAndroid) {
      tableViewOptions.style = Ti.UI.iOS.TableViewStyle.GROUPED;
    }
    tableViewOptions.headerView = Ti.UI.createView({height: 1});

    //if (tableView) {
      // win.remove(tableView);
    //};
    tableView = Ti.UI.createTableView(tableViewOptions);
    win.add(tableView);

    tableView.addEventListener('click', function(e) {
      var index = e.index;
      var section = e.section;
      var row = e.row;
      var isPurchsed = VCC.Utils.isPurchased(productIdentifier);

      switch (row.action) {
        case 'removeAds':
          if (!isPurchsed) {
            //showLoading();
            requestProduct(productIdentifier, function(p) {
              purchaseProduct(p);
              //hideLoading();
            });
          }
  // テスト用コード・リリース時には無効にする
  /*
         else {
            var alertDialog = Ti.UI.createAlertDialog({
              title: 'reset purchase',
              //message: 'テスト',
              buttonNames: ['Reset','Cancel'],
              // キャンセルボタンがある場合、何番目(0オリジン)のボタンなのかを指定できます。
              cancel: 1
            });
            alertDialog.addEventListener('click', function(event){
              if (event.index == 0) {
                VCC.Utils.setPurchased(productIdentifier, false);
                setTableViewInfo(false);
              }
            });
            alertDialog.show();
          }
  */
          break;
        case 'restorePurchases':
          //showLoading();
          restorePurchases(function() {
            setTableViewInfo();
            hideLoading();
          });
          break;
      }
    });
  }

  function setTableViewInfo(isPurchsed) {
    if (isPurchsed === undefined) {
      isPurchsed = VCC.Utils.isPurchased(productIdentifier);
    }
    tableDatas[0].child.value.text = isPurchsed ? L('str_past_purchases') : productPrice;
  }

  function generateTableviewDatas() {
    tableDatas = [];
    for (var i = 0; i < datas.length; i++) {
      var row = VCC.Utils.createTableViewRow(datas[i]);
      tableDatas.push(row);
    }
  }

  /**
   * Requests a product. Use this to get the information you have set up in iTunesConnect, like the localized name and
   * price for the current user.
   * @param identifier The identifier of the product, as specified in iTunesConnect.
   * @param success A callback function.
   * @return A Ti.Storekit.Product.
   */
  function requestProduct(identifier, success) {
    showLoading();
    storeKit.requestProducts([identifier], function(evt) {
      hideLoading();
      if (!evt.success) {
        VCC.Utils.alert(L('err_failed_talk_to_apple'));
      } else if (evt.invalid) {
        VCC.Utils.alert(L('err_request_invalid_product'));
      } else {
        success(evt.products[0]);
      }
    });
  }

  function purchaseProduct(product) {
    if (product.downloadable) {
      info('Purchasing a product that is downloadable');
    }
    showLoading();
    storeKit.purchase({
      product : product
      // applicationUsername is a opaque identifier for the user’s account on your system.
      // Used by Apple to detect irregular activity. Should hash the username before setting.
      // applicationUsername: '<HASHED APPLICATION USERNAME>'
    });
  }

  /**
   * Restores any purchases that the current user has made in the past, but we have lost memory of.
   */
  function restorePurchases(success) {
    showLoading();
    restoreHandler = success;
    storeKit.restoreCompletedTransactions();
  }

}

exports.initialize = initialize;
