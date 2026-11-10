import {createRoot} from 'react-dom/client';
import type {Root} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {NutritionPanel} from './NutritionPanel.tsx';
import type {NutritionMode} from './NutritionPanel.tsx';
import type {Language, SavedRecipe} from '../../../shared/contracts.ts';
import {createReferenceDialog} from './reference-dialog.js';

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
interface Options {
  storage: Storage;
  getLanguage: () => Language;
  onSaved: (recipe: SavedRecipe, index: number) => void;
  toast: (message: string) => void;
}

// A narrow adapter keeps legacy pages independent of React's rendering lifecycle.
export function createNutritionUI(options: Options) {
  const editor = createReferenceDialog(options);
  let root: Root | null = null;
  let recipe: SavedRecipe | null = null;
  let selected = 1;
  let mode: NutritionMode = 'serving';
  function render() {
    if (!root || !recipe) return;
    const current = recipe;
    flushSync(() => root!.render(<NutritionPanel recipe={current} selected={selected} language={options.getLanguage()} mode={mode}
      onMode={next => {mode = next; render();}} onEdit={index => editor.open(current, index)}/>));
  }
  return {
    mount(element: HTMLElement, next: SavedRecipe, servings: number) {
      root?.unmount();
      root = createRoot(element);
      recipe = next;
      selected = servings;
      render();
    },
    updateServings(servings: number) {selected = servings; render();},
    unmount() {root?.unmount(); root = null; recipe = null;},
  };
}
