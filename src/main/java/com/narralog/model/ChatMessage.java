package com.example.narralog.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Data
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private UUID problemId;
    private String sender;
    private String content;
    private LocalDateTime sentAt = LocalDateTime.now();
}