// app/api/get_settings

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from "next/server";
// import { authOptions } from '../../auth/[...nextauth]/route';
import { authOptions } from '@/app/(app)/lib/auth';

import clientPromise from '@/app/lib/mongodb';

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

    if (session?.user.role !== 'student') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session) {

        const client = await clientPromise;
        const db = client.db('schoolcentral');
        const user_collection = db.collection('users');

        const data = await user_collection.find({ email: session.user?.email }).toArray();

        return NextResponse.json({ firstname: data[0].firstname, lastname: data[0].lastname });
    }
    else {
        return NextResponse.json({ message: 'Not authenticated' });
    }
}

