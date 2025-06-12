interface PyPIJsonAPI {
    info: {
        author?: string;
        author_email?: string;
        bugtrack_url: string;
        classifiers: string[];
        description: string;
        description_content_type:string;

    };
    releases: {
        [version: string]: {
            comments_text: string;
            digests: {
                blake2b_256: string,
                md5: string,
                sha256: string
            },
            downloads: number,
            filename: string,
            has_sig: boolean,
            md6_digest: string,
            package_type: string,
            url: string
        }[]
    }
}

// only relevant entires are listed in pypijsonapi