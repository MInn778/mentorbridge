package com.mentorbridge.backend.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

class DatabaseConfigTest {

    @Test
    void convertsNeonUrlToJdbc() {
        assertArrayEquals(
                new String[]{"jdbc:postgresql://ep-x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require", "neondb_owner", "p@ss"},
                DatabaseConfig.toJdbc("postgresql://neondb_owner:p%40ss@ep-x-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"));
        assertArrayEquals(
                new String[]{"jdbc:postgresql://host:5432/db", "u", "pw"},
                DatabaseConfig.toJdbc("postgres://u:pw@host:5432/db"));
    }
}
