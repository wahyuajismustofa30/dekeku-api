import { success } from "../../utils/response.js";
import { GitHubClient } from "../../core/github.js";

export const getRepositoryMetadata = async (request, env) => {
  const client = new GitHubClient(env);
  const data = await client.getRepository();
  return success({
    name: data.full_name,
    description: data.description,
    url: data.html_url,
    default_branch: data.default_branch,
    visibility: data.visibility,
    _metadata: { github_ratelimit: client.rateLimit }
  });
};

export const getBranchMetadata = async (request, env) => {
  const client = new GitHubClient(env);
  const data = await client.getBranch();
  return success({
    name: data.name,
    commit: data.commit.sha,
    protected: data.protected,
    _metadata: { github_ratelimit: client.rateLimit }
  });
};
