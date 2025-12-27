// Recipe data cache
let recipeData = null;
let fuse = null;

// Fetch and cache recipe data
async function loadRecipeData() {
  if (recipeData) {
    console.log('[loadRecipeData] Using cached recipe data');
    return recipeData;
  }

  console.log('[loadRecipeData] Fetching /index.json...');
  try {
    const response = await fetch('/index.json');
    console.log('[loadRecipeData] Fetch response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    recipeData = await response.json();
    console.log('[loadRecipeData] Recipe data loaded:', Object.keys(recipeData).length, 'recipes');

    // Check if Fuse.js is available
    if (typeof Fuse === 'undefined') {
      console.error('[loadRecipeData] Fuse.js is not loaded!');
      throw new Error('Fuse.js library not available');
    }
    console.log('[loadRecipeData] Fuse.js is available');

    // Initialize Fuse.js for search
    const recipesArray = Object.values(recipeData);
    console.log('[loadRecipeData] Initializing Fuse with', recipesArray.length, 'recipes');
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
    console.log('[loadRecipeData] Fuse initialized successfully');

    return recipeData;
  } catch (error) {
    console.error('[loadRecipeData] Failed to load recipe data:', error);
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
  console.log('[performSearch] Starting search');
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  const searchQueryInput = document.getElementById('search-query');
  const resultsContainer = document.getElementById('search-results');
  const statsContainer = document.getElementById('search-stats');

  console.log('[performSearch] Query:', query);
  console.log('[performSearch] Results container exists:', !!resultsContainer);

  if (!query || !resultsContainer) {
    console.log('[performSearch] Missing query or results container, exiting');
    return;
  }

  // Set the search input value
  if (searchQueryInput) {
    searchQueryInput.value = query;
  }

  // Load recipe data and ensure Fuse is initialized
  console.log('[performSearch] Loading recipe data...');
  await loadRecipeData();

  console.log('[performSearch] Fuse initialized:', !!fuse);

  if (!fuse) {
    console.error('[performSearch] Fuse not initialized, showing error message');
    resultsContainer.innerHTML = '<p class="text-muted-foreground italic col-span-2">Failed to load search index</p>';
    return;
  }

  // Perform search
  console.log('[performSearch] Performing search for:', query);
  const results = fuse.search(query);
  console.log('[performSearch] Search results count:', results.length);

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

  // Get active courses
  const activeCourses = getActiveCourses();

  // Filter cards by active courses
  const filteredCards = cards.filter(card => {
    if (activeCourses.length === 0) return true; // Show all if no courses selected

    // Get course badges from the card
    const courseBadges = card.querySelectorAll('.px-2.py-1.bg-primary\\/10');
    const cardCourses = Array.from(courseBadges).map(badge => badge.textContent.trim());

    // Check if card has any of the active courses
    return cardCourses.some(course => activeCourses.includes(course));
  });

  // Shuffle the filtered cards
  const shuffled = filteredCards.sort(() => Math.random() - 0.5);

  // Hide all cards first
  cards.forEach(card => card.style.display = 'none');

  // Show only the first 6 shuffled filtered cards
  shuffled.forEach((card, index) => {
    if (index < 6) {
      card.style.display = '';
    }
  });

  // Re-append in shuffled order
  shuffled.forEach(card => container.appendChild(card));
}

// Get active courses from toggle buttons
function getActiveCourses() {
  const toggles = document.querySelectorAll('.course-toggle');
  const activeCourses = [];

  toggles.forEach(toggle => {
    if (toggle.dataset.active === 'true') {
      activeCourses.push(toggle.dataset.course);
    }
  });

  return activeCourses;
}

// Initialize course toggle buttons
function initCourseToggles() {
  const toggles = document.querySelectorAll('.course-toggle');
  const shuffleBtn = document.getElementById('shuffle-btn');

  if (toggles.length === 0) return; // Not on homepage

  // Add click handlers to toggle buttons
  toggles.forEach(toggle => {
    // Set initial active state styling
    updateToggleStyle(toggle);

    toggle.addEventListener('click', () => {
      // Toggle active state
      const isActive = toggle.dataset.active === 'true';
      toggle.dataset.active = (!isActive).toString();
      updateToggleStyle(toggle);

      // Don't shuffle, just update styling
      // User must click shuffle button to re-roll
    });
  });

  // Add click handler to shuffle button
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      displayInspirationRecipes();
    });
  }
}

