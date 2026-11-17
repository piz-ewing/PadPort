package pl.padport.app;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.net.Uri;
import android.provider.DocumentsContract;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/**
 * SAF tree of the game folder. Keeps an index of document IDs, not a second copy of the game.
 * Games are only read; the one exception is {@link #delete}, used for PC-only runtime files
 * after the user confirmed the list (PcRuntimeFiles).
 */
final class GameSource {
    final Context context;
    final Uri tree;
    final String id;
    String title,engine,prefix="";
    /** RPG Maker XP/VX/VX Ace (RGSS): executable base name and RGSS version; null/0 for MV/MZ. */
    String exec;
    int rgss;
    private String archivePath;
    final Map<String,Entry> entries=new LinkedHashMap<>();
    final Map<String,String> caseIndex=new HashMap<>();
    record Entry(String documentId,long size,long offset) {
        Entry(String documentId,long size){this(documentId,size,-1);}
    }
    private record Dir(String id,String path) {}

    GameSource(Context c,Uri uri) throws Exception {
        context=c;tree=uri;
        byte[] digest=MessageDigest.getInstance("SHA-256").digest(uri.toString().getBytes(StandardCharsets.UTF_8));
        StringBuilder name=new StringBuilder();
        for(int i=0;i<12;i++) name.append(String.format(Locale.ROOT,"%02x",digest[i]));
        id=name.toString();
    }
    String origin() {return "https://g"+id+".padport.local";}
    void scan() throws Exception {
        entries.clear();caseIndex.clear();
        ContentResolver resolver=context.getContentResolver();
        ArrayDeque<Dir> queue=new ArrayDeque<>();
        queue.add(new Dir(DocumentsContract.getTreeDocumentId(tree),""));
        Set<String> visited=new HashSet<>();
        while(!queue.isEmpty()) {
            Dir dir=queue.remove();
            if(!visited.add(dir.id())) continue;
            Uri children=DocumentsContract.buildChildDocumentsUriUsingTree(tree,dir.id());
            String[] columns={DocumentsContract.Document.COLUMN_DOCUMENT_ID,DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                DocumentsContract.Document.COLUMN_MIME_TYPE,DocumentsContract.Document.COLUMN_SIZE};
            try(Cursor cursor=resolver.query(children,columns,null,null,null)) {
                if(cursor==null) throw new IOException(AppLanguage.text(context,R.string.folder_read_error));
                while(cursor.moveToNext()) {
                    String doc=cursor.getString(0), name=cursor.getString(1), type=cursor.getString(2);
                    String path=dir.path()+name;
                    if(DocumentsContract.Document.MIME_TYPE_DIR.equals(type)) queue.add(new Dir(doc,path+"/"));
                    else {
                        entries.put(path,new Entry(doc,cursor.isNull(3)?-1:cursor.getLong(3)));
                        String lower=path.toLowerCase(Locale.ROOT);
                        if(caseIndex.containsKey(lower)) caseIndex.put(lower,"");
                        else caseIndex.put(lower,path);
                    }
                }
            }
        }
        prefix="";exec=null;rgss=0;archivePath=null;
        if(find("index.html")==null && find("www/index.html")==null) {
            RgssGame.Info info=RgssGame.detect(new RgssGame.Files(){
                public Collection<String> paths(){return entries.keySet();}
                public byte[] read(String path) throws IOException {return GameSource.this.read(path,1024*1024);}
            });
            if(info!=null) {
                exec=info.exec();rgss=info.version();engine=info.engine();title=info.title();
                saveIndex();
                return;
            }
        }
        if(find("index.html")==null) {
            if(find("www/index.html")!=null) prefix="www/";
            else if(!indexArchive()) throw new IOException(AppLanguage.text(context,R.string.index_missing));
        }
        engine=find(prefix+"js/rmmz_core.js")!=null?"MZ":find(prefix+"js/rpg_core.js")!=null?"MV":null;
        if(engine==null) throw new IOException(AppLanguage.text(context,R.string.unsupported_engine));
        JSONObject system=new JSONObject(new String(read("data/System.json",8*1024*1024),StandardCharsets.UTF_8));
        title=system.optString("gameTitle","RPG Maker "+engine);
        if(title.trim().isEmpty()) title="RPG Maker "+engine;
        saveIndex();
    }
    private boolean indexArchive() throws IOException {
        String candidate=null;
        for(String path:entries.keySet()) {
            if(!path.equalsIgnoreCase("app.asar") && !path.equalsIgnoreCase("resources/app.asar")) continue;
            if(candidate!=null) throw new IOException("Multiple app.asar archives; select the resources folder");
            candidate=path;
        }
        if(candidate==null)return false;
        Entry archive=entries.get(candidate);
        AsarArchive index;
        try(InputStream in=open(archive)){index=AsarArchive.read(in,archive.size());}
        String root=index.gameRoot();
        Map<String,Entry> members=new LinkedHashMap<>();
        for(var item:index.files().entrySet()) {
            AsarArchive.Member member=item.getValue();
            Entry entry;
            if(member.unpackedPath()!=null) {
                Entry sidecar=find(candidate+".unpacked/"+member.unpackedPath());
                if(sidecar==null || (sidecar.size()>=0 && sidecar.size()!=member.size()))
                    throw new IOException("ASAR unpacked file is missing or has changed: "+item.getKey());
                entry=new Entry(sidecar.documentId(),member.size());
            } else entry=new Entry(archive.documentId(),member.size(),member.offset());
            members.put(candidate+"/"+item.getKey(),entry);
        }
        archivePath=candidate;prefix=candidate+"/"+root;
        for(var item:members.entrySet())putEntry(item.getKey(),item.getValue());
        // Check random access now, before accepting a provider that cannot seek.
        try(InputStream ignored=open("index.html")){}
        return true;
    }
    private void putEntry(String path,Entry entry) {
        entries.put(path,entry);
        String lower=path.toLowerCase(Locale.ROOT);
        if(caseIndex.containsKey(lower))caseIndex.put(lower,"");else caseIndex.put(lower,path);
    }
    /** Manual writes target a real folder, never an archive's virtual web root. */
    String writablePrefix(){return archivePath==null?prefix:"";}
    private Entry find(String name) {
        Entry entry=entries.get(name);
        if(entry!=null) return entry;
        String original=caseIndex.get(name.toLowerCase(Locale.ROOT));
        return original==null || original.isEmpty()?null:entries.get(original);
    }
    Entry entry(String relative) {
        String path=prefix+AssetPaths.normalize(relative);
        Entry result=find(path);
        return result!=null?result:find(AssetPaths.audioFallback(path));
    }
    String mimePath(String relative) {
        String path=prefix+AssetPaths.normalize(relative);
        return find(path)!=null?path:AssetPaths.audioFallback(path);
    }
    InputStream open(String relative) throws IOException {
        Entry entry=entry(relative);
        if(entry==null) throw new FileNotFoundException(relative);
        return open(entry);
    }
    InputStream open(Entry entry) throws IOException {
        Uri uri=DocumentsContract.buildDocumentUriUsingTree(tree,entry.documentId());
        if(entry.offset()>=0) {
            AssetFileDescriptor descriptor=context.getContentResolver().openAssetFileDescriptor(uri,"r");
            if(descriptor==null)throw new IOException("Cannot open ASAR archive");
            FileInputStream in=null;
            try {
                long start=descriptor.getStartOffset(),length=descriptor.getLength();
                if(start>Long.MAX_VALUE-entry.offset() || entry.size()<0
                    || entry.offset()>Long.MAX_VALUE-entry.size()
                    || (length>=0 && entry.offset()+entry.size()>length))
                    throw new IOException("ASAR member exceeds document bounds");
                in=descriptor.createInputStream();
                return AsarArchive.slice(in,start+entry.offset(),entry.size());
            } catch(IOException | RuntimeException error) {
                try{if(in!=null)in.close();else descriptor.close();}catch(IOException close){error.addSuppressed(close);}
                throw error;
            }
        }
        InputStream stream=context.getContentResolver().openInputStream(uri);
        if(stream==null) throw new IOException(AppLanguage.text(context,R.string.file_open_error,entry.documentId()));
        return stream;
    }
    byte[] read(String relative,int limit) throws IOException {
        try(InputStream in=open(relative)) {return readBounded(context,in,limit);}
    }
    byte[] browserFont(String relative) throws IOException {
        return FontCollection.matches(relative) ? FontCollection.firstFace(read(relative,FontCollection.LIMIT)) : null;
    }
    /** The first {@code count} bytes (fewer for shorter files). */
    byte[] head(String relative,int count) throws IOException {
        try(InputStream in=open(relative)) {
            byte[] buffer=new byte[count];int total=0,n;
            while(total<count&&(n=in.read(buffer,total,count-total))!=-1)total+=n;
            return Arrays.copyOf(buffer,total);
        }
    }
    static byte[] readBounded(InputStream in,int limit) throws IOException {
        return readBounded(null,in,limit);
    }
    static byte[] readBounded(Context context,InputStream in,int limit) throws IOException {
        ByteArrayOutputStream out=new ByteArrayOutputStream();
        byte[] buffer=new byte[16384];int n;
        while((n=in.read(buffer))!=-1) {
            if(out.size()+n>limit) throw new IOException(context==null?"File exceeds limit of "+limit+" bytes":AppLanguage.text(context,R.string.file_too_large,limit));
            out.write(buffer,0,n);
        }
        return out.toByteArray();
    }
    JSONObject metadata() throws Exception {
        JSONObject result=new JSONObject().put("id",id).put("uri",tree.toString()).put("title",title).put("engine",engine).put("prefix",prefix);
        if(exec!=null) result.put("exec",exec).put("rgss",rgss);
        if(archivePath!=null)result.put("archive",archivePath);
        return result;
    }
    /** Indexed files: path relative to the picked folder -> size in bytes (-1 if unknown). */
    Map<String,Long> sizes(){
        Map<String,Long> result=new LinkedHashMap<>();
        for(var e:entries.entrySet())if(!archiveResource(e.getKey()))result.put(e.getKey(),e.getValue().size());
        return result;
    }
    private boolean archiveResource(String path){
        return archivePath!=null && (path.equals(archivePath)||path.startsWith(archivePath+"/")||path.startsWith(archivePath+".unpacked/"));
    }
    /** Deletes indexed files; returns the paths that could not be deleted. Call scan() afterwards. */
    List<String> delete(List<String> paths){
        List<String> failed=new ArrayList<>();
        ContentResolver resolver=context.getContentResolver();
        for(String path:paths){
            Entry entry=entries.get(path);
            if(entry==null)continue;
            if(archiveResource(path)||entry.offset()>=0){failed.add(path);continue;}
            try{
                if(!DocumentsContract.deleteDocument(resolver,DocumentsContract.buildDocumentUriUsingTree(tree,entry.documentId())))failed.add(path);
            }catch(Exception e){failed.add(path);}
        }
        return failed;
    }
    boolean isRgss(){return exec!=null;}
    int rgssVersion(){return rgss;}
    private File indexFile() {return new File(context.getFilesDir(),"index-"+id+".json");}
    private void saveIndex() throws Exception {
        JSONObject obj=metadata();JSONArray files=new JSONArray();
        for(var e:entries.entrySet()) {
            JSONArray row=new JSONArray().put(e.getKey()).put(e.getValue().documentId()).put(e.getValue().size());
            if(e.getValue().offset()>=0)row.put(e.getValue().offset());
            files.put(row);
        }
        obj.put("files",files);
        File tmp=new File(indexFile()+".tmp");
        try(OutputStream out=new FileOutputStream(tmp)) {out.write(obj.toString().getBytes(StandardCharsets.UTF_8));}
        java.nio.file.Files.move(tmp.toPath(),indexFile().toPath(),java.nio.file.StandardCopyOption.REPLACE_EXISTING);
    }
    static GameSource restore(Context c,JSONObject metadata) throws Exception {
        GameSource s=new GameSource(c,Uri.parse(metadata.getString("uri")));
        JSONObject index;
        try(InputStream in=new FileInputStream(s.indexFile())) {index=new JSONObject(new String(readBounded(c,in,32*1024*1024),StandardCharsets.UTF_8));}
        s.title=index.getString("title");s.engine=index.getString("engine");s.prefix=index.getString("prefix");
        s.exec=index.has("exec")?index.getString("exec"):null;s.rgss=index.optInt("rgss",0);
        s.archivePath=index.has("archive")?index.getString("archive"):null;
        JSONArray files=index.getJSONArray("files");
        for(int i=0;i<files.length();i++) {
            JSONArray entry=files.getJSONArray(i);String path=entry.getString(0);
            s.putEntry(path,new Entry(entry.getString(1),entry.getLong(2),entry.optLong(3,-1)));
        }
        // Fail early for revoked folder permissions, instead of leaving a black screen.
        try(InputStream ignored=s.open(s.isRgss()?s.exec+".ini":"index.html")) { }
        return s;
    }
}
