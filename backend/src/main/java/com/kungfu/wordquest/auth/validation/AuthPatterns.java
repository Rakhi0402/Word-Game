package com.kungfu.wordquest.auth.validation;

/**
 * Shared validation patterns — keep in sync with frontend authValidation.ts
 */
public final class AuthPatterns {

    private AuthPatterns() {}

    /** 3–30 chars: letter first, then letters, digits, underscore */
    public static final String USERNAME =
            "^[A-Za-z][A-Za-z0-9_]{2,29}$";

    public static final String USERNAME_MESSAGE =
            "Username must be 3–30 characters, start with a letter, and use only letters, numbers, or underscore";

    public static final String EMAIL =
            "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";

    public static final String EMAIL_MESSAGE =
            "Enter a valid email address";

    /** 8–40 chars: at least one upper, one lower, one digit; no whitespace */
    public static final String PASSWORD_PATTERN=
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)\\S{8,40}$";

    public static final String PASSWORD_MESSAGE =
            "Password must be 8–40 characters with at least one uppercase letter, one lowercase letter, and one number";
}
