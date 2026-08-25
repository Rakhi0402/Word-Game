package com.kungfu.wordquest.admin.dto;

import lombok.Data;

@Data
public class AdminUserPatchRequest {
    /** ROLE_USER or ROLE_ADMIN */
    private String role;
    private Boolean enabled;
    private Boolean locked;
}
