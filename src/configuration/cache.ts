export const CACHE_TTL_USER = {
    USER_DETAIL: 300,      // 5 phút — user ít đổi
    USER_LIST: 60,         // 1 phút — list đổi khi có user mới
    USER_SEARCH: 30,       // 30 giây — search thay đổi nhanh
} as const;

export const CACHE_KEYS_USER = {
    userDetail: (id: string) => `user:detail:${id}`,
    userListVersion: 'user:list:version',
    userList: (version: number, queryHash: string) => `user:list:v${version}:${queryHash}`,
} as const;

export const CACHE_TTL_WORKSPACE = {
  WORKSPACE_DETAIL: 300,
  WORKSPACE_LIST: 60,
  MEMBER_LIST: 60,
} as const;

export const CACHE_KEYS_WORKSPACE = {
  detail: (id: string) => `workspace:detail:${id}`,
  listVersion: (userId: string) => `workspace:list:version:${userId}`,
  list: (userId: string, version: number) => `workspace:list:${userId}:v${version}`,
  memberList: (workspaceId: string) => `workspace:members:${workspaceId}`,
} as const;