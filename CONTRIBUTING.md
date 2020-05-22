## Development

### Requirements
* [Python](https://www.python.org/downloads/) >= 3.7
* [virtualenv](https://virtualenv.pypa.io/en/latest/) >= 16.4.3
* [NPM](https://www.npmjs.com/get-npm) >= 6.7.0
* [GNU Make](https://www.gnu.org/software/make/) >= 3.8.1

### Build
* Create a new sandbox (aka venv) and install required python libraries into it
    ```bash
    virtualenv --python=python3.7 venv
    source venv/bin/activate

    # Install Python packages
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    ```
* Install NPM packages.
    ```bash
    npm install
    ```
* Run `make` to execute all tests.
    
### IDE Setup
* Setup the Python Interpreter
    - For PyCharm, go to `Settings -> Project Settings -> Project Interpreter`.
    - For IntelliJ, go to `File -> Project Structure -> Project -> Project SDK`.
    - Add a `Virtualenv Environment` from an `Existing environment` and set the Interpreter to `YOUR_REPO_ROOT/venv/bin/python`.

### Pull Request
* We force the following checks in before changes can be merged into master:
  [eslint](https://eslint.org/),
  [prettier](https://prettier.io/)
  [isort](https://pypi.org/project/isort/),
  [black](https://black.readthedocs.io/en/stable/),
  [pylint](https://www.pylint.org/),
  [mypy](http://mypy-lang.org/).
    * You can run `make` to executes all checks.
    * To fix any formatting or import errors, you can simply run `make format`.
    * For more details, see the `format` and `format-check` tasks in the [Makefile](./Makefile)
