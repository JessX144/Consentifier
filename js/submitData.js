//when user submits age and location data 
var Url = server.Url;

$(document).ready(function(){
  submitTable();
})


function submitTable(){
	chrome.storage.sync.get('user', function(obj){
		chrome.storage.sync.get(['key'], function(result) {

			var service = service = (result.key).split(' ')[0];
			var user = usern = obj.user.username;

			document.getElementById('user').innerHTML = user;
			document.getElementById('service').innerHTML = service;

			document.getElementById("submit").addEventListener("click", function(){
				//gets age and location data from form 
				var ageForm = document.getElementById("Age");
				var age = ageForm.options[ageForm.selectedIndex].value;

				var locationForm = document.getElementById("Location");
				var location = locationForm.options[locationForm.selectedIndex].value;

				//updates database with user data 
				urlSubmit = Url + 'crowd/analytics/data/'
				$.ajax({
					type: "POST",
					url: urlSubmit,
					data: {
						'service':service,
						'age': age,
						'location': location,
						'user': user 
					},
					datatype: "json",
					success: function(data) {
						alert("Thank you for your data!");
						//loads map data
						openData(user, service);
					}
				});

			});
		});
	});
}

//closes current window, opens new graph map
function openData(user, service){
	window.close();
	var win = window.open('dataSigned.html');
}

