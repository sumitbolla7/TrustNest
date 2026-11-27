import test from 'node:test';
import assert from 'node:assert/strict';
import { searchReturn } from '../utils/searchReturn.mjs';
import { adminFilters } from '../utils/adminFilters.mjs';

test('rental back links keep valid filters and reject external paths', () => {
  assert.equal(searchReturn('/properties?county=Dublin&page=2&view=list'), '/properties?county=Dublin&page=2&view=list');
  for (const invalid of ['//example.test', '/dashboard', '/properties?county=Unknown', '/properties?view=invalid', '/properties#anchor']) {
    assert.equal(searchReturn(invalid), '/properties');
  }
});
test('administrator pagination bounds pages, scope and status', () => {
  assert.equal(adminFilters(new URLSearchParams('section=properties&status=pending&page=2')).page, 2);
  for (const invalid of ['section=other', 'section=properties&status=deleted', 'page=201', 'page=1.5']) {
    assert.equal(adminFilters(new URLSearchParams(invalid)), null);
  }
});
