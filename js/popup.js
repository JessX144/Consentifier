var Url = server.Url;

var redirectTo = (page) => {
  chrome.storage.sync.set({ lastpage: window.location.href }, (result)=>{});
  window.location.href = page;
};

var back = () => {
  chrome.storage.sync.get('lastpage', (result) => {
    if (result['lastpage']){
      window.location.href = result['lastpage'];  
    } else {
      console.log("Could not change page");
    }
  });
}

var redirectToLogin = () => {
  $('#loading').text('Couldn\'t authorise user, redirecting to login...');
  redirectTo('login.html');
};

var profileSuccess = (data) => {
  $('#loading').text('Updating user profile...');
  chrome.storage.sync.set({ user: data }, (result)=>{});
  startUsingPlugin();
};

var startUsingPlugin = (matchCb, failCb) => {
  setAgreementUrl((result) => {
    $('#loading').text('Starting consentifier...');
    if (result){
      if (matchCb) { matchCb(); } else { 
        redirectTo("consent.html"); 
      }
    } else {
      if (failCb){ failCb(); } else { 
        redirectTo("user-settings.html");
      }
    }
  });
};


var changeBackgroundColor =function(color) {
  var script = 'document.body.style.backgroundColor="' + color + '";';
  chrome.tabs.executeScript({  code: script });
};

//sets current url before getting agreement url 
//prevents plugin getting null for agreement url 
var setAgreementUrl = function(callback){
  var queryInfo = { active: true };
  chrome.tabs.query(queryInfo, (tabs) => {
    var tab = tabs[0];
    var url = tab.url;

    var items = {};
    items["agreement_url"] = url;
    chrome.storage.sync.set(items, (result) => { 
      chrome.storage.sync.get("agreement_url", (result) => {
        callback(chrome.runtime.lastError ? null : result["agreement_url"]);
      });
    });
  });
}

var getAgreementUrl = function(callback) {
  chrome.storage.sync.get("agreement_url", (result) => {
    callback(chrome.runtime.lastError ? null : result["agreement_url"]);
  });
};

//Not used
var getMatchesFor = function(url, callback) {
  chrome.storage.sync.get(url, (items) => {
    callback(chrome.runtime.lastError ? null : items[url]);
  });
};

var handleSignup = function(){
  var storeToken = function(response){
    //gets user token
    chrome.storage.sync.set({ token: response['key'] });
    var userToken = response['key']

    //returns user info using token, sets user data
    var data = returnUserInfo(userToken);
    chrome.storage.sync.set({ user: data }, (result)=>{});

    //gets cookies of site as soon as signed up
    getCookies();

    $('#signup').prop('disabled', false);
    startUsingPlugin();
  };

  var error = function(response, x){
    console.log("error ", response);
    $('#login').prop('disabled', false);
    for (field of Object.keys(response.responseJSON)){
      $('#errors').empty().append('<li>' + field + ': ' + response.responseJSON[field] + '</li>');
    }
  };

  $('#signup').click(function(){
    $(this).prop('disabled', true);
    signup(
      $('input[name="username"]').val(),
      $('input[name="password"]').val(),
      storeToken, error);
  });
}

var handleLogin = function(){
  var storeToken = function(response){
    chrome.storage.sync.set({ token: response['token'] });
    var userToken = response['token']

    var data = returnUserInfo(userToken);
    chrome.storage.sync.set({ user: data }, (result)=>{});

    getCookies();

     $('#login').prop('disabled', false);
     startUsingPlugin();
  };

  var error = function(response, x){
    console.log("error ", response);
    $('#login').prop('disabled', false);
    for (field of Object.keys(response.responseJSON)){
      $('#errors').empty().append('<li>' + field + ': ' + response.responseJSON[field] + '</li>');
    }
  };

  $('#login').click(function(){
    $(this).prop('disabled', true);
    getToken(
      $('input[name="username"]').val(),
      $('input[name="password"]').val(),
      storeToken, error);
  });

};

var renderCommonElements = function(){
  $("body").prepend("<div class=\"title gradient\"> <img src=\"images/logo.png\" alt=\"consentifier logo\" srcset=\"images/logo.svg\">\
    <a href=\"user-settings.html\" id=\"user-settings\"><i class=\"fas fa-user-circle\"></i></a></div>");
};

var handleUserSettings = function(){
  var loggedOut = function(){
    chrome.storage.sync.get('token', function(obj){
      if (obj.token == undefined){
        $('#logout').hide();
        $('.user-settings p.msg').remove();
        $('.user-settings').append('<p class="msg">You are now logged out. <br/><a href="/login.html">Login</a></p>');
      } else {
        chrome.storage.sync.get('user', function(obj){
          $('.user-settings p.msg').remove();
          $('.user-settings').append('<p class="msg">You are currently logged in as ' + obj.user.username);
        });
      }
    });
  }

  $('#logout').click(function(){
    chrome.storage.sync.remove('token', loggedOut);
  });

  loggedOut();
};

//back button
var handleBack = function(){
  $('#back-initial').click(function(){
    redirectTo('initial.html');
  });

  $('#back').click(back);
};

var renderRecommendations = function(){
  var resolveUrl;
  var responseData;
  var urlReady = (url) => { resolveUrl = url; chrome.storage.sync.get('token', tokenReady); }
  var tokenReady = (obj) => { resolve(obj.token, resolveUrl, resolveReady); }
  var resolveReady = (data) => {
    responseData = data;
    console.log(responseData);
    $('#recommendations').empty()
    for (identity of responseData.identities){
      for (recommendation of identity.recommendations){
        $('#recommendations').append(
          '<a href="' + recommendation.detail_url + '" class="gradient">\
          <span class="cicon ' + recommendation.resolver_class + 
          '"></span><span>' + identity.name + ': ' +
          recommendation.resolver + " <br/> " + recommendation.summary +
          '</span></a>');
      }
    }

    //Handle recommendation links with iframe
    $('#recommendations a').click(function(e){
      e.preventDefault();
      $('main').html('<iframe width="360" height="500" src="'+$(this).attr('href')+
        '" frameborder="0" allowfullscreen></iframe>');
    });
  }
  getAgreementUrl(urlReady);
}

var getCurrentTabUrl = function(callback) {
  if (callback == undefined){ callback = defaultCb }
  //add  currentWindow: true  if we're using normal popup
  var queryInfo = { active: true };
  chrome.tabs.query(queryInfo, (tabs) => {
    var tab = tabs[0];
    var url = tab.url;
    console.assert(typeof url == 'string', 'tab.url should be a string');
    callback(url);
  });
};

$(document).ready(function(){
  renderCommonElements();
  handleBack();
  handleLogin();
  handleSignup();
  handleUserSettings();
  loadAnalytics();
  getVotes();
  getAgreed();
  getCookies();
  createDelegate();
  getDelegates();

  if ($('#recommendations').length > 0){
    renderRecommendations();
  }
  console.log("popup ready");
});