// app/api/get_schools

// returns all schools

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from "next/server";
// import { authOptions } from '../../auth/[...nextauth]/route';
import { authOptions } from '@/app/(app)/lib/auth';
import clientPromise from '@/app/lib/mongodb';


interface Data {
    schedules?: Array<any>;
    message?: string;
}

export async function POST(req: NextRequest, res: NextResponse<Data>) {
    
    const client = await clientPromise;
    const db = client.db('schoolcentral');
    const schools = db.collection('verifiedschools');

    const data = await schools.find({}).toArray();

    return NextResponse.json({ schools: data[0].schools });
}