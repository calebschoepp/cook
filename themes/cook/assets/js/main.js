// Recipe data cache
let recipeData = null;

// Fetch and cache recipe data
async function loadRecipeData() {
  if (recipeData) return recipeData;

  try {
    const response = await fetch('/index.json');
    recipeData = await response.json();
    return recipeData;
  } catch (error) {
    console.error('Failed to load recipe data:', error);
    return null;
  }
}

// Pick a random recipe from the selected course
window.pickRandomRecipe = async function() {
  const data = await loadRecipeData();
  if (!data) {
    alert('Failed to load recipe data');
    return;
  }

  // Get selected course from dropdown
  const courseSelect = document.getElementById('course-select');
  const selectedCourse = courseSelect.value;

  // Filter recipes by course (or all if "All" is selected)
  let recipesToChooseFrom;
  if (selectedCourse === 'All') {
    recipesToChooseFrom = Object.values(data);
  } else {
    recipesToChooseFrom = Object.values(data).filter(recipe =>
      recipe.courses.includes(selectedCourse)
    );
  }

  if (recipesToChooseFrom.length === 0) {
    const container = document.getElementById('random-recipe-display');
    container.innerHTML = '<p class="text-muted-foreground text-center">No recipes found in this course</p>';
    return;
  }

  // Pick random recipe
  const randomRecipe = recipesToChooseFrom[Math.floor(Math.random() * recipesToChooseFrom.length)];

  // Display the recipe
  const container = document.getElementById('random-recipe-display');
  container.innerHTML = `
    <div class="space-y-3">
      ${randomRecipe.image ? `
        <img src="${randomRecipe.image}" alt="${randomRecipe.title}" class="w-full h-48 object-cover rounded-md">
      ` : ''}
      <h3 class="text-2xl font-semibold">
        <a href="${randomRecipe.url}" class="hover:text-primary transition-colors">${randomRecipe.title}</a>
      </h3>
      ${randomRecipe.description ? `
        <p class="text-muted-foreground">${randomRecipe.description}</p>
      ` : ''}
      <div class="flex flex-wrap gap-2">
        ${randomRecipe.courses.map(course => `
          <span class="inline-block px-3 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground">
            ${course}
          </span>
        `).join('')}
      </div>
      <a href="${randomRecipe.url}" class="inline-block text-primary hover:underline font-medium">
        View Recipe →
      </a>
    </div>
  `;
};

// Display random inspiration recipes
async function displayInspirationRecipes() {
  const data = await loadRecipeData();
  if (!data) {
    console.error('Failed to load recipe data for inspiration');
    return;
  }

  const container = document.getElementById('inspiration-recipes');
  if (!container) return; // Not on homepage

  // Get all recipes and shuffle them
  const allRecipes = Object.values(data);
  const shuffled = allRecipes.sort(() => Math.random() - 0.5);
  const randomRecipes = shuffled.slice(0, 6);

  // Display the random recipes
  container.innerHTML = randomRecipes.map(recipe => `
    <a href="${recipe.url}" class="block border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
      ${recipe.image ? `
        <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover">
      ` : `
        <div class="w-full h-48 bg-secondary flex items-center justify-center">
          <span class="text-4xl">🍽️</span>
        </div>
      `}
      <div class="p-4">
        <h3 class="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">${recipe.title}</h3>
        ${recipe.description ? `
          <p class="text-sm text-muted-foreground line-clamp-2">${recipe.description}</p>
        ` : ''}
      </div>
    </a>
  `).join('');
}

// Preload recipe data and display inspiration recipes on page load
// Mobile menu toggle
function initMobileMenu() {
  const menuButton = document.getElementById('mobile-menu-button');
  const mobileMenu = document.getElementById('mobile-menu');

  if (menuButton && mobileMenu) {
    menuButton.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    // Close menu when clicking a link
    const menuLinks = mobileMenu.querySelectorAll('a');
    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadRecipeData();
    displayInspirationRecipes();
    initMobileMenu();
  });
} else {
  loadRecipeData();
  displayInspirationRecipes();
  initMobileMenu();
}
