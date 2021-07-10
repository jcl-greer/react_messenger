from flask import Flask, render_template, request, jsonify, Response
import mysql.connector 
import bcrypt
import configparser
import io
import secrets 
from datetime import datetime, timedelta
import json 
import string
import random

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


config = configparser.ConfigParser()
config.read('secrets.cfg')
DB_NAME = 'jcgreer'
DB_USERNAME = config['secrets']['DB_USERNAME']
DB_PASSWORD = config['secrets']['DB_PASSWORD']
PEPPER = config['secrets']['PEPPER']

def create_token(): 
    token = secrets.token_urlsafe(12)
    return token 


def authenticate_token(session_token, user_id):
    """
    Authenticates Token Given Token and User ID
    """
    if not session_token:
        return False

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()
    
    auth_query = 'SELECT session_token FROM users WHERE id = %s;'

    try:
        cursor.execute(auth_query, (user_id,))
        db_token = cursor.fetchone()[0]
        if session_token == db_token:
            return True
        return False 
    except Exception as e:
        print("THe error is ", e)
        return False
    finally:
        cursor.close()
        connection.close()

# utility functions
def create_channel_array(channel_res):
    """
    Given list of sql query results, returns a channel array
    """
    channels = []
    ch_cols = ['channelId', 'channelName', 'hostId', 'newMessages']

    for channel_row in channel_res:
        channel = {} 
        for i, column in enumerate(channel_row):
            channel[ch_cols[i]] = column 
        channels.append(channel)

    return channels

def create_message_array(message_res):
    """
    Given List of sql query results, returns array of message dictionaries
    """
    messages = [] 

    msg_cols = ['id', 'userId', 'channelId', 'replyToId', 'body', 'username', 'replies']

    for message_row in message_res:
        message = {} 
        for i, column in enumerate(message_row):
            message[msg_cols[i]] = column 
        messages.append(message)

    return messages

@app.route('/')
@app.route('/channel/<int:channel_id>')
def index(channel_id=None):
    return app.send_static_file('index.html')
@app.route('/channel/<int:channel_id>/message/<int:message_id>')
def index2(channel_id=None, message_id=None):
    return app.send_static_file('index.html')

@app.errorhandler(404)   
def not_found(e):   
  return app.send_static_file('index.html')

# -------------------------------- API ROUTES ----------------------------------

@app.route('/api/signup', methods=['POST'])
def signup():
    body = request.get_json()

    username = body['username']
    password = body['password'] + PEPPER
    email = body['email']

  
    if "" in [username, email, password]:
        return {'message': 'One of your submissions was empty'}, 404

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    add_user = "INSERT into users (username, password, email) VALUES (%s, %s, %s)"
    add_to_channels = "INSERT INTO last_read (user_id, channel_id) SELECT users.id, channels.id FROM users "\
        + "CROSS JOIN channels WHERE users.id=(SELECT id FROM users WHERE email=%s)"

    try:
        cursor.execute(add_user, (username, hashed, email))
        connection.commit()
        cursor.execute(add_to_channels, (email,))
        connection.commit()
        return {}, 200
    except Exception as e:
        print(e)
        return {"error": e}, 404
    finally:
        cursor.close()
        connection.close()

@app.route('/api/login', methods=['POST'])
def login ():

    body = request.get_json()
    email = body['email']
    password = body['password']

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    login = "SELECT password, id FROM users WHERE email=%s;"
    update_token = 'UPDATE users SET session_token=%s WHERE email=%s;'

    try:

        cursor.execute(login, (email,))
        hashed, user_id = cursor.fetchone()
        
        if bcrypt.checkpw((password+PEPPER).encode('utf-8'), hashed.encode('utf-8')):
            new_token = create_token()
            cursor.execute(update_token, (new_token, email,))
            connection.commit()
            
            return {'session_token': new_token, 'user_id': user_id}, 200
        return {}, 404
    except Exception as e:
        print(e)
        return {}, 404
    finally:
        cursor.close()
        connection.close()


@app.route('/api/reset', methods=['POST'])
def reset():
    body = request.get_json()

    username = body['username']
    user_id = body['user_id']
    email = body['email']
    password = body['password'] + PEPPER
    token = body['session_token']


    if "" in [username, password]:
        return {'message': 'One of your submissions was empty'}, 404

    if not authenticate_token(token, user_id):
        return {'error': 'failed authentication'}, 404
    
    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    update_user = "UPDATE users SET username= %s, email = %s, password = %s WHERE id = %s"

    try:
        cursor.execute(update_user, (username, email, hashed, user_id))
        connection.commit()
        connection.commit()
        return {}, 200
    except Exception as e:
        print(e)
        return {"error": e}, 404
    finally:
        cursor.close()
        connection.close()



