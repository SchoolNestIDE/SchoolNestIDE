//afaik, these schemas dont even do anything. keep anyways for now

import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    school_abbr: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
    }
});

const User = models.User || mongoose.model('User', userSchema, 'users');

export default User;