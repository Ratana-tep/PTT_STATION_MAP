// Function to get route information from Bing Maps API
function getBingRoute(startLat, startLng, endLat, endLng) {
    const bingMapsKey = "AhQxc3Nm4Sfv53x7JRXUoj76QZnlm7VWkT5qAigmHQo8gjeYFthvGgEqVcjO5c7C"; // Replace with your Bing Maps API Key
    const url = `https://dev.virtualearth.net/REST/V1/Routes/Driving?wp.0=${startLat},${startLng}&wp.1=${endLat},${endLng}&optmz=timeWithTraffic&key=${bingMapsKey}`;
  
    return fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.resourceSets[0].resources.length > 0) {
          const route = data.resourceSets[0].resources[0];
          const distance = route.travelDistance; // in kilometers
          const travelTime = route.travelDurationTraffic / 60; // in minutes
          return {
            distance: distance.toFixed(2) + " km",
            travelTime: Math.floor(travelTime / 60) + " hr. " + Math.round(travelTime % 60) + " min",
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
  
  // Function to get status information
  function getStatusInfo(status) {
    const cambodiaTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Phnom_Penh" }));
    const currentHour = cambodiaTime.getHours();
    const currentMinutes = cambodiaTime.getMinutes();
  
    if (status.toLowerCase() === "under construct") {
      return {
        iconClass: "fa-tools",
        badgeClass: "bg-warning text-white blink-border",
        displayText: "Under Construction",
      };
    } else if (status.toLowerCase() === "24h") {
      return {
        iconClass: "fa-gas-pump",
        badgeClass: "bg-success text-white",
        displayText: "Open 24h",
      };
    } else {
      const openingHour = 5; // Opening hour is 5 AM
      const closingHour = 20; // Closing hour is 8 PM
      const closingMinutes = 30; // Closing minutes is 8:30 PM
  
      if (
        currentHour < openingHour || // Before 5 AM
        currentHour > closingHour || // After 8 PM
        (currentHour === closingHour && currentMinutes >= closingMinutes) || // After 8:30 PM
        (currentHour >= 0 && currentHour < 5) // After midnight and before 5 AM
      ) {
        return {
          iconClass: "fa-times-circle",
          badgeClass: "bg-danger text-white",
          displayText: "Closed",
        };
      } else {
        return {
          iconClass: "fa-gas-pump",
          badgeClass: "bg-success text-white",
          displayText: `Open until 8:30 PM`,
        };
      }
    }
  }
  
  // Function to find nearby stations using Bing Maps API
  function findNearbyStations(currentLocation, stations, maxDistance = 10) {
    const promises = stations.map((station) => {
      return getBingRoute(currentLocation.lat, currentLocation.lng, station.latitude, station.longitude)
        .then((routeInfo) => {
          return { ...station, distance: parseFloat(routeInfo.distance), travelTime: routeInfo.travelTime };
        });
    });
  
    return Promise.all(promises)
      .then((stationsWithDistance) => {
        return stationsWithDistance.filter((station) => station.distance <= maxDistance)
          .sort((a, b) => a.distance - b.distance);
      });
  }
  
  // Event listener for nearby stations button
  document.getElementById("nearbyStationsBtn").addEventListener("click", function () {
    getCurrentLocation()
      .then((currentLocation) => {
        fetch("https://raw.githubusercontent.com/pttpos/map_ptt/main/data/markers.json")
          .then((response) => response.json())
          .then((data) => {
            const stations = data.STATION;
            findNearbyStations(currentLocation, stations)
              .then((nearbyStations) => {
                const nearbyStationsList = document.getElementById("nearbyStationsList");
                nearbyStationsList.innerHTML = ""; // Clear the list
  
                if (nearbyStations.length > 0) {
                  nearbyStations.forEach((station) => {
                    const listItem = document.createElement("li");
                    listItem.classList.add("list-group-item");
  
                    let descriptionsHTML = '';
                    if (station.description && station.description.filter(desc => desc).length) {
                      descriptionsHTML = `
                        <div class="icons">
                          ${station.description.filter(desc => desc).map(desc => `<img src="${getItemIcon(desc)}" alt="${desc}">`).join('')}
                        </div>`;
                    }
  
                    let productsHTML = '';
                    if (station.product && station.product.filter(product => product).length) {
                      productsHTML = `
                        <div class="icons">
                          ${station.product.filter(product => product).map(product => `<img src="${getProductIcon(product)}" alt="${product}">`).join('')}
                        </div>`;
                    }
  
                    let otherProductsHTML = '';
                    if (station.other_product && station.other_product.filter(otherProduct => otherProduct).length) {
                      otherProductsHTML = `
                        <div class="icons">
                          ${station.other_product.filter(otherProduct => otherProduct).map(otherProduct => `<img src="${getProductIcon(otherProduct)}" alt="${otherProduct}">`).join('')}
                        </div>`;
                    }
  
                    let servicesHTML = '';
                    if (station.service && station.service.filter(service => service).length) {
                      servicesHTML = `
                        <div class="icons">
                          ${station.service.filter(service => service).map(service => `<img src="${getItemIcon(service)}" alt="${service}">`).join('')}
                        </div>`;
                    }
  
                    // Get status information
                    const statusInfo = getStatusInfo(station.status);
                    listItem.innerHTML = `
                    <div class="d-flex align-items-start">
                      <div>
                        <img src="https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/${station.picture}" alt="${station.title}" class="img-thumbnail me-3" style="width: 100px; height: 100px; object-fit: cover;">
                        <div class="d-flex flex-column align-items-start gap-1 mt-2">
                          <div class="badge ${statusInfo.badgeClass} text-white small">
                            <i class="fas ${statusInfo.iconClass} me-1"></i> ${statusInfo.displayText}
                          </div>
                          <div class="badge bg-primary text-white small">
                            <i class="fas fa-location-arrow me-1"></i>${station.distance} km
                          </div>
                          <div class="badge bg-secondary text-white small">
                            <i class="fas fa-clock me-1"></i>${station.travelTime}
                          </div>
                        </div>
                      </div>
                      <div class="flex-grow-1">
                        <div class="station-details">
                          <h6>${station.title}</h6>
                          <p class="mb-1">${station.address}</p>
                          ${descriptionsHTML}
                          ${productsHTML}
                          ${otherProductsHTML}
                          ${servicesHTML}
                        </div>
                      </div>
                    </div>
                  `;
                    // Determine the current status of the station
                    const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Phnom_Penh", hour12: false });
                    const [currentHour, currentMinute] = currentTime.split(":").map(Number);
  
                    const openingHour = 5; // 5:00 AM
                    const closingHour = 20; // 8:00 PM
                    const closingMinute = 30; // 8:30 PM
  
                    // Log the current time and the hours
                    console.log(`Current Time: ${currentTime}`);
                    console.log(`Current Hour: ${currentHour}, Current Minute: ${currentMinute}`);
                    console.log(`Station ${station.title}: Status - ${station.status}`);
                    console.log(`Opening Hour: ${openingHour}:00, Closing Hour: ${closingHour}:${closingMinute}`);
  
                    // Check if the station is open 24 hours
                    const isOpen24h = station.status === "24h";
  
                    // Determine if the station is open
                    const isOpen = isOpen24h || (currentHour > openingHour && (currentHour < closingHour || (currentHour === closingHour && currentMinute < closingMinute)));
  
                    console.log(`Is Open: ${isOpen}`);
  
                    if (isOpen) {
                      listItem.classList.add("open-station");
                    } else {
                      listItem.classList.add("closed-station");
                    }
  
                    listItem.addEventListener("click", () => {
                      map.setView([parseFloat(station.latitude), parseFloat(station.longitude)], 15);
                      const markerData = allMarkers.find((m) => parseFloat(m.data.latitude) === parseFloat(station.latitude) && parseFloat(m.data.longitude) === parseFloat(station.longitude));
                      if (markerData) {
                        markerData.marker.openPopup(); // Open the marker popup
                        showMarkerModal(station, `https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/${station.picture}`); // Show the marker modal
                        // Get route information and update modal
                        getCurrentLocation()
                          .then((currentLocation) => {
                            getBingRoute(currentLocation.lat, currentLocation.lng, station.latitude, station.longitude)
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
                      } else {
                        console.error("Marker not found for station:", station);
                      }
                      const nearbyStationsOffcanvas = bootstrap.Offcanvas.getInstance(document.getElementById("nearbyStationsOffcanvas"));
                      nearbyStationsOffcanvas.hide();
                    });
  
                    nearbyStationsList.appendChild(listItem);
                  });
                } else {
                  nearbyStationsList.innerHTML = "<li class='list-group-item'>No nearby stations found.</li>";
                }
  
                var nearbyStationsOffcanvas = new bootstrap.Offcanvas(document.getElementById("nearbyStationsOffcanvas"));
                nearbyStationsOffcanvas.show();
              })
              .catch((error) => {
                console.error("Error finding nearby stations:", error);
              });
          })
          .catch((error) => {
            console.error("Error fetching data:", error);
          });
      })
      .catch((error) => {
        console.error("Error getting current location:", error);
        alert("Error getting your location. Please try again later.");
      });
  });
  
  // Function to get current location
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
  
  // Function to get the image URL based on the product name
  function getProductIcon(product) {
    const productImages = {
      "ULR 91": "./pictures/ULR91.png", // Path to the URL 91 image
      "ULG 95": "./pictures/ULG95.png", // Path to the ULG 95 image
      HSD: "./pictures/HSD.png", // Path to the HSD image
      EV: "./pictures/ev.png", // Path to the EV image
      Onion: "./pictures/onion.png", // Path to the Onion image
    };
    return productImages[product] || "./pictures/default.png"; // Default image if product not found
  }
  
  // Function to get the image URL based on the item name
  function getItemIcon(item) {
    const itemImages = {
      "Fleet card": "./pictures/fleet.png", // Path to the Fleet card image
      "KHQR": "./pictures/KHQR.png", // Path to the KHQR image
      "Cash": "./pictures/cash.png", // Path to the Cash image
      "Amazon": "./pictures/amazon.png", // Path to the Amazon image
      "7-Eleven": "./pictures/7eleven.png", // Path to the 7-Eleven image
      // Add other items as needed
    };
    return itemImages[item] || "./pictures/default.png"; // Default image if item not found
  }
  