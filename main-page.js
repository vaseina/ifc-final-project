const projectList = document.getElementById("project-list");
const projectCards = Array.from(projectList.children);
console.log(projectCards);
const exampleCard = projectCards[0];
console.log(exampleCard);

const baseURL = './bim-model/bim-model.html';

import { projects } from "./projects.js";

for(let project of projects) {
    const newCard = exampleCard.cloneNode(true);

    const cardText = newCard.querySelector('p');
    cardText.textContent = project.name;
    console.log(cardText);

    const button = newCard.querySelector('a');
    button.href = baseURL + `?id=${project.id}`;

    projectList.appendChild(newCard);
}

exampleCard.remove();