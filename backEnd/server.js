require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { CognitoJwtVerifier } = require("aws-jwt-verifier");
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  RespondToAuthChallengeCommand,
  GetUserCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const app = express();

app.use(bodyParser.json());
app.use(cors());

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION, 
});

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  tokenUse: "access",
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
});


async function cognitoLogin(username, password) {
  try {
    const authResult = await cognitoClient.send(new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: process.env.AWS_COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    }));

    if (authResult.ChallengeName) {
      if (authResult.ChallengeName === 'MFA_REQUIRED') {
        throw new Error("Multi-Factor Authentication is required, but not handled in this example.");
      }
      const challengeResponse = await cognitoClient.send(
          new RespondToAuthChallengeCommand({
            ChallengeName: authResult.ChallengeName,
            ClientId: process.env.AWS_COGNITO_CLIENT_ID,
            Session: authResult.Session,
            ChallengeResponses: {
                USERNAME: username,
            }
          })
      );
      if(challengeResponse.AuthenticationResult?.AccessToken){
        return challengeResponse.AuthenticationResult;
      }
      else{
        throw new Error("Challenge Response failed");
      }


    } else if (authResult.AuthenticationResult) {
    
      return authResult.AuthenticationResult;
    } else {
      throw new Error("Authentication failed");
    }
  } catch (error) {
    console.error("Cognito Login Error:", error);
    throw error;
  }
}


app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const authResult = await cognitoLogin(username, password);
    const accessToken = authResult.AccessToken;

    const userResult = await cognitoClient.send(new GetUserCommand({
      AccessToken: accessToken,
    }));

    let companyName = "";
      if (userResult.UserAttributes) {
          const companyNameAttribute = userResult.UserAttributes.find(
              (attr) => attr.Name === "custom:companyName"
          );
          companyName = companyNameAttribute ? companyNameAttribute.Value : "";
      }

    res.json({
      token: accessToken,
      entreprise: companyName,
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

async function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }

  try {
    const payload = await jwtVerifier.verify(token);  // Verify the token
    req.user = payload; // Attach user data to the request
    next(); //  Go to the next middleware or route handler
  } catch (error) {
    console.error("Authentication Error:", error);
    res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'Protected resource accessed', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});