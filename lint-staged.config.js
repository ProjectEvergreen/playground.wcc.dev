export default {
  "*.js": ["npm run lint --"],
  "*.ts": ["npm run lint --", "npm run check --"],
  "*.*": ["npm run format --"],
};
