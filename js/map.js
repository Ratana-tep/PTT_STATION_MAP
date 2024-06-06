// Initialize the map
var map = L.map("map").setView([11.55, 104.91], 7);

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Initialize marker cluster group
var markers = L.markerClusterGroup();
var allMarkers = []; // Array to hold all markers for filtering

// Fetch data from JSON file
fetch("https://raw.githubusercontent.com/pttpos/map_ptt/main/data/markers.json")
  .then((response) => response.json())
  .then((data) => {
    var stations = data.STATION;
    populateSelectOptions(stations);

    stations.forEach((station) => {
      // Get the custom icon URL based on the station status
      var iconUrl = getIconUrl(station.status);

      // Create custom icon for the marker
      var customIcon = L.icon({
        iconUrl: iconUrl, // Use the path returned by getIconUrl
        iconSize: [41, 62], // Adjust the size to fit your needs
        iconAnchor: [24, 75],
        popupAnchor: [1, -1000],
      });

      // Create marker with custom icon
      var marker = L.marker([station.latitude, station.longitude], {
        icon: customIcon,
      });

      // Create image URL
      var imageUrl = `https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/${station.picture}`;

      // Add click event to marker to show modal
      marker.on("click", function () {
        showMarkerModal(station, imageUrl); // Show modal first
        getCurrentLocation()
          .then((currentLocation) => {
            getBingRoute(
              currentLocation.lat,
              currentLocation.lng,
              station.latitude,
              station.longitude
            )
              .then((result) => {
                const { distance, travelTime } = result;
                updateModalWithRoute(distance, travelTime, station.status);
              })
              .catch((error) => {
                console.error("Error getting route from Bing Maps:", error);
                updateModalWithRoute("N/A", "N/A", station.status); // Use placeholders if there's an error
              });
          })
          .catch((error) => {
            console.error("Error getting current location:", error);
            updateModalWithRoute("N/A", "N/A", station.status); // Use placeholders if location is unavailable
          });
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
  .catch((error) => console.error("Error fetching data:", error));

// Function to get current location
document.getElementById("myLocationBtn").addEventListener("click", function () {
  getCurrentLocation()
    .then((currentLocation) => {
      const { lat, lng } = currentLocation;

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
        color: "blue",
        fillColor: "blue",
        fillOpacity: 0.2,
        radius: 1000,
        className: "pulse-circle",
      }).addTo(map);

      // Create a custom icon
      var customIcon = L.icon({
        iconUrl: "./pictures/mylocal.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      // Add marker with custom icon
      var marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      // Optionally, you can bind a popup to the marker
      marker.bindPopup("You are here.").openPopup();

      // Store the current marker and circle for removal later
      currentLocationMarker = marker;
      currentLocationCircle = circle;
    })
    .catch((error) => {
      console.error("Error getting geolocation:", error);
      alert("Error getting your location. Please try again later.");
    });
});

// Variable to store the current marker and circle
var currentLocationMarker;
var currentLocationCircle;

// Helper function to get the icon URL based on the station status
function getIconUrl(status) {
    if (status.toLowerCase() === "under construct") {
        return './pictures/under_construction.png'; // Path to the under construction icon
    } else if (status.toLowerCase() === "24h") {
        return './pictures/61.png'; // Path to the 24h icon
    } else if (status.match(/^\d{1,2}h$/)) {
        return './pictures/time_close1.png'; // Assuming 16h icon or replace with a specific hour icon if needed
    } else {
        return './pictures/default.png'; // Default icon for unknown statuses
    }
}

// Function to get the current location
function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        function (error) {
          reject(error);
        },
        {
          enableHighAccuracy: true, // Request high accuracy
          timeout: 5000, // Set timeout to 5 seconds
          maximumAge: 0, // Do not use cached location
        }
      );
    } else {
      reject(new Error("Geolocation is not supported by your browser."));
    }
  });
}

// Function to get route information from Bing Maps API
function getBingRoute(startLat, startLng, endLat, endLng) {
  const bingMapsKey =
    "AhQxc3Nm4Sfv53x7JRXUoj76QZnlm7VWkT5qAigmHQo8gjeYFthvGgEqVcjO5c7C"; // Replace with your Bing Maps API Key
  const url = `https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=${startLat},${startLng}&wp.1=${endLat},${endLng}&optmz=timeWithTraffic&key=${bingMapsKey}`;

  return fetch(url)
    .then((response) => response.json())
    .then((data) => {
      console.log("Bing Maps API response:", data); // Log response for debugging
      if (data.resourceSets[0].resources.length > 0) {
        const route = data.resourceSets[0].resources[0];
        const distance = route.travelDistance; // in kilometers
        const travelTime = route.travelDurationTraffic / 60; // in minutes
        return {
          distance: distance.toFixed(1) + " km",
          travelTime:
            Math.floor(travelTime / 60) +
            " hr. " +
            Math.round(travelTime % 60) +
            " min",
        };
      } else {
        throw new Error("No route found");
      }
    })
    .catch((error) => {
      console.error("Error getting route from Bing Maps:", error);
      throw error;
    });
}

// Function to show marker data in modal
function showMarkerModal(station, imageUrl) {
  var modalBody = document.getElementById("markerModalBody");
  modalBody.innerHTML = `
        <div class="station-details">
            <img src="${imageUrl}" alt="${station.title}" class="img-fluid mb-3 rounded-image" />
            <div class="text-center">
                <h3 class="station-title mb-3 font-weight-bold">${station.title}</h3>
            </div>
             <div class="info"><i class="fas fa-map-marker-alt icon"></i> ${station.address}</div>
            <div class="separator"></div>
            <div id="route-info" class="d-flex justify-content-center mb-3"></div> 
            <div class="separator"></div>
            <div class="nav-tabs-container">
                <ul class="nav nav-tabs flex-nowrap" id="myTab" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="products-tab" data-bs-toggle="tab" data-bs-target="#products" type="button" role="tab" aria-controls="products" aria-selected="true">Products</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="payment-tab" data-bs-toggle="tab" data-bs-target="#payment" type="button" role="tab" aria-controls="payment" aria-selected="false">Payment</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="services-tab" data-bs-toggle="tab" data-bs-target="#services" type="button" role="tab" aria-controls="services" aria-selected="false">Services</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="promotion-tab" data-bs-toggle="tab" data-bs-target="#promotion" type="button" role="tab" aria-controls="promotion" aria-selected="false">Promotion</button>
                    </li>
                </ul>
            </div>
            
            <!-- Tab panes with smooth animation -->
            <div class="tab-content mt-3">
                <div class="tab-pane fade show active" id="products" role="tabpanel" aria-labelledby="products-tab">
                    <div class="scrollable-content">
                        <div class="info"><i class="fas fa-box-open icon"></i> ${station.product.join(", ")}</div>
                        ${station.other_product && station.other_product[0] ? `<div class="info"><i class="fas fa-boxes icon"></i> Other Products: ${station.other_product.join(", ")}</div>` : ""}
                    </div>
                </div>
                <div class="tab-pane fade" id="payment" role="tabpanel" aria-labelledby="payment-tab">
                    <div class="scrollable-content">
                        <div class="info"><i class="fas fa-tools icon"></i> ${station.service.join(", ")}</div>
                    </div>
                </div>
                <div class="tab-pane fade" id="services" role="tabpanel" aria-labelledby="services-tab">
                    <div class="scrollable-content">
                        ${station.description && station.description[0] ? `<div class="info"><i class="fas fa-boxes icon"></i> Services: ${station.description.join(", ")}</div>` : ""}
                    </div>
                </div>
                <div class="tab-pane fade" id="promotion" role="tabpanel" aria-labelledby="promotion-tab">
                    <div class="scrollable-content">
                        ${station.promotion && station.promotion[0] ? `<div class="info"><i class="fas fa-boxes icon"></i> Promotion: ${station.promotion.join(", ")}</div>` : ""}
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-3">
              <div class="d-flex justify-content-center align-items-center">
                <div class="icon-background mx-2" onclick="shareLocation(${station.latitude}, ${station.longitude})">
                    <i class="fas fa-share-alt share-icon"></i>
                </div>
                <button class="btn btn-primary rounded-circle mx-5 go-button pulse" onclick="openGoogleMaps(${station.latitude}, ${station.longitude})">GO</button>
                <div class="icon-background">
                    <i class="fas fa-location-arrow navigate-icon mx-2"></i>
                </div>
              </div>
            </div>
        </div>
    `;

  var markerModal = new bootstrap.Modal(document.getElementById("markerModal"), {
    keyboard: false,
  });
  markerModal.show();

  // Initialize Bootstrap tabs correctly
  var triggerTabList = [].slice.call(document.querySelectorAll('#myTab button'));
  triggerTabList.forEach(function (triggerEl) {
    var tabTrigger = new bootstrap.Tab(triggerEl);
    triggerEl.addEventListener('click', function (event) {
      event.preventDefault();
      tabTrigger.show();
    });
  });
}

// Function to update modal with route information
function updateModalWithRoute(distance, travelTime, status) {
    var routeInfo = document.getElementById("route-info");
    const statusInfo = getStatusInfo(status); // Determine the icon and badge class based on status
    
    routeInfo.innerHTML = `
          <div class="badge bg-primary text-white mx-1">
              <i class="fas fa-clock icon-background"></i> ${travelTime}
          </div>
          <div class="badge bg-primary text-white mx-1">
              <i class="fas fa-location-arrow icon-background"></i> ${distance}
          </div>
          <div class="badge ${statusInfo.badgeClass} text-white mx-1">
              <i class="fas ${statusInfo.iconClass} icon-background"></i> ${statusInfo.displayText}
          </div>
      `;
  }

// Helper function to determine the icon, badge class, and display text based on status and current time
function getStatusInfo(status) {
    const currentTime = new Date(); // Current time in local timezone
    const cambodiaOffset = 7 * 60 * 60 * 1000; // Cambodia is UTC+7
    const cambodiaTime = new Date(currentTime.getTime() + currentTime.getTimezoneOffset() * 60000 + cambodiaOffset);
    const currentHour = cambodiaTime.getHours();
    const currentMinutes = cambodiaTime.getMinutes();

    // Parse the status to extract the closing hour and minutes if present
    const statusParts = status.match(/^(\d{1,2})(?:h(\d{1,2})?)?$/); // Match hours optionally followed by minutes

    if (status.toLowerCase() === "under construct") {
        return {
            iconClass: "fa-tools",
            badgeClass: "bg-warning text-white blink-border",
            displayText: "Under Construction"
        };
    } else if (status.toLowerCase() === "24h") {
        return {
            iconClass: "fa-gas-pump",
            badgeClass: "bg-success text-white",
            displayText: "Open 24h"
        };
    } else if (statusParts) {
        const closingHour = parseInt(statusParts[1], 10); // Closing hour from status
        const closingMinutes = statusParts[2] ? parseInt(statusParts[2], 10) : 0; // Closing minutes from status or default to 0

        // Determine if the station is closed or open
        if (currentHour > closingHour || (currentHour === closingHour && currentMinutes >= closingMinutes)) {
            return {
                iconClass: "fa-times-circle",
                badgeClass: "bg-danger text-white",
                displayText: "Closed"
            };
        } else {
            return {
                iconClass: "fa-gas-pump",
                badgeClass: "bg-success text-white",
                displayText: `Open until ${status}`
            };
        }
    } else {
        return {
            iconClass: "fa-question-circle",
            badgeClass: "bg-secondary text-white",
            displayText: "Unknown Status"
        };
    }
}


// Function to open Google Maps with the destination
function openGoogleMaps(lat, lon) {
  var url =
    "https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lon;
  window.open(url, "_self");
}

// Function to share location via Google Maps
function shareLocation(lat, lon) {
  var url = "https://www.google.com/maps?q=" + lat + "," + lon;
  if (navigator.share) {
    navigator
      .share({
        title: "Location",
        text: "Check out this location:",
        url: url,
      })
      .then(() => {
        console.log("Thanks for sharing!");
      })
      .catch(console.error);
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

  data.forEach((station) => {
    provinces.add(station.province);
    station.description.forEach((desc) => descriptions.add(desc));
    station.service.forEach((serv) => services.add(serv));
    station.product.forEach((prod) => products.add(prod));
    if (station.other_product) {
      station.other_product.forEach((otherProd) => {
        if (otherProd.trim() !== "") {
          otherProducts.add(otherProd);
        }
      });
    }
  });

  // Populate select elements
  populateSelectElement("province", provinces);
  populateSelectElement("description", descriptions);
  populateSelectElement("service", services);
  populateSelectElement("product", products);
  populateSelectElement("otherProduct", otherProducts);
}

// Helper function to populate a select element
function populateSelectElement(elementId, values) {
  var selectElement = document.getElementById(elementId);
  values.forEach((value) => {
    if (value.trim() !== "") {
      var option = document.createElement("option");
      option.value = value;
      option.text = value;
      selectElement.add(option);
    }
  });
}

// Filter function
function applyFilter() {
  var province = document.getElementById("province").value.toLowerCase();
  var description = document.getElementById("description").value.toLowerCase();
  var service = document.getElementById("service").value.toLowerCase();
  var product = document.getElementById("product").value.toLowerCase();
  var otherProduct = document
    .getElementById("otherProduct")
    .value.toLowerCase();

  markers.clearLayers(); // Clear existing markers

  allMarkers.forEach((entry) => {
    var match = true;

    if (
      province &&
      entry.data.province.toLowerCase().indexOf(province) === -1
    ) {
      match = false;
    }
    if (
      description &&
      !entry.data.description.some(
        (desc) => desc.toLowerCase().indexOf(description) !== -1
      )
    ) {
      match = false;
    }
    if (
      service &&
      !entry.data.service.some(
        (serv) => serv.toLowerCase().indexOf(service) !== -1
      )
    ) {
      match = false;
    }
    if (
      product &&
      !entry.data.product.some(
        (prod) => prod.toLowerCase().indexOf(product) !== -1
      )
    ) {
      match = false;
    }
    if (
      otherProduct &&
      (!entry.data.other_product ||
        !entry.data.other_product.some(
          (otherProd) => otherProd.toLowerCase().indexOf(otherProduct) !== -1
        ))
    ) {
      match = false;
    }

    if (match) {
      markers.addLayer(entry.marker);
    }
  });

  map.addLayer(markers);
  map.fitBounds(markers.getBounds());

  // Hide the modal
  var filterModalElement = document.getElementById("filterModal");
  var filterModal = bootstrap.Modal.getInstance(filterModalElement);
  filterModal.hide();
}

// Add event listener to form submit
document
  .getElementById("filterForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    applyFilter();
  });
