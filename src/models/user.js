export const isAdmin = (u) => u?.role === 'admin';
export const isGuest = (u) => u?.role === 'guest';

export function userFromDoc(data, uid) {
  return {
    uid,
    email: data.email ?? '',
    name: data.name ?? '',
    groupName: data.groupName ?? '',
    password: data.password ?? '',
    role: data.role ?? 'employee',
    createdDate: data.createdDate ?? new Date().toISOString(),
    isAccessGranted: data.isAccessGranted ?? false,
  };
}
