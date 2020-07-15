export const tinyMCEConfig = {
    plugins: ["print",
        "table",
        "advlist",
        "lists",

        // Options could be added later based on requirements
        "code",
        "preview",
        "searchreplace",
        "autolink",
        "directionality",
        "fullscreen",
        "image",
        "link",
        "media",
        // "mediaembed",
        "charmap",
        "hr",
        "pagebreak",
        "toc",
        "insertdatetime",
        "advlist",
        "lists",
        // "textcolor",
        "wordcount",
        // "contextmenu",
        // "colorpicker",
        "textpattern",
        "help",
        "noneditable",
        "codesample",

        // Paste plugin
        "paste"
    ],
    toolbar: 'undo redo | formatselect | fontselect | bold italic underline forecolor backcolor | link image | media | alignleft aligncenter alignright alignjustify  | numlist bullist outdent indent | removeformat fullscreen | Tex | codesample | paste'
};
export const tinyMCEOptions = {
        skin: false,
        image_caption: true,
        media_live_embeds: true,
        plugins: tinyMCEConfig.plugins,
        codesample_languages: [
            {text: 'Bash', value: 'bash'},
            {text: 'Python', value: 'python'},
            {text: 'HTML/XML', value: 'markup'},
            {text: 'JavaScript', value: 'javascript'},
            {text: 'CSS', value: 'css'},
            {text: 'PHP', value: 'php'},
            {text: 'Ruby', value: 'ruby'},
            {text: 'Java', value: 'java'},
            {text: 'C', value: 'c'},
            {text: 'C#', value: 'csharp'},
            {text: 'C++', value: 'cpp'},
        ],
        codesample_content_css: "src/static/prism/prism.css",
        toolbar: tinyMCEConfig.toolbar,
        image_advtab: true,
        //file_picker_callback: callbackfn,
        file_browser_callback_types: "image",
        file_picker_types: "image",
        height: 480,
        font_formats: 'Aileron=aileron, sans-serif;Helvetica=helvetica, arial;Lato=lato, sans-serif;Lobster=lobster, chicago, serif;Noto Serif=noto serif, serif;Permanent Marker=permanent marker, sans-serif;Raleway=raleway, sans-serif;Roboto=roboto, sans-serif;Source Code Pro=source code pro, monospace,Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats',
        // Only paste plain text
        paste_as_text: true,
        theme: 'silver'
}

// export const tinyMCEOptions = {
//     height: 480,
//     toolbar: tinyMCEConfig.toolbar,
//     plugins: tinyMCEConfig.plugins,
//     menu: true,
//     theme: 'silver'
// }

