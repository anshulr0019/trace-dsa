import java.util.*;
import java.lang.reflect.Array;

/** JSON input helpers and explicit visual checkpoints available to Solution. */
public class Trace {
    static final List<String> frames = new ArrayList<>();
    static boolean truncated;
    static int steps;
    static long frameBytes;
    public static Map<String,Object> state(Object... pairs) {
        Map<String,Object> map = new LinkedHashMap<>();
        for (int i=0;i+1<pairs.length;i+=2) map.put(String.valueOf(pairs[i]),pairs[i+1]);
        return map;
    }
    public static void trace(Object... pairs) { traceAt(0,pairs); }
    public static void traceAt(int line,Object... pairs) {
        if (++steps>30000) throw new IllegalStateException("Execution stopped after 30,000 checkpoints.");
        if (frames.size()>=1200 || frameBytes>4000000) {truncated=true;return;}
        StackTraceElement caller=Thread.currentThread().getStackTrace()[2];
        String frame=json(state("line",line>0?line:caller.getLineNumber(),"event","checkpoint","function",caller.getMethodName(),"stack",Collections.emptyList(),"vars",state(pairs)));
        frames.add(frame);frameBytes+=frame.length();
    }
    public static int integer(Object value) { return value instanceof Number ? ((Number)value).intValue() : Integer.parseInt(value.toString()); }
    public static int num(Map<String,Object> data,String key) {return integer(data.get(key));}
    public static String str(Map<String,Object> data,String key) {return (String)data.get(key);}
    @SuppressWarnings("unchecked") public static List<Object> list(Object value) {return (List<Object>)value;}
    public static int[] ints(Object value) {List<Object> a=list(value);int[] out=new int[a.size()];for(int i=0;i<out.length;i++)out[i]=integer(a.get(i));return out;}
    public static int[] ints(Map<String,Object> data,String key) {return ints(data.get(key));}
    public static int[][] matrix(Map<String,Object> data,String key) {List<Object> a=list(data.get(key));int[][] out=new int[a.size()][];for(int i=0;i<out.length;i++)out[i]=ints(a.get(i));return out;}
    public static String[] strings(Map<String,Object> data,String key) {List<Object> a=list(data.get(key));return a.toArray(new String[0]);}
    public static String json(Object value) {StringBuilder out=new StringBuilder();encode(value,out,new IdentityHashMap<Object,Boolean>(),0);return out.toString();}
    private static void encode(Object value,StringBuilder out,IdentityHashMap<Object,Boolean> seen,int depth) {
        if(out.length()>5000000)throw new IllegalArgumentException("JSON output exceeded 5 MB.");
        if(value==null){out.append("null");return;}
        if(value instanceof Number){double n=((Number)value).doubleValue();if(Double.isInfinite(n)||Double.isNaN(n))quote(value.toString(),out);else out.append(value);return;}
        if(value instanceof Boolean){out.append(value);return;}
        if(value instanceof CharSequence||value instanceof Character){quote(value.toString(),out);return;}
        if(depth>40||seen.containsKey(value)){quote("<cyclic or deeply nested object>",out);return;}
        seen.put(value,true);
        if(value instanceof Map){out.append('{');boolean first=true;for(Map.Entry<?,?> e:((Map<?,?>)value).entrySet()){if(!first)out.append(',');first=false;quote(String.valueOf(e.getKey()),out);out.append(':');encode(e.getValue(),out,seen,depth+1);}out.append('}');}
        else if(value instanceof Iterable){out.append('[');boolean first=true;for(Object v:(Iterable<?>)value){if(!first)out.append(',');first=false;encode(v,out,seen,depth+1);}out.append(']');}
        else if(value.getClass().isArray()){out.append('[');for(int i=0;i<Array.getLength(value);i++){if(i>0)out.append(',');encode(Array.get(value,i),out,seen,depth+1);}out.append(']');}
        else quote("<"+value.getClass().getSimpleName()+">",out);
        seen.remove(value);
    }
    private static void quote(String value,StringBuilder out){out.append('"');for(int i=0;i<value.length();i++){char c=value.charAt(i);switch(c){case '"':out.append("\\\"");break;case '\\':out.append("\\\\");break;case '\n':out.append("\\n");break;case '\r':out.append("\\r");break;case '\t':out.append("\\t");break;default:if(c<32)out.append(String.format("\\u%04x",(int)c));else out.append(c);}}out.append('"');}
    public static Object parse(String text){return new Parser(text).parse();}
    private static class Parser {
        final String s;int i;
        Parser(String text){s=text;}
        void ws(){while(i<s.length()&&Character.isWhitespace(s.charAt(i)))i++;}
        Object parse(){Object v=value();ws();if(i!=s.length())throw new IllegalArgumentException("Invalid JSON");return v;}
        Object value(){ws();char c=s.charAt(i++);if(c=='"')return string();if(c=='{'){Map<String,Object> m=new LinkedHashMap<>();ws();if(s.charAt(i)=='}'){i++;return m;}while(true){ws();if(s.charAt(i++)!='"')throw new IllegalArgumentException("Invalid JSON key");String k=string();ws();if(s.charAt(i++)!=':')throw new IllegalArgumentException("Invalid JSON object");m.put(k,value());ws();c=s.charAt(i++);if(c=='}')return m;if(c!=',')throw new IllegalArgumentException("Invalid JSON object");}}
            if(c=='['){List<Object>a=new ArrayList<>();ws();if(s.charAt(i)==']'){i++;return a;}while(true){a.add(value());ws();c=s.charAt(i++);if(c==']')return a;if(c!=',')throw new IllegalArgumentException("Invalid JSON array");}}
            int start=i-1;while(i<s.length()&&",]} \t\r\n".indexOf(s.charAt(i))<0)i++;String token=s.substring(start,i);if(token.equals("null"))return null;if(token.equals("true"))return true;if(token.equals("false"))return false;if(token.contains(".")||token.contains("e")||token.contains("E"))return Double.valueOf(token);return Long.valueOf(token);}
        String string(){StringBuilder out=new StringBuilder();while(i<s.length()){char c=s.charAt(i++);if(c=='"')return out.toString();if(c=='\\'){c=s.charAt(i++);switch(c){case 'u':c=(char)Integer.parseInt(s.substring(i,i+4),16);i+=4;break;case 'n':c='\n';break;case 'r':c='\r';break;case 't':c='\t';break;case 'b':c='\b';break;case 'f':c='\f';break;}}out.append(c);}throw new IllegalArgumentException("Unterminated JSON string");}
    }
}
