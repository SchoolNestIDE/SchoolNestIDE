interface Project {
    projectName: string,
    projectType: "python"|"cpp"|"linux"|"java",
    githubUsername: string,
    githubRepo: string
}
interface StorageType {
    projects: Project[],
    organization: string
}
export type {Project, StorageType}