-- my command for running file
-- mysql -u root -p jcgreer < 20210315T172550-create_tables.sql

use jcgreer;

DROP TABLE if exists last_read;
DROP TABLE if exists messages;
DROP TABLE if exists channels;
DROP TABLE if exists users;

create table users (
  id int AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL,
  password VARCHAR(60) NOT NULL,
  email VARCHAR (60) UNIQUE NOT NULL,
  session_token VARCHAR(20)
);

create table channels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel_name VARCHAR(60) UNIQUE NOT NULL,
  host_id INT NOT NULL,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE

);

create table last_read (
  user_id INT NOT NULL,
  channel_id INT NOT NULL,
  last_read_id INT DEFAULT 0,
  PRIMARY KEY(user_id, channel_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
 
create table messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,  
  channel_id INT NOT NULL, 
  reply_to_id INT, 
  body TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(channel_id) REFERENCES channels(id) ON DELETE CASCADE
);



