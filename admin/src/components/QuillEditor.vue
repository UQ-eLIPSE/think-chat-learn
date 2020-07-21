<template>
    <div>
        <!-- For better or worse, create a manual toolbar -->
        <div :id="`toolbar-${this.id}`">
            <span class="ql-formats">
                <select class="ql-font">
                    <option selected value>Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                </select>
            </span>
            <span class="ql-formats">
                <select class="ql-size">
                    <option value="small">Small</option>
                    <option selected value>Default</option>
                    <option value="large">Large</option>
                    <option value="huge">Huge</option>
                </select>
            </span>            
            <span class="ql-formats">
                <button type="button" class="ql-bold"></button>
                <button type="button" class="ql-italic"></button>
                <button type="button" class="ql-underline"></button>
                <button type="button" class="ql-strike"></button>
                <button type="button" class="ql-header" value="1"></button>
                <button type="button" class="ql-blockquote"></button>
                <button type="button" class="ql-code-block"></button>
                <button type="button" class="ql-list" value="ordered"></button>
                <button type="button" class="ql-list" value="bullet"></button>
                <button type="button" class="ql-script" value="sub"></button>
                <button type="button" class="ql-script" value="super"></button>
                <button type="button" class="ql-indent" value="+1"></button>
                <button type="button" class="ql-indent" value="-1"></button>                
            </span>
            <span class="ql-formats">
                <select class="ql-color">
                    <option selected="selected"></option>
                    <option value="#e60000"></option>
                    <option value="#ff9900"></option>
                    <option value="#ffff00"></option>
                    <option value="#008a00"></option>
                    <option value="#0066cc"></option>
                    <option value="#9933ff"></option>
                    <option value="#ffffff"></option>
                    <option value="#facccc"></option>
                    <option value="#ffebcc"></option>
                    <option value="#ffffcc"></option>
                    <option value="#cce8cc"></option>
                    <option value="#cce0f5"></option>
                    <option value="#ebd6ff"></option>
                    <option value="#bbbbbb"></option>
                    <option value="#f06666"></option>
                    <option value="#ffc266"></option>
                    <option value="#ffff66"></option>
                    <option value="#66b966"></option>
                    <option value="#66a3e0"></option>
                    <option value="#c285ff"></option>
                    <option value="#888888"></option>
                    <option value="#a10000"></option>
                    <option value="#b26b00"></option>
                    <option value="#b2b200"></option>
                    <option value="#006100"></option>
                    <option value="#0047b2"></option>
                    <option value="#6b24b2"></option>
                    <option value="#444444"></option>
                    <option value="#5c0000"></option>
                    <option value="#663d00"></option>
                    <option value="#666600"></option>
                    <option value="#003700"></option>
                    <option value="#002966"></option>
                    <option value="#3d1466"></option>
                </select>
                <select class="ql-background">
                    <option value="#000000"></option>
                    <option value="#e60000"></option>
                    <option value="#ff9900"></option>
                    <option value="#ffff00"></option>
                    <option value="#008a00"></option>
                    <option value="#0066cc"></option>
                    <option value="#9933ff"></option>
                    <option selected="selected"></option>
                    <option value="#facccc"></option>
                    <option value="#ffebcc"></option>
                    <option value="#ffffcc"></option>
                    <option value="#cce8cc"></option>
                    <option value="#cce0f5"></option>
                    <option value="#ebd6ff"></option>
                    <option value="#bbbbbb"></option>
                    <option value="#f06666"></option>
                    <option value="#ffc266"></option>
                    <option value="#ffff66"></option>
                    <option value="#66b966"></option>
                    <option value="#66a3e0"></option>
                    <option value="#c285ff"></option>
                    <option value="#888888"></option>
                    <option value="#a10000"></option>
                    <option value="#b26b00"></option>
                    <option value="#b2b200"></option>
                    <option value="#006100"></option>
                    <option value="#0047b2"></option>
                    <option value="#6b24b2"></option>
                    <option value="#444444"></option>
                    <option value="#5c0000"></option>
                    <option value="#663d00"></option>
                    <option value="#666600"></option>
                    <option value="#003700"></option>
                    <option value="#002966"></option>
                    <option value="#3d1466"></option>
                </select>                
            </span>
            <span class="ql-formats">
                <button type="button" class="ql-formula"></button>
                <button type="button" class="ql-image"><v-icon>add_a_photo</v-icon></button>            
            </span>
        </div>
        <!-- It's better to bind to the quill instance than use a getter as VueJS cannot listen to it -->
        <div :id="id" v-on:input="fetchHTML()" v-bind:value="value">
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import Quill from "quill";
import ImageResize from "quill-image-resize";
import { getIdToken } from "../../../common/js/front_end_auth";
import { EventBus, EventList, SnackEvent, BlobUpload } from "../EventBus";
import API from "../../../common/js/DB_API";
import Delta from "quill-delta";

