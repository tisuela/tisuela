# Contributing

Suggestions and pull requests are highly encouraged.

## Development

To develop the project locally, you'll need a recent version of Node.js and `pnpm` installed globally.

To get started, clone the repo and run `pnpm` from the root directory:

```bash
git clone https://github.com/tisuela/tisuela
cd tisuela
pnpm
```

Now that your dependencies are installed, you can run the local Next.js dev server:

```bash
pnpm dev
```

You should now be able to open `http://localhost:3000` to view the webapp.

## Production

To build for production, you can run:

```bash
pnpm build
```

Which just runs `next build` under the hood.

### Gotchas

If you're seeing something unexpected while debugging with Next.js, try running `rm -rf .next` to refresh the Next.js cache before running `pnpm dev` again.
