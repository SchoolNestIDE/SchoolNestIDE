

export default function LegalSidebar() {
    return (
        <div className="w-1/4 p-4 bg-white text-black rounded-2xl shadow-lg sticky top-0 h-screen border-2 border-gray-300 dark:border-gray-700 dark:bg-black dark:text-white">
            <h2 className="text-xl font-bold mb-4">POLICIES</h2>
            <ul className="space-y-2">
                <li>
                    <a
                        href="/legal/privacy"
                        className="w-full text-left p-2 hover:bg-gray-200 rounded block dark:hover:bg-gray-700"
                    >
                        Privacy Policy
                    </a>
                </li>
                <li>
                    <a
                        href="/legal/tos"
                        className="w-full text-left p-2 hover:bg-gray-200 rounded block dark:hover:bg-gray-700"
                    >
                        Terms of Service
                    </a>
                </li>
                <li>
                    <a
                        href="/legal/cookie"
                        className="w-full text-left p-2 hover:bg-gray-200 rounded block dark:hover:bg-gray-700"
                    >
                        Cookie Policy
                    </a>
                </li>
                <li>
                    <a
                        href="/legal/aup"
                        className="w-full text-left p-2 hover:bg-gray-200 rounded block dark:hover:bg-gray-700"
                    >
                        Acceptable Use Policy
                    </a>
                </li>
            </ul>
        </div>
    )
}