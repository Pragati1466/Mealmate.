document.getElementById('recipe-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const ingredients = document.getElementById('ingredients').value;
  const healthGoal = document.getElementById('healthGoal').value;

  const response = await fetch('/get-recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `ingredients=${encodeURIComponent(ingredients)}&healthGoal=${encodeURIComponent(healthGoal)}`
  });

  const recipes = await response.json();
  const resultsDiv = document.getElementById('results');
  const modal = document.getElementById('recipe-modal');
  const modalContent = modal.querySelector('.modal-content');

  if (recipes.length) {
    resultsDiv.innerHTML = recipes.map((recipe, index) => `
      <div class="recipe-card" data-index="${index}">
        <img src="${recipe.ImageUrl || 'placeholder.jpg'}" alt="${recipe.Title}">
        <h3>${recipe.Title}</h3>
      </div>
    `).join('');

    // Add event listeners to recipe cards
    document.querySelectorAll('.recipe-card').forEach((card) => {
      card.addEventListener('click', () => {
        const recipe = recipes[card.dataset.index];
        modalContent.innerHTML = `
          <h2>${recipe.Title}</h2>
          <p><strong>Ingredients:</strong> ${recipe.Ingredients}</p>
          <p><strong>Total Time:</strong> ${recipe.TotalTimeInMins} mins</p>
          <p><strong>Cuisine:</strong> ${recipe.Cuisine}</p>
          <p><strong>Instructions:</strong> ${recipe.Instructions}</p>
          <p><strong>Ingredient Count:</strong> ${recipe.IngredientCount}</p>
          <p><strong>Health Goals:</strong> ${recipe.HealthGoals}</p>
          <p><strong>YouTube Link:</strong> <a href="${recipe.YouTubeLink}" target="_blank">Watch Here</a></p>
          <button class="close">Close</button>
        `;
        modal.style.display = 'flex';

        // Close modal
        modal.querySelector('.close').addEventListener('click', () => {
          modal.style.display = 'none';
        });
      });
    });
  } else {
    resultsDiv.innerHTML = `<p class="no-results">No recipes found. Try different ingredients or health goals!</p>`;
  }
});
