<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import * as Card from '$lib/components/ui/card/index.js';
  import { fly, scale, fade } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';

  // Initialize the puzzle with a shuffled state
  let puzzle = $state([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0]);
  let isSolved = $state(false);
  let moveCount = $state(0);

  // Shuffle the puzzle on component initialization
  function shufflePuzzle() {
    const shuffled = [...puzzle];

    // Perform 1000 random valid moves to ensure solvability
    for (let i = 0; i < 1000; i++) {
      const emptyIndex = shuffled.indexOf(0);
      const validMoves = getValidMoves(emptyIndex);
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        [shuffled[emptyIndex], shuffled[randomMove]] = [shuffled[randomMove], shuffled[emptyIndex]];
      }
    }

    puzzle = shuffled;
    isSolved = false;
    moveCount = 0;
  }

  // Get valid moves for the empty space (0)
  function getValidMoves(emptyIndex) {
    const row = Math.floor(emptyIndex / 4);
    const col = emptyIndex % 4;
    const validMoves = [];

    // Check up
    if (row > 0) validMoves.push(emptyIndex - 4);
    // Check down
    if (row < 3) validMoves.push(emptyIndex + 4);
    // Check left
    if (col > 0) validMoves.push(emptyIndex - 1);
    // Check right
    if (col < 3) validMoves.push(emptyIndex + 1);
    console.log(validMoves);
    return validMoves;
  }

  // Handle tile click
  function handleTileClick(index) {
    if (isSolved) return;

    const emptyIndex = puzzle.indexOf(0);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
      // Swap the clicked tile with the empty space
      const newPuzzle = [...puzzle];
      [newPuzzle[emptyIndex], newPuzzle[index]] = [newPuzzle[index], newPuzzle[emptyIndex]];
      puzzle = newPuzzle;
      moveCount++;

      // Check if puzzle is solved
      checkSolved();
    }
  }

  // Check if the puzzle is solved
  function checkSolved() {
    const solvedState = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
    isSolved = puzzle.every((value, index) => value === solvedState[index]);
  }

  // Reset puzzle to solved state
  function resetPuzzle() {
    puzzle = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
    isSolved = true;
    moveCount = 0;
  }

  // Initialize with a shuffled puzzle
  shufflePuzzle();
</script>

<svelte:head>
  <title>15 Puzzle Game - Weatherly</title>
  <meta name="description" content="Play the classic 15 puzzle sliding game" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
  <div class="mx-auto max-w-2xl">
    <!-- Header -->
    <div class="mb-8 text-center" in:fade={{ duration: 600 }}>
      <h1 class="mb-2 text-4xl font-bold text-gray-800">15 Puzzle Game</h1>
      <p class="text-gray-600">Slide the tiles to arrange them in order from 1 to 15</p>
    </div>

    <!-- Game Stats -->
    <div class="mb-6 flex justify-center gap-4" in:fly={{ y: -20, duration: 500, delay: 200 }}>
      <div class="rounded-lg bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
        <span class="text-sm font-medium text-gray-600">Moves:</span>
        <span class="ml-1 text-lg font-bold text-blue-600">{moveCount}</span>
      </div>
      {#if isSolved}
        <div
          class="rounded-lg bg-green-100 px-4 py-2 shadow-sm"
          in:scale={{ duration: 500, easing: elasticOut }}
        >
          <span class="text-sm font-bold text-green-800">🎉 Puzzle Solved!</span>
        </div>
      {/if}
    </div>

    <!-- Game Board -->
    <div in:scale={{ duration: 600, delay: 300 }}>
      <Card.Root class="mx-auto mb-6 max-w-md bg-white/90 backdrop-blur-sm">
        <Card.Content class="p-6">
          <div class="grid grid-cols-4 gap-2">
            {#each puzzle as tile, index (index)}
              <button
                class="aspect-square rounded-lg border-2 text-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 {tile ===
                0
                  ? 'border-gray-200 bg-gray-100'
                  : 'border-blue-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'}"
                onclick={() => handleTileClick(index)}
                disabled={isSolved}
                in:fly={{
                  x: Math.random() * 40 - 20,
                  y: Math.random() * 40 - 20,
                  duration: 400,
                  delay: index * 50,
                  easing: quintOut
                }}
              >
                {tile === 0 ? '' : tile}
              </button>
            {/each}
          </div>
        </Card.Content>
      </Card.Root>
    </div>

    <!-- Control Buttons -->
    <div class="flex justify-center gap-4" in:fly={{ y: 20, duration: 500, delay: 600 }}>
      <Button
        onclick={shufflePuzzle}
        variant="default"
        size="lg"
        class="bg-blue-600 hover:bg-blue-700"
      >
        New Game
      </Button>
      <Button onclick={resetPuzzle} variant="outline" size="lg">Show Solution</Button>
    </div>

    <!-- Instructions -->
    <div in:fade={{ duration: 600, delay: 800 }}>
      <Card.Root class="mt-8 bg-white/80 backdrop-blur-sm">
        <Card.Content class="p-6">
          <h3 class="mb-3 text-lg font-semibold text-gray-800">How to Play</h3>
          <ul class="space-y-2 text-sm text-gray-600">
            <li class="flex items-start">
              <span class="mr-2 text-blue-500">•</span>
              Click on a tile adjacent to the empty space to move it
            </li>
            <li class="flex items-start">
              <span class="mr-2 text-blue-500">•</span>
              Arrange the tiles in order from 1 to 15 with the empty space at the bottom right
            </li>
            <li class="flex items-start">
              <span class="mr-2 text-blue-500">•</span>
              Try to solve it in as few moves as possible!
            </li>
          </ul>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</div>
