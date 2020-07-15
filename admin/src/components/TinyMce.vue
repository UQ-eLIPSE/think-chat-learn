 <template>
  <div class="tiny-rte">
    <editor api-key="no-api-key" :id="id" v-model="value" :init="initOptions" />
  </div>
</template>
 <script lang="ts">
import { Vue, Component, Prop } from "vue-property-decorator";
import { getIdToken } from "../../../common/js/front_end_auth";
import { EventBus, EventList, SnackEvent, BlobUpload } from "../EventBus";
import API from "../../../common/js/DB_API";
import Editor from "@tinymce/tinymce-vue";
// import { tinyMceInitOptions } from "../util/TinyUtils";
// import tinymce from "tinymce";

@Component({
  components: {
    editor: Editor
  }
})
export default class TinyMce extends Vue {
  @Prop({ default: "" }) private id!: string;
//   @Prop({ default: "" }) private value!: string;
  @Prop({ default: null }) editor: any;
  private value: string = '<p>bcd<p>';

  get initOptions() {
    return {};
    // return tinyMceInitOptions;
  }

  mounted() {
      const vm = this;
      console.log('mounted:', vm);
    // this.$nextTick(() => {
    //   tinymce.init(vm.initOptions).then(function(editors) {
    //     vm.editor = editors[0];
    //   });
    // });
  }
}
</script>
<style scoped>
.tiny-rte {
    min-height: 500px;
}

.tiny-rte > * {
    height: 100%;
}

</style>