@app.route('/api/getChannels', methods=['GET'])
def channels():

    token = request.headers.get('session_token') 
    user_id = request.headers.get('user_id')

    if not authenticate_token(token, user_id):
        return {}, 404

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    channels_with_counts = "SELECT channels.*, ch_counts.new_count FROM channels LEFT JOIN (SELECT m.channel_id as m_id, COUNT(*) as new_count "\
        + "FROM messages as m " \
            + "JOIN last_read AS lr ON lr.channel_id = m.channel_id " \
                + "WHERE m.reply_to_id IS NULL and lr.user_id = %s AND m.id > lr.last_read_id " \
                    + "GROUP BY m.channel_id, lr.last_read_id) as ch_counts ON channels.id = ch_counts.m_id; "

    try:
        cursor.execute(channels_with_counts, (user_id,))
        channels = cursor.fetchall()
        channel_arr = create_channel_array(channels)
        return {'channels': channel_arr}, 200
    except Exception as e:
        print(e)
        return {'error': e}, 404
    finally:
        cursor.close()
        connection.close()

@app.route('/api/create_channel', methods=['POST'])
def create_channel():

    
    body = request.get_json()

    token = body['session_token']
    user_id = body['id']

    channel_name = body['channel_name'].replace(" ", "-")

    if not authenticate_token(token, user_id):
        return {}, 404

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    channel_insert = "INSERT INTO channels (channel_name, host_id) VALUES (%s, %s);"

    # adds all user and channel combinations to last read table (as users have access to all channels)
    add_users = '''INSERT INTO last_read (user_id, channel_id) SELECT users.id, channels.id FROM users CROSS JOIN channels WHERE channels.id= %s '''
    get_channel_id = "SELECT id FROM channels WHERE channel_name = %s;"

    channels_with_counts = "SELECT channels.*, ch_counts.new_count FROM channels LEFT JOIN (SELECT m.channel_id as m_id, COUNT(*) as new_count "\
        + "FROM messages as m " \
            + "JOIN last_read AS lr ON lr.channel_id = m.channel_id " \
                + "WHERE m.reply_to_id IS NULL and lr.user_id = %s AND m.id > lr.last_read_id " \
                    + "GROUP BY m.channel_id, lr.last_read_id) as ch_counts ON channels.id = ch_counts.m_id; "
    try:
        cursor.execute(channel_insert, (channel_name, user_id,))
        connection.commit()

        cursor.execute(get_channel_id, (channel_name,))
        channel_id = cursor.fetchone()[0]

        cursor.execute(add_users, (channel_id,))
        connection.commit() 
        
        cursor.execute(channels_with_counts, (user_id,))
        channels = cursor.fetchall()

        channel_arr = create_channel_array(channels)
        
        return {'channels': channel_arr}, 200

    except Exception as e:
        print("the error is ", e)
        return {'error': 'Failed To Create New Channel'}, 404

    finally:
        cursor.close()
        connection.close() 


@app.route('/api/delete_channel', methods=['POST'])
def delete_channel():

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    body = request.get_json()

    token = body['session_token']
    user_id = body['user_id']
    channel_id = body['channel_id']

    if not authenticate_token(token, user_id):
        return {"error": "user not authenticated"}, 404

    delete_query = 'DELETE FROM channels WHERE id = %s;'

    channels_with_counts = "SELECT channels.*, ch_counts.new_count FROM channels LEFT JOIN (SELECT m.channel_id as m_id, COUNT(*) as new_count "\
        + "FROM messages as m " \
            + "JOIN last_read AS lr ON lr.channel_id = m.channel_id " \
                + "WHERE m.reply_to_id IS NULL and lr.user_id = %s AND m.id > lr.last_read_id " \
                    + "GROUP BY m.channel_id, lr.last_read_id) as ch_counts ON channels.id = ch_counts.m_id; "

    try:
        cursor.execute(delete_query, (channel_id,))
        connection.commit()
        cursor.execute(channels_with_counts, (user_id,))
        channels = cursor.fetchall()

        channel_arr = create_channel_array(channels)
        return {'channels': channel_arr}, 200

    except Exception as e:
        print("the error is ", e)
        return {"error": 'failed to delete channel'}, 404

    finally:
        cursor.close()
        connection.close() 


