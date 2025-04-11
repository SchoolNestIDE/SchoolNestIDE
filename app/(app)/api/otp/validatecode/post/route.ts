import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from "next/server";
// import { authOptions } from '../../auth/[...nextauth]/route';
import { authOptions } from '@/app/(app)/lib/auth';
import clientPromise from '@/app/lib/mongodb';
import nodemailer from "nodemailer";
import { emailTemplate } from '@/app/lib/emailTemplate';


interface Data {
    message?: string;
}

export async function POST(req: NextRequest, res: NextResponse<Data>) {
    const session = await getServerSession(
        req as unknown as NextApiRequest,
        {
            ...res,
            getHeader: (name: string) => res.headers?.get(name),
            setHeader: (name: string, value: string) => res.headers?.set(name, value),
        } as unknown as NextApiResponse,
        authOptions
    )

    if (!session || !session.user || !session.user.email) {
        return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 });
    }

    // if theres a document that has the same email and the otp code is the same as the document, set the "emailIsVerified" field to true
    const email: string = session.user.email;
    const client = await clientPromise;
    const db = client.db('schoolcentral');
    const collection = db.collection('otp');

    const body = await req.json();

    const document = await collection.findOne({ email, otpCode: body.otp });

    if (document) {
        await collection.updateOne(
            { email },
            {
                $set: {
                    emailIsVerified: true
                }
            }
        );

    }

    return NextResponse.json({ message: 'Email verified' });


}