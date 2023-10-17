// Initialize the map
var map = createMap();

// Add the boundary layer (comuna_limits)
addBoundaryLayer(map).then(function (comunaLayer) {
    highlightComunaArea(map, comunaLayer);
    clickeableComuna(map, comunaLayer);
    
});

// Load and display GTFS lines
loadAndDisplayGTFSLines(map);


// Function to create the map
function createMap() {
    var map = L.map('map', {
        center: [-33.6, -70.6693],
        zoom: 8.5,
        zoomControl: false, // Disable zoom control buttons
    });

    var whiteLayer = L.tileLayer('./map_background.png', {
        maxZoom: 17,
        scrollY: false,
    }).addTo(map);
    
    whiteLayer.setZIndex(1); // Ensure the white layer is on top
    

    return map;
}



// Function to add the boundary layer (comuna_limits)
function addBoundaryLayer(map) {
    return fetch('data/region_metropolitana_de_santiago/all.geojson') 
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var comunaLayer = L.geoJSON(data, {
                style: {
                    fill: false,   // No fill color
                    color: 'black', // Boundary color
                    weight: 2,     // Boundary line weight
                },
            });

            comunaLayer.addTo(map); 

            return comunaLayer;

        });
}


// Function to load and display GTFS lines
function loadAndDisplayGTFSLines(map) {
    fetch('data/public_transport_routes/MyAgency/MyAgency.geojson') 
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var lineFeatures = data.features.filter(function (feature) {
                return feature.properties.agency_id === 'M' || feature.properties.agency_id === 'RM' || feature.properties.agency_id === 'MT';
            });

            // Create a GeoJSON layer with different line styles
            var lineLayer = createLineLayer(lineFeatures);
            lineLayer.addTo(map);

            // Event listeners for checkboxes
            document.getElementById('metroCheckbox').addEventListener('change', function () {
                updateLineVisibility('metroCheckbox', 'M', lineLayer);
            });

            document.getElementById('busCheckbox').addEventListener('change', function () {
                updateLineVisibility('busCheckbox', 'RM', lineLayer);
            });

            document.getElementById('tramCheckbox').addEventListener('change', function () {
                updateLineVisibility('tramCheckbox', 'MT', lineLayer);
            });
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
        // Get the clicked coordinates
        var latlng = e.latlng;
    
        comunaLayer.eachLayer(function (layer) {
            // Check if the clicked point is within the comuna boundary
            var isWithinBoundary = turf.booleanPointInPolygon(
                [latlng.lng, latlng.lat],
                layer.toGeoJSON()
            );
            
            if (isWithinBoundary) {
                var comunaName = layer.feature.properties.NOM_COM; // Get the comuna name
                window.location.href = `comuna.html?comuna=${comunaName}`;
            }
        });
    });
}



