## How to add new icons to icomoon font

1. Go to Icomoon app: https://icomoon.io/app and create a new project.
2. Click on `Import Icons` and import `TCL-icomoon-save.json` file. Icons that have been selected will automatically be imported.
3. Select new icons.
4. Switch to `Generate font` tab to see the download button.
5. Extract the downloaded compressed file, the `fonts` folder should contains 4 font typeface files. Replace all the font typeface files in `src/assets/fonts`.
6. Copy the `style.css` classes styling starts with `.icon-` and replace all the current `.icon-` styling in `_icons.scss`.
7. Copy the project hashcode provided in `fontface`'s `url` (e.g. `c3pm5z`) and replace the current hashcode in `app.css` fontface url.
