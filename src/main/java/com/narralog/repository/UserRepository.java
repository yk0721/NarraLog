package com.narralog.repository;

import com.narralog.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    // ユーザー名で検索するためのメソッドを追加
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}