// When you want to use this file picker using the service account, please modify the above Google Apps Script as follows. In this case, Google Drive of the service account can be used.

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
