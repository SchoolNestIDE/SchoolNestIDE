// something where i can open different projects here
// opens a new tab, but passes in a parameter that specifies the project
// create template projects

export default function Page() {
    return (
        <>
            <button className="border-2 border-black bg-white hover:bg-gray-200 text-black font-bold py-2 px-4 rounded">
                spin up a new project
                <a href="/studenthome/java/ide"><h1>lalala</h1></a>
            </button>

            <div>   
                projects listed here (limit 10)
            </div>

            <div>
                template projects listed here
            </div>

            <div>
                your classes listed here
            </div>

        </>
    );
}