var Url = server.Url;

//loads map data page 
$(document).ready(function(){
  getData();
})

var usern;
var userLocation;

//gets data of current site 
function getData(){
  chrome.storage.sync.get('user', function(obj){
    chrome.storage.sync.get(['key'], function(result) {
      service = (result.key).split(' ')[0];
      usern = obj.user.username;

      document.getElementById('user').innerHTML = usern;
      document.getElementById('service').innerHTML = service;

      $.ajax({
        type: "GET",
        url: Url + "crowd/votes/",
        dataType: "json",
        data: {'service': service, 'usern':usern},
        success: function(data) {
          graphData = data;

          //gets user location to preselect country on map 
          $.ajax({
            type: "GET",
            url: Url + "crowd/location/",
            dataType: "json",
            data: {'usern':usern},
            success: function(data) {
              userLocation = data.userLocation;
              loadMapGraph(graphData);
            }
          });

        }
      });
    });
  });
}


var currentCountry;
var countrySelected;
//loads graph 
function loadMapGraph(dataGiven){

  var countries = {},
    mapChart,
    countryChart
    
    //gets the yes and no arrays 
    yesList = dataGiven["yes"];
    noList = dataGiven["no"];

    var countryYesData = Object.keys(yesList);
    var countryNoData = Object.keys(noList);

    //each country is a dict
    countryYesData.forEach(function(key){
      countryCode = yesList[key]["name"];
      totalagreed = yesList[key]["value"].total

      var ageDict = yesList[key]["value"]["age"];
      //turns dictionary of age data into list
      var ageArrayAgree = new Array();
      for (var key in ageDict) {
        ageArrayAgree.push(ageDict[key]);
      }
      countries[countryCode] = {
        name: '',
        //country is identified by its pre-set code3
        code3: countryCode,
        //overall country data
        data: [totalagreed], 
        ageDataAgree: ageArrayAgree,
        ageDataDisagree: []
      };
    });

   countryNoData.forEach(function(key){
      countryCode = noList[key]["name"];
      totaldisagreed = noList[key]["value"].total

      var ageDict = noList[key]["value"]["age"];
      //turns dictionary of age data into list
      var ageArrayDisagree = new Array();
      for (var key in ageDict) {
        ageArrayDisagree.push(ageDict[key]);
      }
      countries[countryCode].data.push(totaldisagreed);
      countries[countryCode].ageDataDisagree = ageArrayDisagree;
    });

    //across ages
    var totalAgreed = [0, 0, 0, 0, 0];
    var totalDisagreed = [0, 0, 0, 0, 0];

    for (var key in countries){
      country = countries[key];
      for (i=0; i < Object.keys(countries).length; i++){
        totalAgreed[i] += country.ageDataAgree[i]; 
        totalDisagreed[i] += country.ageDataDisagree[i]; 
      }
    }

    var data = [];
    for (var code3 in countries) {
      var value = 0, itemData = countries[code3].data,
        //takes ratio of agreed/disagreed to shade country 
        yes = itemData[0];
        no = itemData[1];
        //avoids 0 division which results in error
        if (yes == 0){
          value = 0;
        }
        else if (no == 0){
          value = yes;
        }
        else{
          value = yes/no;
        }

      data.push({
        name: countries[code3].name,
        code3: code3,
        value: value
      });

    }

    var mapData = Highcharts.geojson(Highcharts.maps['custom/world']);
    $.each(mapData, function () {
      this.id = this.properties['hc-key']; 
    });

    Highcharts.wrap(Highcharts.Point.prototype, 'select', function (proceed) {
      proceed.apply(this, Array.prototype.slice.call(arguments, 1));
      currentCountry = this.name;

      $('#info h2').html(this.name);

      countryChart = Highcharts.chart('country-chart', {
        chart: {
          height: 250,
          spacingLeft: 0
        },
        credits: {
          enabled: false
        },
        title: {
          text: null
        },
        subtitle: {
          text: null
        },
        xAxis: {
          title: {text: 'Age' },
          tickPixelInterval: 50,
          categories: ['<18', '18-25', '25-35', '35-45', '50+'],
          crosshair: true
        },
        yAxis: {
          allowDecimals: false,
          title: {text: 'No. of Users' },
          opposite: true
        },
        tooltip: {
          split: true
        },
        plotOptions: {
          series: {

            animation: {
              duration: 500
            },
            marker: {
              enabled: false
            },
            threshold: 0,
            pointStart: 0
          }
        }
      });


      countryChart.series.slice(0).forEach(function (s) {
        s.remove(false);
      });

      var selectedCountry;
      var countryToSelect;

      //if no country is selected, displays all countries 
      if (!countrySelected){
        $('#info h2').html('All countries');

        countryChart.addSeries({
          name: 'Agreed',
          data: totalAgreed,
          type: 'area'
        }, false);
        countryChart.addSeries({
          name: 'Disagreed',
          data: totalDisagreed,
          type: 'area'
        }, false);

        countryChart.redraw();
      }

      //if country is selected 
      else {
        $('#info h2').html(this.name);
        var selected = this.code3;

        countryChart.addSeries({
        name: 'Agreed',
        data: countries[selected].ageDataAgree,
        type: 'area'
        }, false);

        countryChart.addSeries({
        name: 'Disagreed',
        data: countries[selected].ageDataDisagree,
        type: 'area'
        }, false);

        countryChart.redraw();
      }

    });

    // Initiate the map chart
    mapChart = Highcharts.mapChart('container', {

      title: {
        text: 'User Data by Country'
      },

      subtitle: {
        text: 'Click countries to see age data, click again for all country data'
      },

      mapNavigation: {
        enabled: true,
        buttonOptions: {
          verticalAlign: 'bottom'
        }
      },

      colorAxis: {
        type: 'linear',
        endOnTick: false,
        startOnTick: false,
        min: 0
      },
      //lable when hovering over a country
      tooltip: {
        formatter: function() {

          name = this.point.code3;
          agreed = countries[name].data[0];
          disagreed = countries[name].data[1]

          return '<b>' + this.point.name + ': ' + '</b>' + 'Agreed: ' + agreed + ', Disagreed: ' + disagreed;
        }
      },


      plotOptions: {
        series: {
          point: {
            events: {
              select: function () {
                countrySelected = true;
                selectedCountry = this.name;
              },
              unselect: function () {
                countrySelected = false;
                countryToSelect = this.name;
                if (countryToSelect != selectedCountry){
                  countrySelected = true;
                }
              }
            }
          }
        }
      },


      series: [{
        data: data,
        mapData: mapData,
        joinBy: ['iso-a3', 'code3'],
        name: 'User Data: ',
        allowPointSelect: true,
        cursor: 'pointer',
        states: {
          select: {
            color: '#a4edba',
            borderColor: 'black',
          }
        }
      }]
    });


    countryID = getLocation(userLocation);
    // Pre-select a country
    mapChart.get(countryID).select();
 
 }

//using country code, gets country id to select on map
function getLocation(userlocation){
  //ids : de, us, gb, fr
  switch(userlocation){
    case 'GBR':
      return 'gb';
      break;

    case 'USA':
      return 'us';  
      break;

    case 'FRA':
      return 'fr';
      break;

    case 'DEU':
      return 'de';
      break;

    default:
      return;
  }
}
