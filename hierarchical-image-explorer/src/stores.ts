import { Writable, writable } from 'svelte/store';
import type {HexagonPropertiesMap, QuantizationResults } from './types';

export const currentQuantization:Writable<null|QuantizationResults> = writable(null)
export const hexagonPropertiesMap:Writable<HexagonPropertiesMap> = writable({color: 'd => op.any(d.id)', representantID: 'd => op.mode(d.id)'})
