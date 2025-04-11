//afaik, these schemas dont even do anything. keep anyways for now

import mongoose, { Schema, models } from "mongoose";

const userSchema = new Schema({
    events: {
        type: Array,
        required: true,
    },
    schedules: {
        type: Array,
        required: true,
    },
    school_abbr: {
        type: String,
        required: true,
    },
    weekly: {
        type: Array,
        required: true,
    },
    outliers: {
        type: Array,
        required: true,
    },
    background: {
        type: String,
        required: true,
    },
    managers: {
        type: Array,
        required: true,
    },
    theme_colors: {
        type: Array,
        required: true,
    },
});

const School = models.School || mongoose.model('School', userSchema, 'schools');

export default School;