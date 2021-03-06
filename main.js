'use strict';
// Module to control application life.
const electron = require('electron');

const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// Module to store app and user state
const storage = require('electron-json-storage');
var request = require('request');
// Module for cross-platform notifications
const notifier = require('node-notifier');
//Easily query SSID
const escapeStringRegexp = require('escape-string-regexp');
//Escaping strings for regex
// Module for autolaunching on startup
const AutoLaunch = require('auto-launch');
const http = require('http');
const url = require('url');


var AutoLauncher = new AutoLaunch({
  name: 'OpenSesame'
});

// Warning! This works properly only on packaged releases.
AutoLauncher.enable();

//AutoLauncher.disable();

AutoLauncher.isEnabled()
  .then(function (isEnabled) {
    if (isEnabled) {
      return;
    }
    AutoLauncher.enable();
  })
  .catch(function (err) {
    // handle error
    console.log(err);
  });
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 700,
    height: 450
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/app/setup.html`);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

function login(userId, password, mode) {
  //adding for the possibility of logout in future
  if (mode === undefined) {
    mode = '191';
    //193 for logout
  }
  request.post({
    url: 'https://10.1.0.10:8090/login.xml',
    strictSSL: false,
    form: {
      username: userId,
      password: password,
      mode: mode
    }
  }, function (err, response, body) {
    // Some network requests might take time. So, keep the user busy occupied with a notification until this callback is called.
    console.log(err);
    // console.log(response);
    if (!err && response.statusCode == 200) {
      var String1 = escapeStringRegexp('<message><![CDATA[');
      var String2 = escapeStringRegexp(']]></message>');
      var re = new RegExp(String1 + "(.*?)" + String2);
      var result = re.exec(body);
      notifier.notify(result[1]);
    }
  });

}

function appCreate() {
  app.on('ready', createWindow);
  createWindow();
}

storage.has('setup', function (error, hasKey) {
  if (error) {
    throw error;
  }
  if (!hasKey) {
    console.log('Application is yet to be setup.');
    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    appCreate();
  } else {
    //Initiate endless poll
    setInterval(queryCheck, refreshinterval * 1000);
    queryCheck();
    storage.get('setup', function (error, data) {
      if (error) {
        throw error;
      }
      let userId = data.userId;
      let password = data.password;
      login(userId, password);
    });


  }
});



// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

const refreshinterval = 10;

function queryCheck() {
  http.get('http://captive.apple.com/hotspot-detect.html', function (res) {
    // Detect a redirect
    if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
      // The location for some (most) redirects will only contain the path,  not the hostname;
      // detect this and add the host to the path.
      console.log("Its a redirect!");
      if (url.parse(res.headers.location).hostname) {
        // Hostname included; make request to res.headers.location
      } else {
        // Hostname not included; get host from requested URL (url.parse()) and prepend to location.
      }

      // Otherwise no redirect; capture the response as normal
    } else {
      var data = '';

      res.on('data', function (chunk) {
        data += chunk;
      }).on('end', function () {
        // Do something with 'data'
        console.log(data);
      });
    }
  });
}


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
