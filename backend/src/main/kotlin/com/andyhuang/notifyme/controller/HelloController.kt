package com.andyhuang.notifyme.controller

import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/hello")
class HelloController {

    @GetMapping
    fun hello(): Map<String, String> {
        return mapOf("message" to "Hello from notify-me backend!")
    }
}
