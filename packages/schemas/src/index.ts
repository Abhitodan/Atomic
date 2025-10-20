import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import changeSpecSchema from './changespec.schema.json';
import missionSchema from './mission.schema.json';

// Initialize AJV with schemas
const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

// Compile validators
export const validateChangeSpec: ValidateFunction = ajv.compile(changeSpecSchema);
export const validateMission: ValidateFunction = ajv.compile(missionSchema);

// Export schemas
export { changeSpecSchema, missionSchema };

// Utility functions
export function isValidChangeSpec(data: unknown): boolean {
  return validateChangeSpec(data);
}

export function isValidMission(data: unknown): boolean {
  return validateMission(data);
}

export function getChangeSpecErrors() {
  return validateChangeSpec.errors || [];
}

export function getMissionErrors() {
  return validateMission.errors || [];
}
