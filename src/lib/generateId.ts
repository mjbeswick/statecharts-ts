export function generateId() {
  return crypto.randomUUID().slice(0, 8);
}
