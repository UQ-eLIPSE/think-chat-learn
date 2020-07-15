<template>
  <div class="editor">
    <editor-menu-bar :editor="editor" v-slot="{ commands }">
      <div class="menubar">
        <button
          class="menubar__button"
          @click="showImagePrompt(commands.image)"
        >
          <v-icon>add_photo</v-icon>
        </button>
      </div>
    </editor-menu-bar>

    <editor-content class="editor__content" :editor="editor" />
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import Quill from "quill";
import { getIdToken } from "../../../common/js/front_end_auth";
import { EventBus, EventList, SnackEvent, BlobUpload } from "../EventBus";
import API from "../../../common/js/DB_API";
import { Editor, EditorContent, EditorMenuBar } from "tiptap";
import {
  HardBreak,
  Heading,
  Image,
  Bold,
  Code,
  Italic,
} from 'tiptap-extensions';

@Component({
  components: {
    EditorContent,
    EditorMenuBar
  }
})
export default class TipTap extends Vue {
  @Prop({ default: "" }) private id!: string;
  @Prop({ default: "" }) private value!: string;
  @Prop({ default: null }) editor: any;

  private async mounted() {
    await Vue.nextTick();
    this.editor = new Editor({
      content: this.value,
      extensions: [
          new HardBreak(),
          new Heading({ levels: [1, 2, 3] }),
          new Image(),
          new Bold(),
          new Code(),
          new Italic(),
        ],
    });
  }

    showImagePrompt(command: any) {
      const src = prompt('Enter the url of your image here')
      if (src !== null) {
        command({ src })
      }
    }

  beforeDestroy() {
    this.editor.destroy();
  }
}
</script>
