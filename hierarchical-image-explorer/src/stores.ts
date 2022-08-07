import type ColumnTable from 'arquero/dist/types/table/column-table';
import { Writable, writable } from 'svelte/store';
import type { DataHexagon, QuantizationResults } from './types';

export const currentQuantization:Writable<null|QuantizationResults> = writable(null)