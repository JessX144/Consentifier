//global server url. Also change manifest and delegate views 
var server = {
  // apiUrl : 'http://localhost:8000/api/', 
  // Url : 'http://localhost:8000/'
  apiUrl : 'https://scc-pactman.lancs.ac.uk/api/', 
  Url : 'https://scc-pactman.lancs.ac.uk/'
};

var Url = server.Url;
var apiUrl = server.apiUrl;

var defaultCb = function(data) { console.log(data); };
var defaultErrorCb = function(data) { console.log("Error"); console.log(data); };

var getToken = function(username, password, cb, errorCb){
  var url =  apiUrl + 'token-auth/';
  if (cb == undefined){ cb = defaultCb }
  if (errorCb == undefined){ errorCb = defaultErrorCb; }
  var data = { "username": username, "password": password };
  $.ajax({
    type: 'POST', url: url, data: data, dataType: 'json',
    success: cb, error: errorCb
  });
};

//Currently unused - but might be useful for later
// var getIdentities = function(token, cb, errorCb){
//   var headers = { 'Authorization': 'Token ' + token };
//   var url =  apiUrl + 'identities/';
//   if (cb == undefined){ cb = defaultCb }
//   if (errorCb == undefined){ errorCb = defaultErrorCb; }
//   $.ajax({ 
//     type: 'GET', url: url, dataType: 'json', headers: headers,
//     success: cb, errorCb
//   });
// };

var getUserInfo = function(token, cb, errorCb){
  var headers = { 'Authorization': 'Token ' + token };
  var url =  apiUrl + 'user/';
  if (cb == undefined){ cb = defaultCb }
  if (errorCb == undefined){ errorCb = defaultErrorCb; }
  $.ajax({
    type: 'GET', url: url, dataType: 'json', headers: headers,
    success: cb, error: errorCb
  });
};

//returns user info 
var returnUserInfo = function(token, cb, errorCb){
  var result="";
  var headers = { 'Authorization': 'Token ' + token };
  var url =  apiUrl + 'user/';  
  if (cb == undefined){ cb = function(data) { result = data; }; }
  if (errorCb == undefined){ errorCb = defaultErrorCb; }
  $.ajax({
    type: 'GET', url: url, dataType: 'json', headers: headers,
    async: false,
    success: cb, error: errorCb
  });
  return result;
};


var signup = function(username, password, cb, errorCb){
  var url =  apiUrl + 'users/';
  if (cb == undefined){ cb = defaultCb }
  if (errorCb == undefined){ errorCb = defaultErrorCb; }
  var data = { "username": username, "password": password };
  $.ajax({
    type: 'POST', url: url, data: data, dataType: 'json',
    success: cb, error: errorCb
  });
};

var resolve = function(token, agreement_url, cb, errorCb){
  var headers = { 'Authorization': 'Token ' + token };
  var url =  apiUrl + 'resolve/';
  if (cb == undefined){ cb = defaultCb }
  if (errorCb == undefined){ errorCb = defaultErrorCb; }
  var data = { "agreement_url": agreement_url };
  $.ajax({
    type: 'POST', url: url, data: data, dataType: 'json', headers: headers,
    success: cb, error: errorCb
  });
};

var getVotes = function(){
  var url = Url + 'crowd/votes'
   chrome.storage.sync.get(['key'], function(result) {
    var service = (result.key).split(' ')[0];

    $.ajax({
      url: url, data: {'service':service}, dataType:'json',
      success: function(data){
      	$('#service').append(service);
      	$('#dislikes').append(data.no_count);
         $('#likes').append(data.yes_count); 
      }
    });
  });
};


var getAgreed = function(){
  var url = Url + 'crowd/agreed/'
  chrome.storage.sync.get('user', function(obj){
    chrome.storage.sync.get(['key'], function(result) {
    	//if plugin has just been installed, no user is stored 
      if (obj.user === undefined){}
      else {
			usern = obj.user.username;
			service = (result.key).split(' ')[0];
				$.ajax({
				url: url, type: 'GET', data: {'owner':usern, 'service':service}, 
				dataType:'json',
				success: function(data){
					if (data.agreed)
						$('#agreed').text('Agreed');
					else
					   $('#agreed').text('Did not agree');
				}
			});
      }
    });
  });
};


//load map data page 
var loadAnalytics = function(){
  $('#analytics').click(function(){
    chrome.storage.sync.get('user', function(obj){
      chrome.storage.sync.get(['key'], function(result) {
        
	      service = (result.key).split(' ')[0];
	      usern = obj.user.username;
	      urlData = Url + 'crowd/analytics/'

				$.ajax({
				  url: urlData, data:{'user':usern}, type: 'GET', dataType:'json', 
				  async: false,
				  success: function(data){
				    var win = window.open(data.page);
				  },
				});
			});
    });
  });
};

