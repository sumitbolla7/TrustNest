export const reportReasons = [
  'Suspiciously low rent', 'Deposit before viewing', 'Fake photographs', 'Suspected impersonation',
  'Suspicious payment request', 'Duplicate listing', 'Misleading property information', 'Other suspicious activity',
];

export function viewingTransition(role, next) {
  const transitions = {
    tenant: { cancelled: ['pending', 'accepted'] },
    landlord: { accepted: ['pending'], declined: ['pending'], completed: ['accepted'] },
  };
  return Object.hasOwn(transitions, role) && Object.hasOwn(transitions[role], next) ? transitions[role][next] : null;
}
