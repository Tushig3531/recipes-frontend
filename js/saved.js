

function closeModal() {
    $('#recipe-modal').modal('hide');
}

document.addEventListener('DOMContentLoaded', () => {
    const closeModalFooter = document.getElementById('close-modal-footer');
    if (closeModalFooter) {
        closeModalFooter.addEventListener("click", () => {
            $('#recipe-modal').modal('hide');
        });
    }

    loadSavedRecipes();
    loadFridgeItems('fridge-info-box');
});

async function loadSavedRecipes() {
    try {
        const response = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/saved_recipes`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch saved recipes");
        }

        const recipes = await response.json();
        displaySavedRecipes(recipes);
    } catch (error) {
        console.error("Load Saved Recipes Error:", error);
        const errorMsg = document.getElementById("error-message");
        errorMsg.classList.remove("is-hidden");
        errorMsg.textContent = escapeHtml(error.message);
    }
}

async function fetchYouTubeTutorial(queryStr) {
    const YOUTUBE_API_KEY = "AIzaSyAmHHz3lgsGTPO7AyxQ-BMCf5g174J5r8w";
    if (!YOUTUBE_API_KEY) return "";

    const query = encodeURIComponent(`${queryStr} tutorial`);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${query}&key=${YOUTUBE_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("YouTube API request failed.");
        const data = await response.json();
        if (data.items && data.items.length > 0) {
            const videoId = data.items[0].id.videoId;
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return "";
    } catch (error) {
        console.error("YouTube fetch error:", error);
        return "";
    }
}

function displaySavedRecipes(recipes) {
    const savedRecipesList = document.getElementById("saved-recipes");
    savedRecipesList.innerHTML = "";

    if (!recipes.length) {
        savedRecipesList.innerHTML = "<p class='text-center w-100'>No saved recipes.</p>"; 
        return;
    }

    recipes.forEach(r => {
        const column = document.createElement("div");
        column.classList.add("col-md-3", "col-sm-6", "mb-4"); 

        const card = document.createElement("div");
        card.classList.add("card", "h-100", "recipe-card"); 
        card.style.cursor = "pointer"; 
        card.addEventListener("click", () => openRecipeModal(r.name));

        // Card image
        const img = document.createElement("img");
        img.classList.add("card-img-top", "recipe-image"); 
        img.src = r.image_url || "https://via.placeholder.com/250x180?text=No+Image";
        img.alt = r.name;
        img.onerror = () => {
            img.src = "https://via.placeholder.com/250x180?text=No+Image";
        };
        card.appendChild(img);

        // Card body
        const cardBody = document.createElement("div");
        cardBody.classList.add("card-body", "p-2"); 

        const title = document.createElement("h5");
        title.classList.add("card-title", "text-truncate"); 
        title.textContent = r.name;

        cardBody.appendChild(title);

        
        const removeButton = document.createElement("button");
        removeButton.classList.add("btn", "btn-danger", "btn-sm", "mt-2"); 
        removeButton.textContent = "Remove";
        removeButton.addEventListener("click", (event) => {
            event.stopPropagation(); 
            confirmAndRemoveRecipe(r.recipe_id);
        });

        cardBody.appendChild(removeButton);
        card.appendChild(cardBody);

        column.appendChild(card);
        savedRecipesList.appendChild(column);
    });
}

async function confirmAndRemoveRecipe(recipeId) {

    try {
        const response = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/unsave_recipe/${recipeId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to remove recipe");
        }

        alert(data.message || "Recipe removed successfully!");
        loadSavedRecipes();
    } catch (error) {
        console.error("Remove Recipe Error:", error);
        alert(error.message);
    }
}

async function openRecipeModal(recipeName) {
    try {
        const detailUrl = `https://recipes-flask-backend-521138187713.us-central1.run.app/recipe_details_csv?name=${encodeURIComponent(recipeName)}`;

        const res = await fetch(detailUrl, { method: 'GET', credentials: 'include' });
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Failed to fetch recipe details");
        }
        const data = await res.json();
        const csvRecipe = data.recipe;

        const localImageUrl = csvRecipe.image_url || "https://via.placeholder.com/800x600?text=No+Image";

        const youtubeUrl = await fetchYouTubeTutorial(csvRecipe.name);

        const finalRecipe = {
            recipe_id: csvRecipe.recipe_id,
            name: csvRecipe.name,
            ingredients: csvRecipe.ingredients,
            instructions: csvRecipe.instructions,
            image_url: localImageUrl,
            youtube_url: youtubeUrl
        };

        const isSaved = await checkIfRecipeSaved(finalRecipe.recipe_id);

        displayRecipeModal(finalRecipe, isSaved);
    } catch (err) {
        console.error("Modal Fetch Error:", err);
        alert(err.message);
    }
}

