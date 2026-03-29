import crypto from "node:crypto";

const GITHUB_API_BASE = "https://api.github.com";

function generateJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({
      iat: now - 60,
      exp: now + 600,
      iss: appId,
    }),
  ).toString("base64url");

  const data = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(data);
  const signature = sign.sign(privateKey, "base64url");

  return `${data}.${signature}`;
}

export async function getInstallationToken(
  appId: string,
  privateKey: string,
  installationId: number,
): Promise<string> {
  const jwt = generateJWT(appId, privateKey);

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "GitSlop-Bot/1.0",
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to get installation token: ${response.status} ${text}`,
    );
  }

  const data = (await response.json()) as { token: string };
  return data.token;
}

export async function postDiscussionComment(
  token: string,
  discussionNodeId: string,
  body: string,
): Promise<void> {
  const query = `
    mutation AddDiscussionComment($discussionId: ID!, $body: String!) {
      addDiscussionComment(input: { discussionId: $discussionId, body: $body }) {
        comment { id }
      }
    }
  `;

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "GitSlop-Bot/1.0",
    },
    body: JSON.stringify({ query, variables: { discussionId: discussionNodeId, body } }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL error: ${response.status} ${text}`);
  }

  const result = await response.json() as { errors?: { message: string }[] };
  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${result.errors.map(e => e.message).join(", ")}`);
  }
}

export async function postIssueComment(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<void> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/${issueNumber}/comments`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "GitSlop-Bot/1.0",
    },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${text}`);
  }
}
