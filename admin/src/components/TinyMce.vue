<template>
  <textarea :id="id"></textarea>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import katex from "katex";
import "katex/dist/contrib/mhchem";
import { tinyMCEOptions } from "../util/TinyMceUtils";
import API from "../../../common/js/DB_API";
import { EventBus, EventList, SnackEvent, showSnackbar } from "../EventBus";


/** TinyMCE rich text editor component */
@Component
export default class TinyMce extends Vue {
  @Prop() id!: string;
  @Prop() options!: any;
  @Prop() value!: string;

  private imageMimeType = "image/*";

  /** Passed to TinyMCE for sending a post request to the server with a new image */
  private editorImageUploadApiPath = `api/resource/editorImages/blob`;

  /** Returns options for TinyMCE */
  get tinyMceOptions() {
    // Set file picker callback
    const options: any = Object.assign(
      {},
      { ...tinyMCEOptions },
      this.options || {}
    );
    options.file_picker_callback = this.tinyMceFilePicker;
    options.automatic_uploads = false;

    // custom function implementation for image upload
    options.images_upload_handler = this.imageUploadHandler;

    return options;
  }

  /** Checks if the chosen file is a valid image file */
  isValidImageFile(file: File | null | undefined) {
    if (!file) return false;
    return this.imageMimeType.split("/")[0] === file.type.split("/")[0];
  }

  /** Event handler to trigger file picker for TinyMCE */
  tinyMceFilePicker(callback: Function, _value: any, _meta: any) {
    const imageInput = document.createElement("INPUT");
    imageInput.setAttribute("type", "file");
    imageInput.setAttribute("accept", this.imageMimeType);
    imageInput.addEventListener("change", (_e: Event) => {
      const files = (imageInput as HTMLInputElement).files;
      if (!files || files.length <= 0 || !files[0]) {
        return;
      }

      const imageFile = files[0];
      if (!this.isValidImageFile(imageFile)) {
        return;
      }

      // Display image in TinyMCE
      callback(imageFile.name, {
        alt: imageFile.name,
        src: URL.createObjectURL(imageFile)
      });
    });

    imageInput.dispatchEvent(new MouseEvent("click", { bubbles: false }));
  }

  mounted() {
    //Initial configuration
    let options: any = {};
    let config = (editor: any) => {
      editor.on("NodeChange Change KeyUp", (_e: any) => {
        this.$emit("input", tinymce.get(this.id).getContent());
      });

      editor.on("init", (_e: any) => {
        if (this.value != undefined) {
          tinymce.get(this.id).setContent(this.value);
        }
      });

      //   editor.addButton("Tex", {
      // editor.ui.registry.addButton("Tex", {
      //   text: "LaTex",
      //   tooltip: "Add LaTex",
      //   icon: false,
      //   onAction: function() {
      //     console.log('Add latex');
      //     // Open window
      //     openLatexDialog(editor);
      //   }
      // });
    };

    //Default configuration
    let s1 = (e: any) => config(e);
    if (typeof this.tinyMceOptions == "object") {
      options = { ...this.tinyMceOptions };
      if (!this.tinyMceOptions.hasOwnProperty("selector")) {
        options.selector = "#" + this.id;
      }
      options["valid_elements"] = "*[*]";
      // options["content_style"] =
      //   ".chemhub-katex-custom-style:hover,.chemhub-katex-custom-style:active,.chemhub-katex-custom-style:focus {outline: 0.05em solid orange;}";
      // options["content_css"] = "./../../node_modules/katex/dist/katex.min.css";
      //   options['content_css'] = 'https://www.tiny.cloud/css/codepen.min.css';
      if (typeof this.tinyMceOptions.setup == "function") {
        s1 = editor => {
          config(editor);
          this.tinyMceOptions.setup(editor);
        };
      }
    } else {
      options.selector = "#" + this.id;
    }
    options.setup = (editor: any) => s1(editor);
    this.$nextTick(() => {
      tinymce.init(options);
    });
  }

  beforeDestroy() {
    tinymce.execCommand("mceRemoveEditor", false, this.id);
  }

  private imageUploadHandler(
    blobInfo: any,
    success: Function,
    failure: Function,
    progress: Function
  ) {
    const tempForm = new FormData();

    tempForm.append("file", blobInfo.blob(), blobInfo.filename());

    API.uploadForm("image/imageUpload", tempForm)
      .then(
        (responseData: { fieldName: string; fileName: string; location: string }[]) => {
          const data = responseData && responseData[0];
          if(!data || !data.location) throw new Error();
          success(data.location);
        }
      )
      .catch(e => {
        failure("Image could not be uploaded");
        return;
      });
  }


}
</script>