var signup_urls = ["instagram", "pinterest", "facebook"];
var signup_paths = ["/register", "/signup", "/sign-up", "/sign_up"];

var saveAgreementUrl = function(url) {
  var items = {};
  items["agreement_url"] = url;
  //sets agreement_url to the url function is called with 
  chrome.storage.sync.set(items, (result) => {});
  //stored data synced with chrome browser user is logged into 
}

var panel_props = {
  type: 'panel',
  width: 360,
  height: 600,
  left: 0,
  top: 0,
  focused: true,//If true, opens an active window. If false, opens an inactive window.
  url: "chrome-extension://" + chrome.runtime.id + "/initial.html"
}

chrome.windows.getAll(function(windows){
  for (var i=0; i < windows.length; i++){
    if (windows[i].type ==  'normal') {
      panel_props.left = windows[i].width - panel_props.width;
      //returns type of the window 
    }
  }
});

var popupid;
var is_signup;
var userAgreed;

//when tab changes or is updated 
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {

  if (changeInfo.status == 'complete'){
    is_signup = false;
    
    //if current url is one of signup urls
    for (var i=0; i < signup_urls.length; i++){
      var currentURL = signup_urls[i]
      var tabURL = new URL(tab.url)
      if ( tabURL.host.includes(currentURL) ){ 
        is_signup = true;
        chrome.storage.sync.set({key: currentURL}, function() {});
        getCookies();
       }
    }

    chrome.storage.sync.get('user', function(obj){ 
      //if user has just downloaded plugin, chrome has no stored current user
      if (obj.user == undefined && is_signup){
      	//sets icon to active 
        chrome.browserAction.setIcon({path: '../images/icon.png', tabId: tabId});
      } 
      else {
        getAgreedPopup(tabId, changeInfo, tab);
      }
    });

  };
});


var setupListeners = function(tabId, changeInfo, tab, userAgreed){

  if (is_signup && (!userAgreed)){
    saveAgreementUrl(tab.url);
    chrome.browserAction.setPopup({tabId: tabId, popup: '../initial.html'});
    chrome.browserAction.setIcon({path: '../images/icon.png', tabId: tabId});
    
    chrome.windows.create(panel_props, function(newWindow) {
      popupid = newWindow.id;
    });
  } 

  else if (is_signup && (userAgreed)){
    saveAgreementUrl(tab.url);
    chrome.browserAction.setPopup({tabId: tabId, popup: '../initial.html'});
    chrome.browserAction.setIcon({path: '../images/icon.png', tabId: tabId});
  }

  else {
    saveAgreementUrl(undefined);
    chrome.browserAction.setPopup({tabId: tabId, popup: ''});
    chrome.browserAction.setIcon({path: '../images/icon-disabled.png', tabId: tabId});
  }
}

//removes the html popup if inactive for amount of time  
window.setInterval(checkBrowserFocus, 2000);  

//checks for changed tab, updates url
window.setInterval(updateWindow, 500);  

var checked = 0;
function checkBrowserFocus(){
  chrome.windows.getCurrent(function(window){
    if (popupid != window.id){
     chrome.windows.remove(popupid);
    }
  })
}

var previousTab;
function updateWindow(){
  chrome.tabs.getSelected(null, function(tab){
    //only executes if window has changed
    if (previousTab != tab.url){
      previousTab = tab.url;
      for (var i=0; i < signup_urls.length; i++){
        var currentURL = signup_urls[i];
        var tabURL = new URL(tab.url);
        if ( tabURL.host.includes(currentURL) ){ 
          is_signup = true;
          chrome.storage.sync.set({key: currentURL}, function() {  });
          getCookies();
        }
      }
    }
  });
}

//gets if user agreed to service, to decide if popup pops up when loaded 
function getAgreedPopup(tabId, changeInfo, tab) {
  var url = Url + 'crowd/agreed/'
  chrome.storage.sync.get('user', function(obj){
    chrome.storage.sync.get(['key'], function(result) {
      usern = obj.user.username;
      service = (result.key).split(' ')[0];
        $.ajax({
          url: url, type: 'GET', data: {'owner':usern, 'service':service}, dataType:'json',
          success: function(data){
           var userAgreed = data.agreed;
           setupListeners(tabId, changeInfo, tab, userAgreed); 
        }
      });
    });
  });
}


console.log("Background js loaded");