import test from "node:test";
import assert from "node:assert/strict";
import { getDatasetDisplayFields } from "../datasetDisplayMapping.js";

test("dataset display mapping returns scalar fields for language-tagged values", () => {
  const dataset = {
    identifier: [
      { value: { "@language": "en", "@value": " " } },
      { "@language": "en", "@value": "https://doi.org/10.1594/PANGAEA.887477" },
    ],
    name: { "@language": "en", "@value": "GSIM Part 1" },
    description: [
      { "@language": "en", "@value": " " },
      { "@language": "en", "@value": "Data catalog and catchment boundary..." },
    ],
    url: { "@id": "https://doi.pangaea.de/10.1594/PANGAEA.887477" },
    distribution: [{ contentUrl: { "@id": "https://example.org/file.zip" } }],
  };

  const mapped = getDatasetDisplayFields(dataset);
  assert.equal(mapped.s_identifier, "https://doi.org/10.1594/PANGAEA.887477");
  assert.equal(mapped.s_name, "GSIM Part 1");
  assert.equal(mapped.s_description, "Data catalog and catchment boundary...");
  assert.equal(mapped.s_url, "https://doi.pangaea.de/10.1594/PANGAEA.887477");
  assert.deepEqual(mapped.s_distribution, dataset.distribution);
});
