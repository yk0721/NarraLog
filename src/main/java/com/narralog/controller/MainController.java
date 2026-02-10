package com.narralog.controller;

import com.narralog.model.*;
import com.narralog.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MainController {

    private final ProblemRepository problemRepo;
    private final ChatMessageRepository chatRepo;
    private final SimpMessagingTemplate messagingTemplate;

    // 1. ボヤき投稿API
    @PostMapping("/api/problems")
    public Problem createProblem(@RequestBody Problem problem) {
        // ★本来はここでAI APIを叩く。今はダミー
        problem.setTitle("【AI要約】" + problem.getContent().substring(0, Math.min(problem.getContent().length(), 10)) );
        return problemRepo.save(problem);
    }

    // 2. チャット履歴取得API
    @GetMapping("/api/problems/{id}/messages")
    public List<ChatMessage> getMessages(@PathVariable UUID id) {
        return chatRepo.findByProblemIdOrderBySentAtAsc(id);
    }

    // 3. WebSocketチャット受信 & 配信
    @MessageMapping("/chat/{problemId}")
    public void sendMessage(@DestinationVariable UUID problemId, ChatMessage message) {
        message.setProblemId(problemId);
        chatRepo.save(message);
        // 購読している全員に配信
        messagingTemplate.convertAndSend("/topic/problems/" + problemId, message);
    }
    // 4. 相談一覧取得API (ここを追加！)
    @GetMapping("/api/problems")
    public List<Problem> getAllProblems() {
        // 新しい順に返すとUXが良いのでID順または作成日順などが理想ですが、
        // まずは全件取得でOKです。
        return problemRepo.findAll();
    }
}