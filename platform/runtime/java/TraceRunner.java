import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.lang.reflect.*;
import java.util.*;
import javax.tools.*;

/** Compiles and executes one submission in the disposable browser JVM. */
public class TraceRunner {
    static class BoundedOutput extends OutputStream {
        final ByteArrayOutputStream bytes=new ByteArrayOutputStream();
        public void write(int b){if(bytes.size()<16000)bytes.write(b);}
        public void write(byte[] b,int off,int len){bytes.write(b,off,Math.min(len,Math.max(0,16000-bytes.size())));}
        public String toString(){return new String(bytes.toByteArray(),StandardCharsets.UTF_8);}
    }
    @SuppressWarnings("unchecked") public static void main(String[] args) throws Exception {
        if(args.length==2&&args[0].equals("--cleanup")){
            Path root=Paths.get(args[1]);
            if(root.getFileName().toString().startsWith("trace-"))try(java.util.stream.Stream<Path> paths=Files.walk(root)){paths.sorted(Comparator.reverseOrder()).forEach(p->{try{Files.deleteIfExists(p);}catch(IOException ignored){}});}
            return;
        }
        Path directory=Paths.get(args[2]);Files.createDirectories(directory);
        Path source=directory.resolve("Solution.java");Files.copy(Paths.get(args[0]),source,StandardCopyOption.REPLACE_EXISTING);
        Trace.frames.clear();Trace.steps=0;Trace.frameBytes=0;Trace.truncated=false;
        BoundedOutput output=new BoundedOutput();Object result=null;String error=null;int errorLine=0;
        PrintStream originalOut=System.out,originalErr=System.err;
        try {
            JavaCompiler compiler=ToolProvider.getSystemJavaCompiler();
            if(compiler==null)compiler=(JavaCompiler)Class.forName("com.sun.tools.javac.api.JavacTool").newInstance();
            if(compiler==null)throw new IllegalStateException("Java compiler could not load.");
            DiagnosticCollector<JavaFileObject> diagnostics=new DiagnosticCollector<>();
            try(StandardJavaFileManager files=compiler.getStandardFileManager(diagnostics,null,StandardCharsets.UTF_8)) {
                StringWriter messages=new StringWriter();
                boolean success=compiler.getTask(messages,files,diagnostics,Arrays.asList("-g","-encoding","UTF-8","-proc:none","-d",directory.toString(),"-classpath",System.getProperty("java.class.path")),null,files.getJavaFileObjects(source.toFile())).call();
                if(!success){StringBuilder errors=new StringBuilder();for(Diagnostic<?> d:diagnostics.getDiagnostics())if(d.getKind()==Diagnostic.Kind.ERROR){if(errorLine==0)errorLine=(int)d.getLineNumber();errors.append("Solution.java:").append(d.getLineNumber()).append(": ").append(d.getMessage(Locale.ENGLISH)).append('\n');}error=errors.toString();}
            }
            if(error==null){
                System.setOut(new PrintStream(output,true,"UTF-8"));System.setErr(new PrintStream(output,true,"UTF-8"));
                Map<String,Object> input=(Map<String,Object>)Trace.parse(new String(Files.readAllBytes(Paths.get(args[1])),StandardCharsets.UTF_8));
                try(URLClassLoader loader=new URLClassLoader(new URL[]{directory.toUri().toURL()},TraceRunner.class.getClassLoader())) {
                    Class<?> solution=Class.forName("Solution",true,loader);Method solve=solution.getMethod("solve",Map.class);
                    result=solve.invoke(Modifier.isStatic(solve.getModifiers())?null:solution.newInstance(),input);
                }
            }
        }catch(Throwable exception){Throwable cause=exception instanceof InvocationTargetException?exception.getCause():exception;error=cause.toString();for(StackTraceElement entry:cause.getStackTrace())if("Solution.java".equals(entry.getFileName())){errorLine=entry.getLineNumber();break;}}
        finally{System.setOut(originalOut);System.setErr(originalErr);}
        String encoded;
        try{encoded=Trace.json(result);}catch(Throwable e){encoded="null";error=e.toString();}
        String run="{\"frames\":["+String.join(",",Trace.frames)+"],\"result\":"+encoded+",\"stdout\":"+Trace.json(output.toString())+",\"truncated\":"+Trace.truncated+",\"error\":"+Trace.json(error)+",\"errorLine\":"+errorLine+"}";
        Files.write(directory.resolve("result.json"),run.getBytes(StandardCharsets.UTF_8));
        // Only this run's unique directory is removed; the result is read by JS.
        try(java.util.stream.Stream<Path> paths=Files.walk(directory)){paths.sorted(Comparator.reverseOrder()).filter(p->!p.equals(directory)&&!p.getFileName().toString().equals("result.json")).forEach(p->{try{Files.deleteIfExists(p);}catch(IOException ignored){}});}
    }
}
