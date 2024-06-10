// Function to calculate the distance between two points using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }
  
  // Function to find nearby stations
  function findNearbyStations(currentLocation, stations, maxDistance = 10) {
    return stations
      .map((station) => {
        const distance = calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          station.latitude,
          station.longitude
        );
        return { ...station, distance };
      })
      .filter((station) => station.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
// Event listener for nearby stations button
document.getElementById("nearbyStationsBtn").addEventListener("click", function () {
  getCurrentLocation()
    .then((currentLocation) => {
      fetch("https://raw.githubusercontent.com/pttpos/map_ptt/main/data/markers.json")
        .then((response) => response.json())
        .then((data) => {
          const stations = data.STATION;
          const nearbyStations = findNearbyStations(currentLocation, stations);

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

              listItem.innerHTML = `
                <img src="https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/${station.picture}" alt="${station.title}">
                <div class="station-details">
                  <h6>${station.title}</h6>
                  <p>${station.address}</p>
                  ${descriptionsHTML}
                  ${productsHTML}
                  ${otherProductsHTML}
                  ${servicesHTML}
                </div>
              `;

              // Determine the current status of the station
              const currentTime = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Phnom_Penh", hour12: false });
              const [currentHour, currentMinute] = currentTime.split(":").map(Number);

              const openingHour = 5; // 5:00 AM
              const closingHour = 20; // 8:00 PM
              const closingMinute = 30; // 8:30 PM

              // Check if the station is open 24 hours
              const isOpen24h = station.status === "24h";

              // Determine if the station is open
              const isOpen = isOpen24h || (currentHour > openingHour && (currentHour < closingHour || (currentHour === closingHour && currentMinute < closingMinute)));

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
          console.error("Error fetching data:", error);
        });
    })
    .catch((error) => {
      console.error("Error getting current location:", error);
      alert("Error getting your location. Please try again later.");
    });
});