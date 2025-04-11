// app/api/save_files

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

interface ProjectData {
    project_name: string;
    files: { 
        filename: string;
        contents: string;
    }[];
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

        const body = await req.json();

        console.log('body', body);

        // const projectData = {
        //     project_name: body.project,
        //     files: Object.entries(body.files).map(([filename, contents]) => ({
        //         filename,
        //         contents,
        //     })),
        // };

        const projectData : ProjectData = {
            project_name: body.project,
            files: body.files
        };

        // Update the project in java_projects array
        const result = await user_collection.updateOne(
            {
                email: session.user.email,
                'java_projects.project_name': projectData.project_name,
            },
            {
                $set: {
                    'java_projects.$': projectData,
                },
            }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json(
                { error: 'Project not found or not updated' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: 'Project updated successfully' },
            { status: 200 }
        );
    }
    else {
        return NextResponse.json({ message: 'Not authenticated' });
    }
}

