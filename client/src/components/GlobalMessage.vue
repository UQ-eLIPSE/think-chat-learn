<template>
  <div class="global-message"
       :class="globalMessageClass"
       v-if="message">
    <font-awesome-icon :icon="iconByMessageType" /> {{message}}
  </div>
</template>


<script lang="ts">
import { Vue, Component, Prop, Watch } from "vue-property-decorator";
import { SystemMessageTypes } from "../store";
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
        error: this.systemMessage.type === SystemMessageTypes.FATAL_ERROR,
        warning: this.systemMessage.type === SystemMessageTypes.WARNING,
        success: this.systemMessage.type === SystemMessageTypes.SUCCESS,
      };

    }

    return {};
  }

  get iconByMessageType() {
    if (this.hasMessage) {
      switch (this.systemMessage.type) {
        case SystemMessageTypes.FATAL_ERROR:
        return "exclamation-circle";
        case SystemMessageTypes.WARNING:
          return "exclamation-circle";
        case SystemMessageTypes.SUCCESS:
          return "check-circle";
        default:
          return "";
      }
    }

    return "";
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