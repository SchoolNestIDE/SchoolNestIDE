let response = await fetch('/static_config.json');
let json: any;
if (response.status === 200 || response.ok) {
    json = await response.json();
}
async function getDownloadPath() {
   if (response.status === 404) {
    return "";
   }
   return json.downloadURI ?? "";
}
export {
    getDownloadPath
}