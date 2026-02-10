package com.example.narralog.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
public class Problem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String content; // ボヤき
    private String title;   // AIがつけたタイトル
    private LocalDateTime createdAt = LocalDateTime.now();
}