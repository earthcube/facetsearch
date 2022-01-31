<template>
  <div class="feedback" >
    <b-button v-b-modal.feedback-modal variant="outline-secondary" @click="showModal">Create Collection</b-button>
    <b-modal
        size="lg"
        id="feedback-modal"
        ref="modal"

        @show="resetModal"
        @hidden="resetModal"
        @ok="handleOk"
    >
      <template #modal-title>
        Create New Collection:
      </template>
      <template #modal-ok>
        Create
      </template>
      <form ref="feedbackForm" @submit.stop.prevent="handleSubmit">

        <b-form-group
            label="Collection Name"
            label-for="message-input"
            invalid-feedback="You message is required"
            :state="nameState"
        >
          <b-form-input
              id="message-input"
              v-model="name"
              :state="nameState"
              required
          ></b-form-input>
        </b-form-group>

      </form>
    </b-modal>


  </div>
</template>

<script>
import localforage from "localforage";
import {mapGetters, mapState} from "vuex";

export default {
  name: "CreateCollection.vue",
  inject: ["updteAllCollections"],
  data(){ return {
    isFeedbackVisible: true,
    name: '',
    nameState: null,
  }},
  computed: {
    ...mapState(['setNewCollection']),
    //...mapGetters(['q',])
    ...mapGetters (['getCollections'])
  },
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
      this.name = ''
      this.nameState = null
    },
    handleOk(bvModalEvt) {
      // Prevent modal from closing
      bvModalEvt.preventDefault()
      // Trigger submit handler
      this.handleSubmit()
    },
    handleSubmit() {
      var self = this
      // Exit when the form isn't valid
      if (!this.checkFormValidity()) {
        return
      }
      this.$store.commit('setNewCollection', {'key': this.name, 'value': this.name})
      console.log(this.name)
      localforage.getItem(this.name, function (err, value) {
        if (value === null) {
          localforage.setItem(
              self.name,
              {'type': 'collection name', 'collection': 'collection name', 'value': self.name}
          ).then((value) => {
            console.log("store: " + "collection name "+self.name + value.g + " to localstorage");
            var colls = []
            localforage.iterate(function(value, key) {
              console.log([key, value]);
              colls.push(value.value)
              // Vue.set(self.collections, self.collections.length, value)
            }).then(function() {
              self.updteAllCollections(colls)
            }).catch(function(err) {
              // This code runs if there were any errors
              console.log(err);
            });

          }).catch((err) => {
            console.log('oops! the account was too far gone, there was nothing we could do to save him ', err);
          });
          console.log("add to collection");
        } else {
          // localforage.setItem(newFilename, value, function () {
          //   localforage.removeItem(filename, function () { return callback(); });
          // });
          console.log(value)
        }
      });

      // Hide the modal manually
      this.$nextTick(() => {
        this.$bvModal.hide('feedback-modal')
      })
    }
  },
}
</script>

<style scoped>

</style>