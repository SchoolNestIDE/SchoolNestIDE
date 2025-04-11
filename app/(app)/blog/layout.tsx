import Link from "next/link"

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="max-w-4xl mx-auto px-4">
            <header className="py-8">
                <nav>
                    <Link href="/" className="text-blue-600 hover:text-blue-800">
                        Home
                    </Link>
                    {" | "}
                    <Link href="/blog" className="text-blue-600 hover:text-blue-800">
                        Blog
                    </Link>
                </nav>
            </header>
            <main>{children}</main>
        </div>
    )
}
