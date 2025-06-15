import java.io.*;
import java.nio.file.Paths;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import com.sun.tools.javac.Main;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import javax.tools.*;

public class FakeMain {

    // The "virtual current working directory" as a real File/Path



    public static void main(String[] args) throws Exception{
        System.out.println("\nptr\n");
        BufferedReader r = new BufferedReader(new InputStreamReader(System.in));
        String line;
        Base64.Decoder dec = Base64.getDecoder();
        while (true) {
        FileReader fr =new FileReader(new File("/tmp/srvStream"));
        BufferedReader br = new BufferedReader(fr);
        int exitCode = 0;
        try {
            while ((line = br.readLine())!=null) {

                String[] ar = line.split(";");
                String pwd = new String(dec.decode(ar[0]), StandardCharsets.UTF_8);
                ArrayList<String> argsList = new ArrayList<>();
                for (int i = 1; i < ar.length; i++) {
                    String toDecode = ar[i];
                    argsList.add(new String(dec.decode(toDecode), StandardCharsets.UTF_8));
                }

                String outputPath = pwd;
                PrintWriter pw = new PrintWriter(outputPath);
                exitCode = com.sun.tools.javac.Main.compile(argsList.toArray(new String[0]),pw);
                pw.close();

            }
                           fr.close();

        PrintWriter fw = new PrintWriter(new File("/tmp/srvStream"));
        fw.println(exitCode);
        fw.close();
            

        } catch (IOException e) {
            System.err.println("Faced an IO Exception here: " );
            e.printStackTrace();
        }

        }
    }
}