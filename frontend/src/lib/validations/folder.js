import { z } from 'zod';

/**
 * Folder name validation schema
 */
export const folderNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .regex(/^[^<>:"/\\|?*]+$/, 'Folder name contains invalid characters'),
});

/**
 * Folder creation schema
 */
export const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .regex(/^[^<>:"/\\|?*]+$/, 'Folder name contains invalid characters')
    .trim(),
  parentId: z.number().int().positive().optional().nullable(),
});

/**
 * Folder update schema
 */
export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1, 'Folder name is required')
    .max(100, 'Folder name must be less than 100 characters')
    .regex(/^[^<>:"/\\|?*]+$/, 'Folder name contains invalid characters')
    .trim(),
});

/**
 * Validate folder name
 * @param {string} name - Folder name to validate
 * @returns {{success: boolean, error?: string}} Validation result
 */
export function validateFolderName(name) {
  try {
    folderNameSchema.parse({ name });
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || 'Invalid folder name',
      };
    }
    return { success: false, error: 'Validation error' };
  }
}
