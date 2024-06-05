// Initialize the map
var map = L.map('map').setView([11.55, 104.91], 7);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Initialize marker cluster group
var markers = L.markerClusterGroup();
var allMarkers = []; // Array to hold all markers for filtering

// Fetch data from JSON file
fetch('https://raw.githubusercontent.com/pttpos/map_ptt/main/data/markers.json')
    .then(response => response.json())
    .then(data => {
        var stations = data.STATION;
        populateSelectOptions(stations);

        stations.forEach(station => {
            // Create marker
            var marker = L.marker([station.latitude, station.longitude]);

            // Create image URL
            var imageUrl = `https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/${station.picture}`;

            // Add click event to marker to show modal
            marker.on('click', function () {
                showMarkerModal(station, imageUrl);
            });

            // Add marker to marker cluster group
            markers.addLayer(marker);
            allMarkers.push({ marker: marker, data: station }); // Store marker and its data
        });

        // Add marker cluster group to map
        map.addLayer(markers);

        // Fit map to markers bounds
        map.fitBounds(markers.getBounds());
    })
    .catch(error => console.error('Error fetching data:', error));

// Function to get current location
document.getElementById('myLocationBtn').addEventListener('click', function () {
    // Check if geolocation is available
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;

            // Remove existing marker and circle if they exist
            if (currentLocationMarker) {
                map.removeLayer(currentLocationMarker);
            }
            if (currentLocationCircle) {
                map.removeLayer(currentLocationCircle);
            }

            // Set map view to current position
            map.setView([lat, lng], 15);

            // Add animated circle to represent current location
            var circle = L.circle([lat, lng], {
                color: 'blue',
                fillColor: '#blue',
                fillOpacity: 0.2,
                radius: 1000,
                className: 'pulse-circle'
            }).addTo(map);

            // Create a custom icon
            var customIcon = L.icon({
                iconUrl: './pictures/mylocal.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            // Add marker with custom icon
            var marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

            // Optionally, you can bind a popup to the marker
            marker.bindPopup('You are here.').openPopup();

            // Store the current marker and circle for removal later
            currentLocationMarker = marker;
            currentLocationCircle = circle;
        }, function (error) {
            console.error('Error getting geolocation:', error);
            alert('Error getting your location. Please try again later.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }
});

// Variable to store the current marker and circle
var currentLocationMarker;
var currentLocationCircle;

// Function to show marker data in modal
function showMarkerModal(station, imageUrl) {
    var modalBody = document.getElementById('markerModalBody');
    modalBody.innerHTML = `
        <div class="station-details">
            <img src="${imageUrl}" alt="${station.title}" class="img-fluid mb-3 rounded-image" />
            <div class="text-center">
                <h3 class="station-title mb-3 font-weight-bold">${station.title}</h3>
            </div>
            <div class="info"><i class="fas fa-map-marker-alt icon"></i> ${station.address}</div>
            <div class="separator"></div>
            <div class="d-flex justify-content-center mb-3">
                <div class="badge bg-primary text-white mx-1"><i class="fas fa-clock icon-background"></i> 5 hr. 20 min</div>
                <div class="badge bg-primary text-white mx-1"><i class="fas fa-location-arrow icon-background"></i> 219.6 km</div>
                <div class="badge bg-primary text-white mx-1"><i class="fas fa-arrow-up icon-background"></i> Inbound</div>
            </div>
            <div class="separator"></div>
            <div class="info"><i class="fas fa-clock icon"></i> ${station.status}</div>
            <div class="info"><i class="fas fa-box-open icon"></i> Products: ${station.product.join(', ')}</div>
            <div class="info"><i class="fas fa-tools icon"></i> Services: ${station.service.join(', ')}</div>
            ${station.other_product && station.other_product[0] ? `<div class="info"><i class="fas fa-boxes icon"></i> Other Products: ${station.other_product.join(', ')}</div>` : ''}
            <div class="text-center mt-3">
              <div class="d-flex justify-content-center align-items-center">
              <div class="icon-background mx-2" onclick="shareLocation(${station.latitude}, ${station.longitude})">
              <i class="fas fa-share-alt share-icon"></i>
               </div>
                <button class="btn btn-primary rounded-circle mx-5 go-button" onclick="openGoogleMaps(${station.latitude}, ${station.longitude})">GO</button>
                <div class="icon-background">
                    <i class="fas fa-location-arrow navigate-icon mx-2"></i>
                </div>
              </div>
            </div>
        </div>
    `;

    var markerModal = new bootstrap.Modal(document.getElementById('markerModal'), {
        keyboard: false
    });
    markerModal.show();
}

// Function to open Google Maps with the destination
function openGoogleMaps(lat, lon) {
    var url = "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
    window.open(url, "_self");
}
// Function to share location via Google Maps
function shareLocation(lat, lon) {
    var url = "https://www.google.com/maps?q=" + lat + "," + lon;
    if (navigator.share) {
        navigator.share({
            title: 'Location',
            text: 'Check out this location:',
            url: url
        }).then(() => {
            console.log('Thanks for sharing!');
        }).catch(console.error);
    } else {
        // Fallback for browsers that do not support the Web Share API
        window.open(url, "_blank");
    }
}

// Function to populate select options
function populateSelectOptions(data) {
    var provinces = new Set();
    var descriptions = new Set();
    var services = new Set();
    var products = new Set();
    var otherProducts = new Set();

    data.forEach(station => {
        provinces.add(station.province);
        station.description.forEach(desc => descriptions.add(desc));
        station.service.forEach(serv => services.add(serv));
        station.product.forEach(prod => products.add(prod));
        if (station.other_product) {
            station.other_product.forEach(otherProd => {
                if (otherProd.trim() !== "") {
                    otherProducts.add(otherProd);
                }
            });
        }
    });

    // Populate select elements
    populateSelectElement('province', provinces);
    populateSelectElement('description', descriptions);
    populateSelectElement('service', services);
    populateSelectElement('product', products);
    populateSelectElement('otherProduct', otherProducts);
}

// Helper function to populate a select element
function populateSelectElement(elementId, values) {
    var selectElement = document.getElementById(elementId);
    values.forEach(value => {
        if (value.trim() !== "") {
            var option = document.createElement('option');
            option.value = value;
            option.text = value;
            selectElement.add(option);
        }
    });
}

// Filter function
function applyFilter() {
    var province = document.getElementById('province').value.toLowerCase();
    var description = document.getElementById('description').value.toLowerCase();
    var service = document.getElementById('service').value.toLowerCase();
    var product = document.getElementById('product').value.toLowerCase();
    var otherProduct = document.getElementById('otherProduct').value.toLowerCase();

    markers.clearLayers(); // Clear existing markers

    allMarkers.forEach(entry => {
        var match = true;

        if (province && entry.data.province.toLowerCase().indexOf(province) === -1) {
            match = false;
        }
        if (description && !entry.data.description.some(desc => desc.toLowerCase().indexOf(description) !== -1)) {
            match = false;
        }
        if (service && !entry.data.service.some(serv => serv.toLowerCase().indexOf(service) !== -1)) {
            match = false;
        }
        if (product && !entry.data.product.some(prod => prod.toLowerCase().indexOf(product) !== -1)) {
            match = false;
        }
        if (otherProduct && (!entry.data.other_product || !entry.data.other_product.some(otherProd => otherProd.toLowerCase().indexOf(otherProduct) !== -1))) {
            match = false;
        }

        if (match) {
            markers.addLayer(entry.marker);
        }
    });

    map.addLayer(markers);
    map.fitBounds(markers.getBounds());

    // Hide the modal
    var filterModalElement = document.getElementById('filterModal');
    var filterModal = bootstrap.Modal.getInstance(filterModalElement);
    filterModal.hide();
}

// Add event listener to form submit
document.getElementById('filterForm').addEventListener('submit', function (event) {
    event.preventDefault();
    applyFilter();
});
