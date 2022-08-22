import { Writable, writable } from 'svelte/store';
import type { HexagonPropertiesMap, QuantizationResults } from './types';

export const currentQuantization: Writable<null | QuantizationResults> =
  writable(null);
export const hexagonPropertiesMap: Writable<HexagonPropertiesMap> = writable({
  color: 'd => op.any(d.label)',
  representantID: 'd => op.mode(d.label)',
});
export const colorPropertyType: Writable<string> = writable('');
export const selectedColorPalette: Writable<string> = writable('');
