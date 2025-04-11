// ngl i think we need both mongodb and mongodb2

import mongoose from 'mongoose';

const uri = "mongodb+srv://atharun:SchoolNestClientProject@schoolnestclientcluster.slnat0f.mongodb.net/?retryWrites=true&w=majority&appName=SchoolNestClientCluster"

export const connectMongoDB = async () => {
    try {
        await mongoose.connect(uri);
        console.log("MongoDB connected");
    } catch (error) {
        console.log("Error connecting to MongoDB: ", error);
    }
}
