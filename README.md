#

# pgroll

`pgroll` is a thread-safe, lightweight and flexible database migration tool for PostgreSQL

PostgreSQL clients currently supporting:

- [x] PostgresJS
- [ ] pg
- [ ] ...

`postgresjs` client. It offers simple commands to manage your database schema changes with `up`, `down`, `create`, and `go` features.

## Features

- **up**: Apply all pending migrations.
- **down**: Rollback the last applied migration.
- **create**: Create new migration files.
- **go**: Migrate the database schema to a specific version.

## Installation

You can install `pgroll` via npm:

```bash
npm install pgroll
```

## Usage

### Command Line Interface (CLI)

`pgroll` provides a CLI to manage your database migrations. Below are the available commands:

#### Running the CLI

1. Run Migrations Up:

```bash
npx pgroll up
```

2. Run Migrations Down:

```bash
npx pgroll down
```

3. Navigate to a Specific Version:

```bash
npx pgroll go <version>
```

4. Create New Migration Files:

```bash
npx roll create <migration-name>
```
