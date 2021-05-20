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

<!--
in case more intro paragraph text is needed
        <b-container class="col-md-8 mt-5">
        </b-container>
-->

        <b-container fluid="md" class="mt-5">
            <h2>Council of Data Facilities (<a href="https://www.earthcube.org/council-of-data-facilities" target="_blank">CDF</a>)</h2>
            <h5>Repositories crawled and indexed</h5>
        </b-container>

        <b-card-group columns class="mt-4">
            <b-card no-body class="text-center"
                v-for="(item, index) in repositories"
                v-bind:key="index"
            >
                <b-card-body>
                    <b-card-title>
                        <b-link target="_blank" class="d-flex flex-column align-items-center"
                            :href="item.website"
                        >
                            <div class="logo d-flex justify-content-center align-items-center">
                                <b-img fluid
                                    :src="'/images/repo/' + item.image"
                                ></b-img>
                            </div>

                            <div class="mt-3">{{item.title}}</div>
                        </b-link>
                    </b-card-title>

                    <b-card-text>
                        <i v-if="item.record_count > 0">{{item.record_count}} record{{(item.record_count == 1) ? '' : 's'}}</i>

                        <div class="mt-3 small text-left" v-html="item.description"></div>
                    </b-card-text>
<!--
//left this here in case the description was too much to be shown all the time (use collapse). problem is, sometimes expanding forces an item to move to a different column (feels like it disappears)
//could use accordian option to only allow a single card to be expanded at a time...but still doesn't solve the issue completely and why this was moved to show the description by default
                    <b-card-text
                        v-b-toggle="'collapse_repository_' + index"
                    >
                        <i v-if="item.record_count > 0">{{item.record_count}} record{{(item.record_count == 1) ? '' : 's'}}</i>

                        <b-collapse class="text-left small"
                            :id="'collapse_repository_' + index"
                        >
                            <div class="mt-3" v-html="item.description"></div>
                        </b-collapse>

                        <div class="mt-3">
                            <b-icon icon="caret-down-fill" scale="1" class="when_open"></b-icon>
                            <b-icon icon="caret-up-fill" scale="1" class="when_closed"></b-icon>
                        </div>
                    </b-card-text>
-->
                </b-card-body>
            </b-card>
        </b-card-group>

        <b-container fluid="md" class="mt-5">
            <h2>Feedback</h2>

            <p><a href="https://github.com/earthcube/facetsearch/issues" target="_blank">Create an issue</a> and a <a href="mailto:emailfeedback@geocodes.earthcube.org" >email feedback.</a></p>
        </b-container>

        <b-container fluid="md" class="mt-5">
            <h2>Supported by</h2>

            <p>Work on this site is supported by</p>

            <div><img src="https://www.nsf.gov/images/logos/NSF_4-Color_bitmap_Logo.png" width="38" alt="NSF"></div>
            <h5>NSF EarthCube</h5>
            <div><i>NSF award #1928208</i></div>

            <p class="mt-4"><a href="https://github.com/earthcube" target="_blank">Open source</a> under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a></p>
        </b-container>
    </b-container>
</template>

