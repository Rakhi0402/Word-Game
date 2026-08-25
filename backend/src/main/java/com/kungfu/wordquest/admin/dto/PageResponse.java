package com.kungfu.wordquest.admin.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class PageResponse<T> {
    java.util.List<T> content;
    int page;
    int size;
    long totalElements;
    int totalPages;
}
