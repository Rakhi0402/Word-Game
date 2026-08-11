package com.kungfu.wordquest.common.exception;

public class UnauthorizedException extends BusinessException {

    public UnauthorizedException(String message) {
        super(ErrorCode.INVALID_TOKEN, message);
    }

    public UnauthorizedException(ErrorCode code, String message) {
        super(code, message);
    }
}
