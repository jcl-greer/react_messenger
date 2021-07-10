// Util Function to compare arrays of channels / messages
// If they are not the same, returns bool to update state
function checkArrays(array1, array2) {
  let checkArrays = true;
  for (let i = 0; i < array1.length; i++) {
    let obj1 = array1[i];
    let obj2 = array2[i];
    for (let property in obj1) {
      if (obj1[property] !== obj2[property]) {
        checkArrays = false;
        break;
      }
    }
  }
  return checkArrays;
}

class Login extends React.Component {
  render() {
    if (!this.props.isLoggedIn) {
      return (
        <div className="login-page">
          <div className="login-form">
            <h2>Login to Belay</h2>

            <label htmlFor="email">
              <div className="login-label">Email Address</div>
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter email"
              value={this.props.email}
              onChange={this.props.emailHandler}
            ></input>
            <label htmlFor="password">
              <div className="login-label">Password</div>
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              value={this.props.password}
              onChange={this.props.passwordHandler}
            ></input>
            <label htmlFor="username">
              <div className="login-label">Username</div>
            </label>
            <input
              id="username"
              // value={this.props.username}
              placeholder="Enter username"
              onChange={this.props.usernameHandler}
            ></input>
            <span id="signup-login">
              <button
                className="signup_button"
                onClick={this.props.signUpHandler}
              >
                Sign Up
              </button>
              <button
                className="login_button"
                onClick={this.props.loginHandler}
              >
                Login
              </button>
            </span>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

class Reset extends React.Component {
  render() {
    if (this.props.reset) {
      return (
        <div className="reset-page">
          <div className="reset-form">
            <h2>Reset your username and/or password</h2>
            <label htmlFor="email">
              <div className="login-label">Email Address</div>
            </label>
            <input
              id="email"
              type="email"
              placeholder="Enter email"
              value={this.props.email}
              onChange={this.props.emailHandler}
            ></input>
            <label htmlFor="password">New/Old Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter current or desired password"
              value={this.props.password}
              onChange={this.props.passwordHandler}
            ></input>
            <label htmlFor="username">New/Old Username</label>
            <input
              id="username"
              placeholder="Enter current or desired username"
              onChange={this.props.usernameHandler}
            ></input>
            <button className="reset_button" onClick={this.props.resetHandler}>
              Reset
            </button>
          </div>
        </div>
      );
    } else {
      return null;
    }
  }
}

class Channel extends React.Component {
  formatMessageCount = () => {
    return this.props.channel.newMessages === null
      ? ""
      : " New Messages: " + this.props.channel.newMessages;
  };

  render() {
    return (
      <ul className="channel-list">
        <li>
          <button
            className="channel"
            onClick={() =>
              this.props.onGoToChannel(
                this.props.channel.channelId,
                this.props.channel.channelName
              )
            }
          >
            {this.props.channel.channelName}
          </button>
          <span>{this.formatMessageCount()}</span>
          {this.props.userId == this.props.channel.hostId && (
            <button
              onClick={() => this.props.onDelete(this.props.channel.channelId)}
            >
              Delete
            </button>
          )}
        </li>
      </ul>
    );
  }
}

class Channels extends React.Component {
  render() {
    return (
      <div>
        <div>
          <h3>Channels</h3>
          {this.props.channels.map((channel) => (
            <Channel
              key={channel.channelId}
              userId={this.props.userId}
              channel={channel}
              onDelete={this.props.onDelete}
              onGoToChannel={this.props.onGoToChannel}
            />
          ))}
        </div>
      </div>
    );
  }
}

class ChannelForm extends React.Component {
  CreateChannel = () => {
    alert("New Channel Created");

    const channelName = document.getElementById("new-channel").value;

    fetch("http://127.0.0.1:5000/api/create_channel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_token: window.localStorage.getItem("session_token"),
        channel_name: channelName,
        username: this.props.username,
        id: this.props.userId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.props.updateChannel(data["channels"]);
      })
      .catch((error) => {
        alert("Either You Do Not Have Authorization or Channel Already Exists");
        console.log(error);
      });
  };

  render() {
    return (
      <div id="create-channel">
        <h3>Create a Channel, {this.props.username}</h3>
        <label htmlFor="new-channel"></label>
        <input
          type="text"
          id="new-channel"
          placeholder="Enter channel name ..."
        />
        <button onClick={() => this.CreateChannel()}>Create Channel</button>
      </div>
    );
  }
}

class Message extends React.Component {
  formatReplyCount = () => {
    return this.props.message.replies > 0 ? (
      <div>
        <button
          onClick={() =>
            this.props.onGoToThread(
              this.props.message.id,
              this.props.message.body
            )
          }
        >
          {this.props.message.replies}
        </button>
        <span>Replies</span>
      </div>
    ) : (
      <div>
        <button onClick={() => this.props.onGoToThread(this.props.message.id)}>
          Reply
        </button>
      </div>
    );
  };

  checkImage = () => {
    let str = this.props.message.body;
    let urlRE = new RegExp(
      "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?([^ ])+"
    );
    let img_res = str.match(urlRE);
    if (img_res !== null) {
      let newBody = str.replace(img_res[0], "");

      return (
        <div>
          {newBody}
          <div>
            <img src={img_res[0]} alt={newBody} width="250" height="auto"></img>
          </div>
        </div>
      );
    } else {
      return <div>{this.props.message.body}</div>;
    }
  };

  render() {
    return (
      <div>
        <div className="message-format">
          <b>
            <span>{this.props.message.username}</span>
          </b>
          <br></br>
          {this.checkImage()}
          <div>{this.formatReplyCount()}</div>
        </div>
      </div>
    );
  }
}

class Messages extends React.Component {
  render() {
    return (
      <div className="messages">
        <button
          id="channel-return"
          onClick={() => this.props.onReturnChannel()}
        >
          Channel Return
        </button>
        <div>
          <h3>{this.props.currentChannelName} Messages</h3>
          {this.props.messages
            .filter((message) => message.replyToId === null)
            .map((message) => (
              <Message
                key={message.id}
                message={message}
                onGoToThread={this.props.onGoToThread}
              />
            ))}
        </div>
        <MessageSubmit
          currentChannelId={this.props.currentChannelId}
          userId={this.props.userId}
          username={this.props.username}
          updateMessages={this.props.updateMessages}
          currentMessageId={this.props.currentMessageId}
        />
      </div>
    );
  }
}

class MessageSubmit extends React.Component {
  AddMessage = () => {
    const message = document.getElementsByClassName("new-message")[0].value;

    fetch("http://127.0.0.1:5000/api/add_message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_token: window.localStorage.getItem("session_token"),
        new_message: message,
        channel_id: this.props.currentChannelId,
        user_id: this.props.userId,
        username: this.props.username,
        reply_to_id: null,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.props.updateMessages(data["Messages"]);
        // alert("Added Message");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return (
      <div className="Add-message">
        <h3>Add a Message</h3>
        <label htmlFor="new-message"></label>
        <textarea
          rows="2"
          cols="30"
          type="text"
          className="new-message"
          placeholder="Enter message..."
        />
        <button id="message-button" onClick={() => this.AddMessage()}>
          Add Message
        </button>
      </div>
    );
  }
}

class Replies extends React.Component {
  render() {
    return (
      <div className="replies">
        <button
          className="exit-reply"
          onClick={() => this.props.onExitThread()}
        >
          Exit Thread
        </button>
        <h3>replies to... {this.props.body}</h3>
        <div>
          {this.props.messages
            .filter(
              (message) => message.replyToId === this.props.currentMessageId
            )
            .map((message) => (
              <Reply key={message.id} message={message} />
            ))}
        </div>
      </div>
    );
  }
}

class Reply extends React.Component {
  checkImage = () => {
    let str = this.props.message.body;
    let urlRE = new RegExp(
      "([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?([^ ])+"
    );
    let img_res = str.match(urlRE);
    if (img_res !== null) {
      let newBody = str.replace(img_res[0], "");

      return (
        <div>
          {newBody}
          <div>
            <img src={img_res[0]} alt={newBody} width="250" height="auto"></img>
          </div>
        </div>
      );
    } else {
      return <div>{this.props.message.body}</div>;
    }
  };
  render() {
    return (
      <div>
        <div className="message-format">
          <b>
            <span>{this.props.message.username}</span>
          </b>
          <br></br>
          {this.checkImage()}
        </div>
      </div>
    );
  }
}

class ReplySubmit extends React.Component {
  AddMessage = () => {
    const message = document.getElementsByClassName("new-reply")[0].value;

    fetch("http://127.0.0.1:5000/api/add_message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session_token: window.localStorage.getItem("session_token"),
        new_message: message,
        channel_id: this.props.currentChannelId,
        user_id: this.props.userId,
        username: this.props.username,
        reply_to_id: this.props.currentMessageId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.props.updateMessages(data["Messages"]);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  render() {
    return (
      <div className="Add-reply">
        <h3>Add a reply</h3>
        <label htmlFor="new-reply"></label>
        <textarea
          rows="2"
          cols="30"
          type="text"
          className="new-reply"
          placeholder="Enter reply..."
        />
        <button id="reply-button" onClick={() => this.AddMessage()}>
          Add Message
        </button>
      </div>
    );
  }
}

// Holds State For Belay
class Belay extends React.Component {
  constructor(props) {
    super(props);
    this.getChannels = this.getChannels.bind(this);
    this.channelPolling = this.channelPolling.bind(this);
    this.ChannelHandler = this.ChannelHandler.bind(this);
    this.getMessages = this.getMessages.bind(this);
    this.MessagePolling = this.MessagePolling.bind(this);
    this.MessageHandler = this.MessageHandler.bind(this);
    this.state = {
      currentUrl: window.location.href,
      channels: [],
      username: window.localStorage.getItem("username"),
      userId: window.localStorage.getItem("userId"),
      isLoggedIn: window.localStorage.getItem("isLoggedIn"),
      reset: false,
      password: "",
      // newPassword: "",
      email: "",
      currentChannelId: window.localStorage.getItem("channelId"),
      currentChannelName: window.localStorage.getItem("channelName"),
      channelMessages: [],
      currentMessageId: window.localStorage.getItem("messageId"),
      currentMessageBody: null,
      messageReplies: [],
      timeouts: [],
      channelTimeouts: [],
      messageTimeouts: [],
    };
  }

  componentDidMount() {
    this.popStateHandler(null);
    window.addEventListener("popstate", (e) => this.popStateHandler(e));

    console.log(
      "The component mounted, and the current channel and message ids are ",
      this.state.currentChannelId,
      this.state.currentMessageId,
      this.state.userId
    );

    if (this.state.isLoggedIn && this.state.currentChannelId) {
      this.channelPolling();
      this.MessagePolling();
    } else if (this.state.isLoggedIn) {
      this.channelPolling();
    }
  }

  popStateHandler = (e) => {
    let splitUrl = window.location.href.split("/");

    this.setState({ currentUrl: window.location.href });

    let messageIdx = splitUrl.indexOf("message");
    let channelIdx = splitUrl.indexOf("channel");

    let messageId = splitUrl[messageIdx + 1];
    let channelId = splitUrl[channelIdx + 1];

    if (
      messageIdx > -1 &&
      messageId !== "" &&
      window.localStorage.getItem("session_token")
    ) {
      this.setState({ currentMessageId: messageId }, this.MessagePolling);
      this.setState({ currentChannelId: channelId }, this.channelPolling);
    } else if (
      channelIdx > -1 &&
      channelId !== "" &&
      window.localStorage.getItem("session_token")
    ) {
      this.setState({ currentChannelId: channelId }, this.channelPolling);
      this.setState({ currentMessageId: null }, this.MessagePolling);
    } else if (
      channelIdx > -1 &&
      channelId === "" &&
      window.localStorage.getItem("session_token")
    ) {
      this.setState({ currentChannelId: null });
      this.setState({ currentMessageId: null });
      let oldTimeout = this.state.messageTimeouts;
      clearTimeout(oldTimeout);
    } else {
      console.log("back to login");
      this.setState({ isLoggedIn: false });
      window.localStorage.setItem("isLoggedIn", false);
      let oldTimeout = this.state.messageTimeouts;
      clearTimeout(oldTimeout);

      let oldChannelTimeout = this.state.timeouts;
      clearTimeout(oldChannelTimeout);
    }
  };

  usernameHandler = (e) => {
    window.localStorage.getItem("username", e.target.value);
    console.log("the etarget value is ", e.target.value);
    this.setState({ username: e.target.value });
  };

  passwordHandler = (e) => {
    this.setState({ password: e.target.value });
  };

  emailHandler = (e) => {
    this.setState({ email: e.target.value });
  };

  logoutHandler = () => {
    window.localStorage.removeItem("session_token");
    window.localStorage.removeItem("userId");
    window.localStorage.removeItem("username");
    window.localStorage.removeItem("channelId");
    window.localStorage.removeItem("channelName");
    window.localStorage.removeItem("messageId");
    this.setState({ currentMessageId: null, currentChannelId: null });

    window.history.pushState({}, "", "http://127.0.0.1:5000/");

    this.setState({ isLoggedIn: false });
    window.localStorage.setItem("isLoggedIn", false);
  };

  signUpHandler = () => {
    const username = this.state.username;
    const email = this.state.email;
    const password = this.state.password;

    fetch("http://127.0.0.1:5000/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        username: username,
        password: password,
      }),
    })
      .then((response) => {
        if (response.status == 200) {
          response.json().then((data) => {
            alert(
              "User Signed Up For Belay - Click the Login Button to log in"
            );
          });
        } else {
          console.log(response.status);
          this.logoutHandler();
        }
      })
      .catch((response) => {
        alert("Sign Up Failed - Please Try Again");
        this.logoutHandler();
      });
  };

  loginHandler = () => {
    const username = this.state.username;
    const password = this.state.password;
    const email = this.state.email;

    fetch("http://127.0.0.1:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        password: password,
        email: email,
      }),
    })
      .then((response) => {
        if (response.status == 200) {
          response.json().then((data) => {
            window.localStorage.setItem("session_token", data.session_token);
            window.localStorage.setItem("isLoggedIn", true);
            window.localStorage.setItem("userId", data.user_id);
            window.localStorage.setItem("username", username);
            this.setState({ userId: data.user_id }, this.channelPolling);
            this.setState({ isLoggedIn: true });

            window.history.pushState({}, "", "http://127.0.0.1:5000/channel/");

            alert("User Sucessfully Logged In");
            this.getChannels();
          });
        } else {
          console.log(response.status);
          alert(
            "Login Failed: Either Password / Email is Incorrect or User Does Not Exist"
          );
          this.logoutHandler();
        }
      })
      .catch((response) => {
        console.log(response);
        this.logoutHandler();
      });
  };

  callResetHandler = () => {
    window.history.pushState({}, "", "http://127.0.0.1:5000/");
    this.setState({ reset: true });
  };

  fulfillResetHandler = () => {
    const username = this.state.username;
    const password = this.state.password;
    const email = this.state.email;
    const userId = this.state.userId;

    fetch("http://127.0.0.1:5000/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        username: username,
        password: password,
        email: email,
        session_token: window.localStorage.getItem("session_token"),
      }),
    })
      .then((response) => {
        if (response.status == 200) {
          response.json().then((data) => {
            this.setState({ reset: false });
            alert("User Successfully Updated Their Belay Account");
          });
        } else {
          console.log(response.status);
          this.logoutHandler();
        }
      })
      .catch((response) => {
        console.log(response);
        alert("Sign Up Failed - Please Try Again");
        this.logoutHandler();
      });
  };

  ChannelHandler(channels) {
    if (channels.length !== this.state.channels.length) {
      this.setState({ channels: channels });
    } else if (checkArrays(this.state.channels, channels) !== true) {
      this.setState({ channels: channels });
    }
  }

  getChannels() {
    const session_token = window.localStorage.getItem("session_token");

    let authHeaders = new Headers();
    authHeaders.append("session_token", session_token);
    authHeaders.append("user_id", this.state.userId);
    authHeaders.append("username", this.state.username);
    authHeaders.append("Content-Type", "application/json");
    const myInit = {
      method: "GET",
      headers: authHeaders,
    };

    fetch("http://127.0.0.1:5000/api/getChannels", myInit)
      .then((response) => response.json())
      .then((data) => {
        this.ChannelHandler(data["channels"]);
      })
      .catch((e) => {
        console.log("The POLLING ERROR IS ", e);
      });
  }

  channelPolling() {
    let oldTimeout = this.state.timeouts;

    clearTimeout(oldTimeout);

    this.getChannels();

    if (this.state.isLoggedIn) {
      let newTimeout = setTimeout(this.channelPolling, 8000);
      this.setState({ timeouts: newTimeout });
    }
  }

  handleDeleteChannel = (channelId) => {
    const session_token = window.localStorage.getItem("session_token");

    fetch("http://127.0.0.1:5000/api/delete_channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_token: session_token,
        user_id: this.state.userId,
        channel_id: channelId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        this.ChannelHandler(data["channels"]);
      })
      .catch((e) => {
        console.log("The Delete Channel Error is ", e);
      });
  };

  handleGoToChannel = (channelId, channelName) => {
    window.history.pushState(
      {},
      "",
      "http://127.0.0.1:5000/channel/" + channelId
    );

    this.setState({ currentChannelId: channelId }, this.MessagePolling);
    window.localStorage.setItem("channelId", channelId);

    this.setState({ currentChannelName: channelName }, this.channelPolling);
    window.localStorage.setItem("channelName", channelName);
    this.getMessages(channelId);
  };

  MessageHandler(messages) {
    if (messages.length !== this.state.channelMessages.length) {
      this.setState({ channelMessages: messages });
    } else if (checkArrays(this.state.channelMessages, messages) !== true) {
      this.setState({ channelMessages: messages });
    }
  }

  getMessages(channelId = null) {
    const session_token = window.localStorage.getItem("session_token");

    // supply channelId if set state does not immediately change current id state
    let authChannelId;
    if (!channelId === null) {
      authChannelId = channelId;
    } else {
      authChannelId = this.state.currentChannelId;
    }

    let authHeaders = new Headers();
    authHeaders.append("session_token", session_token);
    authHeaders.append("user_id", this.state.userId);
    authHeaders.append("channel_id", authChannelId);
    authHeaders.append("Content-Type", "application/json");
    const myInit = {
      method: "GET",
      headers: authHeaders,
    };

    fetch("http://127.0.0.1:5000/api/get_messages", myInit)
      .then((response) => response.json())
      .then((data) => {
        this.MessageHandler(data["messages"]);
      })
      .catch((e) => {
        console.log("The POLLING Message ERROR IS ", e);
      });
  }

  MessagePolling() {
    this.getMessages(false);

    let oldTimeout = this.state.messageTimeouts;

    clearTimeout(oldTimeout);

    if (this.state.isLoggedIn) {
      let newTimeout = setTimeout(this.MessagePolling, 5000);
      this.setState({ messageTimeouts: newTimeout });
    }
    return;
  }

  handleGoToThread = (messageId, body) => {
    window.history.pushState(
      {},
      "",
      "http://127.0.0.1:5000/channel/" +
        this.state.currentChannelId +
        "/message/" +
        messageId
    );

    this.setState({ currentMessageId: messageId }, function () {});
    window.localStorage.setItem("currentMessageId", messageId);
    this.setState({ currentMessageBody: body }, function () {});

    // this.getMessages(messageId);
  };

  exitThreadHandler = () => {
    this.setState({ currentMessageId: null }, function () {});

    window.history.pushState(
      {},
      "",
      "http://127.0.0.1:5000/channel/" + this.state.currentChannelId
    );
  };

  returnChannelHandler = () => {
    console.log("reached the return channel handler");
    this.setState({ currentChannelId: null }, function () {});
    this.setState({ currentChannelName: null }, this.channelPolling);
    let oldTimeout = this.state.messageTimeouts;
    clearTimeout(oldTimeout);

    window.history.pushState({}, "", "http://127.0.0.1:5000/channel/");
  };

  render() {
    return (
      <div>
        <div className="login-container">
          <Login
            isLoggedIn={this.state.isLoggedIn}
            username={this.state.username}
            password={this.state.password}
            usernameHandler={this.usernameHandler}
            passwordHandler={this.passwordHandler}
            emailHandler={this.emailHandler}
            loginHandler={this.loginHandler}
            logoutHandler={this.logoutHandler}
            signUpHandler={this.signUpHandler}
          />
        </div>
        <div className="reset-container">
          <Reset
            username={this.state.username}
            password={this.state.password}
            email={this.state.email}
            usernameHandler={this.usernameHandler}
            passwordHandler={this.passwordHandler}
            emailHandler={this.emailHandler}
            loginHandler={this.loginHandler}
            logoutHandler={this.logoutHandler}
            reset={this.state.reset}
            resetHandler={this.fulfillResetHandler}
          />
        </div>
        <div className="full-container">
          {this.state.isLoggedIn && !this.state.reset && (
            <div className="channel-container">
              <div className="logout-button">
                <button onClick={this.logoutHandler}>Logout</button>
              </div>
              <div className="reset-button">
                <button onClick={this.callResetHandler}>
                  Reset Password / Username
                </button>
              </div>
              <ChannelForm
                channels={this.state.channels}
                username={this.state.username}
                userId={this.state.userId}
                updateChannel={this.ChannelHandler}
                email={this.state.email}
              />
              <Channels
                userId={this.state.userId}
                channels={this.state.channels}
                onDelete={this.handleDeleteChannel}
                updateChannel={this.channelHandler}
                onGoToChannel={this.handleGoToChannel}
              />
            </div>
          )}

          {this.state.isLoggedIn &&
            !this.state.reset &&
            this.state.currentChannelId && (
              <div className="message-container">
                <Messages
                  messages={this.state.channelMessages}
                  currentChannelId={this.state.currentChannelId}
                  currentChannelName={this.state.currentChannelName}
                  currentMessageId={this.state.currentMessageId}
                  userId={this.state.userId}
                  username={this.state.username}
                  updateMessages={this.MessageHandler}
                  onGoToThread={this.handleGoToThread}
                  onReturnChannel={this.returnChannelHandler}
                  MessagePolling={this.props.MessagePolling}
                />
              </div>
            )}
          {this.state.isLoggedIn &&
            !this.state.reset &&
            this.state.currentChannelId &&
            this.state.currentMessageId && (
              <div className="reply-container">
                <Replies
                  onExitThread={this.exitThreadHandler}
                  currentMessageId={this.state.currentMessageId}
                  messages={this.state.channelMessages}
                  body={this.state.currentMessageBody}
                />
                <ReplySubmit
                  currentChannelId={this.state.currentChannelId}
                  userId={this.state.userId}
                  username={this.state.username}
                  updateMessages={this.MessageHandler}
                  currentMessageId={this.state.currentMessageId}
                />
              </div>
            )}
        </div>
      </div>
    );
  }
}

ReactDOM.render(React.createElement(Belay), document.getElementById("root"));