<script>
export default {
  name: "about.vue",
  data() {
    return {
        repositories: [
            {
                title: 'Environmental Data Initiative',
                website: 'http://environmentaldatainitiative.org',
                image: 'edi.png',
                description: "The Environmental Data Initiative is an NSF-funded project meant to accelerate curation and  archive of environmental data, emphasizing data from projects funded by the NSF Division of Environmental Biology. Aside from hosting the LTER data repository and collaborating with the LTER Information Managers, EDI serves the ecological research community including but not limited to research funded by the Long TermResearch in Environmental Biology (LTREB), Organization for Biological Field Stations (OBFS), and Macrosystems Biology (MSB). The Environmental Data Initiative maintains and develops the PASTA infrastructure for its data repositories, and has recently become DataONE’s 40th member node.",
                record_count: 28248
            },
            {
                title: 'Biological and Chemical Oceanography Data Management Office',
                website: 'http://www.bco-dmo.org',
                image: 'bco-dmo.png',
                description: "The Biological and Chemical Oceanography Data Management Office (BCO-DMO) was created in late 2006 to serve PIs funded by the NSF Geosciences Directorate (GEO) Division of Ocean Sciences (OCE) Biological and Chemical Oceanography Programs and Office of Polar Programs (OPP) Antarctic Sciences (ANT) Organisms & Ecosystems Program. The BCO-DMO is a combination the Data Management Offices formerly created to support the US JGOFS and US GLOBEC programs. The BCO-DMO staff members are the curators of the legacy data collections created by those respective programs, as well as many other more recent research efforts including those of individual investigators.",
                record_count: 5018
            },
            {
                title: 'Consortium of Universities for the Advancement of Hydrologic Science, Inc. (CUAHSI)',
                website: 'http://www.cuahsi.org',
                image: 'hydroshare.png',
                description: "CUAHSI's Hydrologic Information System (CUAHSI-HIS) provides web services, tools, standards and procedures that enhance access to more and better data for hydrologic analysis.",
                record_count: 4185
            },
            {
                title: 'IEDA (Integrated Earth Data Applications)',
                website: 'http://www.iedadata.org',
                image: 'iedadata.png',
                description: "IEDA is a community-based facility that serves to support, sustain, and advance the geosciences by providing data services for observational Geoscience data from the Ocean, Earth, and Polar Sciences. IEDA welcomes and encourages investigators to contribute their data to the IEDA collections so that the data can be discovered and reused by a diverse community now and in the future. The IEDA collections are: EarthChem, Geochron, System for Earth Sample Registration (SESAR), Marine Geoscience Data System (MGDS), and USAP Data Center. Meta-Search provided on the portal through IEDA Data Browser http://www.iedadata.org/databrowser.",
                record_count: 7147
            },
            {
                title: 'OpenTopography',
                website: 'http://www.opentopography.org',
                image: 'opentopography.png',
                description: "OpenTopography facilitates community access to high-resolution, Earth science-oriented, topography data, and related tools and resources. The OpenTopography Facility is based at the San Diego Supercomputer Center at the University of California, San Diego and is operated in collaboration with colleagues in the School of Earth and Space Exploration at Arizona State University. Core operational support for OpenTopography comes from the National Science Foundation Earth Sciences: Instrumentation and Facilities Program (EAR/IF) and the Office of Cyberinfrastructure. In addition, we receive funding from the NSF and NASA to support various OpenTopography related research and development activities.",
                record_count: 502
            },
            {
                title: 'UNAVCO',
                website: 'http://www.unavco.org',
                image: 'unavco.png',
                description: "UNAVCO promotes research by providing access to data that our community of geodetic scientists uses for quantifying the motions of rock, ice and water that are monitored by a variety of sensor types at or near the Earth's surface. After processing, these data enable millimeter-scale surface motion detection and monitoring at discrete points, and high-resolution strain imagery over areas of tens of square meters to hundreds of square kilometers. The data types include GPS/GNSS, imaging data such as from SAR and TLS, strain and seismic borehole data, and meteorological data. Most of these can be accessed via web services. In addition, GPS/GNSS datasets, TLS datasets, and InSAR products are assigned digital object identifiers.",
                record_count: 5086
            },
            {
                title: 'IODP Site Survey Databank',
                website: 'https://ssdb.iodp.org',
                image: 'ssdb.iodp.png',
                description: "The Site Survey Data Bank (SSDB) is a repository for site survey data submitted in support of International Ocean Discovery Program (IODP) proposals and expeditions. SSDB serves different roles for different sets of users.",
                record_count: 5344
            },
            {
                title: 'Balto',
                website: 'http://balto.opendap.org',
                image: 'balto.png',
                description: "Driven by data-rich use cases that span geodesy, geodynamics, seismology, and ecohydrology, the BALTO project will enable brokered access to diverse geoscience data, including data that have been collected/organized by individual scientists in novel or unusual forms, also known as “long-tail” datasets.",
                record_count: 89
            },
            {
                title: 'Linked Earth',
                website: 'http://wiki.linked.earth',
                image: 'linked.earth.png',
                description: "The LinkedEarth wiki is an EarthCube-funded platform that: enables the curation of publicly-accessible database by paleoclimate experts, and, fosters the development of standards, so paleoclimate data are easier to analyze, share, and re-use.",
                record_count: 17964
            },
            {
                title: 'IRIS',
                website: 'http://iris.edu',
                image: 'iris.png',
                description: "Fosters the development of standards, so paleoclimate data are easier to analyze, share, and re-use.",
                record_count: 28
            },
            {
                title: 'UCAR',
                website: 'http://data.ucar.edu',
                image: 'ucar.png',
                description: "OpenSky is the home for NCAR/UCAR research and historical materials as well as other collections of digital assets. Our mission is to provide free and open access to the scientific output and other intellectual resources created at NCAR/UCAR for the advancement of the atmospheric and related sciences. You can reach us at opensky@ucar.edu with any questions.",
                record_count: 11672
            },
            {
                title: 'Magnetics Information Consortium (MagIC)',
                website: 'http://www.earthref.org/MagIC',
                image: 'magic.png',
                description: "Magnetics Information Consortium (MagIC) improves research capacity in the Earth and Ocean sciences by maintaining an open community digital data repository for rock and paleomagnetic data with portals that allow users access to archive, search, visualize, download, and combine these versioned datasets.",
                record_count: 4136
            },
            {
                title: 'Neotoma',
                website: 'http://www.neotomadb.org',
                image: 'neotomadb.png',
                description: "Neotoma is a multiproxy paleoecological database that covers the Pliocene-Quaternary, including modern microfossil samples. The database is an international collaborative effort among individuals from 19 institutions, representing multiple constituent databases. There are over 20 data-types within the Neotoma Paleoecological Database, including pollen microfossils, plant macrofossils, vertebrate fauna, diatoms, charcoal, biomarkers, ostracodes, physical sedimentology and water chemistry. Neotoma provides an underlying cyberinfrastructure that enables the development of common software tools for data ingest, discovery, display, analysis, and distribution, while giving domain scientists control over critical taxonomic and other data quality issues.",
                record_count: 11955
            },
            {
                title: 'earthchem',
                website: 'http://ecl.earthchem.org/home.php',
                image: 'earthchem.png',
                description: "Community-driven preservation, discovery, access, and visualization of geochemical, geochronological, and petrological data.",
                record_count: 639
            },
            {
                title: 'xdomes',
                website: 'http://xdomes.tamucc.edu',
                image: 'xdomes.png',
                description: "The 'Cross-Domain Observational Metadata for Environmental Sensing (X-DOMES)' is an NSF/EarthCube project tasked to develop prototypes for the application of standards-based description of environmental sensor metadata, including provenance, that is paramount to automated data discovery, access, archival, processing, as well as quality control and assessment.",
                record_count: 17
            },
            {
                title: 'National Ecological Observatory Network (NEON)',
                website: 'http://www.neonscience.org',
                image: 'neon.png',
                description: "The National Ecological Observatory Network (NEON) is a continental-scale observatory designed to gather and provide 30 years of ecological data on the impacts of climate change, land use change and invasive species on natural resources and biodiversity. NEON is a project of the National Science Foundation, with many other U.S. agencies and NGOs cooperating.",
                record_count: 179
            },
            {
                title: 'Resource Registry',
                website: 'http://www.earthcube.org/resourceregistry',
                image: 'resource_registry.png',
                description: "The EarthCube Resource Registry (ECRR) is intended to provide immediate access to a list of EC capabilities to understand what EC is, and what it isn’t. To support this goal, the ECRR project has developed several persistent resources available for wider EarthCube use.",
                record_count: 274
            }
        ]
    }
  },
}
</script>

<style scoped lang="scss">
@import '~/src/assets/bootstrapcss/custom';

.logo {
    max: {
        width: 50%;
    }
    min: {
        height: 100px;
    }
}

.card-text {
    &.collapsed .when_closed,
    &.not-collapsed .when_open {
        display: none;
    }
}

</style>
