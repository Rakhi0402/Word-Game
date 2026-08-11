// Run: node --experimental-strip-types src/constants/authValidation.test.ts
// or: npx tsx src/constants/authValidation.test.ts
import {
  validateUsername,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateRegisterForm,
  validateLoginForm,
} from './authValidation.ts';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(validateUsername('ab').ok === false, 'username too short');
assert(validateUsername('Rakhi').ok === true, 'username ok');
assert(validateUsername('1bad').ok === false, 'username must start with letter');
assert(validateUsername('Young Panda').ok === false, 'username no spaces');
assert(validateEmail('bad').ok === false, 'email bad');
assert(validateEmail('a@b.com').ok === true, 'email ok');
assert(validatePassword('short1A').ok === false, 'password length');
assert(validatePassword('alllowercase1').ok === false, 'password needs upper');
assert(validatePassword('ALLUPPERCASE1').ok === false, 'password needs lower');
assert(validatePassword('NoDigitsHere').ok === false, 'password needs digit');
assert(validatePassword('StrongPass1').ok === true, 'password ok');
assert(validateConfirmPassword('StrongPass1', 'StrongPass1').ok === true, 'confirm ok');
assert(validateConfirmPassword('StrongPass1', 'other').ok === false, 'confirm mismatch');
assert(validateRegisterForm('Rakhi', 'a@b.com', 'StrongPass1', 'StrongPass1').ok === true, 'register ok');
assert(validateLoginForm('a@b.com', 'x').ok === true, 'login ok');
assert(validateLoginForm('', '').ok === false, 'login empty');

console.log('authValidation tests passed');
