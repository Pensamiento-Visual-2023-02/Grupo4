// Initialize the map
var map = createMap();
var rentLayer = L.layerGroup();
var transportLayer = L.layerGroup();


// Add the boundary layer (comuna_limits)
addBoundaryLayer(map).then(function (comunaLayer) {
    highlightComunaArea(map, comunaLayer);
    clickeableComuna(map, comunaLayer);
    
});

// Load and display GTFS lines
loadGTFSLines(map);

loadRentPrices();

createEventListeners();

// Function to create the map
function createMap() {
    var map = L.map('map', {
        center: [-33.6, -70.6693],
        zoom: 8.5,
        zoomControl: false, // Disable zoom control buttons
    });

    return map;
}
function readComunasFile(callback) {
    var fr = new FileReader();

    fr.onload = function(event) {
        var comunas_text = event.target.result;
        var comunas_array = comunas_text.split('\n');
        callback(comunas_array); // Call the callback with the result
    };

    fr.readAsText('data/RM_comunas/RM_comunas.txt');
}



// Function to add the boundary layer (comuna_limits)
function addBoundaryLayer(map) {
    return fetch('data/region_metropolitana_de_santiago/all.geojson') 
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {

            const comunasString = "Cerrillos	Cerro Navia	Conchalí	El Bosque	Estación Central	Huechuraba	Independencia	La Cisterna	La Florida	La Granja	La Pintana	La Reina	Las Condes	Lo Barnechea	Lo Espejo	Lo Prado	Macul	Maipú	Ñuñoa	Padre Hurtado	Pedro Aguirres Cerda	Peñalolén	Pirque	Providencia	Pudahuel	Puente Alto	Quilicura	Quinta Normal	Recoleta	Renca	San Joaquín	San Miguel	San Ramón	Santiago	Vitacura";

            // Split the string into an array using the tab character as the delimiter
            const comunas_array = comunasString.split('\t');


            console.log(comunas_array);
            console.log(data);
            var RM_data = data.features.filter(function (feature) {
                const comuna_name = feature.properties.NOM_COM;
                const index = comunas_array.indexOf(comuna_name);

                if (index > -1) {
                    console.log(comuna_name);
                    comunas_array.splice(index, 1);
                    return true;
                } else {
                    return false;
                }
            });
            console.log(comunas_array);


            var comunaLayer = L.geoJSON(RM_data, {
                style: function (feature) {
                    if (feature.properties.NOM_COM === "San Bernardo") {
                        return {
                            fill: 'red',
                            color: 'black',
                            weight: 2
                        };
                    } else {
                        return {
                            fill: null,
                            color: 'black',
                            weight: 2
                        };
                    }
                }
            });

            comunaLayer.addTo(map); 

            return comunaLayer;

        });
}


// Function to load and display GTFS lines
function loadGTFSLines(map) {
    fetch('data/public_transport_routes/MyAgency/MyAgency.geojson') 
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var lineFeatures = data.features.filter(function (feature) {
                return feature.properties.agency_id === 'M' || feature.properties.agency_id === 'RM' || feature.properties.agency_id === 'MT';
            });

            transportLayer = createLineLayer(lineFeatures);
            transportLayer.addTo(map);

        });
}

// Function to create the GeoJSON line layer
function createLineLayer(features) {
    return L.geoJSON(features, {
        style: function (feature) {
            switch (feature.properties.agency_id) {
                case 'MT':
                    return { color: '#1b2b45', weight: 0 };
                case 'M':
                    return { color: '#dd0f0f', weight: 0 };
                case 'RM':
                    return { color: '#fe9553', weight: 0 };
            }
        }
    });
}


// Function to update line visibility based on checkbox state
function updateLineVisibility(checkboxId, lineType, lineLayer) {
    var checkbox = document.getElementById(checkboxId);

    lineLayer.eachLayer(function (layer) {
        if (layer.feature.properties.agency_id === lineType) {
            layer.setStyle({ weight: checkbox.checked ? 1 : 0 }); // Toggle visibility
        }
    });
}


function highlightComunaArea(map, comunaLayer){
    var highlightedLayer = null;
    map.on('mousemove', function (e) {
        // Get the clicked coordinates
        var latlng = e.latlng;

        var isWithinAnyBoundary = false;

        comunaLayer.eachLayer(function (layer) {
            // Check if the mouse pointer is within the comuna boundary
            var isWithinBoundary = turf.booleanPointInPolygon(
                [latlng.lng, latlng.lat],
                layer.toGeoJSON()
            );

            if (isWithinBoundary) {
                isWithinAnyBoundary = true;
                // Highlight the layer by changing the boundary color
                layer.setStyle({
                    weight: 4
                });
                highlightedLayer = layer;
            } else {
                // Restore default boundary color for other layers
                layer.setStyle({
                    weight: 2
                });
                
            }
    });

    // Reset the highlighted layer if the mouse is not within any boundary
    if (!isWithinAnyBoundary && highlightedLayer) {
        highlightedLayer.setStyle({
            weight: 0.5
        });
        highlightedLayer = null;
    }

    });
}

function clickeableComuna(map, comunaLayer){
    map.on('click', function (e) {
        var latlng = e.latlng;
    
        comunaLayer.eachLayer(function (layer) {
            // Check if the clicked point is within the comuna boundary
            var isWithinBoundary = turf.booleanPointInPolygon(
                [latlng.lng, latlng.lat],
                layer.toGeoJSON()
            );
            
            if (isWithinBoundary) {
                var comunaName = layer.feature.properties.NOM_COM; 
                window.location.href = `comuna.html?comuna=${comunaName}`;
            }
        });
    });
}

function loadRentPrices() {
    fetch('./data/rent_prices/rent_prices.json')
      .then(response => response.json())
      .then(data => {
        // Iterate through each line (record) and process it
        data.forEach(data => {
            if(data.region == "Rm (metropolitana)"){
                var price = data.precio;

                // Define a function to set dot color based on price
                var colorScale = d3.scaleSequential(d3.interpolateViridis).domain([10000, 1000000]);
                
                var dot = L.circleMarker([data.latitude, data.longitude], {
                    radius: 1, 
                    color: colorScale(price), 
                    weight: 1, 
                    fillColor: colorScale(price),
                    fillOpacity: 0.8 
                });
                rentLayer.addLayer(dot);

            } 
        
            });
        
      })
      .catch(error => {
        console.error('Error loading data:', error);
      });
  }

function createEventListeners(){
    // Event listeners for checkboxes
    document.getElementById('metroCheckbox').addEventListener('change', function () {
        updateLineVisibility('metroCheckbox', 'M', transportLayer);
    });

    document.getElementById('busCheckbox').addEventListener('change', function () {
        updateLineVisibility('busCheckbox', 'RM', transportLayer);
    });

    document.getElementById('tramCheckbox').addEventListener('change', function () {
        updateLineVisibility('tramCheckbox', 'MT', transportLayer);
    });

    document.getElementById('rentCheckbox').addEventListener('change', function () {
            var checkbox = document.getElementById('rentCheckbox');
            if(checkbox.checked){
                rentLayer.addTo(map);
            }
            else{
                rentLayer.remove();
            }
        });
}
