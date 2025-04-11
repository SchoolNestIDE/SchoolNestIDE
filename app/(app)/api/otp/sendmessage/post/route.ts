import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
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

    const email: string = session.user.email;



    // const body = await req.json()
    // const email: string = body.email;



    const client = await clientPromise;
    const db = client.db('schoolcentral');
    const collection = db.collection('otp');

    const existing = await collection.findOne({ email });

    if (existing) {
        const now = new Date().getTime();
        const created = new Date(existing.createdAt).getTime();
        const diffMs = now - created;

        // 60,000ms = 1 minute
        if (diffMs < 60000) {
            return NextResponse.json({ message: 'Please wait at least 1 minute before requesting a new OTP.' });
        }
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    await collection.updateOne(
        { email },
        {
            $set: {
                email,
                otpCode,
                createdAt: new Date()
            }
        },
        { upsert: true }
    );

    // const transporter = nodemailer.createTransport({
    //     service: "gmail",
    //     auth: {
    //         user: process.env.EMAIL_USER,
    //         pass: process.env.EMAIL_PASS,
    //     },
    // });

    const transporter = nodemailer.createTransport({
        pool: true,
        host: "secure342.inmotionhosting.com",
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
        dkim: {
            domainName: "schoolnest.org",
            keySelector: "default",
            privateKey: `${process.env.DKIM_PRIVATE_KEY}`,
        },
    });

    transporter.verify(function (error, success) {
        if (error) {
            console.log(error);
        } else {
            console.log("Server is ready to take our messages");
        }
    });

    const subject = "SchoolNest Email Verification";
    const messageContent = `Thank you for verifying your SchoolNest account. Your OTP is ${otpCode}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        text: messageContent,
        html: emailTemplate({ subject, content: messageContent }),
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email successfully sent' });
}