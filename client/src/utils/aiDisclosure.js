const AI_DISCLOSURE_KEYWORD = "AI-generated metadata";

const schemaKeys = (name) => [
  name,
  `schema:${name}`,
  `sschema:${name}`,
  `https://schema.org/${name}`,
  `http://schema.org/${name}`,
];

const firstDefined = (...values) => values.find((v) => v !== undefined && v !== null);

const schemaValue = (obj, name) => {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of schemaKeys(name)) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return obj[key];
    }
  }
  return undefined;
};

const asArray = (value) => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

const normalizeText = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (typeof value === "object") {
    const nested = firstDefined(
      value["@value"],
      value.name,
      schemaValue(value, "name"),
      value.value
    );
    return nested === undefined || nested === null ? "" : String(nested).trim();
  }
  return "";
};

export function hasAiGeneratedMetadataKeyword(keywords) {
  const target = AI_DISCLOSURE_KEYWORD.toLowerCase();
  return asArray(keywords).some((kw) => normalizeText(kw).toLowerCase() === target);
}

export function getAiDisclosureFromJsonLd(dataset) {
  if (!dataset || typeof dataset !== "object") {
    return {
      isAiGeneratedMetadata: false,
      matchedByKeyword: false,
      matchedBySdPublisher: false,
      keywordMatchedValue: null,
      sdPublisherSignals: {},
    };
  }

  const keywords = schemaValue(dataset, "keywords");
  const keywordMatchedValue =
    asArray(keywords)
      .map((kw) => normalizeText(kw))
      .find((kw) => kw.toLowerCase() === AI_DISCLOSURE_KEYWORD.toLowerCase()) || null;

  const sdPublisherRaw = schemaValue(dataset, "sdPublisher");
  const sdPublishers = asArray(sdPublisherRaw).filter((v) => v && typeof v === "object");
  const sdPublisherSignals = {
    nameChatGpt: false,
    categoryGenerativeAi: false,
    alternateTypeSoftwareApplication: false,
  };

  sdPublishers.forEach((publisher) => {
    const name = normalizeText(firstDefined(schemaValue(publisher, "name"), publisher.name));
    const appCategory = normalizeText(
      firstDefined(schemaValue(publisher, "applicationCategory"), publisher.applicationCategory)
    );
    const alternateType = normalizeText(
      firstDefined(schemaValue(publisher, "alternateType"), publisher.alternateType)
    );

    if (name.toLowerCase() === "chatgpt") sdPublisherSignals.nameChatGpt = true;
    if (appCategory.toLowerCase() === "generativeai") sdPublisherSignals.categoryGenerativeAi = true;
    if (alternateType.toLowerCase() === "softwareapplication") {
      sdPublisherSignals.alternateTypeSoftwareApplication = true;
    }
  });

  const matchedByKeyword = !!keywordMatchedValue;
  const matchedBySdPublisher =
    sdPublisherSignals.nameChatGpt ||
    sdPublisherSignals.categoryGenerativeAi ||
    sdPublisherSignals.alternateTypeSoftwareApplication;

  return {
    isAiGeneratedMetadata: matchedByKeyword || matchedBySdPublisher,
    matchedByKeyword,
    matchedBySdPublisher,
    keywordMatchedValue,
    sdPublisherSignals,
  };
}

export { AI_DISCLOSURE_KEYWORD };
