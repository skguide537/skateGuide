import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        maxlength: [60, 'Name cannot be more than 60 characters'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    photoUrl: {
        type: String,
        default: 'https://res.cloudinary.com/dcncqacrd/image/upload/v1747641626/users/default-user.png',
    },
    photoId: {
        type: String,
        default: 'users/default-user',
    },
    favorites: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Skatepark',
        default: [],
    },
    bio: {
        type: String,
        maxlength: [500, 'Bio cannot exceed 500 characters'],
        default: '',
    },
    instagram: {
        type: String,
        maxlength: [100, 'Instagram handle too long'],
        default: '',
    },
    tiktok: {
        type: String,
        maxlength: [100, 'TikTok handle too long'],
        default: '',
    },
    youtube: {
        type: String,
        maxlength: [100, 'YouTube handle too long'],
        default: '',
    },
    website: {
        type: String,
        maxlength: [200, 'Website URL too long'],
        default: '',
    },

});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema); 