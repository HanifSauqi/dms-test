import { z } from 'zod';

/**
 * Document title validation schema
 */
export const documentTitleSchema = z.object({
  title: z
    .string()
    .min(1, 'Document title is required')
    .max(200, 'Document title must be less than 200 characters')
    .trim(),
});

/**
 * Document update schema
 */
export const updateDocumentSchema = z.object({
  title: z
    .string()
    .min(1, 'Document title is required')
    .max(200, 'Document title must be less than 200 characters')
    .trim(),
});

/**
 * Search query validation
 */
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query must be less than 100 characters')
    .trim(),
});

/**
 * Validate document title
 * @param {string} title - Document title to validate
 * @returns {{success: boolean, error?: string}} Validation result
 */
export function validateDocumentTitle(title) {
  try {
    documentTitleSchema.parse({ title });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid document title',
      };
    }
    return { success: false, error: 'Validation error' };
  }
}

/**
 * Validate search query
 * @param {string} query - Search query to validate
 * @returns {{success: boolean, error?: string}} Validation result
 */
export function validateSearchQuery(query) {
  try {
    searchQuerySchema.parse({ query });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid search query',
      };
    }
    return { success: false, error: 'Validation error' };
  }
}
