
const api_uri = 'https://recipes-flask-backend.onrender.com';




async function addNewItem() {
  const selectedItem = document.querySelector('input[name="item_name"]:checked');
  const quantityType = document.querySelector('input[name="quantityType"]:checked')?.value;
  const brand = document.getElementById("brand").value.trim() || "No Brand";
  const scaleValue = getScaleValue(quantityType);
  const addItemError = document.getElementById("addItemError");

  addItemError.innerText = "";

  if (!scaleValue || scaleValue.trim() === "" || scaleValue === "0 items") {
    addItemError.innerText = "Please enter a valid quantity.";
    return;
  }
  if (!selectedItem) {
    addItemError.innerText = "Please select an item.";
    return;
  }

  const itemData = {
    item_name: selectedItem.value,
    brand: brand,
    quantity: scaleValue
  };

  console.log("Sending data to /fridge/add:", itemData);

  try {
    const response = await fetch(`${api_uri}/fridge/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemData),
      credentials: 'include' 
    });

    if (response.ok) {
      const addedItem = await response.json();
      addItemError.innerText = "";
      $('#addModal').modal('hide');
      fetchFridgeItems();
      
      showMessage("Item added successfully!", "alert-success");
      
      clearAddItemForm();
    } else {
      const errorData = await response.json();
      addItemError.innerText = "Error: " + (errorData.error || "Unknown error");
    }
  } catch (error) {
    console.error("Error adding item:", error);
    addItemError.innerText = "An unexpected error occurred.";
  }
}


  
async function fetchFridgeItems() {
  try {
    const response = await fetch(`${api_uri}/fridge`, {
      method: 'GET',
      credentials: 'include' 
    });
    if (!response.ok) throw new Error("Failed to fetch fridge items");
    const data = await response.json();

    const resultsContainer = document.getElementById("fridgeItems");
    const emptyMessage = document.getElementById("emptyMessage");
    resultsContainer.innerHTML = "";

    if (data.length === 0) {
      emptyMessage.style.display = "block";
    } else {
      emptyMessage.style.display = "none";
      let itemsHTML = "";
      data.forEach(item => {
        itemsHTML += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <span>
              <strong>${escapeHtml(item.item_name)}</strong>
              - Brand: ${escapeHtml(item.brand)}
              - Added: ${escapeHtml(item.date_added)}
              - Quantity: ${escapeHtml(item.quantity)}
            </span>
            <div>
              <button class="btn btn-sm btn-warning" onclick="openEditModal(${item.id}, '${escapeAttribute(item.quantity)}')">Edit</button>
              <button class="btn btn-sm btn-danger" onclick="deleteItem(${item.id})">Delete</button>
            </div>
          </li>
        `;
      });
      resultsContainer.innerHTML = itemsHTML;
    }
  } catch (error) {
    console.error("Error fetching fridge items:", error);
    showMessage("Failed to load fridge items.", "alert-danger");
  }
}



function showMessage(message, className) {
  const messageDiv = document.getElementById("messageBox");
  messageDiv.innerHTML = `
    <div class="alert ${className} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="close" data-dismiss="alert" aria-label="Close">
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
  `;
  setTimeout(() => {
    messageDiv.innerHTML = "";
  }, 3000);
}



function clearAddItemForm() {
  const addItemForm = document.getElementById("addItemForm");
  addItemForm.reset();

  document.getElementById("searchResults").innerHTML = "";
  document.getElementById("searchInput").value = "";
  document.getElementById("brand").value = "";
  document.getElementById("number").value = "";
  document.getElementById("sizeInch").value = "";
  document.getElementById("sizeCm").value = "";
  document.getElementById("weightKg").value = "";
  document.getElementById("weightLb").value = "";
  document.getElementById("liquidGallon").value = "";
  document.getElementById("liquidLiter").value = "";

  document.getElementById("numberInputs").style.display = "none";
  document.getElementById("sizeInputs").style.display = "none";
  document.getElementById("weightInputs").style.display = "none";
  document.getElementById("liquidInputs").style.display = "none";

  const quantityRadios = document.querySelectorAll('input[name="quantityType"]');
  quantityRadios.forEach(radio => radio.checked = false);

  const selectedItems = document.querySelectorAll('input[name="item_name"]');
  selectedItems.forEach(item => item.checked = false);
}



function getScaleValue(type) {
  let value;
  if (type === "number") {
    value = document.getElementById("number").value.trim();
    return value || "0 items";
  }
  if (type === "size") {
    const inch = document.getElementById("sizeInch").value.trim();
    const cm = document.getElementById("sizeCm").value.trim();
    value = inch ? `${inch} inches` : (cm ? `${cm} cm` : "");
    return value || null;
  }
  if (type === "weight") {
    const kg = document.getElementById("weightKg").value.trim();
    const lb = document.getElementById("weightLb").value.trim();
    value = kg ? `${kg} kg` : (lb ? `${lb} lbs` : "");
    return value || null;
  }
  if (type === "liquid") {
    const gallon = document.getElementById("liquidGallon").value.trim();
    const liter = document.getElementById("liquidLiter").value.trim();
    value = gallon ? `${gallon} gallons` : (liter ? `${liter} liters` : "");
    return value || null;
  }
  return null;
}

  

