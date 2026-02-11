package com.narralog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**").allowedOriginPatterns("http://localhost:5173").allowedMethods("*");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // /app 以下へのアクセスをフロントエンドの index.html にフォワードする
        // ただし、Vite のビルド成果物が static/app/index.html に配置されることを想定
        registry.addViewController("/app").setViewName("forward:/app/index.html");
        registry.addViewController("/app/").setViewName("forward:/app/index.html");
        registry.addViewController("/app/{path:[^\\.]*}").setViewName("forward:/app/index.html");

        // 明示的にルートパスを static/index.html にマッピングする
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}