import mongoose, { Document, Model } from 'mongoose';

export enum ActivityType {
  PARK_CREATED = 'PARK_CREATED',
  PARK_APPROVED = 'PARK_APPROVED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  USER_DELETED = 'USER_DELETED',
}

export type ActivityTargetType = 'park' | 'comment' | 'user';

export interface ActivityMetadata {
  [key: string]: unknown;
}

export interface ActivityDocument extends Document {
  type: ActivityType;
  actorUserId: mongoose.Types.ObjectId;
  targetType: ActivityTargetType;
  targetId: mongoose.Types.ObjectId;
  metadata?: ActivityMetadata;
  createdAt: Date;
}

const ActivitySchema = new mongoose.Schema<ActivityDocument>(
  {
    type: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['park', 'comment', 'user'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: Object,
      default: undefined,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
    versionKey: false,
  }
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ type: 1, createdAt: -1 });

export const ActivityModel: Model<ActivityDocument> =
  mongoose.models.Activity || mongoose.model<ActivityDocument>('Activity', ActivitySchema);


