package com.kungfu.wordquest.common.exception;

public class ConflictException extends BusinessException {

    public ConflictException(ErrorCode code, String message) {

        super(code, message);
    }
}