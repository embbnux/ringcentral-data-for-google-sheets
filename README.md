# RingCentral Data For Google Sheets addon

A [Google Apps Script](https://script.google.com/) app to integrate RingCentral data into Google spreadsheets, such as syncing RingCentral call log into a spreadsheet.

![Sync Call Log](https://user-images.githubusercontent.com/7036536/82349572-de7a0a80-9a2c-11ea-9946-e0e58409b84f.png)

![Sheet data](https://user-images.githubusercontent.com/7036536/82349700-05384100-9a2d-11ea-896a-a1c739b9e12d.png)

![RC Authorization](https://user-images.githubusercontent.com/7036536/82349873-3a449380-9a2d-11ea-9421-40e00e710d1f.png)

## Development

We build this project based on Google Apps Script Tool [clasp](https://developers.google.com/apps-script/guides/clasp) and [TypeScript](https://developers.google.com/apps-script/guides/typescript)

### Init project

Create a free RingCentral app in [RingCentral Developers website](http://developers.ringcentral.com/) to get app client id and secret.

Clone this project and install dependences

```
$ git clone https://github.com/embbnux/ringcentral-data-for-google-sheets.git
$ cd ringcentral-data-for-google-sheets
$ yarn
```

Create `app_credentials.ts` file in project root path:

```
$ touch app_credentials.ts
```

Add following code into `app_credentials.ts` file:

```js
const RC_APP = {
  CLIENT_ID: 'your_ringcentral_app_client_id',
  CLIENT_SECRET: 'your_ringcentral_app_client_secret',
  SERVER: 'https://platform.ringcentral.com', // 'https://platform.devtest.ringcentral.com' for Sandbox Environment
};
```

### Init Goolge Apps Script

```
$ ./node_modules/.bin/clasp login # Login with your Google Apps Script account
$ ./node_modules/.bin/clasp create
```

### Compile and upload to Goolge Apps Script

```
yarn watch
```

Test in [Google Apps Script](https://script.google.com/) website to run it as add-on.
