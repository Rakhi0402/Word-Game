package com.kungfu.wordquest.dictionary;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Explicit dictionary import via {@code --import-dictionary}.
 * Optional one-time seed when DB is empty ({@code wordquest.dictionary.seed-if-empty=true}).
 */
@Component
@Order(50)
@RequiredArgsConstructor
@Slf4j
public class DictionaryBootstrapRunner implements ApplicationRunner {

    private final DictionaryImportService importService;
    private final DictionaryService dictionaryService;
    private final DictionaryProperties properties;

    @Override
    public void run(ApplicationArguments args) {
        if (!properties.isEnabled()) {
            log.info("Word Quest dictionary disabled");
            return;
        }

        boolean cliImport = properties.isImportOnCommand()
                && args.containsOption("import-dictionary");

        if (cliImport) {
            DictionaryImportResult result = importService.importFromConfiguredSource();
            log.info("CLI dictionary import finished: accepted={}", result.getAccepted());
            return;
        }

        if (properties.isSeedIfEmpty() && dictionaryService.allowedCount() == 0) {
            log.info("Dictionary empty — seeding from {} (source={} {})",
                    properties.getPath(), properties.getSource(), properties.getSourceVersion());
            importService.importFromConfiguredSource();
        } else if (!dictionaryService.hasActiveVersion(properties.getSourceVersion())) {
            log.warn(
                    "No dictionary rows for configured sourceVersion={} (allowed words={}). "
                            + "Run with --import-dictionary after placing ESDB/SCOWL at wordquest.dictionary.path",
                    properties.getSourceVersion(),
                    dictionaryService.allowedCount());
        } else {
            log.info("Dictionary ready: {} allowed words (version={})",
                    dictionaryService.allowedCount(), properties.getSourceVersion());
        }
    }
}
