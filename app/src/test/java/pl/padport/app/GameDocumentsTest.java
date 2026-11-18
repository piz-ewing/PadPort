package pl.padport.app;

import org.junit.Test;
import java.nio.file.FileAlreadyExistsException;
import java.util.ArrayList;
import java.util.List;
import static org.junit.Assert.*;

public class GameDocumentsTest {
    @Test public void directoryLookupPreservesExactCaseAndRejectsAmbiguousNames() throws Exception {
        var first = new GameDocuments.Document("first", "Image.png", false, 8, 1);
        var second = new GameDocuments.Document("second", "image.png", false, 9, 2);
        var unique = new GameDocuments.Document("unique", "Audio.ogg", false, 10, 3);
        var directory = new GameDocuments.Directory(List.of(first, second, unique));
        assertSame(first, directory.child("Image.png"));
        assertSame(second, directory.child("image.png"));
        assertSame(unique, directory.child("AUDIO.OGG"));
        assertNull(directory.child("missing"));
        assertThrows(FileAlreadyExistsException.class, () -> directory.child("IMAGE.PNG"));
    }

    @Test public void largeDirectoryUsesOneImmutableIndexForRepeatedAssetLookups() throws Exception {
        var documents = new ArrayList<GameDocuments.Document>();
        for (int i = 0; i < 10000; i++)
            documents.add(new GameDocuments.Document("id" + i, "Image" + i + ".png", false, i, 0));
        var directory = new GameDocuments.Directory(documents);
        documents.clear();
        for (int i = 0; i < 10000; i++) assertEquals(i, directory.child("IMAGE" + i + ".PNG").size());
        assertEquals(10000, directory.documents.size());
    }
}
