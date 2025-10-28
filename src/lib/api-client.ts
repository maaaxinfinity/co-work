// API客户端 - 统一处理所有API调用

const BASE_URL = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}

// Projects API
export const projectsApi = {
  async getAll(params?: { limit?: number; offset?: number; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.search) queryParams.append('search', params.search);

    const res = await fetch(`${BASE_URL}/projects?${queryParams}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${BASE_URL}/projects?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  async create(data: { name: string; status?: string }) {
    const res = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async update(id: number, data: { name?: string; status?: string }) {
    const res = await fetch(`${BASE_URL}/projects?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/projects?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },
};

// Files API
export const filesApi = {
  async getAll(params: {
    projectId: number;
    ownerType?: string;
    userId?: number;
    parentId?: number | null;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('projectId', params.projectId.toString());
    if (params.ownerType) queryParams.append('ownerType', params.ownerType);
    if (params.userId) queryParams.append('userId', params.userId.toString());
    if (params.parentId !== undefined) {
      queryParams.append('parentId', params.parentId === null ? 'null' : params.parentId.toString());
    }

    const res = await fetch(`${BASE_URL}/files?${queryParams}`);
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${BASE_URL}/files?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch file');
    return res.json();
  },

  async create(data: {
    projectId: number;
    name: string;
    type: string;
    ownerType: string;
    parentId?: number;
    fileType?: string;
    content?: string;
    ownerId?: number;
    status?: string;
  }) {
    const res = await fetch(`${BASE_URL}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create file');
    return res.json();
  },

  async update(
    id: number,
    data: {
      name?: string;
      content?: string;
      status?: string;
      parentId?: number | null;
      fileType?: string;
    }
  ) {
    const res = await fetch(`${BASE_URL}/files?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update file');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/files?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete file');
    return res.json();
  },

  async upload(formData: FormData) {
    const res = await fetch(`${BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },
};

// Messages API
export const messagesApi = {
  async getAll(params: { projectId: number; pinned?: boolean; limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('projectId', params.projectId.toString());
    if (params.pinned !== undefined) queryParams.append('pinned', params.pinned.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const res = await fetch(`${BASE_URL}/messages?${queryParams}`);
    if (!res.ok) throw new Error('Failed to fetch messages');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${BASE_URL}/messages?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch message');
    return res.json();
  },

  async create(data: {
    projectId: number;
    role: string;
    content: string;
    quotedMessageId?: number;
  }) {
    const res = await fetch(`${BASE_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create message');
    return res.json();
  },

  async update(id: number, data: { pinned?: boolean; content?: string }) {
    const res = await fetch(`${BASE_URL}/messages?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update message');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/messages?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete message');
    return res.json();
  },
};

// Comments API
export const commentsApi = {
  async getAll(params: { fileId: number; resolved?: boolean }) {
    const queryParams = new URLSearchParams();
    queryParams.append('fileId', params.fileId.toString());
    if (params.resolved !== undefined) queryParams.append('resolved', params.resolved.toString());

    const res = await fetch(`${BASE_URL}/comments?${queryParams}`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${BASE_URL}/comments?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch comment');
    return res.json();
  },

  async create(data: {
    fileId: number;
    author: string;
    content: string;
    parentCommentId?: number;
  }) {
    const res = await fetch(`${BASE_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create comment');
    return res.json();
  },

  async update(id: number, data: { resolved?: boolean; content?: string }) {
    const res = await fetch(`${BASE_URL}/comments?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/comments?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  },
};

// Versions API
export const versionsApi = {
  async getAll(fileId: number) {
    const res = await fetch(`${BASE_URL}/versions?fileId=${fileId}`);
    if (!res.ok) throw new Error('Failed to fetch versions');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${BASE_URL}/versions?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch version');
    return res.json();
  },

  async create(data: { fileId: number; title: string; author: string; content: string }) {
    const res = await fetch(`${BASE_URL}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create version');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/versions?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete version');
    return res.json();
  },
};

// Tasks API
export const tasksApi = {
  async getAll(params: { fileId: number; status?: string }) {
    const queryParams = new URLSearchParams();
    queryParams.append('fileId', params.fileId.toString());
    if (params.status) queryParams.append('status', params.status);

    const res = await fetch(`${BASE_URL}/tasks?${queryParams}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getById(id: number) {
    const res = await fetch(`${BASE_URL}/tasks?id=${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  async create(data: { fileId: number; title: string; status?: string }) {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async update(id: number, data: { title?: string; status?: string }) {
    const res = await fetch(`${BASE_URL}/tasks?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/tasks?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },
};

// Message Context Files API
export const messageContextFilesApi = {
  async getAll(messageId: number) {
    const res = await fetch(`${BASE_URL}/message-context-files?messageId=${messageId}`);
    if (!res.ok) throw new Error('Failed to fetch context files');
    return res.json();
  },

  async create(data: { messageId: number; fileId: number }) {
    const res = await fetch(`${BASE_URL}/message-context-files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create context file');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/message-context-files?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete context file');
    return res.json();
  },
};

// Project Members API
export const projectMembersApi = {
  async getAll(projectId: number) {
    const res = await fetch(`${BASE_URL}/project-members?projectId=${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project members');
    return res.json();
  },

  async create(data: { projectId: number; userId: number; role?: string }) {
    const res = await fetch(`${BASE_URL}/project-members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add project member');
    return res.json();
  },

  async delete(id: number) {
    const res = await fetch(`${BASE_URL}/project-members?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove project member');
    return res.json();
  },
};