function searchItemsFridge() {
  const query = document.getElementById("searchInput").value.trim();
  const resultsDiv = document.getElementById("searchResults");
  const dynamicBox = document.getElementById("dynamicBox");

  if (query.length === 0) {
    resultsDiv.innerHTML = "<p>Please type something to search...</p>";
    dynamicBox.classList.remove("expanded-box");
    dynamicBox.classList.add("collapsed-box");
    return;
  }

  fetch(`${api_uri}/fridge/search_items_fridge?q=${encodeURIComponent(query)}`, {
    method: 'GET',
    credentials: 'include'
  })
    .then(response => {
      if (!response.ok) throw new Error("Failed to fetch search results");
      return response.json();
    })
    .then(data => {
      resultsDiv.innerHTML = "";

      if (Object.keys(data).length === 0) {
        resultsDiv.innerHTML = `<p>No results found for "<strong>${escapeHtml(query)}</strong>".</p>`;
        dynamicBox.classList.remove("expanded-box");
        dynamicBox.classList.add("collapsed-box");
        return;
      }

      let checkboxesHTML = `<h5>${escapeHtml(query.charAt(0).toUpperCase() + query.slice(1))}</h5>`;
      for (const [item, types] of Object.entries(data)) {
        if (types.length > 0) {
          types.forEach(type => {
            const labelText = type ? `${escapeHtml(item)} (${escapeHtml(type)})` : escapeHtml(item);
            checkboxesHTML += `
              <div class="form-check">
                <input type="checkbox" class="form-check-input" name="item_name" value="${escapeAttribute(labelText)}">
                <label class="form-check-label">${labelText}</label>
              </div>`;
          });
        } else {
          checkboxesHTML += `
            <div class="form-check">
              <input type="checkbox" class="form-check-input" name="item_name" value="${escapeAttribute(item)}">
              <label class="form-check-label">${escapeHtml(item)}</label>
            </div>`;
        }
      }

      resultsDiv.innerHTML = checkboxesHTML;

      dynamicBox.style.transition = "all 1s ease";
      dynamicBox.classList.add("expanded-box");
      dynamicBox.classList.remove("collapsed-box");
    })
    .catch(error => {
      console.error("Error fetching search results:", error);
      resultsDiv.innerHTML = `<p class="text-danger">An error occurred while fetching results.</p>`;
    });
}



window.convertSizeFridge = function() {
  const sizeInch = parseFloat(document.getElementById("sizeInch").value) || 0;
  const sizeCm = parseFloat(document.getElementById("sizeCm").value) || 0;

  if (sizeInch > 0) {
    const resultCm = (sizeInch * 2.54).toFixed(2);
    document.getElementById("inchOutput").innerText = `${sizeInch} inches = ${resultCm} cm`;
    document.getElementById("cmOutput").innerText = "";
  } else if (sizeCm > 0) {
    const resultInch = (sizeCm / 2.54).toFixed(2);
    document.getElementById("cmOutput").innerText = `${sizeCm} cm = ${resultInch} inches`;
    document.getElementById("inchOutput").innerText = "";
  } else {
    document.getElementById("inchOutput").innerText = "";
    document.getElementById("cmOutput").innerText = "";
  }
}

window.convertWeight = function() {
  const weightKg = parseFloat(document.getElementById("weightKg").value) || 0;
  const weightLb = parseFloat(document.getElementById("weightLb").value) || 0;

  if (weightKg > 0) {
    const resultLb = (weightKg * 2.20462).toFixed(2);
    document.getElementById("kgOutput").innerText = `${weightKg} kg = ${resultLb} lbs`;
    document.getElementById("lbOutput").innerText = "";
  } else if (weightLb > 0) {
    const resultKg = (weightLb / 2.20462).toFixed(2);
    document.getElementById("lbOutput").innerText = `${weightLb} lbs = ${resultKg} kg`;
    document.getElementById("kgOutput").innerText = "";
  } else {
    document.getElementById("kgOutput").innerText = "";
    document.getElementById("lbOutput").innerText = "";
  }
}

