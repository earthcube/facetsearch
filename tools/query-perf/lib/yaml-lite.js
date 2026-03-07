/**
 * Minimal YAML parser sufficient for FacetSearch config files.
 * Handles scalar key-value pairs, arrays, and nested objects.
 * No external dependencies required.
 */

function parse(text) {
  const result = {};
  const lines = text.split("\n");
  const stack = [{ indent: -1, obj: result }];
  let currentArray = null;
  let currentArrayKey = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip blank lines, comments, and document markers
    if (/^\s*$/.test(line) || /^\s*#/.test(line) || /^---/.test(line)) continue;

    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;
    const trimmed = line.trim();

    // Array item
    if (trimmed.startsWith("- ")) {
      const itemContent = trimmed.slice(2).trim();

      // Simple scalar array item
      if (!itemContent.includes(":")) {
        if (currentArray) {
          currentArray.push(parseValue(itemContent));
        }
        continue;
      }

      // Object array item (e.g., "- field: resourceType")
      if (currentArray) {
        const obj = {};
        const colonIdx = itemContent.indexOf(":");
        const key = itemContent.slice(0, colonIdx).trim();
        const val = itemContent.slice(colonIdx + 1).trim();
        obj[key] = parseValue(val);

        // Collect subsequent indented lines as properties of this object
        const itemIndent = indent + 2;
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (/^\s*$/.test(nextLine) || /^\s*#/.test(nextLine)) { i++; continue; }
          const nextIndent = nextLine.match(/^(\s*)/)[1].length;
          const nextTrimmed = nextLine.trim();
          if (nextIndent <= indent) break;
          if (nextTrimmed.startsWith("- ")) break; // next array item
          // Nested key-value in this array object
          const nc = nextTrimmed.indexOf(":");
          if (nc !== -1) {
            const nk = nextTrimmed.slice(0, nc).trim();
            const nv = nextTrimmed.slice(nc + 1).trim();
            obj[nk] = parseValue(nv);
          }
          i++;
        }
        currentArray.push(obj);
        continue;
      }
      continue;
    }

    // Key-value pair
    const colonIdx = trimmed.indexOf(":");
    if (colonIdx !== -1) {
      const key = trimmed.slice(0, colonIdx).trim();
      const val = trimmed.slice(colonIdx + 1).trim();

      // Pop stack to find parent at correct indent level
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }
      const parent = stack[stack.length - 1].obj;

      if (val === "" || val === undefined) {
        // Could be start of nested object or array - peek ahead
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("- ")) {
          const arr = [];
          parent[key] = arr;
          currentArray = arr;
          currentArrayKey = key;
        } else {
          const nested = {};
          parent[key] = nested;
          stack.push({ indent, obj: nested });
          currentArray = null;
        }
      } else {
        parent[key] = parseValue(val);
        currentArray = null;
      }
    }
  }

  return result;
}

function parseValue(val) {
  if (val === "" || val === undefined) return "";
  // Remove surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  // Booleans
  if (val === "true") return true;
  if (val === "false") return false;
  // Numbers
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  // Inline list notation: [a, b, c]
  if (val.startsWith("[") && val.endsWith("]")) {
    return val.slice(1, -1).split(",").map((s) => parseValue(s.trim()));
  }
  return val;
}

module.exports = { parse };
