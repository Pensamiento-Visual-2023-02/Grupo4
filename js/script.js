// Initialize the map
var map = createMap();

// Add the boundary layer (comuna_limits)
addBoundaryLayer(map);

// Load and display GTFS lines
loadAndDisplayGTFSLines(map);

// Function to create the map
function createMap() {
    var map = L.map('map').setView([-33.4489, -70.6693], 10);

    // Add the dark-themed tile layer
    L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    return map;
}

// Function to add the boundary layer (comuna_limits)
function addBoundaryLayer(map) {
    fetch('data/comuna_limits/all.geojson') 
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            var comunaLayer = L.geoJSON(data, {
                style: {
                    fill: false,   // No fill color
                    color: 'black', // Boundary color
                    weight: 0.5,     // Boundary line weight
                },
            });

            // Add a click event listener to the comuna layer
            comunaLayer.on('click', function (e) {
                var comuna = e.layer; 
                console.log(comuna);
                var comunaName = comuna.feature.properties.NOM_COM; 
                // Example: Display the comuna name in an alert
                console.log('You clicked on ' + comunaName);
            });

            comunaLayer.addTo(map); 

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
                case 'M':
                    return { color: 'red', weight: 0 };
                case 'RM':
                    return { color: 'green', weight: 0 };
                case 'MT':
                    return { color: 'blue', weight: 0 };
            }
        }
    });
}

// Function to update line visibility based on checkbox state
function updateLineVisibility(checkboxId, lineType, lineLayer) {
    var checkbox = document.getElementById(checkboxId);

    lineLayer.eachLayer(function (layer) {
        if (layer.feature.properties.agency_id === lineType) {
            layer.setStyle({ weight: checkbox.checked ? 2 : 0 }); // Toggle visibility
        }
    });
}
