const { test, expect } = require('@playwright/test');

test.describe('Inspiration page', () => {
  test('should filter and shuffle recipes by course toggles', async ({ page }) => {
    await page.goto('/');

    // Wait for the inspiration section to load
    const inspirationContainer = page.locator('#inspiration-recipes');
    await expect(inspirationContainer).toBeVisible();

    // Get initial recipe titles
    const getVisibleRecipeTitles = async () => {
      const cards = await inspirationContainer.locator('a[href^="/recipes/"]').all();
      const visibleCards = [];
      for (const card of cards) {
        const isVisible = await card.isVisible();
        if (isVisible) {
          const title = await card.locator('h3').first().textContent();
          visibleCards.push(title.trim());
        }
      }
      return visibleCards;
    };

    const initialRecipes = await getVisibleRecipeTitles();
    expect(initialRecipes.length).toBeGreaterThan(0);

    // Find all course toggle buttons
    const toggleButtons = page.locator('.course-toggle');
    const toggleCount = await toggleButtons.count();
    expect(toggleCount).toBeGreaterThan(0);

    // Click the first toggle button to activate it
    const firstToggle = toggleButtons.first();
    const courseName = await firstToggle.getAttribute('data-course');
    await firstToggle.click();

    // Verify the toggle is now active (has the active styling)
    await expect(firstToggle).toHaveAttribute('data-active', 'true');

    // Click the shuffle button
    const shuffleButton = page.locator('#shuffle-btn');
    await expect(shuffleButton).toBeVisible();
    await shuffleButton.click();

    // Wait a bit for the shuffle animation/update
    await page.waitForTimeout(500);

    // Get the new visible recipes
    const filteredRecipes = await getVisibleRecipeTitles();
    expect(filteredRecipes.length).toBeGreaterThan(0);

    // Verify that all visible recipes have the selected course badge
    const visibleCards = await inspirationContainer.locator('a[href^="/recipes/"]:visible').all();
    for (const card of visibleCards) {
      const courseBadges = await card.locator('.px-2.py-1.bg-primary\\/10').allTextContents();
      const hasCourse = courseBadges.some(badge => badge.trim() === courseName);
      expect(hasCourse).toBeTruthy();
    }

    // Shuffle again to verify we get different recipes (with the same course filter)
    await shuffleButton.click();
    await page.waitForTimeout(500);

    const reshuffledRecipes = await getVisibleRecipeTitles();
    expect(reshuffledRecipes.length).toBeGreaterThan(0);

    // All should still have the selected course
    const reshuffledCards = await inspirationContainer.locator('a[href^="/recipes/"]:visible').all();
    for (const card of reshuffledCards) {
      const courseBadges = await card.locator('.px-2.py-1.bg-primary\\/10').allTextContents();
      const hasCourse = courseBadges.some(badge => badge.trim() === courseName);
      expect(hasCourse).toBeTruthy();
    }

    // Toggle multiple courses
    if (toggleCount >= 2) {
      const secondToggle = toggleButtons.nth(1);
      const secondCourseName = await secondToggle.getAttribute('data-course');
      await secondToggle.click();
      await expect(secondToggle).toHaveAttribute('data-active', 'true');

      // Shuffle with multiple course filters
      await shuffleButton.click();
      await page.waitForTimeout(500);

      const multiFilterRecipes = await getVisibleRecipeTitles();
      expect(multiFilterRecipes.length).toBeGreaterThan(0);

      // Verify recipes match either of the selected courses
      const multiFilterCards = await inspirationContainer.locator('a[href^="/recipes/"]:visible').all();
      for (const card of multiFilterCards) {
        const courseBadges = await card.locator('.px-2.py-1.bg-primary\\/10').allTextContents();
        const hasEitherCourse = courseBadges.some(badge =>
          badge.trim() === courseName || badge.trim() === secondCourseName
        );
        expect(hasEitherCourse).toBeTruthy();
      }
    }
  });
});
