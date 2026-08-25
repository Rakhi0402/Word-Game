package com.kungfu.wordquest.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class AdminCardRequest {
    @NotBlank
    private String id;
    @NotBlank
    private String name;
    @NotBlank
    private String rarity;
    @NotBlank
    private String image;
    private int stars;
    private String description;
    private List<String> bonuses;
}