// Update toggle button styling based on active state
function updateToggleStyle(toggle) {
  const isActive = toggle.dataset.active === 'true';

  if (isActive) {
    toggle.classList.add('bg-primary/10', 'text-primary');
    toggle.classList.remove('bg-background', 'text-foreground');
  } else {
    toggle.classList.remove('bg-primary/10', 'text-primary');
    toggle.classList.add('bg-background', 'text-foreground');
  }
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

// Timer functionality for recipe pages
class RecipeTimer {
  constructor(element, duration, unit) {
    this.element = element;
    this.totalSeconds = this.parseTime(duration, unit);
    this.remainingSeconds = this.totalSeconds;
    this.isRunning = false;
    this.intervalId = null;
    this.beepIntervalId = null;
    this.audioContext = null;

    this.render();
  }

  parseTime(duration, unit) {
    // Handle ranges like "25-30" by taking the first number
    const match = String(duration).match(/^(\d+)/);
    const value = match ? parseInt(match[1]) : 0;

    // Convert to seconds based on unit
    const unitLower = unit.toLowerCase();
    if (unitLower.startsWith('second')) {
      return value;
    } else if (unitLower.startsWith('minute')) {
      return value * 60;
    } else if (unitLower.startsWith('hour')) {
      return value * 3600;
    }

    // Default to minutes if unknown unit
    return value * 60;
  }

  render() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    this.element.innerHTML = `
      <div class="recipe-timer border border-border rounded-lg p-3 sm:p-4 bg-secondary/30" data-total-seconds="${this.totalSeconds}">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div class="text-2xl sm:text-3xl font-mono font-bold ${this.remainingSeconds === 0 ? 'text-red-600' : 'text-foreground'}" data-timer-display>
            ${timeDisplay}
          </div>
          <div class="flex flex-wrap gap-2 justify-center sm:justify-end">
            <button
              data-timer-start
              class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors ${this.isRunning ? 'opacity-50 cursor-not-allowed' : ''}"
              ${this.isRunning ? 'disabled' : ''}
            >
              Start
            </button>
            <button
              data-timer-stop
              class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-secondary text-secondary-foreground border border-border rounded-md font-medium hover:bg-secondary/80 transition-colors ${!this.isRunning ? 'opacity-50 cursor-not-allowed' : ''}"
              ${!this.isRunning ? 'disabled' : ''}
            >
              Stop
            </button>
            <button
              data-timer-add-minute
              class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-secondary text-secondary-foreground border border-border rounded-md font-medium hover:bg-secondary/80 transition-colors"
            >
              +1 min
            </button>
            <button
              data-timer-reset
              class="px-3 sm:px-4 py-2 text-sm sm:text-base bg-secondary text-secondary-foreground border border-border rounded-md font-medium hover:bg-secondary/80 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    `;

    // Attach event listeners
    this.element.querySelector('[data-timer-start]').addEventListener('click', () => this.start());
    this.element.querySelector('[data-timer-stop]').addEventListener('click', () => this.stop());
    this.element.querySelector('[data-timer-add-minute]').addEventListener('click', () => this.addMinute());
    this.element.querySelector('[data-timer-reset]').addEventListener('click', () => this.reset());
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    activeTimers.add(this);

    this.intervalId = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateDisplay();
      } else {
        this.complete();
      }
    }, 1000);

    this.render();
  }

  stop() {
    this.isRunning = false;
    activeTimers.delete(this);

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop continuous beeping if active (always clear, even if timer wasn't running)
    if (this.beepIntervalId) {
      clearInterval(this.beepIntervalId);
      this.beepIntervalId = null;
    }

    this.render();
  }

  addMinute() {
    const wasAtZero = this.remainingSeconds === 0;
    this.remainingSeconds += 60;
    this.updateDisplay();

    // If timer was at zero and beeping, stop the beeping and auto-restart
    if (wasAtZero) {
      if (this.beepIntervalId) {
        clearInterval(this.beepIntervalId);
        this.beepIntervalId = null;
      }
      // Auto-restart the timer
      this.start();
    }
  }

  reset() {
    this.stop();
    this.remainingSeconds = this.totalSeconds;
    this.render();
  }

  updateDisplay() {
    const minutes = Math.floor(this.remainingSeconds / 60);
    const seconds = this.remainingSeconds % 60;
    const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    const displayElement = this.element.querySelector('[data-timer-display]');
    if (displayElement) {
      displayElement.textContent = timeDisplay;
      if (this.remainingSeconds === 0) {
        displayElement.classList.add('text-red-600');
        displayElement.classList.remove('text-foreground');
      }
    }
  }

  complete() {
    this.stop();

    // Start continuous beeping every 2 seconds until stopped
    this.beep();
    this.beepIntervalId = setInterval(() => {
      this.beep();
    }, 2000);

    // Show notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Timer Complete!', {
        body: 'Your recipe timer has finished.',
        icon: '/favicon.svg'
      });
    }
  }

  beep() {
    try {
      // Create a three-beep pattern (like a kitchen timer) for better attention
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const currentTime = audioContext.currentTime;

      // Helper function to create a single beep
      const createBeep = (startTime, frequency, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'square';

        // Envelope for each beep
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Three beeps: beep-beep-beep pattern (like ready-set-go)
      createBeep(currentTime, 800, 0.15);        // First beep at 800 Hz
      createBeep(currentTime + 0.2, 800, 0.15);  // Second beep
      createBeep(currentTime + 0.4, 1000, 0.3);  // Third beep higher and longer

    } catch (error) {
      console.error('Failed to play beep:', error);
    }
  }
}

