package com.narralog.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        //CORS設定
        registry.addMapping("/**").allowedOriginPatterns("http://localhost:5173").allowedMethods("*");
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        /*
         * /app以下へアクセスがあった場合に/app/index.htmlへフォワード
         */
        registry.addViewController("/app").setViewName("forward:/app/index.html");
        registry.addViewController("/app/").setViewName("forward:/app/index.html");
        registry.addViewController("/app/{path:[^\\.]*}").setViewName("forward:/app/index.html");

        // ルートディレクトリへのアクセスの場合にstatic/index.htmlへフォワード
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}