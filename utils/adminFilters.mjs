export const adminSections = {
  users: { label: 'Users', states: ['active', 'suspended', 'deleted'] },
  properties: { label: 'Listings', states: ['draft', 'pending', 'active', 'rejected', 'rented', 'removed'] },
  verifications: { label: 'Verification', states: ['pending', 'approved', 'rejected', 'suspended'] },
  reports: { label: 'Scam reports', states: ['open', 'in-review', 'resolved', 'dismissed'] },
  audit: { label: 'Audit log', states: ['applied', 'attempted', 'unavailable'] },
};

export function adminFilters(params) {
  const section = params.get('section') || 'all';
  const status = params.get('status') || '';
  const search = (params.get('search') ?? '').trim();
  const page = params.get('page') ?? '1';
  if ((section !== 'all' && !Object.hasOwn(adminSections, section)) || (status && !adminSections[section]?.states.includes(status)) ||
    search.length > 80 || !/^[1-9]\d{0,2}$/.test(page) || Number(page) > 200) return null;
  return { section, status, search, page: Number(page), size: 15 };
}
