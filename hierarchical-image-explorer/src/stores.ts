import { Writable, writable } from 'svelte/store';
import type { HexagonPropertiesMap, QuantizationResults } from './types';

export const currentQuantization: Writable<null | QuantizationResults> =
  writable(null);
export const hexagonPropertiesMap: Writable<HexagonPropertiesMap> = writable({
  color: 'd => op.any(d.id)',
  representantID: 'd => op.mode(d.id)',
});
export const colorQueryMaxima: Writable<{min:number,max:number}> = writable({min:0,max:0})
export const colorPropertyType: Writable<string> = writable('');
export const selectedColorPalette: Writable<string> = writable('');
