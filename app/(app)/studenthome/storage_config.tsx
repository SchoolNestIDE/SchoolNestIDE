interface Project {
    projectName: string,
    projectType: "python"|"cpp"|"linux"|"java",
    githubUsername: string|null,
    githubRepo: string|null,
    githubBranch: string|null
    toBeDeleted:boolean
}
interface StorageType {
    projects: Project[],
    organization: string
}
export type {Project, StorageType}