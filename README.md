# RingCentral Data for Google Sheets addon

A [Google Apps Script](https://script.google.com/) app to integrate RingCentral data into Google spreadsheets, such as syncing RingCentral call log into a spreadsheet.

[![YouTube demo](https://user-images.githubusercontent.com/7036536/82449001-1e98c600-9add-11ea-8158-d114ae14ed8c.png)](https://www.youtube.com/watch?v=KFZYqYbCfWc)

![Addon Menu](https://user-images.githubusercontent.com/7036536/82354777-dc677a00-9a33-11ea-8d09-69d7c0db4e92.png)

![Sheet data](https://user-images.githubusercontent.com/7036536/82349700-05384100-9a2d-11ea-896a-a1c739b9e12d.png)

![RC Authorization](https://user-images.githubusercontent.com/7036536/82349873-3a449380-9a2d-11ea-9421-40e00e710d1f.png)

## Development

We build this project based on Google Apps Script Tool [clasp](https://developers.google.com/apps-script/guides/clasp) and [TypeScript](https://developers.google.com/apps-script/guides/typescript)

### Init project

Create a free RingCentral app in [RingCentral Developers website](http://developers.ringcentral.com/) to get app client id and secret. Add permission `ReadAccount` and `ReadCallLog` into your RingCentral app.

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

**Notice**: Before we test, we need to add following redirect URI into your RingCentral app in RingCentral Developer website:

```
https://script.google.com/macros/d/{SCRIPT ID}/usercallback
```

Test in [Google Apps Script](https://script.google.com/) website to run it as add-on.

## TODO

- [ ] Sync SMS, Voicemail and Fax data
- [ ] Sync RingCentral Video/Meetings data
- [ ] Upgrade RingCentral app into production
- [ ] Publish into add-on marketplace
