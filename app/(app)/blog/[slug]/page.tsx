import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPosts } from '@/app/lib/mdx'

export async function generateStaticParams() {
    const posts = await getAllPosts()
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
    let post
    try {
        post = await getPostBySlug(params.slug)
    } catch (error) {
        notFound()
    }

    return (
        <article className="prose lg:prose-xl mx-auto py-8">
            <h1>{post.meta.title}</h1>
            <p className="text-gray-500">Published on: {post.meta.date}</p>
            {post.content}
        </article>
    )
}