import Link from "next/link"
import { getAllPosts } from "@/app/lib/mdx"

export default function BlogIndex() {
    const posts = getAllPosts()

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Blog Posts</h1>
            <ul className="space-y-4">
                {posts.map((post) => (
                    <li key={post.slug}>
                        <Link href={`/blog/${post.slug}`} className="text-blue-600 hover:text-blue-800">
                            <h2 className="text-xl font-semibold">{post.meta.title}</h2>
                        </Link>
                        <p className="text-gray-600">{post.meta.date}</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}
