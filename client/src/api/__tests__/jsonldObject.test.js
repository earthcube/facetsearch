import test from "node:test";
import assert from "node:assert/strict";
import { schemaItem, getDistributions, getFirstDisplayScalar } from "../jsonldObject.js";

test("schemaItem unwraps JSON-LD @value and simple @id objects", () => {
  const obj = {
    name: { "@language": "en", "@value": "PANGAEA" },
    url: { "@id": "https://doi.pangaea.de/10.1594/PANGAEA.887477" },
  };

  assert.equal(schemaItem("name", obj), "PANGAEA");
  assert.equal(schemaItem("url", obj), "https://doi.pangaea.de/10.1594/PANGAEA.887477");
});

test("getDistributions builds display-friendly strings from language-tagged values", () => {
  const downloads = getDistributions({
    name: { "@language": "en", "@value": "Dataset package" },
    contentUrl: { "@id": "https://example.org/file.zip" },
    encodingFormat: { "@language": "en", "@value": "application/zip" },
  });

  assert.equal(downloads.length, 1);
  assert.equal(downloads[0].name, "Dataset package");
  assert.equal(downloads[0].encodingFormat, "application/zip");
  assert.equal(downloads[0].linkName, "Dataset package format:application/zip");
  assert.equal(downloads[0].contentUrl, "https://example.org/file.zip");
});

test("getFirstDisplayScalar selects a string from array/object identifier shapes", () => {
  const identifier = [
    { value: { "@language": "en", "@value": " " } },
    { value: { "@language": "en", "@value": "https://doi.org/10.1594/PANGAEA.887477" } },
  ];
  assert.equal(
    getFirstDisplayScalar(identifier),
    "https://doi.org/10.1594/PANGAEA.887477"
  );
});
