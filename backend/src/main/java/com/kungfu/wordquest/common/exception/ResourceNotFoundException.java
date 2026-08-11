package com.kungfu.wordquest.common.exception;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(ErrorCode code, String message) {
        super(code, message);
    }
}