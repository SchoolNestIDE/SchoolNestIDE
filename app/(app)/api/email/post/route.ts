// /api/email

// email daniel everytime someone fills out the ambassador form

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from "next/server";
// import { authOptions } from '../../auth/[...nextauth]/route';
import { authOptions } from '@/app/(app)/lib/auth';
import clientPromise from '@/app/lib/mongodb';
import axios from 'axios';

interface Data {
    message?: string;
}

export async function POST(req: NextRequest, res: NextResponse<Data>) {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const formData = await req.formData();

    const gRecaptchaToken = formData.get('gRecaptchaToken');

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


    const web3formskey = process.env.WEB3_FORMS_API_KEY;

    // Append your access_key securely
    formData.append('access_key', `${web3formskey}`);

    formData.delete('gRecaptchaToken');

    const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    return NextResponse.json(data);

}