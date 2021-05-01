<template>
    <b-container fluid="md" class="mt-5">
        <!-- intro paragraph -->
        <b-jumbotron text-variant="white" bg-variant="primary">
            <template #header><span class="text-white">What is GeoCODES?</span></template>

            <template #lead><span class="p-5">
                GeoCODES is an NSF Earthcube program effort to better enable cross-domain discovery of and access to geoscience data and research tools. GeoCODES is made up of three components respectively.
            </span></template>
        </b-jumbotron>

        <b-card-group deck>
            <b-card bg-variant="light" class="text-center" title="An evolving standard">
                <b-card-text>for exposing data called <a href="https://github.com/ESIPFed/science-on-schema.org" target="_blank" rel="noopener" class="text-nowrap">science on schema</a></b-card-text>
            </b-card>

            <b-card bg-variant="light" class="text-center" title="A set of tools">
                <b-card-text>to index relevant data from partners within the Council of Data Facilities who have adopted science on schema, plus a prototype portal to query that data</b-card-text>
            </b-card>

            <b-card bg-variant="light" class="text-center" title="A Resource Registry">
                <b-card-text>by which to <a href="http://tinyurl.com/2register-ecrr" target="_blank" rel="noopener">register</a> and <a href="http://www.earthcube.org/resourceregistry/" target="_blank" rel="noopener">discover</a> <span class="text-nowrap">relevant tools</span></b-card-text>
            </b-card>
        </b-card-group>

        <b-container fluid="md" class="mt-5">
            <h2>Council of Data Facilities (<a href="https://www.earthcube.org/council-of-data-facilities" target="_blank">CDF</a>)</h2>
            <h5>Repositories crawled and indexed</h5>
        </b-container>

        <b-card-group columns>
            <b-card no-body class="text-center"
                title="Environmental Data Initiative"
            >
                <b-card-body >
                    <b-card-title>
                        <b-link href="http://environmentaldatainitiative.org" target="_blank" class="d-flex flex-column align-items-center">
                            <b-img fluid src="/images/repo/edi.png"></b-img>
                            Environmental Data Initiative
                        </b-link>
                    </b-card-title>

                    <b-card-text v-b-toggle.collapse-1>
                        <i>28248 records</i>

                        <b-collapse id="collapse-1" class="text-left small">
                            <p class="mt-3">
                                The Environmental Data Initiative is an NSF-funded project meant to accelerate curation and  archive of environmental data, emphasizing data from projects funded by the NSF Division of Environmental Biology. Aside from hosting the LTER data repository and collaborating with the LTER Information Managers, EDI serves the ecological research community including but not limited to research funded by the Long TermResearch in Environmental Biology (LTREB), Organization for Biological Field Stations (OBFS), and Macrosystems Biology (MSB). The Environmental Data Initiative maintains and develops the PASTA infrastructure for its data repositories, and has recently become DataONE’s 40th member node.
                            </p>
                        </b-collapse>

                        <p><b-icon icon="caret-down-fill" scale=".8"></b-icon></p>
                    </b-card-text>

                </b-card-body>
            </b-card>
        </b-card-group>

        <b-container fluid="md" class="mt-5">
            <h2>Feedback</h2>

            <p><a href="https://github.com/earthcube/geodexui/issues" target="_blank">Create an issue</a> and a feedback email coming soon.</p>
        </b-container>

        <b-container fluid="md" class="mt-5">
            <h2>Supported by</h2>

            <p>Work on this site is supported by</p>

            <div><img src="https://www.nsf.gov/images/logos/NSF_4-Color_bitmap_Logo.png" width="38" alt="NSF"></div>
            <h5>NSF EarthCube</h5>
            <div><i>NSF award #1928208</i></div>

            <p class="mt-4"><a href="https://github.com/earthcube" target="_blank">Open source</a> under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a></p>
        </b-container>
<!--
in case more intro paragraph text is needed
        <b-container class="col-md-8 mt-5">
        </b-container>
