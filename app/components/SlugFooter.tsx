export default function SlugFooter() {
    return (
        <footer className="text-white pb-2 px-12 flex flex-col md:flex-row items-center relative">
            <div className="bg-[#ffffff11] backdrop-blur-lg rounded-lg inline-block max-w-max">
                <p className="text-sm mx-fit p-2 px-3 text-green-500">⬤ All systems normal</p>
                {/* <p className="text-sm mx-fit p-2 px-3 text-yellow-500">⬤ Denial of Service Attack</p> */}
                {/* <p className="text-sm mx-fit p-2 px-3 text-red-500">⬤ Load Issues</p> */}
            </div>
            <div className="md:absolute md:pt-0 pt-3 md:left-1/2 md:transform md:-translate-x-1/2 text-center text-gray-700">
                <p className="text-sm">schoolnest.org is not responsible for the content displayed on this page. Email schoolnestcontact@gmail.com to report abuse.</p>
            </div>
            <div className="md:ml-auto md:pt-0 pt-3 text-gray-700">
                <p className="text-sm">© 2024 schoolnest.org</p>
            </div>
        </footer>
    )
}
