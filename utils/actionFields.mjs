const actions = definitions => Object.fromEntries(Object.entries(definitions).map(([action, fields]) => [action, ['action', ...fields.split(' ').filter(Boolean)]]));

export const accountFields = actions({
  register: 'name role email password token',
  forgot: 'email token', resend: 'email token', reset: 'password token', verify: 'token',
  profile: 'name notifications', password: 'current password', delete: 'current confirmation',
});

export const workspaceFields = actions({
  'notification-read': 'id', 'notifications-read': '',
  'listing-status': 'id status', verification: 'name statement', 'viewing-update': 'id status',
  message: 'id message', 'thread-read': 'id', 'enquiry-status': 'id status',
  enquiry: 'property message', viewing: 'property date time message', report: 'property reason description',
});
