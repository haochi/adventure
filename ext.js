// ext
Number.prototype.toRad = function(){ return this * Math.PI / 180; }
Number.prototype.toDeg = function(){ return this * 180 / Math.PI; }
String.prototype.titleize = function(){
  return this.replace(/(_|\s)+(\w)/g, function(a, b, c){
    return " "+c.toUpperCase();
  }).replace(/^(\w)/, function(a, b){
    return b.toUpperCase();
  });
}

google.maps.LatLng.prototype.midpoint = function(that){
  // http://www.movable-type.co.uk/scripts/latlong.html
  var lat1 = this.lat().toRad()
    , lon1 = this.lng().toRad()
    , lat2 = that.lat().toRad();
  var dLon = (that.lng()-this.lng()).toRad();
  var Bx = Math.cos(lat2) * Math.cos(dLon);
  var By = Math.cos(lat2) * Math.sin(dLon);

  lat3 = Math.atan2(Math.sin(lat1)+Math.sin(lat2), Math.sqrt( (Math.cos(lat1)+Bx)*(Math.cos(lat1)+Bx) + By*By) );
  lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);
  lon3 = (lon3+3*Math.PI) % (2*Math.PI) - Math.PI;  // normalise to -180..+180
  
  return new google.maps.LatLng(lat3.toDeg(), lon3.toDeg());
}
