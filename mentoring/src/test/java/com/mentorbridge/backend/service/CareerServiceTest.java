package com.mentorbridge.backend.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

class CareerServiceTest {

    @Test
    void decodesPythonLittleEndianFloats() {
        // python: base64.b64encode(struct.pack("<2f", 1.0, 0.5)) == b"AACAPwAAAD8="
        assertArrayEquals(new float[]{1.0f, 0.5f}, CareerService.decode("AACAPwAAAD8="));
    }
}
