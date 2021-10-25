// In this sample script, Google Drive of your own account is used. And, the files are shown from the root folder.
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
