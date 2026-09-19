# Sistema de Gestión de Pedidos

Order and inventory management for an electrical supplies business: products, customers, orders, weekly automatic reports, and Excel import/export.

## Stack

- Next.js 15.2.8 (App Router), React 19, TypeScript
- Tailwind CSS with shadcn/ui (Radix primitives)
- Supabase (Postgres) as the datastore, reached from the browser through `@supabase/supabase-js`
- `xlsx` for spreadsheet import and export
- Vitest for tests, ESLint for linting

## Requirements

- Node 22 or newer
- pnpm 10 or newer

## Setup

1. Install dependencies:

   ```
   pnpm install
   ```

2. Configure the database credentials:

   ```
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project: **Project Settings → API**.

3. Create the database schema. Run the files in `scripts/` **in numeric order** against the Supabase SQL editor (or `psql`):

   ```
   01-create-tables.sql
   02-seed-data.sql
   03-update-for-auto-reports.sql
   04-add-cuil-column.sql
   05-verify-and-fix-proveedores.sql
   06-restructure-database.sql
   07-configure-rls.sql
   08-fix-null-productos.sql
   09-create-default-image.sql
   ```

   Note that `07-configure-rls.sql` leaves the database readable and writable **only for authenticated users**, so the app requires a login (see step 4).

4. Create the first user. There is no sign-up screen: accounts are created from the dashboard. Go to **Authentication → Users → Add user**, set an email and password, and enable **Auto Confirm User** (otherwise the account stays pending email confirmation and the login will reject it).

5. Start the development server:

   ```
   pnpm dev
   ```

   Then open http://localhost:3000.

## Scripts

| Command        | What it does                                                  |
| -------------- | ------------------------------------------------------------- |
| `pnpm dev`     | Development server with hot reload                            |
| `pnpm build`   | Production build. **Type errors fail the build.**             |
| `pnpm start`   | Serve the production build                                    |
| `pnpm lint`    | ESLint (flat config in `eslint.config.mjs`)                   |
| `pnpm test`    | Vitest, once                                                   |

## Data model notes

- `productos.articulo_numero` is `VARCHAR(10)`: a **text** code, not a number. Keep leading zeros.
- The unit of measure lives on `categorias.unidad` (General → `unidad`, Cables → `metro`, Materiales → `kg`). Products do **not** carry their own unit; screens read it from the category.
- `pedido_productos` is identified by its own `id`. There is no unique constraint on `(pedido_id, producto_id)`, so order lines cannot be upserted and are reconciled by id instead.
- `clientes.cuil` exists and is nullable.
- Product creation and order editing send `categoria_id` and `img_id`, both `NOT NULL`. New products use the default image.

## Known caveats

- **The SQL scripts are not a faithful description of the live database.** `scripts/06-restructure-database.sql` defines `productos.precio_costo`, but the live table does not have that column. Verify against the live schema before trusting a script.
- **The database is closed to anonymous access.** `scripts/07-configure-rls.sql` enables RLS and grants access only to the `authenticated` role, so the anon key that ships in the client bundle — and that anyone can extract — reads nothing and writes nothing. The login screen is experience only; the real boundary is RLS. The script is idempotent, so re-running it is also the migration path for a database created before it was fixed. The model in place is a single business with one shared login: every authenticated user sees everything. Splitting data per user would require owner columns and adjusted policies.
- Dates and currency are formatted for `es-AR`.
- The original project was generated on v0.app; this repository may still receive changes from there.

## Testing

Tests live next to the code they cover (`lib/*.test.ts`) and run with `pnpm test`.

CI (`.github/workflows/ci.yml`) runs the frozen-lockfile install, the type check, lint, the test suite and the production build on every push to `main` and on pull requests. It needs no secrets: the build works without `.env.local`.
