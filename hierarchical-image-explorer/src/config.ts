import { SettingsObject, ShapeType } from './types';

export const DEFAULT_NUM_COLUMNS = 12;
export const DEFAULT_SHAPE_TYPE = ShapeType.Square;

export const SERVER_ADDRESS = 'http://localhost:25679/';

export const DEFAULT_SETTINGS: SettingsObject = {
  columns: DEFAULT_NUM_COLUMNS,
  shapeType: DEFAULT_SHAPE_TYPE,
};
