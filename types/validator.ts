/**
 * Conexiaa Validator Types
 *
 * Generic validation contracts used by forms, API input sanitisation,
 * and runtime schema validation (e.g., Zod).  Keeps validation logic
 * consistent across the entire application.
 */

// ─── Single field error ────────────────────────────────────────────────
export interface ValidationError {
  /** The path to the field (e.g., "email" or "contact.name") */
  field: string;
  /** Human‑readable error message */
  message: string;
  /** Optional error code for i18n / custom handling */
  code?: string;
}

// ─── Validation result ────────────────────────────────────────────────
export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
}

// ─── Validator function type ──────────────────────────────────────────
/**
 * A validator function that receives the whole data object (or primitive)
 * and returns a promise‑based validation result.
 */
export type Validator<T = unknown> = (data: T) => Promise<ValidationResult>;

// ─── Synchronous validator (for pure functions) ──────────────────────
export type SyncValidator<T = unknown> = (data: T) => ValidationResult;

// ─── Validation rule (used in schema definitions) ────────────────────
export interface ValidationRule<T = unknown> {
  /** Rule name for identification */
  name: string;
  /** The actual check function */
  validate: (value: T, allData?: Record<string, unknown>) => boolean | Promise<boolean>;
  /** Error message when the rule fails */
  message: string;
  /** Optional severity */
  severity?: "error" | "warning";
}

// ─── Schema validator (combines multiple rules per field) ────────────
export interface SchemaValidator<T extends Record<string, unknown>> {
  /** Validate the entire object and return a result */
  validate(data: T): Promise<ValidationResult>;
  /** Add a rule to a specific field */
  addRule(field: keyof T, rule: ValidationRule): void;
  /** Remove a rule by name */
  removeRule(field: keyof T, ruleName: string): void;
}

// ─── Common pre‑defined validators (used in login/register forms) ────

export const emailValidator: SyncValidator<string> = (email: string) => {
  const errors: ValidationError[] = [];
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({
      field: "email",
      message: "Please enter a valid email address.",
      code: "invalid_email",
    });
  }
  return { success: errors.length === 0, errors };
};

export const passwordValidator: SyncValidator<string> = (password: string) => {
  const errors: ValidationError[] = [];
  if (password.length < 6) {
    errors.push({
      field: "password",
      message: "Password must be at least 6 characters.",
      code: "min_length",
    });
  }
  return { success: errors.length === 0, errors };
};

export const nameValidator: SyncValidator<string> = (name: string) => {
  const errors: ValidationError[] = [];
  if (name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Name must be at least 2 characters.",
      code: "min_length",
    });
  }
  return { success: errors.length === 0, errors };
};