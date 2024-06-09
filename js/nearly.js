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
  
                listItem.addEventListener("click", () => {
                  map.setView([station.latitude, station.longitude], 15);
                  const markerObj = allMarkers.find((m) => m.data.latitude === station.latitude && m.data.longitude === station.longitude);
                  if (markerObj && markerObj.marker) {
                    markerObj.marker.openPopup();
                    showMarkerModal(station, `https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/${station.picture}`);
                  }
                  const nearbyStationsModal = bootstrap.Modal.getInstance(document.getElementById("nearbyStationsModal"));
                  nearbyStationsModal.hide();
                });
  
                nearbyStationsList.appendChild(listItem);
              });
            } else {
              nearbyStationsList.innerHTML = "<li class='list-group-item'>No nearby stations found.</li>";
            }
  
            var nearbyStationsModal = new bootstrap.Modal(document.getElementById("nearbyStationsModal"), {
              keyboard: false,
            });
            nearbyStationsModal.show();
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
  