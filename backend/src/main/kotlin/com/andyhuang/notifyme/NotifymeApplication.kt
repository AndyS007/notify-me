package com.andyhuang.notifyme

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.scheduling.annotation.EnableAsync

@SpringBootApplication
@EnableAsync
class NotifymeApplication

fun main(args: Array<String>) {
	runApplication<NotifymeApplication>(*args)
}
