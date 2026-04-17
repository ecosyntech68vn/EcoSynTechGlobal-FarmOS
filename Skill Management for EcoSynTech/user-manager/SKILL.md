---
name: user-manager
description: "Manage users, roles, permissions"
user-invocable: true
agent: explore
---

# User Manager Skill for EcoSynTech

Manage users and access control.

## 1. List Users

```bash
curl localhost:3000/api/v1/admin/users
```

## 2. Create User

```bash
curl -X POST localhost:3000/api/v1/auth/register \
  -d '{"email":"user@example.com","password":"pass","role":"user"}'
```

## 3. Manage Roles

```javascript
roles: {
  admin: { permissions: ['*'] },
  manager: { permissions: ['read', 'write', 'devices'] },
  user: { permissions: ['read'] },
  viewer: { permissions: ['read'] }
}
```

## 4. Disable User

```bash
curl -X PUT localhost:3000/api/v1/admin/users/user_id/disable
```

Execute:

```
## User Manager

### Current Users
| Email | Role | Status | Last Login |
|-------|------|--------|-----------|
| admin@eco.com | ADMIN | ACTIVE | 1h ago |
| user@eco.com | USER | ACTIVE | 5h ago |

### Actions
[ ] Add new user
[ ] Change role
[ ] Disable user
[ ] Reset password
```