<template>
  <div class="feedback" v-show="isModalVisible">
    <b-button v-b-modal.feedback-modal variant="outline-secondary" @click="showModal">Feedback</b-button>
    <b-modal
        size="lg"
        id="feedback-modal"
        ref="modal"
        title="Feedback"
        @show="resetModal"
        @hidden="resetModal"
        @ok="handleOk"
    >
      <form ref="form" @submit.stop.prevent="handleSubmit">

        <div class="mt-2">Item Title: {{ this.s_name }}</div>
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
    s_name:{
      type: String,
      required: true
    },
    urn: {
      required: true
    }
  },
  data(){ return {
    isModalVisible: true,
    feedback_message: '',
    nameState: null,
  }},
  methods: {
    showModal() {
      this.isModalVisible = true;
    },
    closeModal() {
      this.isModalVisible = false;
    },
    checkFormValidity() {
      const valid = this.$refs.form.checkValidity()
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
      console.log(this.s_name)
      console.log(this.urn)
      console.log(this.feedback_message)
      if (!this.checkFormValidity()) {
        return
      }
      let email_subject = this.subject + ' feedback'
      let emailBody = 'Item Title:' + this.s_name + ' \n'
      emailBody = emailBody.concat('Item Id:' + this.urn + '\n')
      emailBody = emailBody.concat('My Message:' + this.feedback_message + '\n')
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
