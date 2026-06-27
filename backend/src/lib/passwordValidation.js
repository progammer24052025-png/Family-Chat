// ========================================
// PASSWORD VALIDATION UTILITIES
// ========================================
// Centralized password validation rules used across the application.
// Enforces modern security standards for password strength.
// ========================================

/**
 * Validates password strength against security requirements.
 * Requirements:
 *   - Minimum 8 characters
 *   - At least one uppercase letter (A-Z)
 *   - At least one lowercase letter (a-z)
 *   - At least one number (0-9)
 *   - At least one special character (!@#$%^&*...)
 *
 * @param {string} password - The password to validate
 * @returns {{ valid: boolean, message: string }} Validation result
 */
export const validatePassword = (password) => {
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }

  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character (!@#$%^&*...)",
    };
  }

  return { valid: true, message: "Password meets requirements" };
};
