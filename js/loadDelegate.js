//loads delegate infromation for delegateDetails.html
$(document).ready(function(){
	chrome.storage.sync.get('instance', function(obj) {
    if (obj === undefined){}
    else {
			var name = obj.instance.name;
			var messsage = obj.instance.message;
			var capture_window = obj.instance.capture_window;
			var response = obj.instance.response;
			
			//displays details
			document.getElementById('name').innerHTML = name;
			document.getElementById('message').innerHTML = messsage;
			document.getElementById('date').innerHTML = capture_window;
			document.getElementById('response').innerHTML = response;
    }
	}); 
})