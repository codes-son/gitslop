import crypto from "node:crypto";

const GITHUB_API_BASE = "https://api.github.com";

function generateJWT(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");

  const payload = Buffer.from(
    JSON.stringify({ iat: now - 60, exp: now + 600, iss: appId }),
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
    throw new Error(`Failed to get installation token: ${response.status} ${text}`);
  }

  const data = (await response.json()) as { token: string };
  return data.token;
}

/** Post a comment on an issue/PR and return the new comment's numeric ID. */
export async function postIssueCommentAndGetId(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<number> {
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

  const data = await response.json() as { id: number };
  return data.id;
}

/** Update (PATCH) an existing issue/PR comment. */
export async function updateIssueComment(
  token: string,
  owner: string,
  repo: string,
  commentId: number,
  body: string,
): Promise<void> {
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/issues/comments/${commentId}`;

  const response = await fetch(url, {
    method: "PATCH",
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
    throw new Error(`GitHub update comment error: ${response.status} ${text}`);
  }
}

/** Post a GraphQL discussion comment and return the comment node ID. */
export async function postDiscussionCommentAndGetId(
  token: string,
  discussionNodeId: string,
  body: string,
): Promise<string> {
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

  const result = await response.json() as {
    data?: { addDiscussionComment?: { comment?: { id: string } } };
    errors?: { message: string }[];
  };
  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL error: ${result.errors.map(e => e.message).join(", ")}`);
  }

  const nodeId = result.data?.addDiscussionComment?.comment?.id;
  if (!nodeId) throw new Error("No comment node ID returned from discussion mutation");
  return nodeId;
}

/** Update an existing discussion comment via GraphQL. */
export async function updateDiscussionComment(
  token: string,
  commentNodeId: string,
  body: string,
): Promise<void> {
  const query = `
    mutation UpdateDiscussionComment($commentId: ID!, $body: String!) {
      updateDiscussionComment(input: { commentId: $commentId, body: $body }) {
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
    body: JSON.stringify({ query, variables: { commentId: commentNodeId, body } }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub GraphQL error: ${response.status} ${text}`);
  }

  const result = await response.json() as { errors?: { message: string }[] };
  if (result.errors?.length) {
    throw new Error(`GitHub GraphQL update error: ${result.errors.map(e => e.message).join(", ")}`);
  }
}

/** Kept for backward compat — wraps postIssueCommentAndGetId */
export async function postIssueComment(
  token: string,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<void> {
  await postIssueCommentAndGetId(token, owner, repo, issueNumber, body);
}

/** Kept for backward compat — wraps postDiscussionCommentAndGetId */
export async function postDiscussionComment(
  token: string,
  discussionNodeId: string,
  body: string,
): Promise<void> {
  await postDiscussionCommentAndGetId(token, discussionNodeId, body);
}
