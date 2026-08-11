package com.kungfu.wordquest;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WordQuestApplication {

    public static void main(String[] args) {
        SpringApplication.run(WordQuestApplication.class, args);
    }
}
