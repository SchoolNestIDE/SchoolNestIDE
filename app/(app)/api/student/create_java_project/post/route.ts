// app/api/create_java_project

import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { getSession } from 'next-auth/react';
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from '@/app/(app)/lib/auth';

import clientPromise from '@/app/lib/mongodb';

interface Data {
    message?: string;
}

const bigassfile = `/*
CustomFileInputStream.java

System.in is NOT natively supported for this WASM based Java compiler. To support user input through System.in, we pause the Java runtime, pipe user input to a file in the file system, and have System.in read from the file. This file configures System.in and runs the main method of Main.java. You may configure this file to handle System.in differently. When "Run Main.java" is clicked, it runs the main method of this file (which then runs the main method of Main.java).

*/

import java.io.*;
import java.lang.reflect.*;

public class CustomFileInputStream extends InputStream {
    public CustomFileInputStream() throws IOException { 
        super();
    }

    @Override
    public int available() throws IOException {
        return 0;
    }

    @Override 
    public int read() {
        return 0;
    }

    @Override
    public int read(byte[] b, int o, int l) throws IOException {
        while (true) {
            // block until the textbox has content
            String cInpStr = getCurrentInputString();
            if (cInpStr.length() != 0) {
                // read the textbox as bytes
                byte[] data = cInpStr.getBytes();
                int len = Math.min(l - o, data.length);
                System.arraycopy(data, 0, b, o, len);
                // clears input string
                clearCurrentInputString();
                return len;
            }
            // wait before checking again
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                throw new IOException("Interrupted", e);
            }
        }
    }

    @Override
    public int read(byte[] b) throws IOException {
        return read(b, 0, b.length);
    }

    // implemented in JavaScript
    public static native String getCurrentInputString();
    public static native void clearCurrentInputString();

    // main method to invoke user's main method
    public static void main(String[] args) {
        try {
            // set the custom InputStream as the standard input
            System.setIn(new CustomFileInputStream());

            // System.out.println(args[0]);
            // Class<?> clazz = Class.forName(args[0]);
            // Method method = clazz.getMethod("main", String[].class);
            // method.invoke(null, (Object) new String[]{});

            // invoke main method in the user's main class
            // Main clazz2 = new Main();
            Main.main(new String[0]);

        // } catch (InvocationTargetException e) {
        //     e.getTargetException().printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
`;

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

        if (body.template !== 'normal') {
            console.log('unique template');
        }

        const project_name = 'NewProject_' + Math.random().toString(36).substring(7);


        const projectData = {
            project_name: project_name,
            files: [
                { 
                    filename: 'Main.java',
                    contents: 'public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }' 
                },
                { 
                    filename: 'CustomFileInputStream.java',
                    contents: bigassfile 
                }
            ]
        };

        console.log('projectData', projectData)

        // add the project in java_projects array
        const result = await user_collection.updateOne(
            { email: session.user.email },
            {
                $addToSet: {
                    java_projects: projectData,
                    java_project_names: projectData.project_name
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
            { message: 'Project updated successfully', project_name: project_name },
            { status: 200 }
        );
    }
    else {
        return NextResponse.json({ message: 'Not authenticated' });
    }
}

