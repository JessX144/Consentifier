// Only used on initial.hmtl - first plugin page that opens
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //console.log(sender.tab ? "from a content script:" + sender.tab.url : "from the extension");
  if (request.greeting == "hello"){
    sendResponse({farewell: "goodbye"});
  }
});

jQuery(function($){

  //Try to get user info with token
  //console.log("Initial.js");
  $('#loading').text('Loading login details...');

  chrome.storage.sync.get(['token'], (result)=>{
    if (result['token']) {
      $('#loading').text('Downloading user profile...');
      getUserInfo(result['token'], profileSuccess, redirectToLogin);
    } else {
      redirectToLogin();
    }
  });

  /**
    Do we have a token y/n?
    y --> Hit server for profile info
      success --> Store info, call checkTab
      fail --> Redirect to login page
    n --> Redirect to login page
  **/
});