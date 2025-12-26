const { test, expect } = require('@playwright/test');

test.describe('Navigation flows', () => {
  test('should navigate from all recipes page to recipe detail page', async ({ page }) => {
    await page.goto('/');

    // Find and click the "All Recipes" link in navigation
    const recipesLink = page.locator('nav a:has-text("All Recipes")').first();
    await recipesLink.click();

    // Wait for navigation to recipes page
    await page.waitForURL(/\/recipes/);

    // Verify we're on the recipes page by checking for the page title
    await expect(page.locator('h1')).toContainText('All Recipes');

    // Verify we have recipe cards
    const recipeCards = page.locator('a[href^="/recipes/"].block.border');
    await expect(recipeCards.first()).toBeVisible();

    // Get the first recipe card's title and click it
    const firstRecipeCard = recipeCards.first();
    const recipeTitle = await firstRecipeCard.locator('h3').textContent();
    expect(recipeTitle.trim()).toBeTruthy();

    await firstRecipeCard.click();

    // Wait for navigation to recipe detail page
    await page.waitForURL(/\/recipes\/[^/]+\//);

    // Verify we're on a recipe detail page
    // Check for typical recipe page elements
    const recipePage = page.locator('main');
    await expect(recipePage).toBeVisible();

    // The recipe title should be visible on the page
    const pageTitle = page.locator('h1').first();
    await expect(pageTitle).toBeVisible();
    const pageTitleText = await pageTitle.textContent();
    expect(pageTitleText.trim().length).toBeGreaterThan(0);

    // Recipe pages should have ingredients or instructions
    const hasContent = await page.locator('body').textContent();
    expect(hasContent.length).toBeGreaterThan(100);
  });

  test('should navigate through courses page flow', async ({ page }) => {
    await page.goto('/');

    // Find and click the "By Course" link in navigation
    const coursesLink = page.locator('nav a:has-text("By Course")').first();
    await coursesLink.click();

    // Wait for navigation to courses page
    await page.waitForURL(/\/courses/);

    // Verify we're on the courses page
    await expect(page.locator('h1')).toContainText('Recipes by Course');

    // Find course category links (e.g., "Main", "Dessert", etc.)
    // These are the large cards with h2 headings
    const courseLinks = page.locator('a[href^="/courses/"].block.p-8');
    await expect(courseLinks.first()).toBeVisible();

    const courseCount = await courseLinks.count();
    expect(courseCount).toBeGreaterThan(0);

    // Click on the first course category
    const firstCourseLink = courseLinks.first();
    const courseName = await firstCourseLink.locator('h2').textContent();
    expect(courseName.trim().length).toBeGreaterThan(0);

    await firstCourseLink.click();

    // Wait for navigation to specific course page
    await page.waitForURL(/\/courses\/[^/]+/);

    // Verify we're on a course category page with recipes
    const courseTitle = page.locator('h1').first();
    await expect(courseTitle).toBeVisible();

    // Should show recipes for this course
    const recipeCards = page.locator('a[href^="/recipes/"].block.border');
    await expect(recipeCards.first()).toBeVisible();

    // Click on a recipe from this course page
    const firstRecipe = recipeCards.first();
    await firstRecipe.click();

    // Wait for navigation to recipe detail page
    await page.waitForURL(/\/recipes\/[^/]+\//);

    // Verify we're on a recipe detail page
    const recipePage = page.locator('main');
    await expect(recipePage).toBeVisible();
  });

  test('should navigate from home page inspiration to recipe detail', async ({ page }) => {
    await page.goto('/');

    // Wait for inspiration section
    const inspirationContainer = page.locator('#inspiration-recipes');
    await expect(inspirationContainer).toBeVisible();

    // Find a recipe card in the inspiration section
    const recipeCard = inspirationContainer.locator('a[href^="/recipes/"]').first();
    await expect(recipeCard).toBeVisible();

    // Get the recipe title
    const recipeTitle = await recipeCard.locator('h3').first().textContent();
    expect(recipeTitle.trim().length).toBeGreaterThan(0);

    // Click the recipe card
    await recipeCard.click();

    // Wait for navigation to recipe detail page
    await page.waitForURL(/\/recipes\/[^/]+\//);

    // Verify we're on the recipe detail page
    const pageTitle = page.locator('h1, h2').first();
    await expect(pageTitle).toBeVisible();
  });
});
