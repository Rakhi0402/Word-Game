package com.kungfu.wordquest.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Enables @Scheduled annotations across the application.
    // The scheduler thread pool size is set in application.yml:
    //   spring.task.scheduling.pool.size: 2
}
