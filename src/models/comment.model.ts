import mongoose, { Document } from 'mongoose';

export interface ICommentModel extends Document {
    skateparkId: mongoose.Schema.Types.ObjectId;
    userId: mongoose.Schema.Types.ObjectId;
    body: string;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new mongoose.Schema({
    skateparkId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skatepark',
        required: [true, 'Skatepark ID is required']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    body: {
        type: String,
        required: [true, 'Comment body is required'],
        minlength: [1, 'Comment must be at least 1 character'],
        maxlength: [2000, 'Comment cannot exceed 2000 characters'],
        trim: true
    },
    editedAt: {
        type: Date
    }
}, { 
    timestamps: true, // adds createdAt and updatedAt automatically
    versionKey: false 
});

// Index for efficient queries by skatepark, sorted by newest first
CommentSchema.index({ skateparkId: 1, createdAt: -1 });

// Index for user's comments
CommentSchema.index({ userId: 1, createdAt: -1 });

export const CommentModel = mongoose.models.Comment || mongoose.model<ICommentModel>('Comment', CommentSchema);

