# Option 1: Layer-Based Split (Horizontal) - Master Plan

## Overview

In this approach, each team member specializes in one technical layer of the application. Work is divided by technical responsibility rather than features.

---

## Why This Approach?

Each person specializes in one technical layer. Good if team members have different skill preferences (some prefer backend, some prefer UI).

### Pros
- Clear technical boundaries
- Each person becomes expert in their area
- Easier to maintain consistent patterns within each layer

### Cons
- Requires constant communication
- Can create bottlenecks (frontend waiting for backend)
- Harder to work independently
- One person's delay blocks others

---

## Team Assignments

| Person | Role | Responsibility |
|--------|------|----------------|
| Person A | Database & Backend | Supabase configuration, schema, RLS, functions |
| Person B | Frontend UI | React components, styling, responsive design |
| Person C | State Management & Integration | Services, contexts, hooks, testing |

---

## Dependency Flow

```
Person A (Database)
    ↓ provides tables & policies
Person C (Integration)
    ↓ provides services & contexts
Person B (Frontend)
    → completes UI components
```

**Critical**: Person A must complete database setup before Person C can build services. Person C must complete services before Person B can fully connect UI.

---

## Timeline Overview

### Week 1: Foundation (Team Together)
- Set up React project
- Set up Supabase project
- Define coding conventions
- Create folder structure
- Basic routing

### Week 2: Core Implementation
- **Person A**: All database tables, basic RLS
- **Person B**: Layout, shared UI components, auth pages
- **Person C**: Supabase client, auth service, AuthContext

### Week 3: Feature Development
- **Person A**: All RLS policies, triggers, stored procedures
- **Person B**: Post components, comment components, user components
- **Person C**: Post service, comment service, vote service, PostContext

### Week 4: Completion
- **Person A**: Admin RLS, search functions, optimization
- **Person B**: Admin pages, voting components, styling
- **Person C**: Admin service, tag service, all tests

### Week 5: Integration & Testing
- Connect all layers
- Fix integration bugs
- Cross-team code review

### Week 6: Polish & Deploy
- UI/UX improvements
- Performance optimization
- Deployment

---

## Communication Requirements

This approach requires **high communication**:

1. **Daily standups** are essential
2. **Shared API contracts** - Person A and C must agree on table structures
3. **Mock data** - Person B may need mock data while waiting for services
4. **Blocking issues** - Raise immediately, don't wait

---

## Individual Plans

See detailed plans for each team member:
- [Person A: Database & Backend](./person-a-database.md)
- [Person B: Frontend UI](./person-b-frontend.md)
- [Person C: State Management & Integration](./person-c-integration.md)

---

## Integration Checkpoints

### End of Week 2
- [ ] All database tables exist
- [ ] Auth flow works (register, login, logout)
- [ ] Basic layout renders
- [ ] Supabase client connects successfully

### End of Week 3
- [ ] Posts can be created via service
- [ ] Posts display in UI
- [ ] Comments work end-to-end
- [ ] RLS prevents unauthorized access

### End of Week 4
- [ ] Voting works end-to-end
- [ ] Admin features functional
- [ ] All services tested
- [ ] Responsive design complete

### End of Week 5
- [ ] All features integrated
- [ ] No blocking bugs
- [ ] Tests passing
- [ ] Ready for deployment

---

## Risk Mitigation

### Risk: Person A delayed on database
**Mitigation**:
- Person C can write service interfaces with mock data
- Person B can build UI with placeholder data

### Risk: RLS policies blocking features
**Mitigation**:
- Test RLS early with simple policies
- Have Person A available to debug auth issues

### Risk: Integration issues at Week 5
**Mitigation**:
- Do mini-integrations throughout development
- Don't wait until Week 5 to connect features

---

## Definition of Done

A feature is complete when:
1. Database table and RLS exist (Person A)
2. Service functions work and are tested (Person C)
3. UI component renders and is styled (Person B)
4. Feature works end-to-end in the app
