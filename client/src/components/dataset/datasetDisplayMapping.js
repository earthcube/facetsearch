import { getFirstDisplayScalar, schemaItem } from "../../api/jsonldObject.js";

export function getDatasetDisplayFields(dataset) {
  return {
    s_identifier: getFirstDisplayScalar(schemaItem("identifier", dataset)),
    s_name: getFirstDisplayScalar(schemaItem("name", dataset)),
    s_url: getFirstDisplayScalar(schemaItem("url", dataset)),
    s_description: getFirstDisplayScalar(schemaItem("description", dataset)),
    s_distribution: schemaItem("distribution", dataset),
  };
}
