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

        // const data = await user_collection.find({ email: session.user?.email }).toArray();

        const body = await req.json();
        const project_name_body = body.project_name;

        // const files = await user_collection.find({"$and":[{ email: session.user?.email }, { java_projects: { $elemMatch: { project_name: project_name } } }]}).toArray();

        const userDocument = await user_collection.findOne(
            {
                email: session.user.email,
                'java_projects.project_name': project_name_body,
            },
            {
                projection: {
                    _id: 0,
                    'java_projects.$': 1,
                },
            }
        );

        if (!userDocument || !userDocument.java_projects) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            );
        }

        const project = userDocument.java_projects[0];

        // Return the project data
        return NextResponse.json({ project });
    }
    else {
        return NextResponse.json({ message: 'Not authenticated' });
    }
}

