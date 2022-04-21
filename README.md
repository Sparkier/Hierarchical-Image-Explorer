# Hierarchical Image Explorer (HIE)

The goal of this project is to develop a Level of Detail visualization for large-scale image datasets, that allows interactive exploration of the data. It is part of the specialization subject Computer Graphics in the 5th and 6th semester for computer science and media students at Ulm University.

### Getting started

1. Clone the repository using your method of choice
2. run `yarn` to initialize the project and install all necessary packages
3. run `yarn build` to compile and build the project
4. run `yarn start -c <config_path> -p <port(default = 25679)>` to start the backend server (navigate to [localhost:5000](http://localhost:5000))

#### Further commands

- `yarn format`: runs the Prettier code formatter
- `yarn lint`: runs the eslint linter, returning all linting problems
- `yarn lint:fix`: runs the eslint linter and automatically fixes all linting problems

### Technology stack
- Code formatter: [prettier](https://prettier.io/)
- Linter: [eslint](https://eslint.org/)
- Web-framework: [svelte](https://svelte.dev/)

### Committing

To have nice commit messages throughout, we use [commitizen](https://github.com/commitizen/cz-cli#making-your-repo-commitizen-friendly). To commit, use `git cz`.

We require reviewed pull requests before merging to `main`. This means:

1. You cannot directly push to the `main` branch.
2. You should create a new branch for a change you want to make.
3. Changes should be as small as possible to allow for a quick review.
4. Once you have applied all the changes you wanted to make to your branch, you need to open a pull request on GitHub.
5. You need to assign a reviewer and get approval before you are able to merge your changes.
6. Your pull request needs to pass all checks on GitHub before being merged.