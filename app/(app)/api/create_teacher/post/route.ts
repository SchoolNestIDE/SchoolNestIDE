import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from "next/server";
// import { authOptions } from '../../auth/[...nextauth]/route';
import { authOptions } from '@/app/(app)/lib/auth';
import clientPromise from '@/app/lib/mongodb';
import bcrypt from 'bcrypt';
import axios from 'axios';

interface Data {
    message?: string;
}

export async function POST(req: NextRequest, res: NextResponse<Data>) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    const body = await req.json();
    const { firstname, lastname, job, schoolemail, email, schoolname, password, gRecaptchaToken } = body;

    // google recaptcha verification
    if (!gRecaptchaToken) {
        return NextResponse.json({ message: 'Recaptcha token missing' }, { status: 400 });
    }

    const url = `secret=${secretKey}&response=${gRecaptchaToken}`;

    let resp;

    try {
        resp = await axios.post(
            "https://www.google.com/recaptcha/api/siteverify",
            url,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
                }
            }
        );
    } catch (error) {
        return NextResponse.json({ message: 'Recaptcha verification failed' }, { status: 400 });
    }

    if (resp && resp.data?.success && resp.data?.score > 0.5) {
    } else {
        console.log("resp.data?.score", resp.data?.score);
        return NextResponse.json({ message: 'Recaptcha verification failed' }, { status: 400 });
    }
    // google recaptcha verification



    if (!firstname || !lastname || !job || !schoolemail || !email || !schoolname || !password) {
        return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    try {
        const client = await clientPromise;
        const db = client.db('schoolcentral');
        const user_collection = db.collection('users');
        const schools_collection = db.collection('schools');

        // Check if user already exists
        const existingUser = await user_collection.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const school_abbr = schoolname.split(':')[0].toLowerCase();

        console.log('school_abbr', school_abbr);

        const schoolnameExists = await schools_collection.findOne({ school_abbr });

        if (!schoolnameExists) {
            return NextResponse.json({ message: 'School does not exist' }, { status: 404 });
        }

        // Insert new student
        await user_collection.insertOne({
            firstname,
            lastname,
            job,
            schoolemail,
            email,
            schoolname,
            school_abbr,
            password: hashedPassword, // Store hashed password
            role: 'educator',
            emailIsVerified: false,
        });

        return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
