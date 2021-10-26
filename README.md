# File Picker using Google Apps Script and Javascript without 3rd party

[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](LICENCE)

<a name="top"></a>

![](images/fig1.gif)

# Overview

This is a sample script for the file picker using Google Apps Script and Javascript without 3rd party.

# Description

I had created the same sample script before. [Ref](https://gist.github.com/tanaikech/96166a32e7781fee22da9e498b2289d0) But, in the case of that script, jQuery is used. And, only Google Drive of own account could be used. In this sample script, 3rd party of jQuery is not used, and also, not only Google Drive of your own account, but also Google Drive of the service account can be used. By this, I thought that this file picker will be useful for various scenes.

The flow for using this sample script is as follows.

# Usage

In order to test this sample script, please run the following flow.

## 1. Create new Spreadsheet

Please create new Spreadsheet and open the script editor of the Spreadsheet.

## 2. Enable Drive API

This script uses Drive API. So, please enable Drive API at Advanced Google services. [Ref](https://developers.google.com/apps-script/guides/services/advanced#enable_advanced_services)

## 3. Sample script

In this sample script, Google Drive of your own account is used. And, the files are shown from the root folder.

### Google Apps Script side: `Code.gs`

Please copy and paste the following script to the script editor as `Code.gs`.

```javascript
function getFiles(e, rootFolderId, mimeType) {
  const accessToken = ScriptApp.getOAuthToken(); // In this case, the files and folders are retrieved from your own Google Drive.
  mimeType = mimeType || "*";
  const data = {};
  const idn = e || "root";
  const url1 = `https://www.googleapis.com/drive/v3/files/${e}?fields=id%2Cname%2Cparents`;
  const folderObj = JSON.parse(
    UrlFetchApp.fetch(url1, {
      headers: { authorization: `Bearer ${accessToken}` },
    }).getContentText()
  );
  if (e == "root") e = folderObj.id;
  data[e] = {
    keyname: folderObj.name,
    keyparent: idn == rootFolderId ? null : folderObj.parents[0],
    files: [],
  };
  let pageToken = "";
  do {
    const q =
      mimeType == "*"
        ? `'${e}' in parents and trashed=false`
        : `'${e}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = '${mimeType}') and trashed=false`;
    const url2 = `https://www.googleapis.com/drive/v3/files?fields=nextPageToken%2Cfiles%28id%2Cname%2CmimeType%29&q=${encodeURIComponent(
      q
    )}&orderBy=name&pageSize=1000&pageToken=${pageToken}`;
    const res = UrlFetchApp.fetch(url2, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const fileList = JSON.parse(res.getContentText());
    if (fileList.files.length > 0) {
      data[e].files = data[e].files.concat(
        fileList.files.map(({ id, name, mimeType }) => ({
          name,
          id,
          mimeType: mimeType == MimeType.FOLDER ? "folder" : mimeType,
        }))
      );
    }
    pageToken = fileList.nextPageToken;
  } while (pageToken);
  return data;
}

// DriveApp.getFiles()  // This is used for automatically detecting the scope of "https://www.googleapis.com/auth/drive.readonly". Also, you can use the scope of "https://www.googleapis.com/auth/drive".

// When the file is selected, this function is run from `work(value)` in Javascript side.
function doSomething(id) {
  // do something
  var res = id;
  return res;
}

// Please run this function.
function main() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createTemplateFromFile("index")
      .evaluate()
      .setTitle("Sample File Picker")
  );
}
```

### HTML & Javascript side: `index.html`

Please copy and paste the following script to the script editor as `index.html`.

```html
<style>
  #filePicker {
    text-align: left;
    width: 95%;
    font-size: 1em;
    margin: auto;
    height: 3em;
  }
</style>

<select id="filePicker"></select>
<div id="result"></div>

<script>
  const rootFolderId = "root"; // Please set the top folder ID here.
  const emimeType = "*"; // In this case, all files are shown.
  //   const emimeType = "application/pdf"; // When you use this line, you can show only files with this mimeType.

  // --- When you want to run the script for the selected file, please modify this function.
  const work = (...args) =>
    google.script.run.withSuccessHandler(output).doSomething(...args);

  function output(res) {
    document.getElementById("result").innerHTML = res;
  }
  // ---

  const alldata = {};
  const getFileList = (...args) =>
    google.script.run.withSuccessHandler(importData).getFiles(...args);
  getFileList(rootFolderId, rootFolderId, emimeType);

  document.getElementById("filePicker").addEventListener("change", function () {
    const { value, options } = this;
    const disp = options[options.selectedIndex].text;
    if (disp.includes("Folder") || disp.includes("../")) {
      while (this.lastChild) this.removeChild(this.lastChild);
      if (alldata[value]) {
        importData({ [value]: alldata[value] });
        return;
      }
      getFileList(value, rootFolderId, emimeType);
      return;
    }
    work(value);
  });

  function importData(e) {
    const key = Object.keys(e)[0];
    if (!alldata[key]) alldata[key] = e[key];
    const select = document.getElementById("filePicker");
    const obj = e[key]["keyparent"]
      ? [
          { text: `./${e[key]["keyname"]}`, value: key },
          { text: "../", value: e[key]["keyparent"] },
        ]
      : [{ text: `./${e[key]["keyname"]}`, value: key }];
    obj.forEach(({ text, value }) => {
      const option = document.createElement("option");
      option.textContent = text;
      option.value = value;
      select.appendChild(option);
    });
    e[key]["files"].forEach(({ mimeType, name, id }) => {
      const option = document.createElement("option");
      option.textContent = mimeType == "folder" ? "[Folder]" + name : name;
      option.value = id;
      select.appendChild(option);
    });
  }
