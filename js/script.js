// Initialize the map
var map = createMap();
var rentLayer = L.layerGroup();
var transportLayer = L.layerGroup();


// Add the boundary layer (comuna_limits)
addBoundaryLayer().then(function (comunaLayer) {

    getComunaInfo().then(function (comunaJSON) {
        highlightComunaArea(comunaLayer, comunaJSON);
        clickeableComuna(comunaLayer);
        createEventListenerColorMap(comunaJSON, comunaLayer);
    });
    
});

loadGTFSLines();

loadRentPrices();

createEventListeners();

// Function to create the map
function createMap() {
    var map = L.map('map', {
        center: [-33.5, -70.6693],
        zoom: 10,
        zoomControl: false, // Disable zoom control buttons
    });

    return map;
}



// Function to add the boundary layer (comuna_limits)
function addBoundaryLayer() {
    return fetch('data/region_metropolitana_de_santiago/all.geojson') 
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {

            var comunas_array = ",Cerrillos,Cerro Navia,Conchalí,El Bosque,Estación Central,Huechuraba,Independencia,La Cisterna,La Florida,La Granja,La Pintana,La Reina,Las Condes,Lo Barnechea,Lo Espejo,Lo Prado,Macul,Maipú,Ñuñoa,Padre Hurtado,Pedro Aguirre Cerda,Peñalolén,Pirque,Providencia,Pudahuel,Puente Alto,Quilicura,Quinta Normal,Recoleta,Renca,San Joaquín,San Miguel,San Ramón,Santiago,Vitacura, ".split(","); // Split string into array of strings, using comma as separator

            var RM_data = data.features.filter(function (feature) {
                const comuna_name = feature.properties.NOM_COM;
                const index = comunas_array.indexOf(comuna_name);

                if (index > -1) {
                    comunas_array.splice(index, 1);
                    return true;
                } else {
                    return false;
                }
            });

            var comunaLayer = L.geoJSON(RM_data, {
                style: {
                        fillColor: 'aliceblue', // Default color
                        color: 'black',
                        weight: 2
                    }    
                
            });
            comunaLayer.addTo(map); 
            return comunaLayer;

        });
}


// Function to load and display GTFS lines
function loadGTFSLines() {
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
function highlightComunaArea(comunaLayer, comunaJSON) {
    var highlightedLayer = null;
    var tooltip = L.DomUtil.create('div', 'leaflet-tooltip'); // Create a tooltip div
    tooltip.style.display = 'none';
    document.getElementById('map').appendChild(tooltip); // Append it to the map container

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
                layer.setStyle({
                    weight: 4
                });
                highlightedLayer = layer;

                tooltip.innerHTML = layer.feature.properties.NOM_COM + "<br>" + getCurrentInfo(comunaJSON, layer.feature.properties.NOM_COM);
                tooltip.style.display = 'block';
                tooltip.style.left = (e.originalEvent.pageX ) - 430 + 'px';
                tooltip.style.top = (e.originalEvent.pageY) + 'px';
            } else {
                layer.setStyle({
                    weight: 2
                });
            }
        });

        if (!isWithinAnyBoundary) {
            tooltip.style.display = 'none';
        }
    });
}

function getCurrentInfo(comunaJSON, comunaName){
    const attribute = document.getElementById('mapview').value;
    if (attribute == ""){
        return "";
    }
    const value = comunaJSON[attribute][comunaName];
    return `${attribute}: ${value}`;

    
}

function clickeableComuna(comunaLayer){
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

function getComunaInfo() {
    return fetch('data/data_per_comuna/data_per_comuna.csv') 
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            const rows = data.trim().split('\n');
            const columns = rows[0].split(',');
            const jsonData = {};

            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',');
                const obj = {};
                for (let j = 1; j < columns.length; j++) {
                    obj[columns[j]] = values[j];
                }
                jsonData[values[0]] = obj;
            }
            return jsonData;
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

function createEventListenerColorMap(comunaJSON, comunaLayer){
    document.getElementById('mapview').addEventListener('change', function() {
        const selectedAttribute = this.value;
        var colorScale = getColorScaleForAttribute(selectedAttribute, comunaJSON);

        comunaLayer.eachLayer(function (layer) {
            const comunaName = layer.feature.properties.NOM_COM;
            var value = comunaJSON[selectedAttribute][comunaName];
            if (selectedAttribute == "Porcentaje de población dentro del 40% de menores ingresos (2021)"){
                value = parseFloat(value.slice(0, -1));
            }

            layer.setStyle({
                fillColor: colorScale(value)
            });
                
            });
        });
        
}

function getColorScaleForAttribute(attribute, comunaJSON) {

    const colorRanges = {
        "Total Poblacion": ['white', '#9d201c'],
        "Total viviendas": ['white', '#0175be'],
        "Hombres": ['white', '#11613c'],
        "Mujeres": ['white', '#023b8c'],
        "Homicidios": ['white', '#3a4c58'],
        "Porcentaje de población dentro del 40% de menores ingresos (2021)": ['white', '#9d201c'],
    };
    var attributeValues = Object.values(comunaJSON[attribute]);
    if (attribute == "Porcentaje de población dentro del 40% de menores ingresos (2021)"){
        attributeValues = Object.values(comunaJSON[attribute]).map(value => parseFloat(value.slice(0, -1))).slice(0, -1);
    }


    var minValue = Math.min(...attributeValues);
    var maxValue = Math.max(...attributeValues);
    console.log(attributeValues);
    console.log(maxValue);
    console.log(minValue);


    const range = colorRanges[attribute];
    console.log(range);
    
    const colorScale = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range(range);

    return colorScale;
}


