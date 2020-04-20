const ejs = require('ejs');

let people = ['geddy', 'neil', 'alex'];
let html = ejs.render('<%= people.join(", "); %>', { people: people });

document.getElementById('output').innerHTML = html;
