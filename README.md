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

### Init Google Apps Script

```
$ ./node_modules/.bin/clasp login # Login with your Google Apps Script account
```

#### If you are using legacy Google Script editor, you can create Google Script by clasp:

```
$ ./node_modules/.bin/clasp create
```

#### If you are using new Google Script editor, you need to create a bound script

Create script project by open a google sheet, and create Google Script project by "Tool -> Script Editor" https://developers.google.com/apps-script/guides/bound

You will be redirect to script editor with URI: `https://script.google.com/home/projects/your_google_script_project_id/edit`

Copy Google Script project id in the URI. Then create '.clasp.json' file in this project root path at your computer.

```
{"scriptId":"your_google_script_project_id"}
```

### Compile and upload to Google Apps Script

```
yarn watch
```

**Notice**: Before we test, we need to add following redirect URI into your RingCentral app in RingCentral Developer website:

```
https://script.google.com/macros/d/{SCRIPT ID}/usercallback
```

### Try it

For legacy editor:
  1. Go to [Google Apps Script](https://script.google.com/)
  2. Open your project with legacy editor
  3. In menu, "Run -> Test as add-on -> Select a sheet file"
  4. Click `Test` to open the sheet file
  5. You can get "RingCentral Data for Google Sheet" at `Add-ons` menu

For new script editor:
  1. Go to [Google Apps Script](https://script.google.com/)
  2. open your project with new editor
  3. In menu, "Deploy -> Test deployments -> Install"
  4. Got to your bind script, refresh the page
  5. You will get a `RingCentral` in top menu

## TODO

- [ ] Sync SMS, Voicemail and Fax data
- [ ] Sync RingCentral Video/Meetings data
- [ ] Upgrade RingCentral app into production
- [ ] Publish into add-on marketplace
- [ ] Support to select call log fields for injecting