</script>
```

- When you want to change the top folder, please modify `const rootFolderId = "root";` like `const rootFolderId = "### folder ID ###";`.

- When you want to show the files with the specific mimeType, please modify `const emimeType = "*";` like `const emimeType = "### mimeType ###";`.

## 4. Testing

Please run `main` function at the script editor. By this, a sidebar is opened at Google Spreadsheet. By this, you can see the file picker as shown in the top demonstration.

# For Service account

When you want to use this file picker using the service account, please modify the above Google Apps Script as follows. In this case, Google Drive of the service account can be used.

```javascript
// This script is from https://gist.github.com/tanaikech/20ea127a8e23a7c609f8d764c8b7ed7c
function getAccessTokenFromServiceAccount(scopes) {
  const private_key =
    "-----BEGIN PRIVATE KEY-----\n-----END PRIVATE KEY-----\n"; // private_key of JSON file retrieved by creating Service Account
  const client_email = "###"; // client_email of JSON file retrieved by creating Service Account
  const url = "https://www.googleapis.com/oauth2/v3/token";
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: client_email,
    scope: scopes.join(" "),
    aud: url,
    exp: (now + 3600).toString(),
    iat: now.toString(),
  };
  const signature =
    Utilities.base64Encode(JSON.stringify(header)) +
    "." +
    Utilities.base64Encode(JSON.stringify(claim));
  const jwt =
    signature +
    "." +
    Utilities.base64Encode(
      Utilities.computeRsaSha256Signature(signature, private_key)
    );
  const params = {
    method: "post",
    payload: {
      assertion: jwt,
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    },
  };
  const data = UrlFetchApp.fetch(url, params).getContentText();
  const obj = JSON.parse(data);
  return obj.access_token;
}

function getFiles(e, rootFolderId, mimeType) {
  const scopes = ["https://www.googleapis.com/auth/drive.readonly"];
  const accessToken = getAccessTokenFromServiceAccount(scopes); // In this case, the files and folders are retrieved from Google Drive of the service account.

  mimeType = mimeType || "*";
  const data = {};
  const idn = e || "root";
  const url1 = `https://www.googleapis.com/drive/v3/files/${e}?fields=id%2Cname%2Cparents`;
  const folderObj = JSON.parse(
    UrlFetchApp.fetch(url1, {
      headers: { authorization: `Bearer ${accessToken}` },
    }).getContentText()
  );
  if (e == "root") e = folderObj.id;
  data[e] = {
    keyname: folderObj.name,
    keyparent: idn == rootFolderId ? null : folderObj.parents[0],
    files: [],
  };
  let pageToken = "";
  do {
    const q =
      mimeType == "*"
        ? `'${e}' in parents and trashed=false`
        : `'${e}' in parents and (mimeType = 'application/vnd.google-apps.folder' or mimeType = '${mimeType}') and trashed=false`;
    const url2 = `https://www.googleapis.com/drive/v3/files?fields=nextPageToken%2Cfiles%28id%2Cname%2CmimeType%29&q=${encodeURIComponent(
      q
    )}&orderBy=name&pageSize=1000&pageToken=${pageToken}`;
    const res = UrlFetchApp.fetch(url2, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    const fileList = JSON.parse(res.getContentText());
    if (fileList.files.length > 0) {
      data[e].files = data[e].files.concat(
        fileList.files.map(({ id, name, mimeType }) => ({
          name,
          id,
          mimeType: mimeType == MimeType.FOLDER ? "folder" : mimeType,
        }))
      );
    }
    pageToken = fileList.nextPageToken;
  } while (pageToken);
  return data;
}

// DriveApp.getFiles()  // This is used for automatically detecting the scope of "https://www.googleapis.com/auth/drive.readonly". Also, you can use the scope of "https://www.googleapis.com/auth/drive".

// When the file is selected, this function is run from `work(value)` in Javascript side.
function doSomething(id) {
  // do something
  var res = id;
  return res;
}

// Please run this function.
function main() {
  SpreadsheetApp.getUi().showSidebar(
    HtmlService.createTemplateFromFile("index")
      .evaluate()
      .setTitle("Sample File Picker")
  );
}
```

# About scopes

In this sample script, by using the comment line of `// DriveApp.getFiles()`, the scope of `https://www.googleapis.com/auth/drive.readonly` is automatically added.

When you want to use the minimum required scope, you can use this script with the scopes of `https://www.googleapis.com/auth/drive.metadata.readonly` and `https://www.googleapis.com/auth/script.external_request`.

---

<a name="licence"></a>

# Licence

[MIT](licence)

<a name="author"></a>

# Author

[Tanaike](https://tanaikech.github.io/about/)

If you have any questions and commissions for me, feel free to tell me.

<a name="updatehistory"></a>

# Update History

- v1.0.0 (October 25, 2021)

  1. Initial release.

[TOP](#top)