-->

  <div>

    <b-row class="mt-5" align-content="center" title="hover over each for a description">
      <b-col class="m-5 display-4"> &emsp; &emsp; Council of Data Facilities (<a id="repo-list"
                                                                                 href=https://www.earthcube.org/council-of-data-facilities>CDF
      </a>)
        repositories crawled and indexed<a href="https://earthcube.clowderframework.org/spaces?size=24"
                                           target="_blank">:</a>
      </b-col>
    </b-row>


    <b-row>
      <table class="dataframe" style=" border: 6px inset white; padding: 15px">
        <tbody>
        <!-- row )&*(&*(&*()HGIUJHIHIJO ONE -->
        <tr>
          <td width="33%">
            <div
                title=" The Environmental Data Initiative is an NSF-funded project meant to accelerate curation and  archive of environmental data, emphasizing data from projects funded by the NSF Division of Environmental Biology. Aside from hosting the LTER data repository and collaborating with the LTER Information Managers, EDI serves the ecological research community including but not limited to research funded by the Long TermResearch in Environmental Biology (LTREB), Organization for Biological Field Stations (OBFS), and Macrosystems Biology (MSB). The Environmental Data Initiative maintains and develops the PASTA infrastructure for its data repositories, and has recently become DataONE’s 40th member node. . [28248 records]">
              <a href=http://environmentaldatainitiative.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src="../../assets/repo/edi.png"/>
                Environmental Data Initiative
              </a>
              <br><small>[28248 records]</small>
            </div>
          </td>

          <td width=33%>
            <div
                title="The Biological and Chemical Oceanography Data Management Office (BCO-DMO) was created in late 2006 to serve PIs funded by the NSF Geosciences Directorate (GEO) Division of Ocean Sciences (OCE) Biological and Chemical Oceanography Programs and Office of Polar Programs (OPP) Antarctic Sciences (ANT) Organisms & Ecosystems Program. The BCO-DMO is a combination the Data Management Offices formerly created to support the US JGOFS and US GLOBEC programs. The BCO-DMO staff members are the curators of the legacy data collections created by those respective programs, as well as many other more recent research efforts including those of individual investigators. [5018 records]">
              <a href=http://www.bco-dmo.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/bco-dmo.png><br>

                Biological and Chemical Oceanography Data Management Office
              </a>
              <br><small>[5018 records]</small>
            </div>
          </td>

          <td width=33%>
            <div
                title="CUAHSI's Hydrologic Information System (CUAHSI-HIS) provides web services, tools, standards and procedures that enhance access to more and better data for hydrologic analysis. [4185 records]">
              <a href=https://www.cuahsi.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/hydroshare.png><br>

                Consortium of Universities for the Advancement of Hydrologic Science, Inc. (CUAHSI)
              </a>
              <br><small>[4185 records]</small>
            </div>
          </td>
        </tr>
        <!-- row )&*(&*(&*()HGIUJHIHIJO TWO -->
        <tr>

          <td width=33%>
            <div
                title="IEDA is a community-based facility that serves to support, sustain, and advance the geosciences by providing data services for observational Geoscience data from the Ocean, Earth, and Polar Sciences. IEDA welcomes and encourages investigators to contribute their data to the IEDA collections so that the data can be discovered and reused by a diverse community now and in the future. The IEDA collections are: EarthChem, Geochron, System for Earth Sample Registration (SESAR), Marine Geoscience Data System (MGDS), and USAP Data Center. Meta-Search provided on the portal through IEDA Data Browser http://www.iedadata.org/databrowser. [7147 records]">
              <a href=http://www.iedadata.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/iedadata.png><br>
                IEDA (Integrated Earth Data Applications)
              </a>
              <br><small>[7147 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="OpenTopography facilitates community access to high-resolution, Earth science-oriented, topography data, and related tools and resources. The OpenTopography Facility is based at the San Diego Supercomputer Center at the University of California, San Diego and is operated in collaboration with colleagues in the School of Earth and Space Exploration at Arizona State University. Core operational support for OpenTopography comes from the National Science Foundation Earth Sciences: Instrumentation and Facilities Program (EAR/IF) and the Office of Cyberinfrastructure. In addition, we receive funding from the NSF and NASA to support various OpenTopography related research and development activities. [502 records]">

              <a href=http://www.opentopography.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/opentopography.png><br>
                OpenTopography
              </a>
              <br><small>[502 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="UNAVCO promotes research by providing access to data that our community of geodetic scientists uses for quantifying the motions of rock, ice and water that are monitored by a variety of sensor types at or near the Earth's surface. After processing, these data enable millimeter-scale surface motion detection and monitoring at discrete points, and high-resolution strain imagery over areas of tens of square meters to hundreds of square kilometers. The data types include GPS/GNSS, imaging data such as from SAR and TLS, strain and seismic borehole data, and meteorological data. Most of these can be accessed via web services. In addition, GPS/GNSS datasets, TLS datasets, and InSAR products are assigned digital object identifiers. [5086 records]">
              <a href=http://www.unavco.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/unavco.png><br>

                UNAVCO
              </a>
              <br><small>[5086 records]</small>
            </div>
          </td>
        </tr>

        <!-- row )&*(&*(&*()HGIUJHIHIJO ONE -->
        <tr>

          <td width=33%>
            <div
                title="The Site Survey Data Bank (SSDB) is a repository for site survey data submitted in support of International Ocean Discovery Program (IODP) proposals and expeditions. SSDB serves different roles for different sets of users. [5344 records]">
              <a href=https://ssdb.iodp.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/ssdb.iodp.png><br>
                IODP Site Survey Databank
              </a>
              <br><small>[5344 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="Driven by data-rich use cases that span geodesy, geodynamics, seismology, and ecohydrology, the BALTO project will enable brokered access to diverse geoscience data, including data that have been collected/organized by individual scientists in novel or unusual forms, also known as “long-tail” datasets. [89 records]">
              <a href=http://balto.opendap.org>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/balto.png><br>

                Balto
              </a>
              <br><small>[89 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="The LinkedEarth wiki is an EarthCube-funded platform that: enables the curation of publicly-accessible database by paleoclimate experts, and, fosters the development of standards, so paleoclimate data are easier to analyze, share, and re-use. [17964 records]">
              <a href=http://wiki.linked.earth>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/linked.earth.png><br>

                Linked Earth
              </a>
              <br><small>[17964 records]</small>
            </div>
          </td>

        </tr>
        <!-- row )&*(&*(&*()HGIUJHIHIJO Three -->
        <tr>

          <td width=33%>
            <div
                title="fosters the development of standards, so paleoclimate data are easier to analyze, share, and re-use. [28 records]">
              <a href=http://iris.edu>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/iris.png><br>
                IRIS
              </a>
              <br><small>[28 records]</small>
            </div>
          </td>

          <td width=33%>
            <div
                title="OpenSky is the home for NCAR/UCAR research and historical materials as well as other collections of digital assets. Our mission is to provide free and open access to the scientific output and other intellectual resources created at NCAR/UCAR for the advancement of the atmospheric and related sciences. You can reach us at opensky@ucar.edu with any questions. [11672 records]">
              <a href=https://data.ucar.edu>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/ucar.png><br>

                UCAR
              </a>
              <br><small>[11672 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="Open Core Data is an implementation of the RDA Digital Object Cloud. Open Core Data contains digital objects from the contintental and ocena drilling research projects funded by the National Science Foundation. [18171 records]">
              <a href=https://opencoredata.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/opencoredata.png><br>

                opencoredata
              </a>
              <br><small>[18171 records]</small>
            </div>
          </td>

        </tr>
        <!-- row )&*(&*(&*()HGIUJHIHIJO Four -->
        <tr>

          <td width=33%>
            <div
                title="These objects are described using the structured data on the web patterns promoted by the ESIP Science on Schema work. The object landing pages implement FAIR data practices and expose stuctured data in JSON-LD. [4136 records]">
              <a href=https://www.earthref.org/MagIC>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/magic.png><br>

                Magnetics Information Consortium (MagIC)
              </a>
              <br><small>[4136 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="Neotoma is a multiproxy paleoecological database that covers the Pliocene-Quaternary, including modern microfossil samples. The database is an international collaborative effort among individuals from 19 institutions, representing multiple constituent databases. There are over 20 data-types within the Neotoma Paleoecological Database, including pollen microfossils, plant macrofossils, vertebrate fauna, diatoms, charcoal, biomarkers, ostracodes, physical sedimentology and water chemistry. Neotoma provides an underlying cyberinfrastructure that enables the development of common software tools for data ingest, discovery, display, analysis, and distribution, while giving domain scientists control over critical taxonomic and other data quality issues. [11955 records]">
              <a href=http://www.neotomadb.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/neotomadb.png><br>

                Neotoma
              </a>
              <br><small>[11955 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="Community-driven preservation, discovery, access, and visualization of geochemical, geochronological, and petrological data. [639 records]">
              <a href=https://ecl.earthchem.org/home.php>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/earthchem.png><br>

                earthchem
              </a>
              <br><small>[639 records]</small>
            </div>
          </td>

        </tr>
        <!-- row )&*(&*(&*()HGIUJHIHIJO FIVE -->
        <tr>

          <td width=33%>
            <div
                title="The 'Cross-Domain Observational Metadata for Environmental Sensing (X-DOMES)' is an NSF/EarthCube project tasked to develop prototypes for the application of standards-based description of environmental sensor metadata, including provenance, that is paramount to automated data discovery, access, archival, processing, as well as quality control and assessment. [17 records]">
              <a href=https://xdomes.tamucc.edu/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/xdomes.png><br>

                xdomes
              </a>
              <br><small>[17 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="The National Ecological Observatory Network (NEON) is a continental-scale observatory designed to gather and provide 30 years of ecological data on the impacts of climate change, land use change and invasive species on natural resources and biodiversity. NEON is a project of the National Science Foundation, with many other U.S. agencies and NGOs cooperating. [179 records]">
              <a href=http://www.neonscience.org/>
                <img style="max-width: 180px; max-height: 90px"
                     src=../../assets/repo/neon.png><br>

                National Ecological Observatory Network (NEON)
              </a>
              <br><small>[179 records]</small>
            </div>
          </td>


          <td width=33%>
            <div
                title="The EarthCube Resource Registry (ECRR) is intended to provide immediate access to a list of EC capabilities to understand what EC is, and what it isn’t. To support this goal, the ECRR project has developed several persistent resources available for wider EarthCube use. [274 records]">
              <a href=http://www.earthcube.org/resourceregistry/>
                <img
                    style="max-width: 180px; max-height: 90px"
                    src=../../assets/repo/resource_registry.png><br>

                Resource Registry
              </a>
              <br><small>[274 records]</small>
            </div>
          </td>


        </tr>


        </tbody>
      </table>

    </b-row>
    <!--
    <div class="row">
    <p>
    <div class="col-2 hidden-sm"></div>
    <div class="col-8">
    -->
    <b-row>
      <h3>Feedback:</h3>
      Create an <a href="https://github.com/earthcube/geodexui/issues" target="_blank">issue</a> and a feedback email
      coming
      soon.
      <!--  </div>-->
    </b-row>

    <!--  </div>-->
    <!-- <footer style="padding-bottom:5px;background-image: linear-gradient(#7391ff, #625354);"> -->
    <b-row>
      <footer style="padding-bottom:5px;background-color: rgba(66,109,148,0.8)">
        <!-- <div class="container"> -->

        <div class="row">
          <div class="col-12">
            <h6 style="color:white">&emsp; &emsp; Work on this site is supported by NSF EarthCube <img
                src="https://www.nsf.gov/images/logos/NSF_4-Color_bitmap_Logo.png" width=38> NSF award #1928208
            </h6>
            <!-- <h6 style="color:grey">Simple Grid by <a style="color:grey" href="http://zcole.me" target="_blank">Zach Cole</a> -->
            &emsp; &emsp; <a style="color:blue" href="https://github.com/earthcube" target="_blank">Open source</a> <a
              style="color:blue" href="https://opensource.org/licenses/MIT" target="_blank">under the MIT License</a>
            <!--        </h6>-->
          </div>
        </div>
      </footer>
    </b-row>

  </div>

    </b-container>
</template>

<script>
export default {
  name: "about.vue"
}
</script>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

</style>
