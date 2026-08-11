package com.kungfu.wordquest.common;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SPLIT_CHAR = ",";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "";
        }
        return attribute.stream()
                .map(String::trim)
                .collect(Collectors.joining(SPLIT_CHAR));
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            // Mutable — callers may append (e.g. wordsFound.add)
            return new ArrayList<>();
        }
        return Arrays.stream(dbData.split(SPLIT_CHAR))
                .map(String::trim)
                .collect(Collectors.toCollection(ArrayList::new));
    }
}