async function checkIfRecipeSaved(recipeId) {
    try {
        const response = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/is_recipe_saved/${recipeId}`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        return data.saved;
    } catch (error) {
        console.error("Check saved status error:", error);
        return false;
    }
}

function displayRecipeModal(recipe, isSaved) {
    document.getElementById("modal-title").textContent = recipe.name;
    document.getElementById("modal-image").src = recipe.image_url || "https://via.placeholder.com/800x600?text=No+Image";
    document.getElementById("modal-ingredients").textContent = recipe.ingredients;
    document.getElementById("modal-instructions").textContent = recipe.instructions;

    const videoContainer = document.getElementById("modal-video");
    videoContainer.innerHTML = "";
    if (recipe.youtube_url) {
        const iframe = document.createElement("iframe");
        iframe.src = recipe.youtube_url;
        iframe.width = "100%";
        iframe.height = "315";
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowFullscreen = true;
        videoContainer.appendChild(iframe);
    } else {
        videoContainer.textContent = "No YouTube tutorial available.";
    }

    const modal = document.getElementById("recipe-modal");
    modal.dataset.currentRecipeId = recipe.recipe_id;

    const saveButton = document.getElementById("save-recipe");
    saveButton.textContent = isSaved ? "Remove Recipe" : "Save Recipe";
    saveButton.classList.toggle("btn-primary", !isSaved);
    saveButton.classList.toggle("btn-danger", isSaved);

    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    if (isSaved) {
        newSaveButton.addEventListener("click", removeRecipeFromModal);
    } else {
        newSaveButton.addEventListener("click", saveRecipe);
    }

    $('#recipe-modal').modal('show');
}

async function removeRecipeFromModal() {
    const modal = document.getElementById("recipe-modal");
    const recipeId = modal.dataset.currentRecipeId;
    if (!recipeId) {
        alert("No recipe selected.");
        return;
    }

    try {
        const response = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/unsave_recipe/${recipeId}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to remove recipe");
        }

        alert(data.message || "Recipe removed successfully!");
        $('#recipe-modal').modal('hide');
        loadSavedRecipes();
    } catch (error) {
        console.error("Remove Recipe Error:", error);
        alert(error.message);
    }
}

async function saveRecipe() {
    const modal = document.getElementById("recipe-modal");
    const recipeId = modal.dataset.currentRecipeId;
    if (!recipeId) {
        alert("No recipe selected.");
        return;
    }

    const name = document.getElementById("modal-title").textContent;
    const ingredients = document.getElementById("modal-ingredients").textContent;
    const instructions = document.getElementById("modal-instructions").textContent;
    const imgSrc = document.getElementById("modal-image").src;
    const iframe = document.querySelector("#modal-video iframe");
    const youtubeUrl = iframe ? iframe.src : "";

    const payload = {
        recipe_id: recipeId,
        name,
        ingredients,
        instructions,
        youtube_url: youtubeUrl,
        image_url: imgSrc
    };

    try {
        const saveRes = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/save_recipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            credentials: "include"
        });
        const saveData = await saveRes.json();
        if (!saveRes.ok) {
            throw new Error(saveData.error || "Failed to save recipe.");
        }
        alert(saveData.message || "Recipe saved successfully!");
        $('#recipe-modal').modal('hide');
        loadSavedRecipes();
    } catch (err) {
        console.error("Save Recipe Error:", err);
        alert(err.message);
    }
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadFridgeItems(elementId) {
    try {
        const response = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/fridge`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch fridge items.');
        const data = await response.json();

        const fridgeList = document.getElementById(elementId);
        if (fridgeList) {
            fridgeList.innerHTML = '';
            if (data.length === 0) {
                fridgeList.innerHTML = '<li class="list-group-item">Your fridge is empty.</li>';
            } else {
                data.forEach(item => {
                    fridgeList.innerHTML += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span>
                                <strong>${escapeHtml(item.item_name)}</strong> - Brand: ${escapeHtml(item.brand)} - Quantity: ${escapeHtml(item.quantity)}
                            </span>
                        </li>
                    `;
                });
            }
        } else {
            console.error(`Element with ID '${elementId}' not found.`);
        }
    } catch (error) {
        console.error("Error fetching fridge items:", error);
        const fridgeList = document.getElementById(elementId);
        if (fridgeList) {
            fridgeList.innerHTML = '<li class="list-group-item text-danger">Failed to load fridge items.</li>';
        }
    }
}

function openEditModal(itemId, currentQuantity) {
    alert(`Edit functionality for item ID ${itemId} is not implemented yet.`);
}

async function deleteItem(itemId) {
    

    try {
        const response = await fetch(`https://recipes-flask-backend-521138187713.us-central1.run.app/fridge/${itemId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to delete fridge item.");
        }
        loadFridgeItems('fridge-info-box');
        loadFridgeItems('fridge-items-list');
    } catch (error) {
        console.error("Delete Fridge Item Error:", error);
        alert(error.message);
    }
}
