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

// Shuffle and display random inspiration recipes
function displayInspirationRecipes() {
  const container = document.getElementById('inspiration-recipes');
  if (!container) return; // Not on homepage

  // Get all recipe cards
  const cards = Array.from(container.children);

  // Shuffle the cards
  const shuffled = cards.sort(() => Math.random() - 0.5);

  // Show only the first 6, hide the rest
  shuffled.forEach((card, index) => {
    if (index < 6) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });

  // Re-append in shuffled order
  shuffled.forEach(card => container.appendChild(card));
}

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
