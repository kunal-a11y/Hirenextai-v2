-- =============================================================================
-- HirenextAI — MySQL Database Schema
-- Generated: 2026-03-23
-- MySQL 8.0+ / MariaDB 10.6+ compatible
-- Usage: mysql -u USER -p DBNAME < database_mysql.sql
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

CREATE DATABASE IF NOT EXISTS `hirenextai`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hirenextai`;

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`                INT          NOT NULL AUTO_INCREMENT,
  `name`              TEXT         NOT NULL,
  `email`             VARCHAR(255) NOT NULL,
  `password_hash`     TEXT         NOT NULL,
  `phone`             TEXT,
  `avatar_url`        TEXT,
  `subscription_plan` TEXT         NOT NULL DEFAULT 'free',
  `role`              TEXT         NOT NULL DEFAULT 'job_seeker',
  `banned`            TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `user_id`    INT      NOT NULL,
  `token`      TEXT     NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sessions_token_unique` (`token`(191)),
  KEY `sessions_user_id_idx` (`user_id`),
  CONSTRAINT `sessions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `profiles` (
  `id`                    INT        NOT NULL AUTO_INCREMENT,
  `user_id`               INT        NOT NULL,
  `headline`              TEXT,
  `bio`                   TEXT,
  `skills`                JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `education`             JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `experience`            JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `resume_url`            TEXT,
  `preferred_locations`   JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `preferred_categories`  JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `open_to_remote`        TINYINT(1) NOT NULL DEFAULT 1,
  `expected_salary_min`   INT,
  `expected_salary_max`   INT,
  `is_fresher`            TINYINT(1) NOT NULL DEFAULT 1,
  `degree_level`          TEXT,
  `specialization`        TEXT,
  `setup_completed`       TINYINT(1) NOT NULL DEFAULT 0,
  `date_of_birth`         TEXT,
  `gender`                TEXT,
  `languages`             JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `certifications`        JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `portfolio_links`       JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `internship_experience` JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `job_type_preference`   JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `availability_status`   TEXT,
  `career_goal`           TEXT,
  `updated_at`            DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profiles_user_id_unique` (`user_id`),
  CONSTRAINT `profiles_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. resumes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `resumes` (
  `id`             INT      NOT NULL AUTO_INCREMENT,
  `user_id`        INT      NOT NULL,
  `type`           TEXT     NOT NULL DEFAULT 'none',
  `file_url`       TEXT,
  `content`        JSON,
  `analysis`       JSON,
  `strength_score` INT,
  `generated_text` TEXT,
  `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resumes_user_id_unique` (`user_id`),
  CONSTRAINT `resumes_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`                   INT      NOT NULL AUTO_INCREMENT,
  `user_id`              INT      NOT NULL,
  `plan`                 TEXT     NOT NULL DEFAULT 'free',
  `status`               TEXT     NOT NULL DEFAULT 'active',
  `current_period_start` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `current_period_end`   DATETIME,
  `cancelled_at`         DATETIME,
  `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscriptions_user_id_unique` (`user_id`),
  CONSTRAINT `subscriptions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `jobs` (
  `id`                   INT        NOT NULL AUTO_INCREMENT,
  `title`                TEXT       NOT NULL,
  `company`              TEXT       NOT NULL,
  `company_logo_url`     TEXT,
  `location`             TEXT       NOT NULL,
  `is_remote`            TINYINT(1) NOT NULL DEFAULT 0,
  `type`                 TEXT       NOT NULL DEFAULT 'full-time',
  `category`             TEXT       NOT NULL,
  `salary_min`           INT,
  `salary_max`           INT,
  `description`          TEXT       NOT NULL,
  `requirements`         JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `skills`               JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `is_fresher`           TINYINT(1) NOT NULL DEFAULT 0,
  `experience_years`     INT,
  `application_count`    INT        NOT NULL DEFAULT 0,
  `source`               TEXT                DEFAULT 'Database',
  `apply_url`            TEXT,
  `posted_at`            DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`           DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_direct_post`       TINYINT(1) NOT NULL DEFAULT 0,
  `posted_by_user_id`    INT,
  `application_deadline` DATETIME,
  `view_count`           INT        NOT NULL DEFAULT 0,
  `company_website`      TEXT,
  `is_boosted`           TINYINT(1) NOT NULL DEFAULT 0,
  `boosted_at`           DATETIME,
  `boost_expiry`         DATETIME,
  `is_featured`          TINYINT(1) NOT NULL DEFAULT 0,
  `featured_at`          DATETIME,
  `featured_expiry`      DATETIME,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_posted_at`       (`posted_at`),
  KEY `idx_jobs_location`        (`location`(191)),
  KEY `idx_jobs_category`        (`category`(191)),
  KEY `idx_jobs_type`            (`type`(191)),
  KEY `idx_jobs_is_fresher`      (`is_fresher`),
  KEY `idx_jobs_is_remote`       (`is_remote`),
  KEY `idx_jobs_salary_min`      (`salary_min`),
  KEY `idx_jobs_salary_max`      (`salary_max`),
  KEY `idx_jobs_experience_years`(`experience_years`),
  KEY `idx_jobs_source`          (`source`(191)),
  CONSTRAINT `jobs_posted_by_user_id_fk` FOREIGN KEY (`posted_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `applications` (
  `id`               INT        NOT NULL AUTO_INCREMENT,
  `job_id`           INT        NOT NULL,
  `user_id`          INT        NOT NULL,
  `status`           TEXT       NOT NULL DEFAULT 'applied',
  `recruiter_status` TEXT       NOT NULL DEFAULT 'pending',
  `cover_letter`     TEXT,
  `resume_url`       TEXT,
  `notes`            TEXT,
  `follow_up_date`   DATETIME,
  `reminder_sent`    TINYINT(1) NOT NULL DEFAULT 0,
  `applied_at`       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `applications_job_id_idx`  (`job_id`),
  KEY `applications_user_id_idx` (`user_id`),
  CONSTRAINT `applications_job_id_fk`  FOREIGN KEY (`job_id`)  REFERENCES `jobs`  (`id`) ON DELETE CASCADE,
  CONSTRAINT `applications_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. saved_jobs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `saved_jobs` (
  `id`       INT      NOT NULL AUTO_INCREMENT,
  `user_id`  INT      NOT NULL,
  `job_id`   INT      NOT NULL,
  `notes`    TEXT,
  `saved_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `saved_jobs_user_id_idx` (`user_id`),
  KEY `saved_jobs_job_id_idx`  (`job_id`),
  CONSTRAINT `saved_jobs_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `saved_jobs_job_id_fk`  FOREIGN KEY (`job_id`)  REFERENCES `jobs`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 9. ai_usage
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ai_usage` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `user_id`    INT      NOT NULL,
  `type`       TEXT     NOT NULL,
  `month_year` TEXT     NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `ai_usage_user_id_idx` (`user_id`),
  CONSTRAINT `ai_usage_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 10. credit_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id`           INT      NOT NULL AUTO_INCREMENT,
  `user_id`      INT      NOT NULL,
  `credits_used` INT      NOT NULL,
  `feature_used` TEXT     NOT NULL,
  `month_year`   TEXT     NOT NULL,
  `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `credit_transactions_user_id_idx`    (`user_id`),
  KEY `credit_transactions_created_at_idx` (`created_at`),
  CONSTRAINT `credit_transactions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 11. job_alerts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `job_alerts` (
  `id`             INT        NOT NULL AUTO_INCREMENT,
  `user_id`        INT        NOT NULL,
  `enabled`        TINYINT(1) NOT NULL DEFAULT 1,
  `frequency`      TEXT       NOT NULL DEFAULT 'daily',
  `keywords`       JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `skills`         JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `locations`      JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `open_to_remote` TINYINT(1) NOT NULL DEFAULT 1,
  `job_types`      JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `categories`     JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `salary_min`     INT,
  `is_fresher_only`TINYINT(1) NOT NULL DEFAULT 0,
  `email_alerts`   TINYINT(1) NOT NULL DEFAULT 1,
  `last_sent_at`   DATETIME,
  `created_at`     DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `job_alerts_user_id_idx` (`user_id`),
  CONSTRAINT `job_alerts_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 12. alert_notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alert_notifications` (
  `id`          INT        NOT NULL AUTO_INCREMENT,
  `user_id`     INT        NOT NULL,
  `alert_id`    INT,
  `job_ids`     JSON       NOT NULL DEFAULT (JSON_ARRAY()),
  `match_count` INT        NOT NULL DEFAULT 0,
  `is_read`     TINYINT(1) NOT NULL DEFAULT 0,
  `email_sent`  TINYINT(1) NOT NULL DEFAULT 0,
  `sent_at`     DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at`  DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `alert_notifications_user_id_idx`  (`user_id`),
  KEY `alert_notifications_alert_id_idx` (`alert_id`),
  CONSTRAINT `alert_notifications_user_id_fk`  FOREIGN KEY (`user_id`)  REFERENCES `users`       (`id`) ON DELETE CASCADE,
  CONSTRAINT `alert_notifications_alert_id_fk` FOREIGN KEY (`alert_id`) REFERENCES `job_alerts`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 13. recruiter_profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recruiter_profiles` (
  `id`                    INT      NOT NULL AUTO_INCREMENT,
  `user_id`               INT      NOT NULL,
  `company_name`          TEXT     NOT NULL,
  `company_logo_url`      TEXT,
  `company_website`       TEXT,
  `company_size`          TEXT,
  `industry`              TEXT,
  `recruiter_name`        TEXT     NOT NULL,
  `recruiter_position`    TEXT,
  `work_email`            TEXT     NOT NULL,
  `phone`                 TEXT,
  `linkedin_url`          TEXT,
  `description`           TEXT,
  `company_location`      TEXT,
  `setup_completed`       TEXT     NOT NULL DEFAULT 'false',
  `recruiter_plan`        TEXT     NOT NULL DEFAULT 'free',
  `job_boost_credits`     INT      NOT NULL DEFAULT 0,
  `featured_jobs_credits` INT      NOT NULL DEFAULT 0,
  `plan_valid_till`       DATETIME,
  `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recruiter_profiles_user_id_unique` (`user_id`),
  CONSTRAINT `recruiter_profiles_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 14. recruiter_subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `recruiter_subscriptions` (
  `id`              INT      NOT NULL AUTO_INCREMENT,
  `user_id`         INT      NOT NULL,
  `plan_name`       TEXT     NOT NULL DEFAULT 'free',
  `job_post_limit`  INT      NOT NULL DEFAULT 3,
  `boost_credits`   INT      NOT NULL DEFAULT 0,
  `featured_jobs`   INT      NOT NULL DEFAULT 0,
  `valid_till`      DATETIME,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rec_subs_user_id`   (`user_id`),
  KEY `idx_rec_subs_plan_name` (`plan_name`(191)),
  CONSTRAINT `recruiter_subscriptions_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 15. job_boost_transactions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `job_boost_transactions` (
  `id`          INT      NOT NULL AUTO_INCREMENT,
  `user_id`     INT      NOT NULL,
  `job_id`      INT      NOT NULL,
  `credits_used`INT      NOT NULL DEFAULT 1,
  `type`        TEXT     NOT NULL DEFAULT 'boost',
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_jbt_user_id` (`user_id`),
  KEY `idx_jbt_job_id`  (`job_id`),
  KEY `idx_jbt_type`    (`type`(191)),
  CONSTRAINT `jbt_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `jbt_job_id_fk`  FOREIGN KEY (`job_id`)  REFERENCES `jobs`  (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 16. support_tickets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id`          INT      NOT NULL AUTO_INCREMENT,
  `user_id`     INT,
  `name`        TEXT     NOT NULL,
  `email`       TEXT     NOT NULL,
  `subject`     TEXT     NOT NULL,
  `message`     TEXT     NOT NULL,
  `status`      TEXT     NOT NULL DEFAULT 'open',
  `admin_reply` TEXT,
  `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `support_tickets_email_idx`      (`email`(191)),
  KEY `support_tickets_status_idx`     (`status`(191)),
  KEY `support_tickets_created_at_idx` (`created_at`),
  CONSTRAINT `support_tickets_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 17. conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id`         INT      NOT NULL AUTO_INCREMENT,
  `title`      TEXT     NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 18. messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id`              INT      NOT NULL AUTO_INCREMENT,
  `conversation_id` INT      NOT NULL,
  `role`            TEXT     NOT NULL,
  `content`         TEXT     NOT NULL,
  `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `messages_conversation_id_idx` (`conversation_id`),
  CONSTRAINT `messages_conversation_id_fk` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- End of schema
-- Usage:
--   mysql -u root -p hirenextai < database_mysql.sql
-- Or to create DB and run in one command:
--   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS hirenextai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u root -p hirenextai < database_mysql.sql
-- =============================================================================