// Track all active timers globally
const activeTimers = new Set();
window.activeTimers = activeTimers;

// Initialize recipe timers
function initRecipeTimers() {
  // Find all h3 elements with the timer format:
  // "Timer: X minutes - context" or "Timer: X seconds - context" or "Timer: X hours - context"
  const timerHeaders = document.querySelectorAll('h3');

  timerHeaders.forEach(header => {
    const text = header.textContent.trim();
    // Match: "Timer: <duration> <unit> - <context>" or "Timer: <duration> <unit>"
    const match = text.match(/^Timer:\s*([\d-]+)\s*(seconds?|minutes?|hours?)\s*(?:-\s*(.+))?$/i);

    if (match) {
      const duration = match[1];
      const unit = match[2];
      const context = match[3] || '';

      // Create a wrapper container
      const wrapper = document.createElement('div');
      wrapper.className = 'timer-container my-4';

      // Add context as a label if present
      if (context) {
        const label = document.createElement('div');
        label.className = 'text-sm text-muted-foreground mb-2';
        label.textContent = context;
        wrapper.appendChild(label);
      }

      // Create a container for the timer widget itself
      const timerWidget = document.createElement('div');
      wrapper.appendChild(timerWidget);

      // Replace the h3 with the wrapper
      header.parentNode.insertBefore(wrapper, header);
      header.remove();

      // Initialize the timer (it will render into timerWidget)
      new RecipeTimer(timerWidget, duration, unit);
    }
  });

  // Request notification permission if there are timers
  if (document.querySelectorAll('.recipe-timer').length > 0) {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // Add beforeunload listener to prevent accidental navigation with active timers
  window.addEventListener('beforeunload', (e) => {
    if (activeTimers.size > 0) {
      e.preventDefault();
      e.returnValue = 'You have active timers. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadRecipeData();
    initCourseToggles();
    displayInspirationRecipes();
    performSearch();
    initMobileMenu();
    initRecipeTimers();
  });
} else {
  loadRecipeData();
  initCourseToggles();
  displayInspirationRecipes();
  performSearch();
  initMobileMenu();
  initRecipeTimers();
}
