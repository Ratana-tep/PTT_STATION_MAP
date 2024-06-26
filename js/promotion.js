// Function to show promotion modal
function showPromotionModal(station) {
    var promotionModal = new bootstrap.Modal(document.getElementById('promotionModal'), {
        keyboard: false
    });

    var promotionImagesContainerAll = document.getElementById('promotionImagesContainerAll');
    var promotionTextContainerAll = document.getElementById('promotionTextContainerAll');
    var promotionImagesContainerPromotions = document.getElementById('promotionImagesContainerPromotions');
    var promotionTextContainerPromotions = document.getElementById('promotionTextContainerPromotions');
    var promotionImagesContainerOpenings = document.getElementById('promotionImagesContainerOpenings');
    var promotionTextContainerOpenings = document.getElementById('promotionTextContainerOpenings');

    // Clear previous promotions
    promotionImagesContainerAll.innerHTML = '';
    promotionTextContainerAll.innerHTML = '';
    promotionImagesContainerPromotions.innerHTML = '';
    promotionTextContainerPromotions.innerHTML = '';
    promotionImagesContainerOpenings.innerHTML = '';
    promotionTextContainerOpenings.innerHTML = '';

    if (station.promotion && station.promotion.length > 0 && station.promotion[0] !== "") {
        station.promotion.forEach(promotion => {
            const promotionImageUrl = getPromotionImageUrl(promotion); // Get the promotion image URL

            // Create and append elements for All tab
            createAndAppendPromotionElements(promotion, promotionImageUrl, promotionImagesContainerAll, promotionTextContainerAll);

            // Create and append elements for specific tabs
            if (promotion.toLowerCase().startsWith('promotion') && !promotion.toLowerCase().includes('opening')) {
                createAndAppendPromotionElements(promotion, promotionImageUrl, promotionImagesContainerPromotions, promotionTextContainerPromotions);
            } else if (promotion.toLowerCase().includes('opening')) {
                createAndAppendPromotionElements(promotion, promotionImageUrl, promotionImagesContainerOpenings, promotionTextContainerOpenings);
            }
        });
        promotionModal.show();
    } else {
        alert('No promotion available for this station.');
    }
}

// Helper function to create and append promotion elements
function createAndAppendPromotionElements(promotion, promotionImageUrl, imageContainer, textContainer) {
    const promotionImage = document.createElement('img');
    promotionImage.src = promotionImageUrl; // Update with the correct image URL
    promotionImage.classList.add('img-fluid', 'mb-3'); // Add classes for styling
    imageContainer.appendChild(promotionImage); // Append to container

    const promotionText = document.createElement('p');
    promotionText.innerText = promotion; // Update with the promotion details
    textContainer.appendChild(promotionText); // Append to container
}

// Function to get the promotion image URL based on the item name
function getPromotionImageUrl(item) {
    const itemImages = {
        "promotion1": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening1.jpg",
        "promotion2": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening2.jpg",
        "promotion3": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening3.jpg",
        "promotion4": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening4.jpg",
        "Promotion Opening 1": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening1.jpg",
        "Promotion Opening 2": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening2.jpg",
        "Promotion Opening 3": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening3.jpg",
        "Promotion Opening 5": "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/opening5.jpg",
        // Add other items as needed
    };
    return itemImages[item] || "https://raw.githubusercontent.com/pttpos/map_ptt/main/pictures/default.png"; // Default image if item not found
}

// Function to populate promotions dynamically
function populatePromotions(stations) {
    const promotionButton = document.getElementById('promotionBtn');
    promotionButton.addEventListener('click', function () {
        const stationWithPromotion = stations.find(station => station.promotion && station.promotion.length > 0 && station.promotion[0] !== "");
        if (stationWithPromotion) {
            showPromotionModal(stationWithPromotion);
        } else {
            alert('No promotion available.');
        }
    });
}

// Fetch station data and initialize the map
fetch("https://raw.githubusercontent.com/pttpos/map_ptt/main/data/markers.json")
    .then(response => response.json())
    .then(data => {
        const stations = data.STATION;
        // Initialize the map with stations
        // Example: populateMap(stations);
        populatePromotions(stations);
    })
    .catch(error => console.error('Error loading station data:', error));

// Clear modal content on hide
document.getElementById('promotionModal').addEventListener('hidden.bs.modal', function () {
    document.getElementById('promotionImagesContainerAll').innerHTML = '';
    document.getElementById('promotionTextContainerAll').innerText = '';
    document.getElementById('promotionImagesContainerPromotions').innerHTML = '';
    document.getElementById('promotionTextContainerPromotions').innerText = '';
    document.getElementById('promotionImagesContainerOpenings').innerHTML = '';
    document.getElementById('promotionTextContainerOpenings').innerText = '';
    // Ensure the modal backdrop is properly removed
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
});

// Manually hide the modal on close button click to ensure it closes properly
document.querySelector('#promotionModal .btn-close').addEventListener('click', function () {
    var promotionModal = bootstrap.Modal.getInstance(document.getElementById('promotionModal'));
    promotionModal.hide();
    // Ensure the modal backdrop is properly removed
    document.body.classList.remove('modal-open');
    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
});