// Unfortunately we have to create our own custom element
// See: https://quilljs.com/guides/cloning-medium-with-parchment/#images
const BlockEmbed = Quill.import('blots/block/embed');
class ImageBlot extends BlockEmbed {
  static create(url: string) {
    const node: any = super.create();
    node.setAttribute('src', url);
    return node;
  }

  static value(node: HTMLImageElement) {
    return {
      url: node.getAttribute('src')
    };
  }
}
ImageBlot.blotName = 'image';
ImageBlot.tagName = 'img';

// Register the modules
Quill.register(ImageBlot);
Quill.register('modules/imageResize', ImageResize);

@Component({})
export default class QuillEditor extends Vue {

    @Prop({ default: "" }) private id!: string;
    @Prop() private value!: string;

    // An array which contains references to the blobs. We don't care about order
    private blobReference: BlobUpload[] = [];

    // A UUID so we can create multiple editors
    private quillInstance: Quill | null = null;

    get token() {
        return getIdToken();
    }

    // Explcitly forces HTML to be updated by the v-model
    private fetchHTML() {
        this.$emit('input', this.quillInstance ? this.quillInstance.root.innerHTML : '')
    }

    // Rewrite how the images are handled with Quill
    private fetchImage() {
        // Super shady file input
        const tempInput = document.createElement("input");
        tempInput.setAttribute("type", "file");
        // Note we can never stop users from submitting bad things
        tempInput.setAttribute("accept", ".png, .jpg, .jpeg, .gif, .svg");
        tempInput.click();

        tempInput.onchange = ((event: Event) => {
            if (!tempInput.files) {
                const message: SnackEvent = {
                    message: "No files added to input",
                    error: true
                }
                EventBus.$emit(EventList.PUSH_SNACKBAR, message);
                return;
            }
            const image = tempInput.files[0];
            // If then else army for specific searches
            if (image.type === "image/png" || image.type === "image/jpg" || image.type === "image/jpeg" || image.type === "image/gif" || image.type === "image/svg+xml") {
                this.localStoreImage(image);
            } else {
                const message: SnackEvent = {
                    message: "Invalid file added",
                    error: true
                }
                EventBus.$emit(EventList.PUSH_SNACKBAR, message);
                return;
            }
        });
    }

    private localStoreImage(image: Blob) {
        const url = URL.createObjectURL(image);
        this.blobReference.push({
            id: url,
            blob: image
        });
        this.renderImage(url);
    }

    private renderImage(url: string) {
        if (this.quillInstance) {
            const change = this.quillInstance.getSelection();
            if (change) {
                const delta = this.quillInstance.insertEmbed(change.index + 1, "image", url);
            }
        } else {
            // TODO snackbar
        }
    }

    private handleUpload() {
        // Go through all of the tags and upload
        // Delete all the tags not in there
        if (this.quillInstance) {
            const deltas = this.quillInstance.getContents();

            const imageUrls: string[] = [];
            deltas.forEach((delta) => {
                if (delta.insert && (delta.insert as any)["image"]) {
                    imageUrls.push((delta.insert as any)["image"].url);
                }
            });

            // If the url is not there, let go
            const filteredReferences: BlobUpload[] = [];
            this.blobReference.forEach((blobUpload) => {
                const index = imageUrls.findIndex((url) => {
                    return blobUpload.id === url;
                });
                
                if (index === -1) {
                    URL.revokeObjectURL(blobUpload.id);
                } else {
                    filteredReferences.push(blobUpload);
                }
            });
            this.blobReference = filteredReferences;

            // Then we forcibly go through the html
            this.fetchHTML();
        }

        EventBus.$emit(EventList.QUILL_UPLOAD, this.blobReference);
    }

    // Gotta save memory by removing blobs once uploaded
    private destroyed() {
        this.blobReference.forEach((blobObject) => {
            URL.revokeObjectURL(blobObject.id);
        });

        // Remove the quill instance so we tell bus to not upload images
        // from this component.
        this.quillInstance = null;
        EventBus.$off(EventList.CONSOLIDATE_UPLOADS, this.handleUpload);
    }

    private async mounted() {
        await Vue.nextTick();
        EventBus.$on(EventList.CONSOLIDATE_UPLOADS, this.handleUpload);

        this.quillInstance = new Quill(`#${this.id}`, {
            modules: {
                toolbar: `#toolbar-${this.id}`,
                'formula': true,
                imageResize : {}
            },
            theme: 'snow'
        });

        if (this.quillInstance) {
            // Override the image and delete listener
            this.quillInstance.getModule("toolbar").addHandler('image', () => {
                this.fetchImage();
            });
            // See https://quilljs.com/docs/modules/clipboard/#dangerouslypastehtml
            // Worst case scenario would be to remove the editor outright or only use deltas
            // to represent the information
            if (this.value) {
                this.quillInstance.root.innerHTML= this.value;
            }
        }     
    }
}
</script>
