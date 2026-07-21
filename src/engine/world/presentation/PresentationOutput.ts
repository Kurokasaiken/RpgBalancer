import {
  PresentationOutputSchema,
  type PresentationOutput,
  type Camera,
  type LayerOffset,
} from './types';

export { PresentationOutputSchema, type PresentationOutput, type Camera, type LayerOffset };

/**
 * Create an empty `PresentationOutput` that satisfies the schema.
 */
export function createEmptyPresentationOutput(): PresentationOutput {
  return PresentationOutputSchema.parse({});
}
