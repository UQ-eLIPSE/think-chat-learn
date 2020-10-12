import katex from 'katex';

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
        { text: 'Bash', value: 'bash' },
        { text: 'Python', value: 'python' },
        { text: 'HTML/XML', value: 'markup' },
        { text: 'JavaScript', value: 'javascript' },
        { text: 'CSS', value: 'css' },
        { text: 'PHP', value: 'php' },
        { text: 'Ruby', value: 'ruby' },
        { text: 'Java', value: 'java' },
        { text: 'C', value: 'c' },
        { text: 'C#', value: 'csharp' },
        { text: 'C++', value: 'cpp' },
    ],
    codesample_content_css: "src/static/prism/prism.css",
    toolbar: tinyMCEConfig.toolbar,
    image_advtab: true,
    //file_picker_callback: callbackfn,
    file_browser_callback_types: "image",
    file_picker_types: "image",
    height: 250,
    font_formats: 'Aileron=aileron, sans-serif;Helvetica=helvetica, arial;Lato=lato, sans-serif;Lobster=lobster, chicago, serif;Noto Serif=noto serif, serif;Permanent Marker=permanent marker, sans-serif;Raleway=raleway, sans-serif;Roboto=roboto, sans-serif;Source Code Pro=source code pro, monospace,Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats',
    // Only paste plain text
    paste_as_text: true,
    content_css: false,
    // theme: 'silver'
}

/**
* Saves editor content and modify resource
*/
export function saveTinyMceEditorContent(editorId: string)
    : Promise<{ success: boolean; payload?: string; messages?: string[] }> {
    const rejectPayload = {
        success: false,
        messages: ["Editor contents could not be saved"]
    };

    return new Promise((resolve, _reject) => {
        try {
            // Fetch `editor` associated with this component
            const editor = (tinymce.editors || [])[editorId];
            // If error does not exist, something is wrong since if this component exists,
            // the corresponding TinyMCE editor should also exist
            if (!editor) return resolve(rejectPayload);

            // Call the `uploadImages` hook and pass a callback function to be executed
            // after `uploadImages` resolves.
            editor.uploadImages((response: { status: boolean; element: any }[]) => {
                if (!response) return resolve(rejectPayload);

                // Check for unexpected response type
                if (!Array.isArray(response)) return resolve(rejectPayload);

                // Resolve successfully if there are no images
                if (response.length === 0) return resolve({ success: true });

                // Resolve if every image was able to be uploaded successfully
                if (response.length && response.every(r => r.status === true)) {
                    const content = editor.getContent();
                    return resolve({ success: true, payload: content });
                }

                // Reject implicitly
                return resolve(rejectPayload);
            });
        } catch (e) {
            console.log(e);
            // Reject implicitly if an error is caught
            return resolve(rejectPayload);
        }
    });
}


export function openLatexDialog(editor: any) {
    return editor.windowManager.open({
      title: "Add latex",
      body: [
        {
          type: "textbox",
          name: "latexCode",
          label: "latexCode"
        }
      ],
      buttons: [
        {
          text: "Close",
          onclick: "close"
        },
        {
          onclick: "submit",
          text: "Save",
          primary: true
        }
      ],
      onSubmit: function(e: any) {
        var data = e.data.latexCode;
        // Insert content when the window form is submitted
        const katexString = katex.renderToString(data);
        // Replace only the first occurrence of katex
        // (found in class attribute) and append class mceNonEditable
        editor.insertContent(
          katexString.replace(
            "katex",
            "katex mceNonEditable chemhub-katex-custom-style"
          )
        );
      }
    });
  }