#!/usr/bin/env node

/**
 * Development API mock server
 * - Handles /wuffle/* API endpoints with mock data
 * - Proxies all other requests to Rollup dev server on port 3001
 */

const http = require('http');

const PORT = 3000;
const ROLLUP_SERVER = 'http://localhost:3001';

// Mock data
const MOCK_DATA = {
  board: {
    columns: [
      { name: 'Inbox', collapsed: false },
      { name: 'Backlog', collapsed: false },
      { name: 'Ready', collapsed: false },
      { name: 'In Progress', collapsed: false },
      { name: 'Needs Review', collapsed: false },
      { name: 'Done', collapsed: false }
    ],
    name: 'Wuffle Board (Mock)'
  },
  cards: {
    items: {
      'Inbox': [
        {
          id: 1,
          number: 123,
          title: 'Example Bug Issue',
          repository: {
            name: 'example-repo',
            owner: { login: 'example' }
          },
          labels: [ { name: 'bug', color: 'd73a4a' } ],
          milestone: null,
          assignees: [],
          pull_request: false,
          column: 'Inbox',
          user: {
            login: 'demo-user',
            avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
          },
          requested_reviewers: [],
          links: [],
          state: 'open',
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          number: 124,
          title: 'Feature Request Example',
          repository: {
            name: 'example-repo',
            owner: { login: 'example' }
          },
          labels: [ { name: 'enhancement', color: '84b6eb' } ],
          milestone: { title: 'v1.0' },
          assignees: [
            {
              login: 'demo-user',
              avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
            }
          ],
          pull_request: false,
          column: 'Inbox',
          user: {
            login: 'other-user',
            avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
          },
          requested_reviewers: [],
          links: [],
          state: 'open',
          updated_at: new Date().toISOString()
        }
      ],
      'Backlog': [],
      'Ready': [
        {
          id: 3,
          number: 125,
          title: 'Ready to work on this',
          repository: {
            name: 'example-repo',
            owner: { login: 'example' }
          },
          labels: [],
          milestone: null,
          assignees: [],
          pull_request: false,
          column: 'Ready',
          user: {
            login: 'demo-user',
            avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
          },
          requested_reviewers: [],
          links: [],
          state: 'open',
          updated_at: new Date().toISOString()
        }
      ],
      'In Progress': [
        {
          id: 4,
          number: 126,
          title: 'Fix the critical bug',
          repository: {
            name: 'example-repo',
            owner: { login: 'example' }
          },
          labels: [ { name: 'bug', color: 'd73a4a' } ],
          milestone: { title: 'v1.0' },
          assignees: [
            {
              login: 'demo-user',
              avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
            }
          ],
          pull_request: true,
          column: 'In Progress',
          user: {
            login: 'demo-user',
            avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
          },
          requested_reviewers: [
            {
              login: 'reviewer-user',
              avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
            }
          ],
          links: [],
          state: 'open',
          updated_at: new Date().toISOString()
        }
      ],
      'Needs Review': [],
      'Done': [
        {
          id: 5,
          number: 122,
          title: 'Completed task example',
          repository: {
            name: 'example-repo',
            owner: { login: 'example' }
          },
          labels: [],
          milestone: null,
          assignees: [],
          pull_request: false,
          column: 'Done',
          user: {
            login: 'demo-user',
            avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
          },
          requested_reviewers: [],
          links: [],
          state: 'closed',
          updated_at: new Date().toISOString()
        }
      ]
    },
    cursor: 'mock-cursor-123'
  },
  user: {
    login: 'demo-user',
    avatar_url: 'https://avatars.githubusercontent.com/u/6481734?s=200&v=4'
  },
  updates: {
    items: [],
    cursor: null
  }
};

function mockWuffleApp(req, res, pathname) {
  res.writeHead(200, { 'Content-Type': 'application/json' });

  if (pathname === '/wuffle/board') {
    res.end(JSON.stringify(MOCK_DATA.board));
  } else if (pathname === '/wuffle/board/cards') {
    res.end(JSON.stringify(MOCK_DATA.cards));
  } else if (pathname === '/wuffle/login_check') {
    res.end(JSON.stringify(MOCK_DATA.user));
  } else if (pathname.startsWith('/wuffle/board/updates')) {
    res.end(JSON.stringify(MOCK_DATA.updates));
  } else if (pathname === '/wuffle/board/issues/move') {

    // Handle POST request for moving issues
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      console.log('Move issue request:', body);
      res.end(JSON.stringify({ success: true }));
    });
    return;
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

function proxyToRollup(req, res, pathname) {

  // Strip /board/ prefix for rollup server
  let rollupPath = pathname;
  if (rollupPath.startsWith('/board/')) {
    rollupPath = rollupPath.slice(6); // Remove '/board'
  } else if (rollupPath === '/board') {
    rollupPath = '/';
  }

  // Default to index.html for directory requests
  if (rollupPath === '/' || rollupPath === '') {
    rollupPath = '/index.html';
  }

  const url = `${ROLLUP_SERVER}${rollupPath}`;

  http.get(url, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  }).on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway - Rollup server not available on port 3001');
  });
}

const server = http.createServer((req, res) => {
  const pathname = req.url.split('?')[0];

  // Handle API requests
  if (pathname.startsWith('/wuffle/')) {
    mockWuffleApp(req, res, pathname);
    return;
  }

  // Proxy all other requests to Rollup server
  proxyToRollup(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`🧇 Wuffle Board running at: http://localhost:${PORT}/board/`);
});
