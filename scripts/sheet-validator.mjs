import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const schemaPath = path.join(rootDir, 'schema', 'sheet-schema.json');
export const sheetSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

export function canTransition(currentStatus, nextStatus) {
  const allowed = sheetSchema.statusLifecycle.transitions[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

export function validateRow(row) {
  const errors = [];
  const columns = sheetSchema.tabs.Workouts.columns;

  for (const col of columns) {
    const val = row[col.name];
    if (col.name === 'Status') {
      if (!col.enum.includes(val)) {
        errors.push(`Invalid Status: "${val}". Allowed: ${col.enum.join(', ')}`);
      }
    } else if (col.name === 'Template' && val) {
      if (!col.enum.includes(val)) {
        errors.push(`Invalid Template: "${val}". Allowed: ${col.enum.join(', ')}`);
      }
    } else if (col.name === 'ScheduledDate' && val) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        errors.push(`Invalid ScheduledDate format: "${val}". Expected YYYY-MM-DD.`);
      }
    } else if (col.name === 'Payload' && val) {
      try {
        JSON.parse(val);
      } catch (err) {
        errors.push(`Payload is not valid JSON: ${err.message}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
