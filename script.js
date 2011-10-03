// settings & seeds
var map_options = {
  center: new google.maps.LatLng(39.828175, -98.5795),
  zoom: 4,
  mapTypeId: google.maps.MapTypeId.ROADMAP
};
var place_types = "accounting airport amusement_park aquarium art_gallery atm bakery bank bar beauty_salon bicycle_store book_store bowling_alley bus_station cafe campground car_dealer car_rental car_repair car_wash casino cemetery church city_hall clothing_store convenience_store courthouse dentist department_store doctor electrician electronics_store embassy establishment finance fire_station florist food funeral_home furniture_store gas_station general_contractor geocode grocery_or_supermarket gym hair_care hardware_store health hindu_temple home_goods_store hospital insurance_agency jewelry_store laundry lawyer library liquor_store local_government_office locksmith lodging meal_delivery meal_takeaway mosque movie_rental movie_theater moving_company museum night_club painter park parking pet_store pharmacy physiotherapist place_of_worship plumber police post_office real_estate_agency restaurant roofing_contractor rv_park school shoe_store shopping_mall spa stadium storage store subway_station synagogue taxi_stand train_station travel_agency university veterinary_care zoo administrative_area_level_1 administrative_area_level_2 administrative_area_level_3 colloquial_area country floor intersection locality natural_feature neighborhood political point_of_interest post_box postal_code postal_code_prefix postal_town premise room route street_address street_number sublocality sublocality_level_4 sublocality_level_5 sublocality_level_3 sublocality_level_2 sublocality_level_1 subpremise transit_station".split(" ").sort();
$.storage = $.jStorage;

// initialize
var directionsDisplay = new google.maps.DirectionsRenderer()
  , directionsService = new google.maps.DirectionsService()
  , map = new google.maps.Map(document.getElementById("map"), map_options)
  , placesService = new google.maps.places.PlacesService(map)
  , info_window = new google.maps.InfoWindow()
  , info_window_template = $("#info_window_template").html()
  , itinerary_template = $("#itinerary_template").html()
  , place_ids = []
  , itinerary_ids = []
  , markers = []
  , circles = [];
info_window.setMap(map);
directionsDisplay.setMap(map);

// types of places
var place_types_select = $("<select>").attr("id", "place_types").addClass("span6").prop("multiple", true).data("placeholder", "Select one or more types of places to show");
$.each(place_types, function(index, place_type){
  $("<option>").val(place_type).text(place_type.titleize()).appendTo(place_types_select);
});
$("#place_types").replaceWith(place_types_select);
$("#place_types").chosen();

// events
$("#add_waypoint").click(function(){
  var div = $("<div>");
  $("<input>").attr("type", "text").watermark("Waypoint Address").addClass("waypoint span5").appendTo(div);
  $("<span>").addClass("delete icon").appendTo(div).click(function(){
    div.remove();
  });
  div.insertBefore("#destination");
});
$(".add_to_itinerary").live("click", function(){
  var place = $.storage.get($(this).attr("rel"));
  $("#empty_itinerary").hide();
  if(!~$.inArray(place.id, itinerary_ids)){
    $("<li>").html(tofu(itinerary_template, place)).appendTo("#itinerary_list")
    itinerary_ids.push(place.id);
  }
});
$("#form").submit(function(){
  // clear markers & circles
  $.each(markers, function(i){ this.setMap(null); delete markers[i]; });
  $.each(circles, function(i){ this.setMap(null); delete circles[i]; });
  markers.length = 0;
  circles.length = 0;
  place_ids.length = 0;

  var start = $("#origin").val()
    , end = $("#destination").val()
    , waypoints = $(this).find(".waypoint").map(function(){
      return { location: $(this).val(), stopover: true };
    });

  var request = {
      origin: start, 
      destination: end,
      waypoints: waypoints,
      travelMode: google.maps.DirectionsTravelMode.DRIVING
  };

  directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      var legs = response.routes[0].legs;
      $.each(legs, function(i, leg){
        var steps = leg.steps;
        var circle_options = {
          strokeColor: "#FF0000",
          strokeOpacity: 0.5,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.35,
          map: map
        };
        $.each(steps, function(index, step){
          if(step.distance.value > 0 /* meters */){
            var midpoint = step.start_point.midpoint(step.end_point)
              , radius = step.distance.value / 2;

            circle_options.center = midpoint;
            circle_options.radius = radius;
            
            placesService.search({
              location: midpoint,
              radius: radius,
              types: $("#place_types option:selected").map(function(){ return $(this).val(); })
            }, function(results, status){
              if (status == google.maps.places.PlacesServiceStatus.OK) {
                $.each(results, function(index, place){
                  if(!~$.inArray(place.id, place_ids)){
                    var icon = new google.maps.MarkerImage(place.icon, null, null, null, new google.maps.Size(25, 25))
                      , marker = new google.maps.Marker({
                      position: place.geometry.location,
                      icon: icon,
                      map: map,
                      title: place.name
                    });
                    markers.push(marker);
                    google.maps.event.addListener(marker, "click", function() {
                      placesService.getDetails({ reference: place.reference }, function(place, status){
                        if(status == google.maps.places.PlacesServiceStatus.OK){
                          place.formatted_address = place.formatted_address.replace(/, United States$/, "");
                          $.storage.set(place.reference, place);
                          info_window.setContent(tofu(info_window_template, place));
                          info_window.setPosition(place.geometry.location);
                          info_window.open(map);
                        }
                      });
                    });
                  }
                });
              }
            });
            circles.push(new google.maps.Circle(circle_options));
          }
        });
        directionsDisplay.setDirections(response);
      });
    }
  });
  return false;
});

$("input[type=text]").each(function(){
  var title = $(this).attr("title");
  if(title){
    $(this).watermark(title);
  }
});
$("a").each(function(){
  $(this).attr("target", "_blank");
});