//needs to be called every time site visited, to create resolver instance 
var getCookies = function(){
	chrome.storage.sync.get('user', function(obj){
		chrome.storage.sync.get(['key'], function(result) {
			chrome.tabs.query({'active': true}, function (tabs) {
				var tab = tabs[0];
				var url = new URL(tab.url)
				var host = url.hostname
				//gets current site domain from url
				var domain = host.substring('www'.length);

				if (obj.user === undefined){}
					else{ 
					service = (result.key).split(' ')[0];
					usern = obj.user.username;
					//gets all cookies of domain, adds to an array
					chrome.cookies.getAll({domain: domain}, function(cookies) {  
						cookieArray = []
						for (var i=0; i<cookies.length;i++){
							cookieArray[i] = cookies[i].name;
						}   

						var url =  Url + 'crowd/new_resolver_request/'
						$.ajax({
							type: 'POST', url: url, async: false, 
							data: {'service': service,'owner':usern, 'cookies':cookieArray}, 
							dataType: 'json', 
							success: function(data){
								//if exists cookie matching one in database, user has agreed
								$('#agreed').text(data.agreed);
							}
						});
					});
				}
			});
		});
	});
};

//creates delegate instance if user sends email request 
var createDelegate = function(){
	$('#submit').click(function(){

		var name = $("#name").val();
		var message = $("#message").val();
		var email = $("#email").val();

		chrome.storage.sync.get(['key'], function(result) {
			chrome.storage.sync.get('user', function(obj){

				usern = obj.user.username;
				message = message;
				name = name;
				service = (result.key).split(' ')[0];
				urlget = Url + 'crowd/userid/'
				//gets user id from username first 
				$.ajax({
					url: urlget, data:{'user':usern}, type:'GET', dataType:'json',
					success: function(data){
						userid = data.userid;

						//creates delegate instance, returns the unique request token
						urlData = Url + 'delegate/plugin/' + userid + '/requests/new/'
						$.ajax({
							url: urlData, data:{'name':name, 'usern':usern, 'message':message, 'service':service}, type:'POST', dataType:'json',
							success: function(data){
							var currentoken = data.token;
							//sends email 
							sendMail(name, message, email, currentoken);
							} 
						});
					} 
				});
			});
		});
	});
};


var sendMail = function(name, message, email, currentoken){
	chrome.storage.sync.get('user', function(obj){
		chrome.storage.sync.get(['key'], function(result) {

			service = (result.key).split(' ')[0];
			usern = obj.user.username;

			urlData = Url + 'delegate/sendmail/'
			//sends the email 
			$.ajax({
				url: urlData, data:{'token': currentoken, 'user':usern, 'service':service, 'name':name, 'email':email, 'message':message}, type:'GET', dataType:'json', async: false,
				success: function(data){
					//if successful, returns success message 
					alert(data.status);
					//redirects to previous page once sent 
					redirectTo('delegate.html');
				},
				error: function(data) { 
					alert("Error: have you entered a valid email?"); 
				}  
			});
		});
	});
};

//gets all delegate requests of user
var getDelegates = function(){
	chrome.storage.sync.get('user', function(obj){
		if (obj.user === undefined){}
		else {
			usern = obj.user.username;
			urlget = Url + 'crowd/userid/'
			//gets userid first
			$.ajax({
				url: urlget, data:{'user':usern}, type:'GET', dataType:'json',
				success: function(data){
					userid = data.userid;

					urlData = Url + 'delegate/plugin/' + userid
					$.ajax({
					url: urlData, data:{}, type:'GET', dataType:'json',
					success: function(data){
						updateResolver(data);
						} 
					});
				} 
			});
		}
	});
}

//adds request instances to page in from of html 
var updateResolver = function(data){
  //every key in data represents a resolver instance 
  //for each resolver instance 
  for (var key in data){
    if (data.hasOwnProperty(key)){
    	//gets request properties
      var service = data[key].service_link;
      var sentDate = data[key].capture_window;
      var name = data[key].name;
      var token = data[key].token;
      var complete = data[key].complete;

   	  //creates div for each request
      const div = document.createElement('div');
      //each id includes request token
      div.id = "delegateInstance_" + token
      //inserts html into page dynamically 
      div.innerHTML = `
        <a href="#" class="gradient">
        <span id="service"><h5>` + service + `</h5>
        <h6 id="name">Sent to: ` + name + `</h6> <h6 id="date">Sent on: ` + sentDate + `</h6>
		<h6 id="complete">Responded: ` + complete + `</h6>
        </span>
        </a>
      `;

      var element =  document.getElementById('content');
      //error handling
      if (typeof(element) != 'undefined' && element != null){
      	//adds div to content div
        document.getElementById('content').appendChild(div);
      }
    }
	}

	//checks if div clicked is request instance div using id
	$('div').click(function(){
		var id = this.id;
		if (id.includes('delegateInstance')){
			//gets token from id 
			var token = id.split("_")[1];

			//gets delegate details of request clicked
			urlget = Url + 'delegate/getDelegate/'
			$.ajax({
				url: urlget, data:{'token':token}, type:'GET', dataType:'json',
				success: function(data){
					newData = data;
					//stores the clicked resolver instance 
					chrome.storage.sync.get('instance', function(obj){
						//removes previously stored instance if it exists, before setting new 
						//prevents max operations per hour error
						if (typeof obj.instance === undefined){
							chrome.storage.sync.set({ 'instance': newData }, (result)=>{
								//redirects to details page once set successfully
								redirectTo("delegateDetails.html");
							}); 
						}

						else {
							chrome.storage.sync.remove('instance', function(obj) {
								chrome.storage.sync.set({ 'instance': newData }, (result)=>{
									redirectTo("delegateDetails.html");
								}); 
							}); 
						}

					}); 
				} 
			});
		}
	});
}

console.log("api funcs loaded");