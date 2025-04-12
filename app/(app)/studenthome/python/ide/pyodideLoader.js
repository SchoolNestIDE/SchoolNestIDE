// Copyright 2017-2022 Leaning Technologies Ltd
if (!self.cj3LoaderPath) {

    function assert(cond) {
        if (!cond)
            debugger;
    }

    var cj3LoaderPath = cj3InitPath();
    var cj3Module = null;

    // Function to get the current script file path
    function cj3GetCurrentScript() {
        try {
            throw new Error();
        }
        catch (e) {
            var stack = e.stack;
        }
        var part = cj3GetStackEntry(stack);
        var loaderStart = part.indexOf("http://");
        if (loaderStart == -1)
            loaderStart = part.indexOf("https://");
        if (loaderStart == -1)
            loaderStart = part.indexOf("chrome-extension://");
        var loaderEnd = part.indexOf(".js");
        if (!(loaderStart >= 0 && loaderEnd > 0)) debugger;
        return part.substring(loaderStart, loaderEnd + 3);
    }

    // Function to initialize Pyodide (instead of cj3.js and Java)
    function cj3InitPath() {
        var loaderFile = cj3GetCurrentScript();
        return loaderFile.substr(0, loaderFile.length - "/cj3loader.js".length);
    }

    async function initializePyodide() {
        const pyodide = await loadPyodide();
        return pyodide;
    }

    // Function to run Python code using Pyodide
    async function runPythonCode(pyodide, code) {
        try {
            const result = await pyodide.runPythonAsync(code);
            return result;
        } catch (error) {
            console.error("Python execution failed: ", error);
            return `Error: ${error}`;
        }
    }

    async function cj3LoadImpl(options) {
        cj3Loaded = 1;
        var resolveFunc = null;
        var rejectFunc = null;
        var ret = new Promise(function (s, j) {
            resolveFunc = s;
            rejectFunc = j;
        });

        // Load Pyodide instead of CheerpJ
        const pyodide = await initializePyodide();
        const code = 'print("Hello, this is Python running on Pyodide!")';  // Example Python code
        const result = await runPythonCode(pyodide, code);

        console.log("Python Result: ", result);  // Display the result in the console

        // Expose functions for running Python
        self.runPython = async (pythonCode) => {
            return await runPythonCode(pyodide, pythonCode);
        };

        resolveFunc();

        return ret;
    }

    // Setup mutation observer and interaction logic
    var cj3Loaded = 0;
    var cj3AppletObserver = null;
    var cj3InjectInFrames = false;
    var cj3PendingReplace = [];
    var cj3PendingOnload = null;

    function cj3AttachBodyObserver(appletRunnerMode) {
        if (cj3AppletObserver == null)
            cj3AppletObserver = new MutationObserver(cj3MutationObserver);
        if (!document.body) {
            window.addEventListener("DOMContentLoaded", function () { cj3AttachBodyObserver(appletRunnerMode); });
            return;
        }
        cj3AppletObserver.observe(document, { subtree: true, childList: true });
        var elemNames = ["applet", "cheerpj-applet", "object", "cheerpj-object", "embed", "cheerpj-embed"];
        for (var i = 0; i < elemNames.length; i++) {
            var elems = document.getElementsByTagName(elemNames[i]);
            for (var j = 0; j < elems.length; j++)
                cj3PendingReplace.push(elems[j]);
        }
        cj3InjectInFrames = appletRunnerMode;
    }

    function cheerpjInit(options) {
        if (cj3Module)
            throw new Error("CheerpJ: Already initialized");
        if (self.window)
            cj3AttachBodyObserver(false);
        return cj3LoadImpl(options);
    }

    // Function to inject loader script for Pyodide
    function cj3InjectLoader(p) {
        if (document.getElementById("cjLoader")) {
            if (self.hasOwnProperty("cj3AttachBodyObserver"))
                cj3AttachBodyObserver(true);
            return;
        }
        var s = document.createElement("script");
        s.src = p + "/cj3loader.js";
        s.id = "cjLoader";
        s.onload = function (e) {
            cj3AttachBodyObserver(true);
        };
        document.head.insertBefore(s, document.head.firstChild);
    }

    // Load Python using Pyodide directly in the browser
    function cj3InjectInFrame(f, scriptText) {
        f.addEventListener("load", function () { cj3InjectInFrame(f, scriptText); });
        if (f.contentDocument == null) {
            return;
        }
        if (f.contentDocument.readyState != "loading") {
            var s = f.contentDocument.createElement("script");
            s.textContent = scriptText;
            f.contentDocument.head.appendChild(s);
        }
        else {
            f.contentDocument.addEventListener("DOMContentLoaded", function (e) {
                var s = e.target.createElement("script");
                s.textContent = scriptText;
                e.target.head.appendChild(s);
            });
        }
    }

    // Initialize the Python runtime when the page is loaded
    window.onload = async function () {
        await cheerpjInit({ version: 8 });
        console.log("Python environment initialized!");
    };

}
