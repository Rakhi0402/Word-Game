package com.kungfu.wordquest.common.exception;

public class ValidationException extends  BusinessException{
    public ValidationException(String message){
        super(ErrorCode.VALIDATION_ERROR, message);
    }
}
