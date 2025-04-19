const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const server = express();
const port = 3000;

AWS.config.update({ region: 'eu-west-1'});

const cognito = new AWS.CognitoIdentifyServiceProvider();
const CLIENT_ID = '5i7pcmk0psculkcgg72mm959ol';

server.use(bodyParser.json());

const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization;
  
    if (token) {
      jwt.verify(token, 'mahesh123', (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
  };

  server.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;
  
  const params = {
  ClientId: CLIENT_ID,
  Username: username,
  Password: password,
  UserAttributes: [
  {
  Name: 'email',
  Value: email,
  },
  ],
  };
  
  try {
  const data = await cognito.signUp(params).promise();
  res.json(data);
  } catch (err) {
  res.status(400).json(err);
  }
  });  

  server.post('/confirm', async (req, res) => {
    const { username, confirmationCode } = req.body;
  
  const params = {
  ClientId: CLIENT_ID,
  Username: username,
  ConfirmationCode: confirmationCode,
  };
  
  try {
  const data = await cognito.confirmSignUp(params).promise();
  res.json(data);
  } catch (err) {
  res.status(400).json(err);
  }
  });

  server.post('/signin', async (req, res) => {
    const { username, password } = req.body;
  
  const params = {
  AuthFlow: 'USER_PASSWORD_AUTH',
  ClientId: CLIENT_ID,
  AuthParameters: {
  USERNAME: username,
  PASSWORD: password,
  },
  };
  
  try {
  const data = await cognito.initiateAuth(params).promise();
  const token = jwt.sign({ username: data.AuthenticationResult.AccessToken }, 'your_jwt_secret_key', { expiresIn: '1h' });
  res.json({ token });
  } catch (err) {
  res.status(400).json(err);
  }
  });

  server.get('/demoPage', authenticateJWT, (req, res) => {
    res.json({ message: 'Welcome to the protected route!' });
  });
  
  server.post('/logout', authenticateJWT, async (req, res) => {
  const token = req.headers.authorization;
  
  const params = {
  AccessToken: token,
  };
  
  try {
  await cognito.globalSignOut(params).promise();
  res.json({ message: 'Successfully logged out' });
  } catch (err) {
  res.status(400).json(err);
  }
  });
  
  server.use((req, res) => {
  res.status(404).json({ message: 'Page not found' });
  });
  
  server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  });