/**
 * ログイン認証用コントローラークラスファイル
 * @Author dredgk
 * @Version 1.0
 */
package com.narralog.controller;

import com.narralog.model.User;
import com.narralog.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;

/*
 * /apiエンドポイントにRestコントローラーをマッピングします
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    /*
     * ユーザーリポジトリ、パスワードエンコーダ、ユーザーディテールサービスを依存性注入します
     */
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final UserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    /*
     * 新規登録エンドポイント
     * /register に対してPostが着地した場合にregister関数を実行します。
     * 返り値としてUserをデータベースに向けて返します。
     */
    @PostMapping("/register")
    public User register(@RequestBody RegisterRequest req) {
        /*
         * ユーザーが既に登録されている場合に例外をスローします
         */
        if (userRepo.findByEmail(req.getEmail()).isPresent()) {
            throw new RuntimeException("このメールアドレスは既に登録されています");
        }

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        /*
         * passwordEncoderを使用して，パスワードをエンコードします。
         */
        user.setPassword(passwordEncoder.encode(req.getPassword())); // 暗号化！
        return userRepo.save(user);
    }

    /*
     * ログインエンドポイント
     * /login に対してPostが着地した場合にlogin関数を実行します。
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {

        // 1) 認証は AuthenticationManager に任せる（これが標準）
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
        );

        // 2) 認証結果を SecurityContext に載せる
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        // 3) 保存は SecurityContextRepository に任せる（セッションなど）
        securityContextRepository.saveContext(context, request, response);

        // ユーザー情報を取得して返す
        String userEmail = authentication.getName();
        User user = userRepo.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LoginResponse loginResponse = new LoginResponse();
        loginResponse.setUsername(user.getUsername());
        loginResponse.setEmail(user.getEmail());

        return ResponseEntity.ok(loginResponse);
    }

    // DTO定義
    @Data
    public static class LoginResponse {
        private String username;
        private String email;
    }
    @Data
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }
}