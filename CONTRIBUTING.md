# Contributing to Sarathi

Thank you for your interest in contributing to Sarathi! This guide will help you get started.

## Development Setup

1. **Clone the repository**
```bash
git clone <repo-url>
cd Sarathi2.0
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment**
```bash
cp env.sample .env
# Edit .env with your configuration
```

4. **Start development servers**
```bash
# Start databases
cd infra
docker-compose -f docker-compose.dev.yml up -d
cd ..

# Start API and Web
pnpm dev:all
```

## Project Structure

- `apps/api/` - Express backend
- `apps/web/` - React frontend
- `packages/shared/` - Shared types, schemas, and business logic
- `infra/` - Docker configs

## Coding Standards

### TypeScript
- Use strict mode
- No `any` types (use `unknown` if needed)
- Prefer interfaces for object types
- Export types alongside implementations

### Code Style
- **Formatting**: Prettier (automatically enforced)
- **Linting**: ESLint
- **Naming**:
  - Files: camelCase for utilities, PascalCase for components
  - Functions: camelCase
  - Classes/Types: PascalCase
  - Constants: UPPER_SNAKE_CASE

### Git Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build/config changes

Example:
```
feat(api): add loan repayment endpoint
fix(web): resolve login redirect issue
docs: update deployment guide
```

## Testing

### Run Tests
```bash
# All tests
pnpm test

# Specific package
pnpm --filter @sarathi/shared test
pnpm --filter @sarathi/api test

# Watch mode
pnpm --filter @sarathi/shared test:watch
```

### Writing Tests
- Place tests next to implementation files: `feature.ts` → `feature.test.ts`
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies

Example:
```typescript
import { describe, it, expect } from 'vitest';

describe('computeScore', () => {
  it('should return base score for new user', () => {
    const signals = { /* ... */ };
    const result = computeScore(signals);
    expect(result.score).toBe(580);
  });
});
```

## Pull Request Process

1. **Create a branch**
```bash
git checkout -b feat/your-feature
```

2. **Make changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit changes**
```bash
git add .
git commit -m "feat: add new feature"
```

4. **Push and create PR**
```bash
git push origin feat/your-feature
```

5. **PR Checklist**
   - [ ] Code follows style guidelines
   - [ ] Tests pass
   - [ ] New tests added for new features
   - [ ] Documentation updated
   - [ ] No console.log or debug code
   - [ ] Types are properly exported
   - [ ] No linter errors

## API Development

### Adding a New Endpoint

1. **Define Zod schema** in `packages/shared/src/schemas.ts`
```typescript
export const MyFeatureSchema = z.object({
  field: z.string(),
});
```

2. **Create route handler** in `apps/api/src/routes/myfeature.ts`
```typescript
import { Router } from 'express';
import { validateBody } from '../middleware/validateRequest.js';
import { MyFeatureSchema } from '@sarathi/shared';

const router = Router();

router.post('/', validateBody(MyFeatureSchema), async (req, res, next) => {
  try {
    // Implementation
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
```

3. **Register route** in `apps/api/src/app.ts`
```typescript
import myfeatureRoutes from './routes/myfeature.js';
app.use('/myfeature', myfeatureRoutes);
```

4. **Add API client method** in `apps/web/src/lib/api.ts`
```typescript
export const api = {
  myFeature: (data) =>
    request('/myfeature', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
```

## Frontend Development

### Adding a New Page

1. **Create page component** in `apps/web/src/pages/MyPage.tsx`
```typescript
import { Layout } from '../components/Layout';

export default function MyPage() {
  return (
    <Layout title="My Page" showBack>
      <div className="card">
        {/* Content */}
      </div>
    </Layout>
  );
}
```

2. **Add route** in `apps/web/src/App.tsx`
```typescript
<Route path="/my-page" element={
  <ProtectedRoute>
    <MyPage />
  </ProtectedRoute>
} />
```

3. **Add translations** in `apps/web/src/locales/en.json` and `hi.json`
```json
{
  "myPage": {
    "title": "My Page",
    "description": "Description text"
  }
}
```

## Database Changes

### Adding a New Model

1. **Define type** in `packages/shared/src/types.ts`
```typescript
export interface MyModel {
  _id: string;
  field: string;
  createdAt: Date;
}
```

2. **Create Mongoose model** in `apps/api/src/models/MyModel.ts`
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface MyModelDocument extends Omit<MyModel, '_id'>, Document {}

const myModelSchema = new Schema<MyModelDocument>({
  field: { type: String, required: true },
}, { timestamps: true });

myModelSchema.index({ field: 1 });

export const MyModel = mongoose.model<MyModelDocument>('MyModel', myModelSchema);
```

## Common Tasks

### Update Dependencies
```bash
pnpm update --latest --recursive
```

### Build for Production
```bash
pnpm build
```

### Check Bundle Size
```bash
pnpm --filter @sarathi/web build
# Check dist/assets/*.js sizes
```

### Database Migrations
For schema changes, create a migration script in `apps/api/src/scripts/`:
```bash
tsx apps/api/src/scripts/migrate-xxx.ts
```

## Troubleshooting

### TypeScript Errors
```bash
# Rebuild shared package
pnpm --filter @sarathi/shared build
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### MongoDB Connection Issues
```bash
# Check MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker restart sarathi-mongo-dev
```

## Resources

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [TanStack Query](https://tanstack.com/query)
- [TailwindCSS](https://tailwindcss.com/)
- [Zod](https://zod.dev/)

## Questions?

Feel free to open an issue for:
- Bug reports
- Feature requests
- Documentation improvements
- Questions about the codebase

Thank you for contributing! 🙏

