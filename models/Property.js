import { Schema, model, models } from 'mongoose';

const PropertySchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    location: {
      street: {
        type: String,
      },
      city: {
        type: String,
      },
      county: String,
      town_key: String,
      eircode: String,
      state: {
        type: String,
      },
      zipcode: {
        type: String,
      },
    },
    beds: {
      type: Number,
      required: true,
    },
    baths: {
      type: Number,
      required: true,
    },
    furnishing: { type: String, enum: ["Furnished", "Unfurnished", "Part-furnished"] },
    availability: String,
    shared: Boolean,
    student: Boolean,
    is_demo: { type: Boolean, default: false },
    demoKey: String,
    square_metres: Number,
    square_feet: Number,
    amenities: [
      {
        type: String,
      },
    ],
    rates: {
      nightly: {
        type: Number,
      },
      weekly: {
        type: Number,
      },
      monthly: {
        type: Number,
      },
    },
    seller_info: {
      name: {
        type: String,
      },
      email: {
        type: String,
      },
      phone: {
        type: String,
      },
    },
    images: [
      {
        type: String,
      },
    ],
    is_featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

PropertySchema.index({ createdAt: -1, _id: -1 });
PropertySchema.index({ 'location.county': 1, createdAt: -1, _id: -1 });
PropertySchema.index({ 'location.county': 1, 'location.town_key': 1 });
PropertySchema.index({ 'rates.monthly': 1, _id: 1 });
PropertySchema.index({ is_featured: 1, createdAt: -1, _id: -1 });
PropertySchema.index({ demoKey: 1 }, { unique: true, sparse: true });

const Property = models.Property || model('Property', PropertySchema);

export default Property;
