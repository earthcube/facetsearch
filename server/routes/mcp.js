/**
 * Streamable HTTP transport for the MCP facet search server.
 *
 * Stateless: a fresh server + transport per request, so any number of MCP clients can
 * hit /mcp without session affinity.
 */
var express = require('express');
var debug = require('debug')('mcp');
var { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');

var { createMcpServer } = require('../mcp/server');

var router = express.Router();

function methodNotAllowed(req, res) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. This MCP endpoint is stateless; use POST.' },
    id: null,
  });
}

router.post('/', async function (req, res) {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });

  res.on('close', function () {
    transport.close();
    server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    debug('mcp request failed ' + err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// No SSE stream and no sessions to delete in stateless mode.
router.get('/', methodNotAllowed);
router.delete('/', methodNotAllowed);

module.exports = router;
