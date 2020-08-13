# Consentifier Plugin Readme

## Install

1. Go to extensions manager
2. Click `Load unpacked`
3. Select the plugin folder

## Configuration

API endpoint variable needs to be set, eg:

`var apiUrl = 'http://localhost:8000/api/';`

Find this in `js/consentifier-api.js`.

## Developer notes

`manifest.json` covers the standard config for chrome plugins. 

`content_security_policy` will need to be modified to include the base url of the consentifier application server e.g.:

```
"content_security_policy": "script-src 'self' https://example.com; object-src 'self'"
```

