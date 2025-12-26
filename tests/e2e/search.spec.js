const { test, expect } = require('@playwright/test');

test.describe('Search functionality', () => {
  test('should find a specific recipe by exact name', async ({ page }) => {
    await page.goto('/');

    // Find and fill the search input
    const searchInput = page.locator('input[type="search"], input[name="q"]');
    await searchInput.fill('Apple Crisp');

    // Submit the search form
    await searchInput.press('Enter');

    // Wait for navigation to search page
    await page.waitForURL(/\/search/);

    // Check that we're on the search page
    await expect(page).toHaveURL(/q=Apple\+Crisp/);

    // Wait for search results to load
    await page.waitForSelector('#search-results');

    // Check that the search stats show results
    const searchStats = page.locator('#search-stats');
    await expect(searchStats).toContainText('Found');
    await expect(searchStats).toContainText('Apple Crisp');

    // Check that Apple Crisp appears in the results
    const results = page.locator('#search-results');
    await expect(results).toContainText('Apple Crisp');

    // Verify it's a clickable link to the recipe
    const recipeLink = results.locator('a:has-text("Apple Crisp")').first();
    await expect(recipeLink).toBeVisible();
  });

  test('should find multiple recipes when searching for "garlic"', async ({ page }) => {
    await page.goto('/');

    // Find and fill the search input
    const searchInput = page.locator('input[type="search"], input[name="q"]');
    await searchInput.fill('garlic');

    // Submit the search form
    await searchInput.press('Enter');

    // Wait for navigation to search page
    await page.waitForURL(/\/search/);

    // Wait for search results to load
    await page.waitForSelector('#search-results');

    // Check that the search stats show multiple results
    const searchStats = page.locator('#search-stats');
    await expect(searchStats).toContainText('Found');
    await expect(searchStats).toContainText('garlic');

    // Extract the number of results from the stats text
    const statsText = await searchStats.textContent();
    const match = statsText.match(/Found (\d+) result/);
    expect(match).toBeTruthy();
    const resultCount = parseInt(match[1]);

    // Verify we have multiple results (at least 2)
    expect(resultCount).toBeGreaterThanOrEqual(2);

    // Verify multiple recipe cards are displayed
    const recipeCards = page.locator('#search-results a');
    const cardCount = await recipeCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(2);

    // Verify each card is visible and clickable
    for (let i = 0; i < Math.min(cardCount, 3); i++) {
      await expect(recipeCards.nth(i)).toBeVisible();
    }
  });

  test('should return no results for nonsensical search term', async ({ page }) => {
    await page.goto('/');

    // Find and fill the search input with a nonsensical term
    const searchInput = page.locator('input[type="search"], input[name="q"]');
    await searchInput.fill('xyzqwertasdfzxcv');

    // Submit the search form
    await searchInput.press('Enter');

    // Wait for navigation to search page
    await page.waitForURL(/\/search/);

    // Wait for search results to load
    await page.waitForSelector('#search-results');

    // Check that the search stats show 0 results
    const searchStats = page.locator('#search-stats');
    await expect(searchStats).toContainText('Found 0 results');

    // Verify the "no results" message is displayed
    const results = page.locator('#search-results');
    await expect(results).toContainText('No recipes found');

    // Verify no recipe cards are displayed
    const recipeCards = page.locator('#search-results a');
    const cardCount = await recipeCards.count();
    expect(cardCount).toBe(0);
  });
});
