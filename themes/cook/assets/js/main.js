// Recipe data cache
let recipeData = null;
let fuse = null;

// Fetch and cache recipe data
async function loadRecipeData() {
  if (recipeData) return recipeData;

  try {
    const response = await fetch('/index.json');
    recipeData = await response.json();

    // Initialize Fuse.js for search
    const recipesArray = Object.values(recipeData);
    fuse = new Fuse(recipesArray, {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'description', weight: 2 },
        { name: 'courses', weight: 2 },
        { name: 'content', weight: 1 }
      ],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true
    });

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

// Perform search and display results
async function performSearch() {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  const searchQueryInput = document.getElementById('search-query');
  const resultsContainer = document.getElementById('search-results');
  const statsContainer = document.getElementById('search-stats');

  if (!query || !resultsContainer) return;

  // Set the search input value
  if (searchQueryInput) {
    searchQueryInput.value = query;
  }

  // Load recipe data and ensure Fuse is initialized
  await loadRecipeData();

  if (!fuse) {
    resultsContainer.innerHTML = '<p class="text-muted-foreground italic col-span-2">Failed to load search index</p>';
    return;
  }

  // Perform search
  const results = fuse.search(query);

  // Display stats
  if (statsContainer) {
    statsContainer.textContent = `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`;
  }

  // Display results
  if (results.length === 0) {
    resultsContainer.innerHTML = '<p class="text-muted-foreground italic col-span-2">No recipes found. Try a different search term.</p>';
    return;
  }

  resultsContainer.innerHTML = results.map(result => {
    const recipe = result.item;
    return `
      <a href="${recipe.url}" class="block border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow group">
        ${recipe.image ? `
          <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover">
        ` : `
          <div class="w-full h-48 bg-secondary flex items-center justify-center">
            <span class="text-4xl">🍽️</span>
          </div>
        `}
        <div class="p-4">
          <div class="flex flex-wrap items-center gap-2 mb-2">
            <h3 class="font-semibold text-lg group-hover:text-primary transition-colors">${recipe.title}</h3>
            ${recipe.courses && recipe.courses.length > 0 ? recipe.courses.map(course => `
              <span class="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">${course}</span>
            `).join('') : ''}
          </div>
          ${recipe.description ? `
            <p class="text-sm text-muted-foreground line-clamp-3">${recipe.description}</p>
          ` : ''}
        </div>
      </a>
    `;
  }).join('');
}

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
    performSearch();
    initMobileMenu();
  });
} else {
  loadRecipeData();
  displayInspirationRecipes();
  performSearch();
  initMobileMenu();
}
