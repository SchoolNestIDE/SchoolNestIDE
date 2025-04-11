import ThemeSwitcher from "./ThemeSwitcher"
import { useTheme } from "next-themes";

export default function HomeHeader() {
    const { systemTheme, theme, setTheme } = useTheme();
    const currentTheme = theme === 'system' ? systemTheme : theme;
    return (
        <nav className="px-4 lg:px-6 py-2.5 bg-[#F9F8F6] dark:bg-black">
            <div className="flex flex-wrap justify-between items-center mx-auto max-w-screen-xl">
                <a href="/" className="flex items-center">
                    <span className="self-center text-xl font-semibold whitespace-nowrap text-black font-mono dark:text-white">schoolnest</span>
                </a>

                <div className="flex items-center lg:order-2">
                    <a href="/login" className="text-white bg-black focus:ring-4  font-semibold rounded-full text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:bg-white dark:text-black">Login</a>
                    {/* <a href="/register" className="text-white bg-black focus:ring-4  font-semibold rounded-full text-sm px-4 lg:px-5 py-2 lg:py-2.5 mr-2 dark:bg-white dark:text-black">Register</a> */}
                    <ThemeSwitcher />
                </div>
            </div>
        </nav>
    )
}