@app.route('/api/add_message', methods=['POST'])
def add_message():

    body = request.get_json()

    token = body['session_token']
    user_id = body['user_id']
    channel_id = body['channel_id']
    reply_to_id = body['reply_to_id']

    message = body['new_message']


    if not authenticate_token(token, user_id):
        return {"Message": 'Add Message Token Not Verified'}, 404

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    add_message = 'INSERT INTO messages (user_id, channel_id, reply_to_id, body) VALUES (%s, %s, %s, %s);'

    update_last_read = 'UPDATE last_read set last_read_id=(Select MAX(id) FROM messages WHERE user_id=%s and channel_id=%s) WHERE user_id=%s and channel_id=%s;'
    
    get_messages = "SELECT m.id, m.user_id, m.channel_id, m.reply_to_id, m.body, u.username, COUNT(m2.reply_to_id) AS replies FROM messages as m " \
        + "Left JOIN messages as m2 on m2.reply_to_id = m.id "\
            + "JOIN users as u on u.id = m.user_id WHERE m.channel_id=%s " \
                + "GROUP BY m.id, m.user_id, m.channel_id, m.reply_to_id, m.body, u.username ORDER BY m.id ASC;"

    try:
        cursor.execute(add_message, (user_id, channel_id, reply_to_id, message,))
        connection.commit()

        cursor.execute(update_last_read, (user_id, channel_id, user_id, channel_id,))
        connection.commit()

        cursor.execute(get_messages, (channel_id,))

        messages = cursor.fetchall()
        messageArr = create_message_array(messages)
        return {'Messages': messageArr}, 200
    except Exception as e:
        print(e)
        return {'error': e}, 404
    finally:
        cursor.close()
        connection.close()


@app.route('/api/get_messages', methods=['GET'])
def get_messages ():

    token = request.headers.get('session_token') 
    user_id = request.headers.get('user_id')

    try: 
        channel_id = request.headers.get('channel_id')
    except Exception as e:
        print("the get messages error is ", e)

    # authenticates token - if not authenticated, return error status
    if not authenticate_token(token, user_id):
        return {'message': 'Wrong token'}, 404 

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    get_messages = "SELECT m.id, m.user_id, m.channel_id, m.reply_to_id, m.body, u.username, COUNT(m2.reply_to_id) AS replies FROM messages as m " \
    + "Left JOIN messages as m2 on m2.reply_to_id = m.id "\
        + "JOIN users as u on u.id = m.user_id WHERE m.channel_id=%s " \
            + "GROUP BY m.id, m.user_id, m.channel_id, m.reply_to_id, m.body, u.username ORDER BY m.id ASC;"

    update_lr = 'UPDATE last_read SET last_read_id = (SELECT MAX(id) FROM messages WHERE channel_id=%s) WHERE user_id=%s AND channel_id=%s'

    try:

        cursor.execute(update_lr, (channel_id, user_id, channel_id,))
        connection.commit()

        cursor.execute(get_messages, (channel_id,))
        messages = cursor.fetchall()
        messageArr = create_message_array(messages)

        return {'messages': messageArr}, 200
    except Exception as e:
        print("THE ERROR FOR MEGET MESSAGES IS ", e)
        return {'error': e}, 404
    finally:
        cursor.close()
        connection.close()


@app.route('/api/check_new_messages', methods=['GET'])
def check_new_messages():

    token = request.headers.get('session_token') 
    user_id = request.headers.get('user_id')

    try: 
        channel_id = request.headers.get('channel_id')
    except Exception as e:
        print("the get messages error is ", e)

    # authenticates token - if not authenticated, return error status
    if not authenticate_token(token, user_id):
        return {'message': 'Wrong token'}, 404 

    connection = mysql.connector.connect(user=DB_USERNAME, database=DB_NAME, password=DB_PASSWORD)
    cursor = connection.cursor()

    newCount = "SELECT COUNT(*) as newCount FROM messages as m Join last_read AS lr on lr.channel_id = m.channel_id"\
        + " WHERE m.reply_to_id IS NULL AND lr.user_id = %s AND m.id > lr.last_read_id AND m.channel_id=%s"

    try:
        cursor.execute(newCount, (user_id, channel_id,))
        newCount = cursor.fetchone()[0]

        return {'newCount': newCount}
    except Exception as e:
        print("THE ERROR FOR check_new_messages is ", e)
        return {'error': e}, 404
    finally:
        cursor.close()
        connection.close()

