import mongoose from 'mongoose';

const spotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for this spot.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a description for this spot.'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  type: {
    type: String,
    enum: ['skatepark', 'street', 'diy'],
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for geospatial queries
spotSchema.index({ location: '2dsphere' });

export default mongoose.models.Spot || mongoose.model('Spot', spotSchema); 