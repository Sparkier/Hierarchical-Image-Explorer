# Hierarchical Image Viewer

## Development

1. Install the dependencies:

```bash
yarn
```

2. Start [Rollup](https://rollupjs.org):

```bash
yarn dev
```

3. Navigate to [localhost:5000](http://localhost:5000). You should see your app running. Edit a component file in `src`, save it, and reload the page to see your changes.

By default, the server will only respond to requests from localhost. To allow connections from other computers, edit the `sirv` commands in package.json to include the option `--host 0.0.0.0`.

If you're using [Visual Studio Code](https://code.visualstudio.com/) we recommend installing the official extension [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode). If you are using other editors you may need to install a plugin in order to get syntax highlighting and intellisense.

## Building and running in production mode

To create an optimised version of the app:

```bash
yarn build
```

You can run the newly built app with `yarn start`. This uses [sirv](https://github.com/lukeed/sirv), which is included in your package.json's `dependencies` so that the app will work when you deploy to platforms like [Heroku](https://heroku.com).

### Committing

To have nice commit messages throughout, we use [commitizen](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly). To commit, use `git cz`.

We require reviewed pull requests before merging to `main`. This means:

1. You cannot directly push to the `main` branch.
2. You should create a new branch for a change you want to make.
3. Changes should be as small as possible to allow for a quick review.
4. Once you have applied all the changes you wanted to make to your branch, you need to open a pull request on GitHub.
5. You need to assign a reviewer and get approval before you are able to merge your changes.
6. Your pull request needs to pass all checks on GitHub before being merged.
