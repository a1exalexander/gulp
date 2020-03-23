<p align="center">
  <a href="https://gulpjs.com">
    <img height="257" width="114" src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp-2x.png">
  </a>
  <h1 align="center">Gulp static config</h1>
</p>

## Installation

```bash
# Create new folder and install the gulp project there
npx degit a1exalexander/gulp-static <my-new-project>
cd <my-new-project>
npm install

# or install the gulp project here
npx degit a1exalexander/gulp-static .
npm install
```

## Usage

```bash
# Run devserver
npm start
# or run deveserver with HTML validator
npm run dev
```

```bash
# Build for production
npm run build
```

### Project structure
    .
    ├── src                    # Source files
      ├── fonts
      ├── images
      ├── js                   # Entry JS files
      ├── styles               # CSS, SASS, SCSS style files (ignore: '_')
      index.html


#### Rigger (import HTML components)
```
//= component.html
```
