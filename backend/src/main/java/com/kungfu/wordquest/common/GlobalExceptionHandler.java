package com.kungfu.wordquest.common;

import com.kungfu.wordquest.common.api.ApiError;
import com.kungfu.wordquest.common.api.ApiResponse;
import com.kungfu.wordquest.common.exception.BusinessException;
import com.kungfu.wordquest.common.exception.ErrorCode;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex) {

        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(field ->
                fieldErrors.put(field.getField(), field.getDefaultMessage())
        );

        ApiError apiError = ApiError.builder()
                .code(ErrorCode.VALIDATION_ERROR.name())
                .status(ErrorCode.VALIDATION_ERROR.getStatus().value())
                .message("Validation failed")
                .build();

        return ResponseEntity
                .status(ErrorCode.VALIDATION_ERROR.getStatus())
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Validation failed")
                        .error(apiError)
                        .data(fieldErrors)
                        .build());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        log.warn("Business exception: {}", ex.getMessage());

        ApiError apiError = ApiError.builder()
                .code(ex.getErrorCode().name())
                .status(ex.getErrorCode().getStatus().value())
                .message(ex.getMessage())
                .build();

        return ResponseEntity
                .status(ex.getErrorCode().getStatus())
                .body(ApiResponse.failure(apiError));
    }

    @ExceptionHandler({BadCredentialsException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials() {
        return unauthorized("Invalid email or password", ErrorCode.INVALID_TOKEN);
    }

    @ExceptionHandler({DisabledException.class, LockedException.class})
    public ResponseEntity<ApiResponse<Void>> handleAccountStatus(AuthenticationException ex) {
        return unauthorized(ex.getMessage() != null ? ex.getMessage() : "Account unavailable",
                ErrorCode.ACCESS_DENIED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied() {
        ApiError apiError = ApiError.builder()
                .code(ErrorCode.ACCESS_DENIED.name())
                .status(403)
                .message("Access denied")
                .build();
        return ResponseEntity.status(403).body(ApiResponse.failure(apiError));
    }

    @ExceptionHandler(ExpiredJwtException.class)
    public ResponseEntity<ApiResponse<Void>> handleExpiredJwt() {
        // #region agent log
        try {
            java.nio.file.Files.writeString(
                    java.nio.file.Path.of("/home/rakhi-kumai/Word Game/.cursor/debug-156feb.log"),
                    "{\"sessionId\":\"156feb\",\"runId\":\"jwt-debug\",\"hypothesisId\":\"C\",\"location\":\"GlobalExceptionHandler.handleExpiredJwt\",\"message\":\"Returning JWT expired to client\",\"data\":{},\"timestamp\":"
                            + System.currentTimeMillis()
                            + "}\n",
                    java.nio.file.StandardOpenOption.CREATE,
                    java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception ignored) {
        }
        // #endregion
        return unauthorized("JWT expired", ErrorCode.INVALID_TOKEN);
    }

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<ApiResponse<Void>> handleJwt() {
        return unauthorized("Invalid or malformed JWT", ErrorCode.INVALID_TOKEN);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String cause = ex.getMostSpecificCause().getMessage();
        log.warn("Data integrity violation: {}", cause);

        String message = "Could not complete the request due to a conflict.";
        if (cause != null) {
            String lower = cause.toLowerCase();
            if (lower.contains("email")) {
                message = "Email already registered.";
            } else if (lower.contains("username")) {
                message = "Username already taken.";
            } else if (lower.contains("password") && lower.contains("null")) {
                message = "Could not save account credentials. Please try again.";
            } else if (lower.contains("user_cards") || lower.contains("card_id")) {
                message = "Could not update card inventory. Please try again.";
            }
        }
        ApiError apiError = ApiError.builder()
                .code(ErrorCode.DUPLICATE_RESOURCE.name())
                .status(409)
                .message(message)
                .build();
        return ResponseEntity.status(409).body(ApiResponse.failure(apiError));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnknown(Exception ex) {
        log.error("Unhandled exception", ex);
        ApiError apiError = ApiError.builder()
                .code(ErrorCode.INTERNAL_ERROR.name())
                .status(500)
                .message("Internal server error")
                .build();
        return ResponseEntity.internalServerError().body(ApiResponse.failure(apiError));
    }

    private ResponseEntity<ApiResponse<Void>> unauthorized(String message, ErrorCode code) {
        ApiError apiError = ApiError.builder()
                .code(code.name())
                .status(401)
                .message(message)
                .build();
        return ResponseEntity.status(401).body(ApiResponse.failure(apiError));
    }
}
