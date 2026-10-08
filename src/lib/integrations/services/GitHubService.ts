import { IntegrationService } from '../IntegrationService';

export class GitHubService {
  private static async request(userId: string, path: string, options?: RequestInit): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'github');

    const res = await fetch(`https://api.github.com${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Roxten-OS',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub API error on ${path}: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async listRepositories(userId: string, perPage: number = 30): Promise<any[]> {
    return await this.request(userId, `/user/repos?sort=updated&per_page=${perPage}&affiliation=owner,collaborator,organization_member`);
  }

  public static async getRepositoryDetails(userId: string, owner: string, repo: string): Promise<any> {
    return await this.request(userId, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
  }

  public static async listIssues(
    userId: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<any[]> {
    return await this.request(
      userId,
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues?state=${state}&per_page=30`
    );
  }

  public static async listPullRequests(
    userId: string,
    owner: string,
    repo: string,
    state: 'open' | 'closed' | 'all' = 'open'
  ): Promise<any[]> {
    return await this.request(
      userId,
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=${state}&per_page=30`
    );
  }

  public static async listCommits(
    userId: string,
    owner: string,
    repo: string,
    perPage: number = 20
  ): Promise<any[]> {
    return await this.request(
      userId,
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=${perPage}`
    );
  }
}
