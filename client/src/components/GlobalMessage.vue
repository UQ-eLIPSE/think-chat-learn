<template>
  <div class="global-message"
       :class="globalMessageClass"
       v-if="message">
    {{message}}</div>
</template>


<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";

@Component({})
export default class GlobalMessage extends Vue {

  get systemMessage() {
    return this.$store.state.systemMessage;
  }

  get hasError() {
    return this.systemMessage && this.systemMessage.error && this.systemMessage.message;
  }

  get hasMessage() {
    return this.systemMessage && this.systemMessage.message;
  }


  get message() {
    return this.hasMessage ? this.systemMessage.message : null;
  }

  get globalMessageClass() {
    if (this.hasMessage) {
      return {
        "error": this.systemMessage.type === "FATAL_ERROR",
        "warning": this.systemMessage.type === "WARNING",
        "success": this.systemMessage.type === "SUCCESS",
      }
    }

    return {};
  }
}
</script>

<style lang="scss" scoped>
.global-message {
  width: 100%;
  position: relative;
  padding: .75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
  border-radius: .25rem;
  font-size: 1.3em;
}

.error {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}


.warning {
  color: #856404;
  background-color: #fff3cd;
  border-color: #ffeeba;
}

.success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}
</style>