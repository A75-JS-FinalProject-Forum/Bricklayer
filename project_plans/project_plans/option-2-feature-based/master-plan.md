# Option 2: Feature-Based Split (Vertical) - RECOMMENDED

## Overview

In this approach, each team member owns complete features from database to UI. This is the recommended approach, especially for teams where members have similar skill levels or want to learn the full stack.

---

## Why This Approach?

Each person owns complete features from database to UI. Best for teams because:
- Less waiting for others
- Clear ownership
- Can see complete feature working
- Easier to understand the full picture

### Pros
- Minimal dependencies between team members
- Each person can work independently
- Clear ownership and accountability
- Faster initial progress
- Better understanding of full stack

### Cons
- Need to establish shared patterns first
- Risk of inconsistent code styles
- Some duplicate learning effort

---

## Team Assignments

| Person | Feature Area | Owns |
|--------|-------------|------|
| Person A | Authentication & Users | Registration, login, profiles, user management |
| Person B | Posts & Content | Posts CRUD, home page, search, filtering |
| Person C | Interactions | Comments, voting, tags, reputation, badges |

---

## Dependency Diagram

```
        Shared Foundation
              ↓
    ┌─────────┼─────────┐
    ↓         ↓         ↓
Person A   Person B   Person C
(Auth)     (Posts)    (Interactions)
    │         │         │
    └────┬────┘         │
         │              │
         └──────┬───────┘
                ↓
         Integration
```

**Key dependencies:**
- Person B and C need Person A's auth context
- Person C's comments/voting need Person B's posts
- All share common UI components

---

## Timeline Overview

### Week 1: Foundation (Team Together)
- Set up React project
- Set up Supabase project
- Create shared components
- Define coding conventions
- Basic routing

### Week 2: Core Features
- **Person A**: Auth system complete, profile viewing
- **Person B**: Home page, post list, post detail
- **Person C**: Comments table, comment service, basic commenting

### Week 3: Feature Completion
- **Person A**: Profile editing, avatar upload
- **Person B**: Post CRUD, filtering, sorting
- **Person C**: Voting system, nested comments

### Week 4: Advanced Features
- **Person A**: Admin user management
- **Person B**: Admin post management
- **Person C**: Tags, reputation, badges

### Week 5: Integration & Testing
- Connect all features
- Fix integration bugs
- Write tests

### Week 6: Polish & Deploy
- UI/UX improvements
- Performance optimization
- Deployment

---

## Shared Foundation (Week 1 - All Together)

Before splitting, the team creates together:

### 1. Project Setup
```bash
npm create vite@latest forum-app -- --template react
cd forum-app
npm install @supabase/supabase-js react-router-dom
```

### 2. Supabase Client
```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 3. Basic Layout Components
- `Layout.jsx`
- `Header.jsx`
- `Footer.jsx`

### 4. Shared UI Components
- `Button.jsx`
- `Input.jsx`
- `Card.jsx`
- `LoadingSpinner.jsx`
- `ErrorMessage.jsx`

### 5. Basic Routing
```javascript
// src/routes.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/posts" element={<PostListPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        {/* More routes added by each person */}
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Communication Requirements

This approach requires **moderate communication**:

1. **Weekly sync meetings** to share progress
2. **Shared components** - coordinate on reusable UI
3. **API contracts** - agree on data structures
4. **Code reviews** - review each other's PRs

---

## Individual Plans

See detailed plans for each team member:
- [Person A: Authentication & Users](./person-a-auth-users.md)
- [Person B: Posts & Content](./person-b-posts.md)
- [Person C: Comments, Voting & Tags](./person-c-interactions.md)

---

## Integration Points

### Auth Context (Person A provides)
Person A creates `AuthContext` that Person B and C will use:
```javascript
const { user, isAuthenticated, isAdmin } = useAuth()
```

### Post Data (Person B provides)
Person B creates post structure that Person C's comments attach to:
```javascript
// Post object structure
{
  id: UUID,
  title: string,
  content: string,
  author_id: UUID,
  created_at: timestamp
}
```

### Vote Integration
Person C creates voting that updates Person A's reputation:
```javascript
// When vote is cast, trigger updates author's reputation
```

---

## Integration Checkpoints

### End of Week 2
- [ ] Users can register and login (Person A)
- [ ] Home page shows posts (Person B)
- [ ] Basic comments work on posts (Person C)

### End of Week 3
- [ ] Users can edit profiles (Person A)
- [ ] Posts can be created/edited (Person B)
- [ ] Voting works on posts (Person C)

### End of Week 4
- [ ] Admin can manage users (Person A)
- [ ] Admin can delete posts (Person B)
- [ ] Tags and reputation work (Person C)

### End of Week 5
- [ ] All features integrated
- [ ] Tests passing
- [ ] Ready for deployment

---

## Recommended for Team with One Experienced Person

If one team member is more experienced, assign them to **Person C (Interactions)** because:
- Most complex features (nested comments, reputation triggers)
- Most database work (4 tables vs 1-2 for others)
- Can help others while working on their features

---

## Definition of Done

A feature is complete when:
1. Database table(s) exist with proper RLS
2. Service functions work
3. UI components are styled
4. Feature works end-to-end
5. Unit tests pass
