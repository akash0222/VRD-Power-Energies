import bcrypt from 'bcryptjs';
const password = process.argv[2];
if (!password || password.length < 14) {
  console.error('Usage: node src/hash-password.js "a-unique-password-at-least-14-characters"');
  process.exit(1);
}
console.log(await bcrypt.hash(password, 12));
