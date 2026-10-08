import { IntegrationService } from '../IntegrationService';

export class NotionService {
  private static async request(userId: string, path: string, options?: RequestInit): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'notion');

    const res = await fetch(`https://api.notion.com/v1${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Notion API error on ${path}: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async searchPages(userId: string, query?: string): Promise<any[]> {
    const body: any = {
      page_size: 10,
      filter: {
        value: 'page',
        property: 'object',
      },
    };
    if (query) {
      body.query = query;
    }

    try {
      const data = await this.request(userId, '/search', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return (data.results || []).map((page: any) => {
        // Extract plain title
        let title = 'Untitled';
        const props = page.properties || {};
        for (const key of Object.keys(props)) {
          if (props[key]?.title && Array.isArray(props[key].title)) {
            title = props[key].title.map((t: any) => t.plain_text).join('') || title;
            break;
          }
        }

        return {
          id: page.id,
          url: page.url,
          title,
          lastEditedTime: page.last_edited_time,
          createdTime: page.created_time,
        };
      });
    } catch (e: any) {
      console.warn('Notion searchPages error:', e.message);
      return [];
    }
  }

  public static async getPage(userId: string, pageId: string): Promise<any> {
    return await this.request(userId, `/pages/${encodeURIComponent(pageId)}`);
  }

  public static async createPage(
    userId: string,
    params: { title: string; content?: string; parentPageId?: string }
  ): Promise<{ id: string; url: string; title: string }> {
    let parentId = params.parentPageId;

    if (!parentId) {
      // Find an existing accessible page in workspace to use as parent
      const existing = await this.searchPages(userId);
      if (existing.length > 0) {
        parentId = existing[0].id;
      }
    }

    if (!parentId) {
      throw new Error('No accessible parent page found in Notion workspace. Please grant page access to the ROXTEN integration.');
    }

    const body: any = {
      parent: { page_id: parentId },
      properties: {
        title: {
          title: [
            {
              text: {
                content: params.title,
              },
            },
          ],
        },
      },
    };

    if (params.content) {
      body.children = [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: params.content,
                },
              },
            ],
          },
        },
      ];
    }

    const created = await this.request(userId, '/pages', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return {
      id: created.id,
      url: created.url,
      title: params.title,
    };
  }
}
