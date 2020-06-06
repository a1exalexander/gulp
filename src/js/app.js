import UserCards from '../templates/UserCards.ejs';

const render = (id, data) => {
  try {
    document.getElementById(id).innerHTML = data
  } catch(err) {
    console.log(`"${id}" Not Rendered`, err);
  }
};

const people = ['geddy', 'neil', 'alex'];

render('people', UserCards(people))
