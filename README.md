## Web Messenger Built with React and Flask 
This project aims to build a Slack-like messenger SPA with React and Flask. In terms of functionality, this application allows users to execute a sign up/login process, create a channel, share and reply to messages (both text and images) with other users, and delete channels / messenges as desired. 

### Back End 
The back end is built with Python and SQL. Using Flask, I constructed functional API routes that insert, modify, and query data from a MySQL database that I initialized with the create_db/create_table files found in this repository. On the security end for user sign-up / login, I use bcrypt to salt and pepper passwords. 


### Front End
The front end of this application was built with Javascript, with CSS for styling. I used React to build the various responsive components of the application, from the login element to channel pages. I use Javascript to respond to dynamic user input and make asynchronous fetch calls to the API routes I created with Flask. Using CSS, I gave the application a unique color theme and made the layout of the app responsive to the size of the screen (ie. changing from 3 columns to 1 column in a mobile-like format). 
