# playground.wcc.dev

Playground repository for [wcc.dev](https://www.wcc.dev) built using [**Greenwood**](https://greenwoodjs.dev/).

## Setup

1. Clone the repository
1. Have NodeJS LTS installed (or run `nvm use`)
1. Run `npm ci`

## Commands

To start the local development server, run:

```sh
$ npm run dev
```

To generate a production build, run:

```sh
$ npm run build
```

To start the production server, run:

> _**Note**: make sure you have generated a production build first._

```sh
$ npm run serve
```

---

Additionally, before committing the following commands will run as part of Husky pre-commit hooks, but you can also run them manually:

- `npm run lint` - Runs OXLint for JS / TS linting
- `npm run format` - Runs OXFmt for code formatting
- `npm run check` - Run TSGO for type-checking
