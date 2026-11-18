package pl.padport.app;

import java.util.LinkedHashMap;
import java.util.Map;

final class RuntimeLog {
    private final LinkedHashMap<String, Long> messages = new LinkedHashMap<>();
    private final LinkedHashMap<String, Long> errors = new LinkedHashMap<>();

    synchronized boolean add(String text, boolean error) {
        String message = text.length() > 8192 ? text.substring(0, 8192) : text;
        Map<String, Long> entries = error ? errors : messages;
        long count = entries.getOrDefault(message, 0L) + 1;
        entries.put(message, count);
        int limit = error ? 24 : 96;
        if (entries.size() > limit) entries.remove(entries.keySet().iterator().next());
        return (count & (count - 1)) == 0;
    }

    synchronized String report() {
        StringBuilder report = new StringBuilder();
        append(report, errors);
        append(report, messages);
        return report.toString();
    }

    private static void append(StringBuilder report, Map<String, Long> entries) {
        entries.forEach((message, count) -> {
            if (report.length() > 0) report.append('\n');
            report.append(message);
            if (count > 1) report.append(" [x").append(count).append(']');
        });
    }
}
