<template>
  <div class="feedback" >
    <b-button v-b-modal.feedback-modal variant="outline-secondary" @click="showModal">Feedback</b-button>
    <b-modal
        size="lg"
        id="feedback-modal"
        ref="modal"

        @show="resetModal"
        @hidden="resetModal"
        @ok="handleOk"
    >
      <template #modal-title>
        Feedback for {{subject}}:
      </template>
      <template #modal-ok>
        Submit
      </template>
      <form ref="feedbackForm" @submit.stop.prevent="handleSubmit">

        <div class="mt-2">{{ subject }}: {{name }}</div>
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
  name: 'feedback',
  props: {
    subject: {
      type: String,
      required: true
    },
    name:{
      type: String,
      required: true
    },
    urn: {
      required: true
    }
  },
  data(){ return {
    isFeedbackVisible: true,
    feedback_message: '',
    nameState: null,
  }},
  methods: {
    showModal() {
      this.isFeedbackVisible = true;
    },
    closeModal() {
      this.isFeedbackVisible = false;
    },
    checkFormValidity() {
      const valid = this.$refs.feedbackForm.checkValidity()
      this.nameState = valid
      return valid
    },
    resetModal() {
      this.feedback_message = ''
      this.nameState = null
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault()
      // Trigger submit handler
      this.handleSubmit()
    },
    handleSubmit() {
      // Exit when the form isn't valid
      console.log(this.subject)
      console.log(this.name)
      console.log(this.urn)
      console.log(this.feedback_message)
      if (!this.checkFormValidity()) {
        return
      }
      let email_subject = 'GeoCODES' + this.subject + ' feedback'
      let emailBody =  this.subject + ' title: ' + this.name + ' \n'
      emailBody = emailBody.concat(this.subject + 'Id:' + this.urn + '\n')
      emailBody = emailBody.concat('My Message: \n' + this.feedback_message + '\n')
      var mailto_link = 'mailto:' + 'emailfeedback@geocodes.earthcube.org' + '?subject=' + email_subject + '&body=' + encodeURIComponent(emailBody);
      window.open(mailto_link);
      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('feedback-modal')
      })
    }
  },
};
</script>
