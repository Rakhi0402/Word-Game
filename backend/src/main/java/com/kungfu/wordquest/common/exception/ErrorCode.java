package com.kungfu.wordquest.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    USER_NOT_FOUND(HttpStatus.NOT_FOUND),

    PUZZLE_NOT_FOUND(HttpStatus.NOT_FOUND),

    CARD_NOT_FOUND(HttpStatus.NOT_FOUND),

    ACHIEVEMENT_NOT_FOUND(HttpStatus.NOT_FOUND),

    INVALID_TOKEN(HttpStatus.UNAUTHORIZED),

    ACCESS_DENIED(HttpStatus.FORBIDDEN),

    VALIDATION_ERROR(HttpStatus.BAD_REQUEST),

    DUPLICATE_RESOURCE(HttpStatus.CONFLICT),

    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }
}