window.convertLiquid = function() {
  const liquidGallon = parseFloat(document.getElementById("liquidGallon").value) || 0;
  const liquidLiter = parseFloat(document.getElementById("liquidLiter").value) || 0;

  if (liquidGallon > 0) {
    const resultLiter = (liquidGallon * 3.78541).toFixed(2);
    document.getElementById("gallonOutput").innerText = `${liquidGallon} gallons = ${resultLiter} liters`;
    document.getElementById("literOutput").innerText = "";
  } else if (liquidLiter > 0) {
    const resultGallon = (liquidLiter / 3.78541).toFixed(2);
    document.getElementById("literOutput").innerText = `${liquidLiter} liters = ${resultGallon} gallons`;
    document.getElementById("gallonOutput").innerText = "";
  } else {
    document.getElementById("gallonOutput").innerText = "";
    document.getElementById("literOutput").innerText = "";
  }
}

  

window.toggleInputsFridge = function(type) {
  document.getElementById("numberInputs").style.display = "none";
  document.getElementById("sizeInputs").style.display = "none";
  document.getElementById("weightInputs").style.display = "none";
  document.getElementById("liquidInputs").style.display = "none";

  if (type === "number") document.getElementById("numberInputs").style.display = "block";
  if (type === "size") document.getElementById("sizeInputs").style.display = "block";
  if (type === "weight") document.getElementById("weightInputs").style.display = "block";
  if (type === "liquid") document.getElementById("liquidInputs").style.display = "block";
}


  // 9) EDIT AN EXISTING FRIDGE ITEM
window.openEditModal = function(itemId, currentQuantity) {
  const modalHtml = `
    <div class="modal fade" id="editModal" tabindex="-1" role="dialog" aria-labelledby="editModalLabel" aria-hidden="true">
      <div class="modal-dialog" role="document">
          <div class="modal-content">
              <div class="modal-header">
                  <h5 class="modal-title" id="editModalLabel">Edit Quantity</h5>
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                  </button>
              </div>
              <div class="modal-body">
                  <label for="editQuantity">New Quantity</label>
                  <input type="text" id="editQuantity" class="form-control" value="${escapeAttribute(currentQuantity)}" />
                  <span id="editItemError" class="text-danger mt-2"></span>
              </div>
              <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                  <button type="button" class="btn btn-primary" onclick="saveEdit(${itemId})">Save Changes</button>
              </div>
          </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  $('#editModal').modal('show');

  $('#editModal').on('hidden.bs.modal', () => {
    document.getElementById('editModal').remove();
  });
}

window.saveEdit = async function(itemId) {
  const newQuantity = document.getElementById("editQuantity").value.trim();
  const editItemError = document.getElementById("editItemError");

  if (!newQuantity) {
    editItemError.innerText = "Quantity cannot be empty!";
    return;
  }

  try {
    const response = await fetch(`${api_uri}/fridge/edit/${itemId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: newQuantity }),
      credentials: 'include'
    });

    if (response.ok) {
      $('#editModal').modal('hide');
      fetchFridgeItems();
      showMessage("Item updated successfully!", "alert-success");
    } else {
      const errorData = await response.json();
      editItemError.innerText = "Error: " + (errorData.error || "Unable to update");
    }
  } catch (error) {
    console.error("Error saving edit:", error);
    editItemError.innerText = "An unexpected error occurred.";
  }
}

window.deleteItem = async function(id) {
  if (confirm("Are you sure you want to delete this item?")) {
    try {
      const response = await fetch(`${api_uri}/fridge/delete/${id}`, {
        method: "POST",
        credentials: 'include'
      });
      if (response.ok) {
        fetchFridgeItems();
        showMessage("Item deleted successfully!", "alert-success");
      } else {
        const errorData = await response.json();
        showMessage("Error deleting item: " + (errorData.error || "Unknown error"), "alert-danger");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      showMessage("An unexpected error occurred.", "alert-danger");
    }
  }
}


document.addEventListener('DOMContentLoaded', () => {
  // Hook up the search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keyup', searchItemsFridge);
  }

  fetchFridgeItems();

  const addItemForm = document.getElementById("addItemForm");
  if (addItemForm) {
    addItemForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await addNewItem(); 
    });
  }


  const quantityRadios = document.querySelectorAll('input[name="quantityType"]');
  quantityRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      toggleInputsFridge(radio.value);
    });
  });


  const sizeInch = document.getElementById("sizeInch");
  const sizeCm = document.getElementById("sizeCm");
  if (sizeInch && sizeCm) {
    sizeInch.addEventListener('input', convertSizeFridge);
    sizeCm.addEventListener('input', convertSizeFridge);
  }

  const weightKg = document.getElementById("weightKg");
  const weightLb = document.getElementById("weightLb");
  if (weightKg && weightLb) {
    weightKg.addEventListener('input', convertWeight);
    weightLb.addEventListener('input', convertWeight);
  }

  const liquidGallon = document.getElementById("liquidGallon");
  const liquidLiter = document.getElementById("liquidLiter");
  if (liquidGallon && liquidLiter) {
    liquidGallon.addEventListener('input', convertLiquid);
    liquidLiter.addEventListener('input', convertLiquid);
  }
});


function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(text) {
  if (!text) return '';
  return text.replace(/'/g, "\\'");
}
