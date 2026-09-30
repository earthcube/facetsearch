<template>
  <div class="feedback">
    <b-button
      v-b-modal.feedback-modal
      class="m-2"
      variant="outline-secondary"
      @click="showModal"
      >Feedback</b-button
    >
    <b-modal
      id="feedback-modal"
      ref="modal"
      size="lg"
      @show="resetModal"
      @hidden="resetModal"
      @ok="handleOk"
    >
      <template #modal-title> Feedback for {{ subject }}: </template>
      <template #modal-ok> Submit </template>
      <b-alert v-if="feedbackError" show variant="danger" class="mb-2">
        {{ feedbackError }}
      </b-alert>
      <b-alert v-if="feedbackInfo" show variant="info" class="mb-2">
        {{ feedbackInfo }}
      </b-alert>
      <form ref="feedbackForm" @submit.stop.prevent="handleSubmit">
        <div class="mt-2">{{ subject }}: {{ name }}</div>
        <!--        <div class="mt-2">urn: {{ this.urn }}}</div>-->
        <b-form-group
          label="Your Message"
          label-for="message-input"
          invalid-feedback="You message is required"
          :state="nameState"
        >
          <b-form-input
            id="message-input"
            v-model="feedback_message"
            :state="nameState"
            required
          ></b-form-input>
        </b-form-group>
      </form>
    </b-modal>
  </div>
</template>

<script>
export default {
  name: "Feedback",
  props: {
    subject: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    urn: {
      required: true,
    },
  },
  data() {
    return {
      isFeedbackVisible: true,
      feedback_message: "",
      nameState: null,
      feedbackError: "",
      feedbackInfo: "",
    };
  },
  methods: {
    showModal() {
      this.isFeedbackVisible = true;
    },
    closeModal() {
      this.isFeedbackVisible = false;
    },
    checkFormValidity() {
      const valid = this.$refs.feedbackForm.checkValidity();
      this.nameState = valid;
      return valid;
    },
    resetModal() {
      this.feedback_message = "";
      this.nameState = null;
      this.feedbackError = "";
      this.feedbackInfo = "";
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault();
      // Trigger submit handler
      this.handleSubmit();
    },
    handleSubmit() {
      // Exit when the form isn't valid
      this.feedbackError = "";
      this.feedbackInfo = "";
      if (!this.checkFormValidity()) {
        return;
      }
      let email_subject = "GeoCODES" + this.subject + " feedback";
      let emailBody = this.subject + " title: " + this.name + " \n";
      emailBody = emailBody.concat(this.subject + "Id:" + this.urn + "\n");
      emailBody = emailBody.concat(
        "My Message: \n" + this.feedback_message + "\n"
      );
      var mailto_link =
        "mailto:" +
        "ywkim@illinois.edu" +
        "?subject=" +
        encodeURIComponent(email_subject) +
        "&body=" +
        encodeURIComponent(emailBody);
      let opened = false;
      try {
        opened = window.open(mailto_link) !== null;
      } catch (_err) {
        opened = false;
      }
      if (!opened) {
        this.feedbackError =
          "Could not open your email app automatically. Please check your browser pop-up/mail handler settings and try again.";
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard
            .writeText(emailBody)
            .then(() => {
              this.feedbackInfo =
                "Your feedback message was copied to clipboard. You can paste it into an email to feedback@geocodes.earthcube.org.";
            })
            .catch(() => {
              this.feedbackInfo = "";
            });
        }
        return;
      }
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide("feedback-modal");
      });
    },
  },
};
</script>
