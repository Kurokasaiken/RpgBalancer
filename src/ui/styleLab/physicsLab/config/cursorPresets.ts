/**
 * Cursor preset schema for Physics Lab
 */

export interface CursorPresetSchema {
  id: string;
  name: string;
  cursor: string;
  trail: {
    length: number;
    decay: number;
    color: string;
  };
}
