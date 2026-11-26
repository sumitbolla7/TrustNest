import { Schema, model, models } from 'mongoose';

const id = { type: Schema.Types.ObjectId, required: true };
const timestamps = { timestamps: true };
const define = (name, fields, indexes = []) => {
  const schema = new Schema(fields, timestamps);
  for (const [keys, options] of indexes) schema.index(keys, options);
  return models[name] || model(name, schema);
};
const status = (values, initial) => ({ type: String, enum: values, default: initial, required: true });
export const Conversation = define('Conversation', { property: id, tenant: id, landlord: id, status: status(['open', 'answered', 'closed'], 'open') }, [
  [{ property: 1, tenant: 1, landlord: 1 }, { unique: true }], [{ tenant: 1, updatedAt: -1 }], [{ landlord: 1, updatedAt: -1 }],
]);
export const ThreadMessage = define('ThreadMessage', { conversation: id, sender: id, recipient: id, body: { type: String, required: true, maxlength: 4000 }, readAt: Date }, [[{ conversation: 1, createdAt: -1 }], [{ recipient: 1, readAt: 1 }]]);
export const Viewing = define('Viewing', { property: id, tenant: id, landlord: id, date: String, time: String, message: String, status: status(['pending', 'accepted', 'declined', 'cancelled', 'completed'], 'pending') }, [[{ tenant: 1, createdAt: -1 }], [{ landlord: 1, createdAt: -1 }]]);
export const Verification = define('Verification', { landlord: id, name: String, statement: String, status: status(['pending', 'approved', 'rejected', 'suspended'], 'pending') }, [[{ landlord: 1 }, { unique: true }], [{ status: 1, updatedAt: -1 }]]);
export const ScamReport = define('ScamReport', { reporter: id, property: id, reason: String, description: String, status: status(['open', 'in-review', 'resolved', 'dismissed'], 'open') }, [[{ reporter: 1, property: 1 }, { unique: true }], [{ status: 1, updatedAt: -1 }]]);
export const Notification = define('Notification', { user: id, label: String, href: String, readAt: Date }, [[{ user: 1, readAt: 1, createdAt: -1 }]]);
export const AdminAudit = define('AdminAudit', { administrator: id, target: id, action: String, status: String, outcome: String }, [[{ createdAt: -1 }]]);
