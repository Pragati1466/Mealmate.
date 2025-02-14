const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Load recipes from CSV
let recipes = [];
fs.createReadStream(path.join(__dirname, '../data/recipes.csv'))
  .pipe(csv())
  .on('data', (row) => {
    // Clean ingredients and health goals before pushing to recipes array
    const cleanedIngredients = row['Cleaned-Ingredients'] ? row['Cleaned-Ingredients'].toLowerCase().split(',').map(item => item.trim()) : [];
    const healthGoals = row['Health Goals'] ? row['Health Goals'].toLowerCase().split(',').map(item => item.trim()) : [];

    recipes.push({
      ...row,
      cleanedIngredients,  // Store cleaned ingredients
      healthGoals         // Store health goals
    });
  })
  .on('end', () => {
    console.log(`Recipes loaded! Total recipes: ${recipes.length}`);
  })
  .on('error', (err) => {
    console.error('Error reading CSV file:', err);
  });

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Filter recipes based on user input (partial ingredient match and health goal)
app.post('/get-recipes', (req, res) => {
  try {
    const { ingredients, healthGoal } = req.body;

    // Validate input
    if (!ingredients) {
      return res.status(400).json({ error: 'Ingredients are required.' });
    }

    // Parse user input
    const userIngredients = ingredients.toLowerCase().split(',').map((item) => item.trim());
    const userHealthGoal = healthGoal ? healthGoal.toLowerCase() : '';

    // Filter recipes based on ingredients (partial match: any ingredient should match) and health goal
    const filteredRecipes = recipes.filter((recipe, index) => {
      const recipeIngredients = recipe.cleanedIngredients;
      const recipeHealthGoals = recipe.healthGoals;

      if (!recipeIngredients.length) {
        console.log(`Skipping recipe at index ${index}: Missing ingredients`, recipe);
        return false;
      }

      // Check if at least one user ingredient is present in the recipe ingredients
      const matchesIngredients = userIngredients.some((ing) => recipeIngredients.includes(ing));

      // Check if at least one health goal matches the user's selected health goal
      const matchesHealthGoal = userHealthGoal ? recipeHealthGoals.some(goal => goal.includes(userHealthGoal)) : true;

      return matchesIngredients && matchesHealthGoal;
    });

    // Return filtered recipes with full details
    const result = filteredRecipes.map(recipe => ({
      Title: recipe.Title,
      Ingredients: recipe.Ingredients,
      TotalTimeInMins: recipe.TotalTimeInMins,
      Cuisine: recipe.Cuisine,
      Instructions: recipe.Instructions,
      URL: recipe.URL,
      CleanedIngredients: recipe['Cleaned-Ingredients'],
      ImageUrl: recipe['image-url'],
      IngredientCount: recipe['Ingredient-count'],
      YouTubeLink: recipe.URL, // Assuming YouTube URL is stored in URL field, adjust if different
      HealthGoals: recipe.healthGoals.join(', '),
    }));

    res.json(result);
  } catch (error) {
    console.error('Error filtering recipes:', error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
