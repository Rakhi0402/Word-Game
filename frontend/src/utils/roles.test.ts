import assert from 'node:assert/strict';
import { isAdmin } from './roles';

assert.equal(isAdmin('ROLE_ADMIN'), true);
assert.equal(isAdmin('ADMIN'), true);
assert.equal(isAdmin('admin'), true);
assert.equal(isAdmin('ROLE_USER'), false);
assert.equal(isAdmin(undefined), false);
assert.equal(isAdmin(null), false);

console.log('roles.isAdmin ok');
