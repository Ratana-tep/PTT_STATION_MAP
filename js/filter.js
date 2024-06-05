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
document.getElementById('filterForm').addEventListener('submit', function(event) {
    event.preventDefault();
    applyFilter();
});
