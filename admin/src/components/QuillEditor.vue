<template>
    <div>
        <div :id="`toolbar-${this.id}`">
            <button type="button" class="ql-bold"></button>
            <button type="button" class="ql-italic"></button>
            <button type="button" class="ql-underline"></button>
            <button type="button" class="ql-strike"></button>
            <button type="button" class="ql-code-block"></button>
            <button type="button" class="ql-formula"></button>
            <!-- <button type="button" class="ql-image"></button>-->
            <button type="button" class="ql-image"><v-icon>add_a_photo</v-icon></button>
        </div>
        <!-- It's better to bind to the quill instance than use a getter as VueJS cannot listen to it -->
        <div :id="id" v-on:input="fetchHTML()" v-bind:value="value">
        </div>
    </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import Quill from "quill";
// Pseudo quasi import
import katex from "katex";
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
Quill.register(ImageBlot);

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
        tempInput.setAttribute("accept", ".png, .jpg, .jpeg, .gif");
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
            if (image.type === "image/png" || image.type === "image/jpg" || image.type === "image/jpeg" || image.type === "image/gif") {
                this.localStoreImage(image);
                // Propogate the input explicitly
                this.fetchHTML();
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
        }

        EventBus.$emit(EventList.QUILL_UPLOAD, this.blobReference);
    }

    // Gotta save memory by removing blobs once uploaded
    private destroyed() {
        this.blobReference.forEach((blobObject) => {
            URL.revokeObjectURL(blobObject.id);
        });
        EventBus.$off(EventList.CONSOLIDATE_UPLOADS);
    }

    private mounted() {
        EventBus.$on(EventList.CONSOLIDATE_UPLOADS, this.handleUpload);
        this.quillInstance = new Quill(`#${this.id}`, {
            modules: {
                toolbar: `#toolbar-${this.id}`,
                'formula': true
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
