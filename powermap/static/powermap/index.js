$( document ).ready(function() {
  // Provide your access token
  L.mapbox.accessToken = 'pk.eyJ1IjoiaGFyYmllaXNtIiwiYSI6IksyU1Rkc0UifQ.eXciAIxM0pfdj5STBHNnbQ';
  // Create a map in the div #map
  var map = L.mapbox.map('map', 'harbieism.mbb67n8i');

  map.addControl(L.mapbox.geocoderControl('mapbox.places', {
    autocomplete: true
  }));

  var carLayer = L.mapbox.featureLayer().addTo(map);

  var noteLayer = L.mapbox.featureLayer();

  var lineStringMarker = L.mapbox.featureLayer().addTo(map);

  var secondMarker = null;

  var staticSecond = null;

  var clusterGroup = new L.MarkerClusterGroup();

  var polyline = L.polyline([]).addTo(map);


  var updateCar = (function(callback) {
    $.get("/pttp/cars/get_user_car/", function(data) {
      var id = data.id;
      data.properties["marker-symbol"] = "car";
      data.properties["marker-size"] = "large";
      data.properties["marker-color"] = "#bad696";
      var temp = carLayer.setGeoJSON(data)._layers;
      for (var prop in temp){
        var marker = temp[prop];
        break;
      }
      console.log(temp);
      var fc = marker.getLatLng();
      callback([fc, id]);
    });
  });


  (function workerTwo() {
    updateCar(function(result) {
      polyline.spliceLatLngs(0, 1, result[0]);
      navigator.geolocation.getCurrentPosition(function(position) {
        var csrftoken = $.cookie('csrftoken');
        var post_data = {
          'lat': position.coords.latitude,
          'lng': position.coords.longitude,
          'csrfmiddlewaretoken': csrftoken,
        }
        var post_url = "/pttp/cars/" + result[1] + "/update_current_location/";
        $.post(post_url, post_data, function(response) {
        });
      });
    });
    setTimeout(workerTwo, 15000);
  })();


  var getData = (function(callback) {
    $.get("/pttp/cars/get_user_car/", function(data) {
      var id = data.id;
      data.properties["marker-symbol"] = "car";
      data.properties["marker-size"] = "large";
      data.properties["marker-color"] = "#bad696";
      var temp = carLayer.setGeoJSON(data)._layers;
      for (var prop in temp){
        var marker = temp[prop];
        break;
      }
      var fc = marker.getLatLng();
      var soon_marker = marker.feature.properties.next_location;
      var lat_second = soon_marker.coordinates[0];
      var lng_second = soon_marker.coordinates[1];

      var secondMarker = L.marker(new L.LatLng(lng_second, lat_second), {
        icon: L.mapbox.marker.icon({
          'marker-symbol': 'marker-stroked',
          'marker-size': 'large',
          'marker-color': '#0044ff'
        }),
        draggable: true,
        zIndexOffset: 1000
      });
      secondMarker.addTo(map);

      secondMarker.options.zIndexOffset = 1000;
      var c = secondMarker.getLatLng();
      var latlngs = [fc, c]
      var polyline = L.polyline(latlngs, {color: 'blue'}).addTo(map);
      callback([fc, secondMarker, polyline, id]);
    });
  });

  carLayer.on('click', function(e){
    $.get("/pttp/popup/" + e.layer.feature.id + "/", function(data) {
      e.layer.bindPopup(data);
      e.layer.openPopup();
    });
  });

  noteLayer.on('click', function(e){
    $.get("/pttp/note_popup/" + e.layer.feature.id + "/", function(data) {
      e.layer.bindPopup(data);
      e.layer.openPopup();
    });
  });

  var getLocation = (function() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(setLocation);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  });

  var setLocation = (function(position) {
    point_string = "POINT(" + position.coords.longitude + " " + position.coords.latitude +")";
    $("#id_location").val(point_string);
    map.setView([position.coords.latitude, position.coords.longitude], 10);
  });


  getLocation();

  (function worker() {
    $.get("/helpnotes/?format=json", function(data) {
      var dataStorage = data;
      for(var i = 0; i < data.results.features.length; i++){
        data.results.features[i].properties["marker-symbol"] = "oil-well";
        data.results.features[i].properties["marker-size"] = "large";
        data.results.features[i].properties["marker-color"] = "#fc4353";
      }
      noteLayer.setGeoJSON([]);
      noteLayer.setGeoJSON(data.results);
      clusterGroup.clearLayers(noteLayer);
      clusterGroup.addLayer(noteLayer);
      map.addLayer(clusterGroup);
      setTimeout(worker, 60000);
    });
  })();

  getData(function(result) {
    polyline = result[2];
    result[1].on('drag', function(e){
      var loc = result[1].getLatLng();
      polyline.spliceLatLngs(1, 1, loc);
    });

    $('#change_next').click(function() {
      var csrftoken = $.cookie('csrftoken');
      var loc = result[1].getLatLng();
      var post_data = {
        'lat': loc.lat,
        'lng': loc.lng,
        'csrfmiddlewaretoken': csrftoken,
      }
      var post_url = "/pttp/cars/" + result[3] + "/change_location/";
      $.post(post_url, post_data, function(response) {
      });
    });
  });

});