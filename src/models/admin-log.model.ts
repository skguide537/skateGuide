import mongoose, { Document, Model } from 'mongoose';

export type AdminLogCategory = 'auth_failure' | 'api_error' | 'rate_limit';

export interface AdminLogDocument extends Document {
  category: AdminLogCategory;
  message: string;
  context?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}

const AdminLogSchema = new mongoose.Schema<AdminLogDocument>(
  {
    category: {
      type: String,
      enum: ['auth_failure', 'api_error', 'rate_limit'],
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    context: {
      type: String,
      maxlength: 120,
    },
    details: {
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

AdminLogSchema.index({ createdAt: -1 });
AdminLogSchema.index({ category: 1, createdAt: -1 });

export const AdminLogModel: Model<AdminLogDocument> =
  mongoose.models.AdminLog || mongoose.model<AdminLogDocument>('AdminLog', AdminLogSchema);


