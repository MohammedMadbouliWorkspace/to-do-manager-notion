module.exports = {
  type: 'oauth2',
  test: {
    headers: {
      Authorization: 'Bearer {{bundle.authData.access_token}}',
      'Notion-Version': '2022-06-28',
    },
    url: 'https://api.notion.com/v1/users/me',
  },
  oauth2Config: {
    authorizeUrl: {
      url: 'https://api.notion.com/v1/oauth/authorize?client_id=0bf73ef9-8abb-4b81-8e7b-2c9ca7acdbe5&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fzapier.com%2Fdashboard%2Fauth%2Foauth%2Freturn%2FApp200369CLIAPI%2F',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
      },
    },
    getAccessToken: {
      url: 'https://api.notion.com/v1/oauth/token',
      method: 'POST',
      body: {
        code: '{{bundle.inputData.code}}',
        grant_type: 'authorization_code',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        'Notion-Version': '2022-06-28',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
        Authorization: `Basic ${Buffer.from(
            `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`
        ).toString('base64')}`,
      },
    },
    refreshAccessToken: {
      method: 'POST',
      body: {
        refresh_token: '{{bundle.authData.refresh_token}}',
        grant_type: 'refresh_token',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
    },
  },
};
