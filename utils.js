const urlencode = require('urlencode');
module.exports = {
        generateCognitoHeader: generateCognitoHeader
    }

function generateCognitoHeader(username) {
    // return JSON.stringify({
    //     "requestContext": {
    //         "resourceId": "tw1fgz",
    //         "authorizer": {
    //             "claims": {
    //                 "sub": "56fdaf19-81e7-41dd-85c2-72d03702f2fb",
    //                 "event_id": "852e0f72-4390-11e8-ad5c-e7c12a3b3b86",
    //                 "token_use": "access",
    //                 "scope": "phone openid profile com.catchup-catcha/shows.selected email",
    //                 "auth_time": "1524114862",
    //                 "iss": "https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_JS1CQbCvb",
    //                 "exp": "Thu Apr 19 06:14:22 UTC 2018",
    //                 "iat": "Thu Apr 19 05:14:22 UTC 2018",
    //                 "version": "2",
    //                 "jti": "b6c67221-868a-4512-8de4-4eb7ef7e9ef5",
    //                 "client_id": "3vvm7jhskaeim0cp6k4dda0adg",
    //                 "username": "palladyne"
    //             }
    //         }
    //     }
    // });
    return urlencode(JSON.stringify({
        requestContext: {
            authorizer: {
                claims: {
                    username: username
                }
            }
        }
    }));
}
