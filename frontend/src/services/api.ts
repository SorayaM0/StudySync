const API_BASE_URL = "http://127.0.0.1:8000";

export interface User {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface StudySpace {
  id: number;
  name: string;
  course_code: string;
  description: string | null;
  owner_id: number;
  created_at: string;
}

export interface Member {
  membership_id: number;
  user_id: number;
  email: string;
  display_name: string;
  role: string;
  joined_at: string;
}

export interface Note {
  id: number;
  space_id: number;
  title: string;
  content: string;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface RegisterData {
  email: string;
  password: string;
  display_name: string;
}

interface LoginData {
  email: string;
  password: string;
}

export interface CreateStudySpaceData {
  name: string;
  course_code: string;
  description?: string;
}

export interface CreateNoteData {
  title: string;
  content?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

const TOKEN_KEY = "studysync_access_token";

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data.detail === "string") {
      return data.detail;
    }

    if (Array.isArray(data.detail)) {
      return data.detail
        .map(
          (item: { msg?: string }) =>
            item.msg ?? "Invalid value.",
        )
        .join(" ");
    }

    return "Something went wrong.";
  } catch {
    return "Unable to connect to StudySync.";
  }
}

async function authenticatedRequest(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("You need to sign in first.");
  }

  const headers = new Headers(options.headers);

  headers.set(
    "Authorization",
    `Bearer ${token}`,
  );

  if (options.body && !headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,
      headers,
    },
  );

  if (response.status === 401) {
    clearAccessToken();

    throw new Error(
      "Your session has expired. Please sign in again.",
    );
  }

  return response;
}

export async function registerUser(
  data: RegisterData,
): Promise<User> {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function loginUser(
  data: LoginData,
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
  );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function getCurrentUser(): Promise<User> {
  const response =
    await authenticatedRequest(
      "/auth/me",
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function getStudySpaces(): Promise<
  StudySpace[]
> {
  const response =
    await authenticatedRequest(
      "/spaces",
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function getStudySpace(
  spaceId: number,
): Promise<StudySpace> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}`,
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function createStudySpace(
  data: CreateStudySpaceData,
): Promise<StudySpace> {
  const response =
    await authenticatedRequest(
      "/spaces",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function getSpaceMembers(
  spaceId: number,
): Promise<Member[]> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}/members`,
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function addSpaceMember(
  spaceId: number,
  email: string,
): Promise<Member> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}/members`,
      {
        method: "POST",
        body: JSON.stringify({
          email,
        }),
      },
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function getNotes(
  spaceId: number,
): Promise<Note[]> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}/notes`,
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function createNote(
  spaceId: number,
  data: CreateNoteData,
): Promise<Note> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}/notes`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function updateNote(
  spaceId: number,
  noteId: number,
  data: UpdateNoteData,
): Promise<Note> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}/notes/${noteId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }

  return response.json();
}

export async function deleteNote(
  spaceId: number,
  noteId: number,
): Promise<void> {
  const response =
    await authenticatedRequest(
      `/spaces/${spaceId}/notes/${noteId}`,
      {
        method: "DELETE",
      },
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response),
    );
  }
}