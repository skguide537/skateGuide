import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import { ActivityDocument, ActivityModel, ActivityTargetType, ActivityType } from '@/models/activity.model';

export interface RecordActivityParams {
  type: ActivityType;
  actorUserId: string;
  targetType: ActivityTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
}

export async function recordActivity(params: RecordActivityParams): Promise<ActivityDocument> {
  await connectToDatabase();
  const document = await ActivityModel.create({
    ...params,
    actorUserId: new mongoose.Types.ObjectId(params.actorUserId),
    targetId: new mongoose.Types.ObjectId(params.targetId),
  });
  return document;
}


