CREATE TABLE `authors` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`first_name` VARCHAR(50) NOT NULL COLLATE 'utf8_unicode_ci',
	`last_name` VARCHAR(50) NOT NULL COLLATE 'utf8_unicode_ci',
	PRIMARY KEY (`id`)
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;

CREATE TABLE `books` (
	`id` INT(11) NOT NULL AUTO_INCREMENT,
	`author_id` INT(11) NOT NULL,
	`title` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
	`data` DATETIME,
	`description` VARCHAR(500) NOT NULL COLLATE 'utf8_unicode_ci',
	`image` VARCHAR(255) NOT NULL COLLATE 'utf8_unicode_ci',
	PRIMARY KEY (`id`)
)
COLLATE='utf8_unicode_ci'
ENGINE=InnoDB;