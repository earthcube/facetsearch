<template>
    <b-navbar toggleable="lg" type="dark" variant="primary" sticky="true">
        <!-- keep nav centered on wide screens -->
        <b-container fluid="md">
            <!-- only show the back arrow on certain pages and ONLY on small or medium sized devices -->
            <b-navbar-nav class="d-lg-none" v-show="['dataset', 'tool'].includes($route.name.toLowerCase())">
                <b-nav-item v-on:click="$router.back()" class="mr-2"><b-btn variant="outline-primary"><b-icon icon="arrow-left" /></b-btn></b-nav-item>
            </b-navbar-nav>

            <b-navbar-brand :to="{ name: 'landing'}"><img src="../assets/EarthCube-White-Long-Tagline.png" height="30" alt="EarthCube" loading="lazy"></b-navbar-brand>

            <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

            <b-collapse id="nav-collapse" is-nav>
<!--
              <b-navbar-nav>
                <b-nav-item  :to="{ name: 'landing'}">Home</b-nav-item>
                <b-nav-item  :to="{ name: 'Search', query:{q:q}}">Search</b-nav-item>
              </b-navbar-nav>
-->

              <!-- Right aligned nav items -->
              <b-navbar-nav class="ml-auto menu_nav">
                <b-nav-form v-on:submit.prevent="onSubmitNavbar" v-show="$route.name.toLowerCase() != 'landing'">
                    <b-input-group size="sm">
                        <b-form-input type="search" placeholder="Search"
                            v-model="textQuery"
                            v-on:keydown.enter.exact.prevent="onSubmitNavbar"
                        ></b-form-input>
                        <b-input-group-append>
                            <b-button type="submit" variant="secondary"><b-icon icon="search"></b-icon></b-button>
                        </b-input-group-append>
                    </b-input-group>
                </b-nav-form>

                <b-nav-item href="https://graph.geodex.org/blazegraph/#query" class="text-nowrap">SPARQL</b-nav-item>
                <b-nav-item href="about.html" target="_blank">Help</b-nav-item>
              </b-navbar-nav>
            </b-collapse>
        </b-container>
    </b-navbar>
</template>

<script>
import {mapState} from "vuex";
//import navBarToLink from "@/components/navBarToLink";

export default {
name: "navHeader",
//  components: {navBarToLink} ,
  computed: {
    ...mapState(['results','searchExactMatch', 'q'])

  },
  watch:{
  q: 'qUpdated'
  },
  data() {
  return {
    textQuery:'',
  }
  },
  methods:{
  qUpdated() {
    this.textQuery = this.q
  },
    onSubmitNavbar(){
      this.$store.state.q = this.textQuery;
      this.$router.push({name: 'Search', query:{q:this.q} }).catch(err => {console.log('ignore'+err)})
    },
  }
}
</script>

<style scoped lang="scss">
    @import '~/src/assets/bootstrapcss/custom';

.navbar {
    //make flat color
    &.bg-primary {
        background: {
            color: #0C3C60 !important;
            image: none;
        }
    }

    .btn-secondary,
    .btn-secondary:hover {
        background: {
            image: none;
        }
    }

    //on smaller screens, force search box full width
    @include media-breakpoint-down(md) {
        .menu_nav {
            padding: {
                top: $spacer;
                bottom: $spacer * 2;
            }
            
            form {
                width: 100%;

                margin: {
                    top: $spacer;
                    bottom: $spacer;
                }
            }
        }
    }

    //on larger screens, add margins to the search form
    @include media-breakpoint-up(lg) {
        .form-inline {
            margin: {
                right: $spacer / 4;
                left: $spacer / 4;
            }
        }
    }
}

</style>
