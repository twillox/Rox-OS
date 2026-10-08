import { IntegrationService } from '../IntegrationService';

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export class GoogleDriveService {
  public static async listFiles(
    userId: string,
    pageSize: number = 20,
    pageToken?: string
  ): Promise<{ files: DriveFileSummary[]; nextPageToken?: string }> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-drive');

    const params = new URLSearchParams({
      pageSize: String(pageSize),
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)',
      q: 'trashed = false',
    });

    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive list failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken,
    };
  }

  public static async searchFiles(
    userId: string,
    query: string,
    pageSize: number = 15
  ): Promise<DriveFileSummary[]> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-drive');

    // Safe query string escaping for Drive search
    const sanitizedQuery = query.replace(/'/g, "\\'");
    const q = `name contains '${sanitizedQuery}' and trashed = false`;

    const params = new URLSearchParams({
      pageSize: String(pageSize),
      q,
      fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, iconLink)',
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive search failed: ${res.status} - ${err}`);
    }

    const data = await res.json();
    return data.files || [];
  }

  public static async getFileMetadata(userId: string, fileId: string): Promise<any> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-drive');

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType,size,createdTime,modifiedTime,webViewLink,owners,description`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive get metadata failed: ${res.status} - ${err}`);
    }

    return await res.json();
  }

  public static async downloadFile(
    userId: string,
    fileId: string
  ): Promise<{ data: ArrayBuffer; contentType: string; fileName: string }> {
    const token = await IntegrationService.getValidAccessToken(userId, 'google-drive');
    const metadata = await this.getFileMetadata(userId, fileId);

    let downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
    let contentType = metadata.mimeType || 'application/octet-stream';

    // If Google Docs/Sheets, use export endpoint
    if (metadata.mimeType === 'application/vnd.google-apps.document') {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
      contentType = 'text/plain';
    } else if (metadata.mimeType === 'application/vnd.google-apps.spreadsheet') {
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/csv`;
      contentType = 'text/csv';
    }

    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google Drive download failed: ${res.status} - ${err}`);
    }

    const data = await res.arrayBuffer();
    return {
      data,
      contentType,
      fileName: metadata.name || fileId,
    };
  }
}
