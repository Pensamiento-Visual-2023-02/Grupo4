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
    var southWest = L.latLng(-34.5, -71.6693); 
    var northEast = L.latLng(-32.5, -69.6693); 
    var bounds = L.latLngBounds(southWest, northEast); 
    var map = L.map('map', {
        center: [-33.5, -70.5],
        zoom: 10.2,
        minZoom: 10 ,
        maxZoom: 15, 
        maxBounds: bounds, 
        zoomControl: false, 
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
                        color: 'grey',
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
    var weight = 1;

    if (lineType === 'M') {
        weight = 2;
    }

    lineLayer.eachLayer(function (layer) {
        if (layer.feature.properties.agency_id === lineType) {
            layer.setStyle({ weight: checkbox.checked ? weight : 0 }); // Toggle visibility
        }
    });
}
function highlightComunaArea(comunaLayer, comunaJSON) {
    var highlightedLayer = null;
    var tooltip = L.DomUtil.create('div', 'leaflet-tooltip'); // Create a tooltip div
    tooltip.style.display = 'none';
    document.getElementById('map').appendChild(tooltip); // Append it to the map container

    map.on('mousemove', function (e) {
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
                tooltip.style.top = (e.originalEvent.pageY) - 250 + 'px';
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
                const range = ['yellow', `rgb(${1}, ${117}, ${190})`]

                var colorScale = d3.scaleLinear()
                .domain([150000.0, 4500000.0])
                .range(range)
                .clamp(true);
                
                var dot = L.circleMarker([data.latitude, data.longitude], {
                    radius: 2, 
                    color: colorScale(price), 
                    weight: 3, 
                    fillColor: colorScale(price),
                    fillOpacity: 1,
                    interactive: false // Disable dynamic resizing

                });
                rentLayer.addLayer(dot);

                // Add a mouseover event listener
                dot.on('mouseover', function (e) {
                    // This function will be called when the mouse hovers over the dot
                    // You can perform actions like changing the dot's style, displaying a tooltip, or any other interaction here
                    dot.setStyle({ radious: 4 });
                    tooltip.innerHTML = "hello" + "<br>" + data.direccion;
                    tooltip.style.display = 'block';
                    tooltip.style.left = (e.originalEvent.pageX ) - 430 + 'px';
                    tooltip.style.top = (e.originalEvent.pageY) - 250 + 'px';
                    console.log("hello");
                });

                // Add a mouseout event listener
                dot.on('mouseout', function (e) {
                    // This function will be called when the mouse moves out of the dot
                    // You can revert any changes made in the mouseover event here
                    dot.setStyle({ fillOpacity: 1 });
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
            var columns = rows[0].split(',');
            columns = columns.slice(0, columns.length - 1);
        

            const jsonData = {};
            console.log(rows)
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',');
                const obj = {};
                for (let j = 2; j < columns.length; j++) {
                    obj[columns[j]] = values[j];
                }
                //if (jsonData[values[0]] == undefined){
                    //jsonData[values[0]] = {};
                //}
                //jsonData[values[0]][values] = obj;
                jsonData[values[1]] = obj;
            }
            console.log(jsonData);
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

function defaultMapColor(comunaLayer){
    comunaLayer.eachLayer(function (layer) {
        layer.setStyle({
            fillColor: '#f2f2f2',
            fillOpacity: 1,
        });
;
    });
}
function changeMapColor(comunaJSON, comunaLayer, selectedAttribute){
    var colorScale = getColorScaleForAttribute(selectedAttribute, comunaJSON);

    comunaLayer.eachLayer(function (layer) {
        const comunaName = layer.feature.properties.NOM_COM;
        var value = comunaJSON[selectedAttribute][comunaName];
        value = parseFloat(value);
        const color = colorScale(value);
        console.log(color);

        layer.setStyle({
            fillColor: color,
            fillOpacity: 1,
        });
    });
    var legend = document.getElementById("legend");
    legend.innerHTML = "";

    var imgElement = document.createElement("img");
    imgElement.src = `./images/${selectedAttribute}.jpeg`;
    imgElement.width = 350;
    legend.appendChild(imgElement);

}

function createEventListenerColorMap(comunaJSON, comunaLayer){
    document.getElementById('mapview').addEventListener('change', function() {
        if (this.value == ""){
            defaultMapColor(comunaLayer);
        }
        else{
            changeMapColor(comunaJSON, comunaLayer, this.value);
        }
    });
        
}

function getColorScaleForAttribute(attribute, comunaJSON) {

    const colorRanges = {
        "Total poblacion": [`rgb(${85}, ${164}, ${184})`,`rgb(${2}, ${59}, ${140})`],
        "Total viviendas": [`rgb(${70}, ${184}, ${213})`,`rgb(${0}, ${104}, ${129})`],
        "Total hombres":  [`rgb(${85}, ${164}, ${184})`,`rgb(${2}, ${59}, ${140})`],
        "Total mujeres":  [`rgb(${85}, ${164}, ${184})`,`rgb(${2}, ${59}, ${140})`],
        "Densidad poblacional (personas cada km2)": [`rgb(${85}, ${164}, ${184})`,`rgb(${2}, ${59}, ${140})`],
        "Robo":[`rgb(${245}, ${86}, ${80})`,`rgb(${157}, ${32}, ${28})`],
        "Violencia intrafamiliar":[`rgb(${245}, ${86}, ${80})`,`rgb(${157}, ${32}, ${28})`],
        "Violaciones": [`rgb(${245}, ${86}, ${80})`,`rgb(${157}, ${32}, ${28})`],
        "Homicidios": [`rgb(${245}, ${86}, ${80})`,`rgb(${157}, ${32}, ${28})`],
        "Total delitos": [`rgb(${245}, ${86}, ${80})`,`rgb(${157}, ${32}, ${28})`],
        "Superficie de areas verdes (m2)": [`rgb(${34}, ${157}, ${100})`,`rgb(${17}, ${97}, ${60})`],
        "Promedio de ingresos (2020) ($CLP)": [`rgb(${73}, ${169}, ${230})`,`rgb(${1}, ${117}, ${190})`],
        "Porcentaje de población dentro del 40% de menores ingresos (2021)": [`rgb(${73}, ${169}, ${230})`,`rgb(${1}, ${117}, ${190})`],
    };
    var attributeValues = Object.values(comunaJSON[attribute]);
    attributeValues = attributeValues.map(element => parseFloat(element));

    var minValue = Math.min(...attributeValues);
    console.log(minValue)
    var maxValue = Math.max(...attributeValues);
    console.log(maxValue)


    const range = colorRanges[attribute];
    console.log(range);
    
    const colorScale = d3.scaleLinear()
        .domain([minValue, maxValue])
        .range(range)
        .clamp(true);

    return colorScale;
}


