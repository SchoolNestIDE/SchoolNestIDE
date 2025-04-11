use:
`const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });`

monaco editor:
```
<MonacoEditor
            language="java"
            theme="vs-dark"
            onChange={(value) => handleEditorChange(value)}
            options={{ automaticLayout: true }}
          />
```

handle editor change:
```
const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setFiles({ ...files, [activeFile]: value });
  };
```

Main.java:
```
public class Main {
    public static void main(String[] args) {
        Class cl = new Class(4,5);

        System.out.println(cl.produce());
    }
}
```

Class.java:
```
public class Class {
    int a;
    int b;
    public Class(int a_new, int b_new){
        a = a_new;
        b = b_new;
    }

    public int produce(){
        return a * b;
    }
}
```

user input:
```
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scan = new Scanner(System.in);

        System.out.println("my number:" + scan.nextInt());
    }
}
```


test new
```
import java.io.IOException;
import java.util.Scanner;

public class Main {

    public static void main(String args[]){
        Scanner scan = new Scanner(System.in);

        System.out.println("test test yay add input:");

        int a = scan.nextInt();

        System.out.println("nice!: "a);
    }
}
```


custom file input class (my inputs)
```
import java.io.*;
import java.lang.reflect.*;

public class CustomFileInputStream extends InputStream {
    public CustomFileInputStream() throws IOException { 
        super();
    }

    @Override
    public int available() throws IOException {
        return 0;
    }

    @Override 
    public int read() {
        return 0;
    }

    @Override
    public int read(byte[] b, int o, int l) throws IOException {
        while (true) {
            // Block until the textbox has content
            String cInpStr = getCurrentInputString();
            if (cInpStr.length() != 0) {
                // Read the textbox as bytes
                byte[] data = cInpStr.getBytes();
                int len = Math.min(l - o, data.length);
                System.arraycopy(data, 0, b, o, len);
                // Clears input string
                clearCurrentInputString();
                return len;
            }
            // Wait before checking again
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                throw new IOException("Interrupted", e);
            }
        }
    }

    @Override
    public int read(byte[] b) throws IOException {
        return read(b, 0, b.length);
    }

    // Implemented in JavaScript
    public static native String getCurrentInputString();
    public static native void clearCurrentInputString();

    // Main method to invoke user's main method
    public static void main(String[] args) {
        try {
            // Set the custom InputStream as the standard input
            System.setIn(new CustomFileInputStream());

            // Invoke main method in the user's main class

            System.out.println(args[0]);
            // Class<?> clazz = Class.forName(args[0]);
            // Method method = clazz.getMethod("main", String[].class);
            // method.invoke(null, (Object) new String[]{});

            Main clazz2 = new Main();
            Main.main(new String[0]);

        // } catch (InvocationTargetException e) {
        //     e.getTargetException().printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}

```